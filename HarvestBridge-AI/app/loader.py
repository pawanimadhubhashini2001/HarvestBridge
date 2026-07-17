from pathlib import Path
import joblib

BASE_DIR = Path(__file__).resolve().parent.parent

MODELS_DIR = BASE_DIR / "models"

pipeline = joblib.load(
    MODELS_DIR / "crop_model_pipeline.pkl"
)

metadata = joblib.load(
    MODELS_DIR / "crop_model_metadata.pkl"
)