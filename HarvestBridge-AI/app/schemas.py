from pydantic import BaseModel


class PredictionRequest(BaseModel):

    District: str

    Plant_Month: str

    Temperature_C: float

    Rainfall_mm: float

    Humidity_pct: float

    pH: float
