from fastapi import FastAPI

from app.schemas import PredictionRequest

from app.predictor import predict

app = FastAPI(
    title="HarvestBridge AI"
)

@app.get("/")
def root():

    return {

        "message":
        "HarvestBridge AI Running"

    }

@app.get("/health")
def health():

    return {

        "status": "healthy"

    }

@app.post("/predict")
def predict_crop(request: PredictionRequest):

    result = predict(
        request.model_dump()
    )

    return result