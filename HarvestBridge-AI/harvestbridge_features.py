import pandas as pd


def add_crop_features(data: pd.DataFrame) -> pd.DataFrame:
    """Add deterministic crop-model features without using the target column."""
    X = data.copy()

    X["temp_rainfall"] = X["Temperature_C"] * X["Rainfall_mm"]
    X["rainfall_humidity"] = X["Rainfall_mm"] * X["Humidity_pct"]
    X["ph_distance_neutral"] = (X["pH"] - 7).abs()
    X["yield_per_rainfall"] = X["Previous_Yield_t_ha"] / (X["Rainfall_mm"] + 1)
    X["has_previous_crop"] = X["Previous_Crop"].notna().astype(int)
    X["has_soil_type"] = X["Soil_Type"].notna().astype(int)

    return X
