import os
from typing import Any

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel


MODELS_DIR = os.getenv("MODELS_DIR", os.path.join(os.path.dirname(__file__), "models"))

MODEL_FILES = {
    "health_trajectory": "health_trajectory_model.pkl",
    "reintegration_binary": "reintegration_readiness_binary.pkl",
    "reintegration_risk": "reintegration_risk_multiclass.pkl",
    "donor_churn": "donor_churn_model.pkl",
    "campaign_effectiveness": "campaign_effectiveness_model.pkl",
    "safehouse_resource": "safehouse_resource_model.pkl",
    "post_referrals": "post_referrals_predictor.pkl",
    "post_value": "post_value_ols.pkl",
}


app = FastAPI(title="SureAnchor ML Service", version="1.0.0")
MODELS: dict[str, Any] = {}


class BatchDonorsRequest(BaseModel):
    donors: list[dict[str, Any]]


class BatchCampaignsRequest(BaseModel):
    campaigns: list[dict[str, Any]]


class BatchSafehousesRequest(BaseModel):
    safehouses: list[dict[str, Any]]


def _load_models() -> None:
    for key, filename in MODEL_FILES.items():
        path = os.path.join(MODELS_DIR, filename)
        if os.path.exists(path):
            try:
                MODELS[key] = joblib.load(path)
            except Exception:
                MODELS[key] = None
        else:
            MODELS[key] = None


def _as_frame(payload: dict[str, Any], model: Any) -> pd.DataFrame:
    df = pd.DataFrame([payload])
    feature_names = getattr(model, "feature_names_in_", None)
    if feature_names is not None:
        for col in feature_names:
            if col not in df.columns:
                df[col] = 0
        df = df[list(feature_names)]
    return df


def _as_frame_batch(rows: list[dict[str, Any]], model: Any) -> pd.DataFrame:
    df = pd.DataFrame(rows)
    feature_names = getattr(model, "feature_names_in_", None)
    if feature_names is not None:
        for col in feature_names:
            if col not in df.columns:
                df[col] = 0
        df = df[list(feature_names)]
    return df


def _probability_of_positive(model: Any, frame: pd.DataFrame) -> float:
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(frame)[0]
        classes = list(getattr(model, "classes_", []))
        if classes:
            for idx, cls in enumerate(classes):
                text = str(cls).strip().lower()
                if text in {"1", "true", "yes", "high", "ready", "declining"}:
                    return float(proba[idx])
            return float(proba[-1])
        return float(proba[-1])
    pred = model.predict(frame)[0]
    try:
        return float(pred)
    except Exception:
        return 0.0


def _class_probability(model: Any, frame: pd.DataFrame) -> dict[str, float]:
    if not hasattr(model, "predict_proba"):
        pred = model.predict(frame)[0]
        return {str(pred): 1.0}
    probs = model.predict_proba(frame)[0]
    classes = [str(c) for c in getattr(model, "classes_", range(len(probs)))]
    return {cls: float(prob) for cls, prob in zip(classes, probs)}


def _risk_tier(prob: float) -> str:
    if prob >= 0.85:
        return "Critical"
    if prob >= 0.65:
        return "High"
    if prob >= 0.4:
        return "Medium"
    return "Low"


def _risk_action_for_tier(tier: str) -> str:
    mapping = {
        "Critical": "Immediate intervention: assign a retention owner and contact within 24 hours.",
        "High": "Priority outreach: personalized follow-up and engagement campaign this week.",
        "Medium": "Monitor closely: schedule a check-in and targeted campaign this month.",
        "Low": "Maintain stewardship: continue regular updates and appreciation touchpoints.",
    }
    return mapping.get(tier, "Monitor and engage the supporter.")


@app.on_event("startup")
def startup() -> None:
    _load_models()


@app.get("/")
def root() -> dict[str, Any]:
    return {
        "service": "sureanchor-ml",
        "available": True,
        "models_dir": MODELS_DIR,
    }


@app.get("/health")
def health() -> dict[str, Any]:
    loaded = {key: (model is not None) for key, model in MODELS.items()}
    return {
        "status": "ok",
        "available": True,
        "models_loaded": loaded,
    }


