"""Train a simple ML model for EnerGum recommendation (dummy data).

- Input: ml_service/data/energum_dummy_sessions_train.csv (one-hot features)
- Label: ml_service/data/energum_dummy_labels.csv
- Output: ml_service/artifacts/model.joblib, feature_columns.json, classes.json

Notes:
- We DROP any leaked/diagnostic columns (e.g., label_confidence) if present.
- This is a starter. You can replace the model with TensorFlow later.
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import classification_report

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
ART_DIR = BASE_DIR / "artifacts"

X_PATH = DATA_DIR / "energum_dummy_sessions_train.csv"
Y_PATH = DATA_DIR / "energum_dummy_labels.csv"

DROP_COLS = {"label_confidence"}  # just in case it exists in the feature csv


def main() -> None:
    ART_DIR.mkdir(parents=True, exist_ok=True)

    X = pd.read_csv(X_PATH)
    y = pd.read_csv(Y_PATH)["label_product"]

    # safety: drop columns that should never be features
    cols_to_drop = [c for c in X.columns if c in DROP_COLS]
    if cols_to_drop:
        X = X.drop(columns=cols_to_drop)

    # train/test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # A small neural net (MLP). Good enough to demonstrate ML integration.
    model = MLPClassifier(
        hidden_layer_sizes=(32, 16),
        activation="relu",
        solver="adam",
        max_iter=500,
        random_state=42,
    )

    model.fit(X_train, y_train)

    pred = model.predict(X_test)
    report = classification_report(y_test, pred)
    print("\n=== Evaluation (dummy) ===\n")
    print(report)

    # save artifacts
    joblib.dump(model, ART_DIR / "model.joblib")
    (ART_DIR / "feature_columns.json").write_text(
        json.dumps(list(X.columns), indent=2), encoding="utf-8"
    )
    (ART_DIR / "classes.json").write_text(
        json.dumps(list(model.classes_), indent=2), encoding="utf-8"
    )

    print("\n✅ Saved artifacts to:", ART_DIR)


if __name__ == "__main__":
    main()
