from pathlib import Path
import joblib

BASE_DIR = Path(__file__).resolve().parent.parent

MODELS_DIR = BASE_DIR / "models"
BUNDLE_PATH = MODELS_DIR / "crop_model_bundle.pkl"

if BUNDLE_PATH.exists():
    bundle = joblib.load(BUNDLE_PATH)
    pipeline = bundle["model"]
    metadata = bundle.get("metadata", {})
else:
    bundle = None
    pipeline = joblib.load(
        MODELS_DIR / "crop_model_pipeline.pkl"
    )

    metadata = joblib.load(
        MODELS_DIR / "crop_model_metadata.pkl"
    )
