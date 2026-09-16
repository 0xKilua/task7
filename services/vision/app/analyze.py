"""Analyse d'une photo : detection visage/corps, cadrage, nettete.

Toute la logique ici repose sur des landmarks MediaPipe reels (pas de
regle arbitraire sur les pixels) : la classification de cadrage utilise la
*visibilite* des points de repos (epaules/hanches/genoux/chevilles) telle
que retournee par le modele de pose.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import cv2
import numpy as np

from app import config
from app.vision_models import get_face_landmarker, get_pose_landmarker, to_mp_image

# Indices MediaPipe Pose (33 points)
NOSE = 0
LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12
LEFT_HIP, RIGHT_HIP = 23, 24
LEFT_KNEE, RIGHT_KNEE = 25, 26
LEFT_ANKLE, RIGHT_ANKLE = 27, 28


@dataclass
class PhotoAnalysis:
    framing: str
    face_detected: bool
    face_count: int
    body_detected: bool
    full_body_visible: bool
    width_px: int
    height_px: int
    sharpness_score: float
    warnings: list[str] = field(default_factory=list)


def _sharpness_score(gray: np.ndarray) -> float:
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    # Normalisation heuristique : au-dela de ~800 de variance, l'image est
    # consideree nette (score plafonne a 1.0).
    return float(min(1.0, variance / 800.0))


def _visibility(landmarks, idx: int) -> float:
    if not landmarks or idx >= len(landmarks):
        return 0.0
    lm = landmarks[idx]
    vis = getattr(lm, "visibility", None)
    return float(vis) if vis is not None else 0.0


def classify_framing(pose_landmarks: list, face_detected: bool) -> tuple[str, bool]:
    if not pose_landmarks:
        return ("portrait" if face_detected else "indetermine"), False

    lm = pose_landmarks[0]
    shoulder_vis = max(_visibility(lm, LEFT_SHOULDER), _visibility(lm, RIGHT_SHOULDER))
    hip_vis = max(_visibility(lm, LEFT_HIP), _visibility(lm, RIGHT_HIP))
    knee_vis = max(_visibility(lm, LEFT_KNEE), _visibility(lm, RIGHT_KNEE))
    ankle_vis = max(_visibility(lm, LEFT_ANKLE), _visibility(lm, RIGHT_ANKLE))
    threshold = config.POSE_VISIBILITY_THRESHOLD

    if ankle_vis > threshold and knee_vis > threshold and hip_vis > threshold and shoulder_vis > threshold:
        return "pied_a_tete", True
    if hip_vis > threshold and shoulder_vis > threshold:
        return "demi_corps", False
    if shoulder_vis > threshold:
        return "buste", False
    return "portrait", False


def analyze_photo(rgb_array: np.ndarray) -> PhotoAnalysis:
    height, width = rgb_array.shape[:2]
    gray = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2GRAY)
    sharpness = _sharpness_score(gray)

    mp_image = to_mp_image(rgb_array)

    face_result = get_face_landmarker().detect(mp_image)
    face_count = len(face_result.face_landmarks)
    face_detected = face_count > 0

    pose_result = get_pose_landmarker().detect(mp_image)
    body_detected = len(pose_result.pose_landmarks) > 0

    framing, full_body_visible = classify_framing(pose_result.pose_landmarks, face_detected)

    warnings: list[str] = []
    if not face_detected and not body_detected:
        warnings.append(
            "Aucun visage ni silhouette detecte. Utilisez une photo plus nette, mieux "
            "eclairee, avec le sujet bien visible."
        )
    if not face_detected and body_detected:
        warnings.append(
            "Visage non clairement detecte : les modules coiffure et couleur seront "
            "moins fiables sur cette photo."
        )
    if face_count > 1:
        warnings.append(
            "Plusieurs visages detectes : la transformation portera sur le visage "
            "principal (le plus grand dans l'image)."
        )
    if framing != "pied_a_tete":
        warnings.append(
            "Pour essayer des vetements ou simuler la silhouette, utilisez de "
            "preference une photo prise de la tete aux pieds."
        )
    if sharpness < 0.25:
        warnings.append("Photo peu nette : le resultat de la simulation peut etre degrade.")
    if width < 480 or height < 480:
        warnings.append("Resolution basse : privilegiez une photo d'au moins 480x480 pixels.")

    return PhotoAnalysis(
        framing=framing,
        face_detected=face_detected,
        face_count=face_count,
        body_detected=body_detected,
        full_body_visible=full_body_visible,
        width_px=width,
        height_px=height,
        sharpness_score=round(sharpness, 4),
        warnings=warnings,
    )
