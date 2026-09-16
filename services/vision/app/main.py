"""Service de vision (FastAPI) : analyse photo, segmentation, recoloration
des cheveux et simulation de silhouette. Tourne entierement en local sur
CPU avec des modeles MediaPipe officiels : aucune cle API externe requise.

Ce service NE fait PAS le changement de forme de coiffure (geometrie) ni
l'essayage de vetements (virtual try-on), qui necessitent un modele de
diffusion generatif hors de portee du CPU disponible ici : voir
packages/ai-engine pour l'integration (optionnelle, a configurer) d'un
fournisseur hebergeant ces modeles.
"""

from __future__ import annotations

import io
import json
import logging
from contextlib import asynccontextmanager

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image

from app.analyze import PhotoAnalysis, analyze_photo
from app.color_transform import HairNotDetectedError, LabTarget, recolor_hair
from app.silhouette import BodyNotDetectedError, reshape_silhouette
from app.vision_models import warm_up

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("relook.vision")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("Chargement des modeles MediaPipe...")
    warm_up()
    logger.info("Modeles charges.")
    yield


app = FastAPI(title="Relook Vision Service", version="0.1.0", lifespan=lifespan)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


async def _read_rgb(upload: UploadFile) -> np.ndarray:
    raw = await upload.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Fichier image vide.")
    try:
        image = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Image illisible : {exc}") from exc
    return np.array(image)


def _encode_png(rgb_array: np.ndarray) -> bytes:
    bgr = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2BGR)
    ok, buf = cv2.imencode(".png", bgr)
    if not ok:
        raise HTTPException(status_code=500, detail="Echec de l'encodage PNG du resultat.")
    return buf.tobytes()


def _analysis_to_dict(analysis: PhotoAnalysis) -> dict:
    return {
        "framing": analysis.framing,
        "faceDetected": analysis.face_detected,
        "faceCount": analysis.face_count,
        "bodyDetected": analysis.body_detected,
        "fullBodyVisible": analysis.full_body_visible,
        "widthPx": analysis.width_px,
        "heightPx": analysis.height_px,
        "sharpnessScore": analysis.sharpness_score,
        "warnings": analysis.warnings,
    }


@app.post("/analyze")
async def analyze(image: UploadFile = File(...)) -> dict:
    rgb = await _read_rgb(image)
    analysis = analyze_photo(rgb)
    return _analysis_to_dict(analysis)


@app.post("/recolor-hair")
async def recolor_hair_endpoint(
    image: UploadFile = File(...),
    target_lab: str = Form(..., description='JSON {"l":..,"a":..,"b":..}'),
    secondary_lab: str | None = Form(None, description="JSON optionnel pour balayage/ombre/etc."),
) -> Response:
    rgb = await _read_rgb(image)
    try:
        target = LabTarget(**json.loads(target_lab))
        secondary = LabTarget(**json.loads(secondary_lab)) if secondary_lab else None
    except (json.JSONDecodeError, TypeError) as exc:
        raise HTTPException(status_code=400, detail=f"target_lab/secondary_lab invalide : {exc}") from exc

    try:
        result = recolor_hair(rgb, target, secondary)
    except HairNotDetectedError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return Response(content=_encode_png(result), media_type="image/png")


@app.post("/reshape")
async def reshape_endpoint(
    image: UploadFile = File(...),
    delta_kg: float = Form(...),
) -> Response:
    if delta_kg % 2 != 0 or delta_kg < -20 or delta_kg > 20:
        raise HTTPException(
            status_code=400, detail="delta_kg doit etre un multiple de 2 entre -20 et +20."
        )
    rgb = await _read_rgb(image)
    try:
        result = reshape_silhouette(rgb, delta_kg)
    except BodyNotDetectedError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return Response(content=_encode_png(result), media_type="image/png")


@app.post("/segment-hair")
async def segment_hair_endpoint(image: UploadFile = File(...)) -> Response:
    """Endpoint de debug/administration : visualise le masque de cheveux."""
    from app.color_transform import get_feathered_hair_mask, HairNotDetectedError as _HNE

    rgb = await _read_rgb(image)
    try:
        mask = get_feathered_hair_mask(rgb)
    except _HNE as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    mask_img = (mask * 255).astype(np.uint8)
    ok, buf = cv2.imencode(".png", mask_img)
    if not ok:
        raise HTTPException(status_code=500, detail="Echec de l'encodage du masque.")
    return Response(content=buf.tobytes(), media_type="image/png")
