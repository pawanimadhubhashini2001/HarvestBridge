import pandas as pd

from app.loader import pipeline


def predict(data: dict):

    df = pd.DataFrame([data])

    prediction = pipeline.predict(df)[0]

    probabilities = pipeline.predict_proba(df)[0]

    confidence = float(probabilities.max())

    return {

        "recommended_crop": prediction,

        "confidence": round(confidence, 4)

    }
