import numpy as np
import pandas as pd

from app.loader import BASE_DIR, bundle, pipeline


FIELD_ALIASES = {
    "District": ["District", "district"],
    "Plant Month": ["Plant Month", "Plant_Month", "Season", "plant_month", "season"],
    "Rainfall(mm)": ["Rainfall(mm)", "Rainfall_mm", "rainfall"],
    "Temperature(C)": ["Temperature(C)", "Temperature_C", "temperature"],
    "Humidity(%)": ["Humidity(%)", "Humidity_pct", "humidity"],
    "Soil pH": ["Soil pH", "Soil_pH", "pH", "ph"],
}

HISTORICAL_DATA_PATH = BASE_DIR / "dataset" / "HarvestBridge.csv"
HISTORICAL_SCORE_FIELDS = [
    "Rainfall(mm)",
    "Temperature(C)",
    "Humidity(%)",
    "Soil pH",
]

_historical_data = None
_historical_scales = {}


def _get_value(data: dict, canonical_field: str):
    for key in FIELD_ALIASES[canonical_field]:
        if key in data and data[key] is not None:
            return data[key]

    raise ValueError(f"Missing required field: {canonical_field}")


def _encode_known_value(encoder, value: str, field_name: str) -> int:
    normalized_value = str(value).strip().title()

    if normalized_value not in encoder.classes_:
        valid_values = ", ".join(str(item) for item in encoder.classes_)
        raise ValueError(
            f"Unknown {field_name}: {value}. Valid values: {valid_values}"
        )

    return int(encoder.transform([normalized_value])[0])


def _load_historical_data():
    global _historical_data, _historical_scales

    if _historical_data is not None:
        return _historical_data

    if not HISTORICAL_DATA_PATH.exists():
        _historical_data = pd.DataFrame()
        _historical_scales = {}
        return _historical_data

    df = pd.read_csv(HISTORICAL_DATA_PATH)

    for column in ["District", "Plant Month", "Crop"]:
        if column in df.columns:
            df[column] = df[column].astype(str).str.strip()

    _historical_scales = {
        field: max(float(pd.to_numeric(df[field], errors="coerce").std() or 0), 1.0)
        for field in HISTORICAL_SCORE_FIELDS
        if field in df.columns
    }
    _historical_data = df

    return _historical_data


def _historical_suitability_scores(data: dict, crop_names: list[str]) -> dict[str, float]:
    history = _load_historical_data()

    if history.empty:
        return {}

    try:
        district = str(_get_value(data, "District")).strip().casefold()
        plant_month = str(_get_value(data, "Plant Month")).strip().casefold()
    except ValueError:
        return {}

    numeric_inputs = {}

    for field in HISTORICAL_SCORE_FIELDS:
        try:
            numeric_inputs[field] = float(_get_value(data, field))
        except (TypeError, ValueError):
            continue

    if not numeric_inputs:
        return {}

    scores = {}

    for crop_name in crop_names:
        crop_rows = history[
            history["Crop"].astype(str).str.strip().str.casefold()
            == str(crop_name).strip().casefold()
        ]

        if crop_rows.empty:
            continue

        contextual_rows = crop_rows[
            (crop_rows["District"].astype(str).str.strip().str.casefold() == district)
            & (
                crop_rows["Plant Month"].astype(str).str.strip().str.casefold()
                == plant_month
            )
        ]
        comparison_rows = contextual_rows if len(contextual_rows) >= 3 else crop_rows
        distance = pd.Series(0.0, index=comparison_rows.index)
        used_fields = 0

        for field, input_value in numeric_inputs.items():
            if field not in comparison_rows.columns:
                continue

            values = pd.to_numeric(comparison_rows[field], errors="coerce")
            scale = _historical_scales.get(field, 1.0)
            distance = distance.add(((values - input_value) / scale) ** 2, fill_value=0)
            used_fields += 1

        if used_fields == 0:
            continue

        similarities = np.exp(-0.5 * (distance / used_fields))
        score = float(pd.Series(similarities).dropna().quantile(0.9))
        scores[str(crop_name)] = round(max(0.0, min(score, 0.99)), 4)

    return scores


def _build_ranked_recommendations(crop_names: list[str], probabilities, data: dict):
    historical_scores = _historical_suitability_scores(data, crop_names)
    candidates = []

    for index in range(len(probabilities)):
        crop_name = str(crop_names[index])
        model_probability = round(float(probabilities[index]), 4)
        historical_score = historical_scores.get(crop_name)
        confidence = model_probability

        if historical_score is not None:
            confidence = historical_score

        candidates.append(
            {
                "name": crop_name,
                "confidence": confidence,
                "model_probability": model_probability,
                "raw_confidence": model_probability,
                "historical_confidence": historical_score,
            }
        )

    return sorted(
        candidates,
        key=lambda candidate: (
            candidate["confidence"],
            candidate["model_probability"],
        ),
        reverse=True,
    )[:3]


