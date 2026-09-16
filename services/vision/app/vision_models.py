"""Chargement paresseux (singleton) des modeles MediaPipe.

Chaque tache MediaPipe (FaceLandmarker, PoseLandmarker, ImageSegmenter) est
couteuse a instancier : on la cree une seule fois par process et on la
reutilise pour toutes les requetes.
"""

from __future__ import annotations

from functools import lru_cache

import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

from app import config


@lru_cache(maxsize=1)
def get_face_landmarker() -> mp_vision.FaceLandmarker:
    options = mp_vision.FaceLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=str(config.FACE_LANDMARKER_PATH)),
        num_faces=5,
        min_face_detection_confidence=0.5,
        min_face_presence_confidence=0.5,
    )
    return mp_vision.FaceLandmarker.create_from_options(options)


@lru_cache(maxsize=1)
def get_pose_landmarker() -> mp_vision.PoseLandmarker:
    options = mp_vision.PoseLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=str(config.POSE_LANDMARKER_PATH)),
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
    )
    return mp_vision.PoseLandmarker.create_from_options(options)


@lru_cache(maxsize=1)
def get_hair_segmenter() -> mp_vision.ImageSegmenter:
    options = mp_vision.ImageSegmenterOptions(
        base_options=mp_python.BaseOptions(model_asset_path=str(config.HAIR_SEGMENTER_PATH)),
        output_category_mask=True,
    )
    return mp_vision.ImageSegmenter.create_from_options(options)


@lru_cache(maxsize=1)
def get_selfie_segmenter() -> mp_vision.ImageSegmenter:
    options = mp_vision.ImageSegmenterOptions(
        base_options=mp_python.BaseOptions(model_asset_path=str(config.SELFIE_SEGMENTER_PATH)),
        output_category_mask=True,
    )
    return mp_vision.ImageSegmenter.create_from_options(options)


def to_mp_image(rgb_array) -> mp.Image:
    return mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_array)


def warm_up() -> None:
    """Force l'initialisation de tous les modeles (utilise au demarrage)."""
    get_face_landmarker()
    get_pose_landmarker()
    get_hair_segmenter()
    get_selfie_segmenter()
