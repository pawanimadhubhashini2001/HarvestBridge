import pandas as pd

from app.loader import bundle, pipeline


FIELD_ALIASES = {
    "District": ["District", "district"],
    "Plant Month": ["Plant Month", "Plant_Month", "Season", "plant_month", "season"],
    "Rainfall(mm)": ["Rainfall(mm)", "Rainfall_mm", "rainfall"],
    "Temperature(C)": ["Temperature(C)", "Temperature_C", "temperature"],
    "Humidity(%)": ["Humidity(%)", "Humidity_pct", "humidity"],
    "Soil pH": ["Soil pH", "Soil_pH", "pH", "ph"],
}


def _get_value(data: dict, canonical_field: str):
    for key in FIELD_ALIASES[canonical_field]:
        if key in data and data[key] is not None:
            return data[key]

    raise ValueError(f"Missing required field: {canonical_field}")


def _encode_known_value(encoder, value: str, field_name: str) -> int:
    normalized_value = str(value).strip().title()

    if normalized_value not in encoder.classes_:
        valid_values = ", ".join(str(item) for item in encoder.classes_)
        raise ValueError(f"Unknown {field_name}: {value}. Valid values: {valid_values}")

    return int(encoder.transform([normalized_value])[0])


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
            raise ValueError(f"Unknown Plant Month: {plant_month}. Valid values: {valid_months}")

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
        prediction = model.predict(df)[0]
        probabilities = model.predict_proba(df)[0]
        ranked_indices = sorted(
            range(len(probabilities)),
            key=lambda index: probabilities[index],
            reverse=True,
        )
        ranked_recommendations = [
            {
                "name": str(crop_encoder.inverse_transform([index])[0]),
                "confidence": round(float(probabilities[index]), 4),
            }
            for index in ranked_indices[:3]
        ]
        recommended_crop = str(crop_encoder.inverse_transform([prediction])[0])

        return {
            "recommended_crop": recommended_crop,
            "confidence": round(float(probabilities[prediction]), 4),
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
    prediction = model.predict(df)[0]
    probabilities = model.predict_proba(df)[0]
    ranked_indices = sorted(
        range(len(probabilities)),
        key=lambda index: probabilities[index],
        reverse=True,
    )
    ranked_recommendations = [
        {
            "name": str(crop_encoder.inverse_transform([index])[0]),
            "confidence": round(float(probabilities[index]), 4),
        }
        for index in ranked_indices[:3]
    ]
    recommended_crop = str(crop_encoder.inverse_transform([prediction])[0])

    return {
        "recommended_crop": recommended_crop,
        "confidence": round(float(probabilities[prediction]), 4),
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