@app.post("/predict/health-trajectory")
def predict_health_trajectory(payload: dict[str, Any]) -> dict[str, Any]:
    model = MODELS.get("health_trajectory")
    if model is None:
        return {"available": False, "reason": "health_trajectory_model.pkl not loaded"}

    frame = _as_frame(payload, model)
    class_probs = _class_probability(model, frame)
    pred_raw = str(model.predict(frame)[0]).strip()

    probs_lower = {k.lower(): v for k, v in class_probs.items()}
    declining_probability = probs_lower.get("declining")
    if declining_probability is None and probs_lower:
        declining_probability = max(
            [v for k, v in probs_lower.items() if "declin" in k] or [min(probs_lower.values())]
        )

    trajectory = "Stable"
    text_pred = pred_raw.lower()
    if "declin" in text_pred:
        trajectory = "Declining"
    elif "improv" in text_pred:
        trajectory = "Improving"
    elif text_pred in {"0", "1", "2"}:
        trajectory = {"0": "Declining", "1": "Stable", "2": "Improving"}[text_pred]

    dprob = float(declining_probability or 0.0)
    if dprob >= 0.65:
        alert_level = "red"
        action = "Increase clinical monitoring and review intervention plans this week."
    elif dprob >= 0.35:
        alert_level = "yellow"
        action = "Track closely and schedule follow-up sessions to prevent decline."
    else:
        alert_level = "green"
        action = "Maintain current care plan and continue routine monitoring."

    return {
        "available": True,
        "trajectory": trajectory,
        "declining_probability": round(dprob, 4),
        "probabilities": {k: round(float(v), 4) for k, v in class_probs.items()},
        "alert_level": alert_level,
        "recommended_action": action,
    }


@app.post("/predict/reintegration")
def predict_reintegration(payload: dict[str, Any]) -> dict[str, Any]:
    ready_model = MODELS.get("reintegration_binary")
    risk_model = MODELS.get("reintegration_risk")
    if ready_model is None or risk_model is None:
        return {"available": False, "reason": "Reintegration models not loaded"}

    ready_frame = _as_frame(payload, ready_model)
    risk_frame = _as_frame(payload, risk_model)

    readiness_probability = float(_probability_of_positive(ready_model, ready_frame))
    reintegration_ready = readiness_probability >= 0.5

    predicted_risk_level = str(risk_model.predict(risk_frame)[0]).strip().title()
    if predicted_risk_level not in {"Low", "Medium", "High", "Critical"}:
        predicted_risk_level = "Medium"

    risk_action_map = {
        "Critical": "High protection needs: intensify support and postpone reintegration decisions.",
        "High": "Strengthen case management and risk mitigation before reintegration planning.",
        "Medium": "Continue targeted supports while validating family and community readiness.",
        "Low": "Candidate appears stable; proceed with structured reintegration planning.",
    }

    return {
        "available": True,
        "predicted_risk_level": predicted_risk_level,
        "risk_action": risk_action_map[predicted_risk_level],
        "reintegration_ready": reintegration_ready,
        "readiness_probability": round(readiness_probability, 4),
    }


@app.post("/predict/donor-churn")
def predict_donor_churn(req: BatchDonorsRequest) -> dict[str, Any]:
    model = MODELS.get("donor_churn")
    if model is None:
        return {"available": False, "reason": "donor_churn_model.pkl not loaded"}
    if not req.donors:
        return {"available": True, "predictions": []}

    features = _as_frame_batch(req.donors, model)

    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(features)
        churn_probs = probs[:, -1]
    else:
        preds = model.predict(features)
        churn_probs = np.array(preds, dtype=float)

    predictions = []
    for i, donor in enumerate(req.donors):
        prob = float(churn_probs[i])
        tier = _risk_tier(prob)
        predictions.append(
            {
                "supporter_id": donor.get("supporter_id"),
                "display_name": donor.get("display_name") or f"Supporter {donor.get('supporter_id', i + 1)}",
                "email": donor.get("email"),
                "churn_probability": round(prob, 4),
                "risk_tier": tier,
                "recommended_action": _risk_action_for_tier(tier),
            }
        )

    predictions.sort(key=lambda x: x["churn_probability"], reverse=True)
    return {"available": True, "predictions": predictions}


