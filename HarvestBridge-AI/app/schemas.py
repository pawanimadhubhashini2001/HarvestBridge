from pydantic import BaseModel


class PredictionRequest(BaseModel):

    District: str

    Season: str

    Soil_Type: str

    Temperature_C: float

    Rainfall_mm: float

    Humidity_pct: float

    pH: float | None = None

    Previous_Crop: str | None = None

    Previous_Yield_t_ha: float | None = None

    Market_Demand: str | None = None
