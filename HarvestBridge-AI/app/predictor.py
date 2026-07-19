import pandas as pd

from app.loader import pipeline


def predict(data: dict):
    df = pd.DataFrame([data])
    prediction = pipeline.predict(df)[0]
    probabilities = pipeline.predict_proba(df)[0]
    classes = getattr(pipeline, "classes_", [])
    confidence = float(probabilities.max())
    ranked_recommendations = []

    if len(classes) == len(probabilities):
        ranked_indices = sorted(
            range(len(probabilities)),
            key=lambda index: probabilities[index],
            reverse=True,
        )
        ranked_recommendations = [
            {
                "name": str(classes[index]),
                "confidence": round(float(probabilities[index]), 4),
            }
            for index in ranked_indices[:3]
        ]

    return {
        "recommended_crop": prediction,
        "confidence": round(confidence, 4),
        "recommended_crops": ranked_recommendations,
    }