@app.post("/predict/campaign-effectiveness")
def predict_campaign_effectiveness(req: BatchCampaignsRequest) -> dict[str, Any]:
    model = MODELS.get("campaign_effectiveness")
    if model is None:
        return {"available": False, "reason": "campaign_effectiveness_model.pkl not loaded"}
    if not req.campaigns:
        return {"available": True, "scorecard": []}

    features = _as_frame_batch(req.campaigns, model)

    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(features)
        high_probs = probs[:, -1]
        pred_labels = model.predict(features)
    else:
        pred_values = np.array(model.predict(features), dtype=float)
        high_probs = np.clip(pred_values, 0.0, 1.0)
        pred_labels = (high_probs >= 0.5).astype(int)

    scorecard = []
    for i, row in enumerate(req.campaigns):
        prob = float(high_probs[i])
        is_high = bool(pred_labels[i]) if isinstance(pred_labels[i], (int, np.integer, bool)) else (prob >= 0.5)
        scorecard.append(
            {
                "campaign_name": row.get("campaign_name", "Unknown"),
                "month_label": row.get("month_label", "Unknown"),
                "high_performance_probability": round(prob, 4),
                "is_high_performing": is_high,
                "total_value_php": float(row.get("month_total_value_php", 0) or 0),
                "total_donations": int(row.get("month_donations", 0) or 0),
            }
        )

    scorecard.sort(key=lambda x: x["high_performance_probability"], reverse=True)
    for idx, item in enumerate(scorecard, start=1):
        item["rank"] = idx

    return {"available": True, "scorecard": scorecard}


@app.post("/predict/safehouse-resources")
def predict_safehouse_resources(req: BatchSafehousesRequest) -> dict[str, Any]:
    model = MODELS.get("safehouse_resource")
    if model is None:
        return {"available": False, "reason": "safehouse_resource_model.pkl not loaded"}
    if not req.safehouses:
        return {"available": True, "predictions": []}

    features = _as_frame_batch(req.safehouses, model)
    preds = model.predict(features)

    results = []
    for i, row in enumerate(req.safehouses):
        current = float(row.get("avg_education_progress_current", 0) or 0)
        predicted = float(preds[i])
        results.append(
            {
                "safehouse_id": row.get("safehouse_id"),
                "safehouse_name": row.get("safehouse_name", "Unknown"),
                "predicted_education_progress": round(predicted, 2),
                "current_education_progress": round(current, 2),
                "delta": round(predicted - current, 2),
            }
        )

    results.sort(key=lambda x: x["delta"], reverse=True)
    return {"available": True, "predictions": results}


@app.post("/predict/social-media-impact")
def predict_social_media_impact(payload: dict[str, Any]) -> dict[str, Any]:
    referrals_model = MODELS.get("post_referrals")
    value_model = MODELS.get("post_value")
    if referrals_model is None or value_model is None:
        return {"available": False, "reason": "Social media impact models not loaded"}

    referrals_frame = _as_frame(payload, referrals_model)
    value_frame = _as_frame(payload, value_model)

    referrals_pred = float(referrals_model.predict(referrals_frame)[0])

    # statsmodels OLS may require adding a constant manually.
    if hasattr(value_model, "model") and hasattr(value_model.model, "exog_names"):
        exog_names = list(value_model.model.exog_names)
        if "const" in exog_names and "const" not in value_frame.columns:
            value_frame.insert(0, "const", 1.0)
        missing = [c for c in exog_names if c not in value_frame.columns]
        for col in missing:
            value_frame[col] = 0
        value_frame = value_frame[exog_names]

    value_pred = float(value_model.predict(value_frame)[0])

    return {
        "available": True,
        "predicted_referrals": max(0, int(round(referrals_pred))),
        "estimated_donation_value_php": round(max(0.0, value_pred), 2),
    }
