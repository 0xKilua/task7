import os
from pathlib import Path

MODELS_DIR = Path(os.environ.get("VISION_MODELS_DIR", Path(__file__).resolve().parent.parent / "models"))

FACE_LANDMARKER_PATH = MODELS_DIR / "face_landmarker.task"
POSE_LANDMARKER_PATH = MODELS_DIR / "pose_landmarker_lite.task"
HAIR_SEGMENTER_PATH = MODELS_DIR / "hair_segmenter.tflite"
SELFIE_SEGMENTER_PATH = MODELS_DIR / "selfie_segmenter.tflite"

# Seuil de visibilite MediaPipe Pose en dessous duquel un landmark est
# considere non fiable (hors cadre / occlus).
POSE_VISIBILITY_THRESHOLD = 0.5

PORT = int(os.environ.get("PORT", "8100"))
