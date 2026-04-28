from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
ART_DIR = BASE_DIR / "artifacts"

X_PATH = DATA_DIR / "energum_dummy_sessions_train.csv"
Y_PATH = DATA_DIR / "energum_dummy_labels.csv"

DROP_COLS = {"label_confidence"}
CLASS_ORDER = ["cashew", "peanut", "both", "none"] 


def seed_everything(seed: int = 42):
    np.random.seed(seed)
    tf.random.set_seed(seed)


def add_none_samples(X: pd.DataFrame, y: pd.Series, n: int = 250, seed: int = 42):
    """Tambahkan kelas 'none' agar model benar2 4 kelas (sesuai claim).
    Strategi PoC: generate sampel 'none' dengan:
    - allergy_peanut=1 & allergy_cashew=1 (aman untuk 'none')
    - engagement rendah (counts=0), recency besar
    """
    n = min(n, len(X))
    samp = X.sample(n=n, random_state=seed).copy()

    # set alergi dua-duanya
    if "allergy_peanut" in samp.columns:
        samp["allergy_peanut"] = 1
    if "allergy_cashew" in samp.columns:
        samp["allergy_cashew"] = 1

    # engagement rendah
    for col in [
        "login_30d",
        "view_cashew_30d",
        "view_peanut_30d",
        "click_rec_cashew_30d",
        "click_rec_peanut_30d",
        "purchase_cashew_90d",
        "purchase_peanut_90d",
    ]:
        if col in samp.columns:
            samp[col] = 0

    if "days_since_last_purchase" in samp.columns:
        samp["days_since_last_purchase"] = 999
    if "days_since_last_active" in samp.columns:
        samp["days_since_last_active"] = 999

    # optional: arahkan ke "healthy" + questionnaire
    if {"goal_energy", "goal_healthy", "goal_snack"}.issubset(set(samp.columns)):
        samp["goal_energy"] = False
        samp["goal_snack"] = False
        samp["goal_healthy"] = True

    if {"source_general", "source_history", "source_questionnaire"}.issubset(set(samp.columns)):
        samp["source_general"] = False
        samp["source_history"] = False
        samp["source_questionnaire"] = True

    X_aug = pd.concat([X, samp], ignore_index=True)
    y_aug = pd.concat(
        [y, pd.Series(["none"] * len(samp), name=y.name)],
        ignore_index=True
    )

    return X_aug, y_aug


def main():
    seed_everything(42)
    ART_DIR.mkdir(parents=True, exist_ok=True)

    # Load dataset
    X = pd.read_csv(X_PATH)
    y = pd.read_csv(Y_PATH)["label_product"]

    # drop diagnostic/leak cols
    X = X.drop(columns=[c for c in X.columns if c in DROP_COLS], errors="ignore")

    # augment NONE class supaya model 4 kelas
    X, y = add_none_samples(X, y, n=250, seed=42)

    # pastikan tipe numerik float32 (bool -> 0/1)
    X = X.astype(np.float32)

    # mapping label -> index sesuai urutan kelas
    label_to_idx = {c: i for i, c in enumerate(CLASS_ORDER)}
    y_idx = y.map(label_to_idx).astype(int).to_numpy()

    # split train/val/test
    n = len(X)
    idx = np.arange(n)
    np.random.shuffle(idx)

    test_size = int(0.10 * n)
    val_size = int(0.10 * n)

    test_idx = idx[:test_size]
    val_idx = idx[test_size:test_size + val_size]
    train_idx = idx[test_size + val_size:]

    X_train, y_train = X.iloc[train_idx].to_numpy(), y_idx[train_idx]
    X_val, y_val = X.iloc[val_idx].to_numpy(), y_idx[val_idx]
    X_test, y_test = X.iloc[test_idx].to_numpy(), y_idx[test_idx]

    # model MLP ringan
    model = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(X_train.shape[1],)),
            tf.keras.layers.Dense(64, activation="relu"),
            tf.keras.layers.Dense(32, activation="relu"),
            tf.keras.layers.Dense(len(CLASS_ORDER), activation="softmax"),
        ]
    )

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    cb = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=8, restore_best_weights=True
        )
    ]

    model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=80,
        batch_size=32,
        callbacks=cb,
        verbose=1,
    )

    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"\n=== TF Evaluation (PoC) ===\nTest accuracy: {test_acc:.4f}\n")

    # =========================
    # SAVE ARTIFACTS (FIXED)
    # =========================

    # 1) Simpan format native Keras (.keras) ✅
    keras_path = ART_DIR / "tf_model.keras"
    model.save(keras_path)  # include_optimizer default True/False gak critical utk inference
    print("✅ Saved Keras model to:", keras_path)

    # 2) Export SavedModel (folder) ✅ untuk serving/FastAPI/TF Serving
    savedmodel_dir = ART_DIR / "tf_savedmodel"
    # Keras v3+: pakai export, bukan model.save(folder)
    model.export(str(savedmodel_dir))
    print("✅ Exported SavedModel to:", savedmodel_dir)

    # 3) Metadata fitur & kelas (dipakai saat inference untuk urutan kolom)
    (ART_DIR / "feature_columns.json").write_text(
        json.dumps(list(X.columns), indent=2), encoding="utf-8"
    )
    (ART_DIR / "classes.json").write_text(
        json.dumps(CLASS_ORDER, indent=2), encoding="utf-8"
    )
    print("✅ Saved feature columns & classes to:", ART_DIR)


if __name__ == "__main__":
    main()