def _predict_from_bundle(data: dict):
    model = bundle["model"]
    district_encoder = bundle["district_encoder"]
    crop_encoder = bundle["crop_encoder"]
    feature_names = bundle["feature_names"]

    if "month_map" in bundle:
        district = str(_get_value(data, "District")).strip().title()
        plant_month = str(_get_value(data, "Plant Month")).strip().title()
        month_map = bundle["month_map"]

        if plant_month not in month_map:
            valid_months = ", ".join(month_map.keys())
            raise ValueError(
                f"Unknown Plant Month: {plant_month}. Valid values: {valid_months}"
            )

        rainfall = float(_get_value(data, "Rainfall(mm)"))
        temperature = float(_get_value(data, "Temperature(C)"))
        humidity = float(_get_value(data, "Humidity(%)"))
        soil_ph = float(_get_value(data, "Soil pH"))
        district_enc = _encode_known_value(district_encoder, district, "District")
        plant_month_num = int(month_map[plant_month])
        temp_humidity = temperature * humidity / 100
        ph_deviation = abs(soil_ph - 7.0)

        row = {
            "District_enc": district_enc,
            "Plant Month Num": plant_month_num,
            "Rainfall(mm)": rainfall,
            "Temperature(C)": temperature,
            "Humidity(%)": humidity,
            "Soil pH": soil_ph,
            "Temp_Humidity": temp_humidity,
            "pH_deviation": ph_deviation,
            "Rain_Temp": rainfall * temperature,
            "Rain_Humidity": rainfall * humidity / 100,
            "Temp_pH": temperature * soil_ph,
            "Humidity_pH": humidity * soil_ph,
            "Month_Rain": plant_month_num * rainfall,
            "District_Month": district_enc * plant_month_num,
        }
        df = pd.DataFrame([row], columns=feature_names)
        probabilities = model.predict_proba(df)[0]
        crop_names = [
            str(crop_encoder.inverse_transform([index])[0])
            for index in range(len(probabilities))
        ]
        ranked_recommendations = _build_ranked_recommendations(
            crop_names,
            probabilities,
            data,
        )
        top_recommendation = ranked_recommendations[0]

        return {
            "recommended_crop": top_recommendation["name"],
            "confidence": top_recommendation["confidence"],
            "model_probability": top_recommendation["model_probability"],
            "raw_confidence": top_recommendation["raw_confidence"],
            "recommended_crops": ranked_recommendations,
            "top_3_crops": ranked_recommendations,
        }

    month_encoder = bundle["month_encoder"]
    row = {
        "District": _encode_known_value(
            district_encoder,
            _get_value(data, "District"),
            "District",
        ),
        "Plant Month": _encode_known_value(
            month_encoder,
            _get_value(data, "Plant Month"),
            "Plant Month",
        ),
        "Rainfall(mm)": float(_get_value(data, "Rainfall(mm)")),
        "Temperature(C)": float(_get_value(data, "Temperature(C)")),
        "Humidity(%)": float(_get_value(data, "Humidity(%)")),
        "Soil pH": float(_get_value(data, "Soil pH")),
    }
    df = pd.DataFrame([row], columns=feature_names)
    probabilities = model.predict_proba(df)[0]
    crop_names = [
        str(crop_encoder.inverse_transform([index])[0])
        for index in range(len(probabilities))
    ]
    ranked_recommendations = _build_ranked_recommendations(
        crop_names,
        probabilities,
        data,
    )
    top_recommendation = ranked_recommendations[0]

    return {
        "recommended_crop": top_recommendation["name"],
        "confidence": top_recommendation["confidence"],
        "model_probability": top_recommendation["model_probability"],
        "raw_confidence": top_recommendation["raw_confidence"],
        "recommended_crops": ranked_recommendations,
        "top_3_crops": ranked_recommendations,
    }


def predict(data: dict):
    if bundle is not None:
        return _predict_from_bundle(data)

    df = pd.DataFrame([data])
    prediction = pipeline.predict(df)[0]
    probabilities = pipeline.predict_proba(df)[0]
    classes = getattr(pipeline, "classes_", [])
    confidence = round(float(probabilities.max()), 4)
    model_probability = confidence
    ranked_recommendations = []

    if len(classes) == len(probabilities):
        ranked_recommendations = _build_ranked_recommendations(
            [str(crop_name) for crop_name in classes],
            probabilities,
            data,
        )
        top_recommendation = ranked_recommendations[0]
        prediction = top_recommendation["name"]
        confidence = top_recommendation["confidence"]
        model_probability = top_recommendation["model_probability"]

    return {
        "recommended_crop": str(prediction),
        "confidence": confidence,
        "model_probability": model_probability,
        "raw_confidence": model_probability,
        "recommended_crops": ranked_recommendations,
    }
