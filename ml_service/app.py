"""
FastAPI inference service for EnerGum recommendation (TensorFlow/Keras MLP).

Endpoints:
- GET /health
- POST /predict

POST /predict payload example:
{
  "profile": {
    "age": 25,
    "gender": "female",  // or "wanita"/"pria"
    "activity": "moderate",
    "goal": "energy",
    "allergies": ["peanut"]
  },
  "history": {
    "login_30d": 5,
    "view_cashew_30d": 3,
    "view_peanut_30d": 8,
    "click_rec_cashew_30d": 1,
    "click_rec_peanut_30d": 2,
    "purchase_cashew_90d": 0,
    "purchase_peanut_90d": 1,
    "days_since_last_purchase": 20,
    "days_since_last_active": 2
  },
  "source": "questionnaire"
}

Response:
{
  "product": "peanut",
  "confidence": 0.78,
  "probs": {"cashew": 0.12, "peanut": 0.78, "both": 0.10, "none": 0.0},
  "debug": {"blocked": ["cashew"]} // if any
}

IMPORTANT: Allergy constraints are applied as safety hard rules only.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional, List

import numpy as np
import pandas as pd
import tensorflow as tf
from fastapi import FastAPI
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).parent
ART_DIR = BASE_DIR / "artifacts"

MODEL_DIR = ART_DIR / "tf_model"  # SavedModel directory
COLS_PATH = ART_DIR / "feature_columns.json"
CLASSES_PATH = ART_DIR / "classes.json"

# Defaults for implicit signals
NUM_DEFAULTS = {
    "login_30d": 0,
    "view_cashew_30d": 0,
    "view_peanut_30d": 0,
    "click_rec_cashew_30d": 0,
    "click_rec_peanut_30d": 0,
    "purchase_cashew_90d": 0,
    "purchase_peanut_90d": 0,
    "days_since_last_purchase": 999,
    "days_since_last_active": 999,
}

# Global model cache (load once)
TF_MODEL: Optional[tf.keras.Model] = None


class Profile(BaseModel):
    age: int | str = 25
    gender: str = "female"
    activity: str = "moderate"
    goal: str = "energy"
    allergies: List[str] = Field(default_factory=list)


class History(BaseModel):
    login_30d: Optional[int] = None
    view_cashew_30d: Optional[int] = None
    view_peanut_30d: Optional[int] = None
    click_rec_cashew_30d: Optional[int] = None
    click_rec_peanut_30d: Optional[int] = None
    purchase_cashew_90d: Optional[int] = None
    purchase_peanut_90d: Optional[int] = None
    days_since_last_purchase: Optional[int] = None
    days_since_last_active: Optional[int] = None


class PredictRequest(BaseModel):
    profile: Profile
    history: Optional[History] = None
    source: str = "questionnaire"  # questionnaire|history|general


def normalize_gender(g: str) -> str:
    g = (g or "").strip().lower()
    if g in {"wanita", "perempuan", "female", "f"}:
        return "female"
    if g in {"pria", "laki-laki", "laki", "male", "m"}:
        return "male"
    return "female"


def normalize_activity(a: str) -> str:
    a = (a or "").strip().lower()
    return a if a in {"low", "moderate", "high"} else "moderate"


def normalize_goal(g: str) -> str:
    g = (g or "").strip().lower()
    return g if g in {"energy", "healthy", "snack"} else "energy"


def normalize_source(s: str) -> str:
    s = (s or "").strip().lower()
    return s if s in {"questionnaire", "history", "general"} else "questionnaire"


def load_artifacts() -> None:
    """Load TF model once."""
    global TF_MODEL
    if TF_MODEL is None:
        TF_MODEL = tf.keras.models.load_model(MODEL_DIR)


def build_feature_row(req: PredictRequest, feature_cols: List[str]) -> Dict[str, float]:
    # start with zeros
    row: Dict[str, float] = {c: 0.0 for c in feature_cols}

    # age
    try:
        age = int(req.profile.age)
    except Exception:
        age = 25
    if "age" in row:
        row["age"] = float(np.clip(age, 10, 80))

    allergies = set([a.strip().lower() for a in (req.profile.allergies or [])])
    if "allergy_peanut" in row:
        row["allergy_peanut"] = 1.0 if "peanut" in allergies else 0.0
    if "allergy_cashew" in row:
        row["allergy_cashew"] = 1.0 if "cashew" in allergies else 0.0

    # numeric history
    hist = req.history.model_dump() if req.history else {}
    for k, default in NUM_DEFAULTS.items():
        if k not in row:
            continue
        val = hist.get(k, None)
        if val is None:
            val = default
        try:
            # counts non-negative; days_since also non-negative
            row[k] = float(max(0, int(val)))
        except Exception:
            row[k] = float(default)

    # one-hot
    gender = normalize_gender(req.profile.gender)
    activity = normalize_activity(req.profile.activity)
    goal = normalize_goal(req.profile.goal)
    source = normalize_source(req.source)

    for col in [f"gender_{gender}", f"activity_{activity}", f"goal_{goal}", f"source_{source}"]:
        if col in row:
            row[col] = 1.0

    return row


def apply_allergy_constraints(probs: Dict[str, float], allergies: List[str]) -> Dict[str, float]:
    """
    Safety constraint only:
    - peanut allergy => block peanut AND both
    - cashew allergy => block cashew AND both
    Renormalize remaining probs.
    """
    allergies_set = set([a.strip().lower() for a in (allergies or [])])
    blocked: List[str] = []
    p = probs.copy()

    if "peanut" in allergies_set:
        for k in ["peanut", "both"]:
            if k in p:
                p[k] = 0.0
                blocked.append(k)

    if "cashew" in allergies_set:
        for k in ["cashew", "both"]:
            if k in p:
                p[k] = 0.0
                blocked.append(k)

    total = sum([v for k, v in p.items() if not k.startswith("__")])
    if total > 0:
        for k in list(p.keys()):
            if not k.startswith("__"):
                p[k] = p[k] / total

    p["__blocked__"] = sorted(list(set(blocked)))
    return p


app = FastAPI(title="EnerGum ML Service", version="0.2-tf")


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "ok": True,
        "has_model": MODEL_DIR.exists() and COLS_PATH.exists() and CLASSES_PATH.exists(),
    }


@app.post("/predict")
def predict(req: PredictRequest) -> Dict[str, Any]:
    # ensure artifacts exist
    if not MODEL_DIR.exists() or not COLS_PATH.exists() or not CLASSES_PATH.exists():
        return {"error": "Model belum ditrain. Jalankan: python train_tf.py"}

    load_artifacts()

    feature_cols = json.loads(COLS_PATH.read_text(encoding="utf-8"))
    classes = json.loads(CLASSES_PATH.read_text(encoding="utf-8"))

    # build input
    row = build_feature_row(req, feature_cols)
    X = pd.DataFrame([row], columns=feature_cols).astype(np.float32).to_numpy()

    # predict probabilities (softmax)
    proba = TF_MODEL.predict(X, verbose=0)[0]
    probs = {cls: float(p) for cls, p in zip(classes, proba)}

    # ensure all 4 keys exist (defensive)
    for k in ["cashew", "peanut", "both", "none"]:
        probs.setdefault(k, 0.0)

    allergies = [a.strip().lower() for a in (req.profile.allergies or [])]

    # if both allergies => force none (safety)
    if "peanut" in allergies and "cashew" in allergies:
        forced = {"cashew": 0.0, "peanut": 0.0, "both": 0.0, "none": 1.0}
        return {
            "product": "none",
            "confidence": 1.0,
            "probs": forced,
            "debug": {"blocked": ["cashew", "peanut", "both"]},
        }

    constrained = apply_allergy_constraints(probs, allergies)
    blocked = constrained.pop("__blocked__", [])

    # final decision = argmax of constrained probs
    product = max(constrained, key=lambda k: constrained[k])
    confidence = float(constrained[product])

    return {
        "product": product,
        "confidence": round(confidence, 4),
        "probs": {k: round(v, 4) for k, v in constrained.items()},
        "debug": {"blocked": blocked},
    }
