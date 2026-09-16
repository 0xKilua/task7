"""Simulation visuelle de variation de silhouette (+/- kg, palier de 2kg).

Approche : mise a l'echelle horizontale, ligne par ligne, du buste/taille/
hanches, centree sur l'axe du corps (detecte via les landmarks de pose) et
bornee par la silhouette reelle de la personne (segmentation MediaPipe
Selfie Segmenter). La zone d'effet est deliberement limitee aux epaules ->
haut des cuisses (la zone la plus representative d'une variation de poids)
avec un fondu (taper) en haut et en bas, pour :
  - ne jamais toucher au visage ni a la coiffure (au-dessus des epaules) ;
  - eviter les deformations de membres (mains, avant-bras, mollets, pieds
    restent hors de la zone d'effet) ;
  - laisser l'arriere-plan intact hors de la silhouette de la personne.

deltaKg=0 est garanti reproduire l'image d'entree a l'identique (test
`test_reshape_zero_delta_is_identity`).

Limite connue (documentee, pas dissimulee) : a fort agrandissement, la zone
nouvellement "revelee" en bordure de silhouette est remplie par
etirement/repetition des pixels voisins plutot que par un inpainting
generatif complet ; le rendu reste plausible mais moins parfait qu'un
moteur de diffusion dedie. Ce dernier pourra etre branche plus tard via
packages/ai-engine sans changer cette API.
"""

from __future__ import annotations

import cv2
import numpy as np

from app.vision_models import get_pose_landmarker, get_selfie_segmenter, to_mp_image

LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12
LEFT_HIP, RIGHT_HIP = 23, 24
LEFT_KNEE, RIGHT_KNEE = 25, 26

PER_KG_WIDTH_FRACTION = 0.014
BAND_BOTTOM_HIP_KNEE_FRACTION = 0.35
TAPER_FRACTION = 0.2  # portion haute/basse de la bande sur laquelle l'effet s'attenue


class BodyNotDetectedError(Exception):
    pass


def _xy(landmarks, idx: int, width: int, height: int) -> tuple[float, float]:
    lm = landmarks[idx]
    return lm.x * width, lm.y * height


def _smoothstep(t: float) -> float:
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def _person_mask(rgb_array: np.ndarray) -> np.ndarray:
    mp_image = to_mp_image(rgb_array)
    result = get_selfie_segmenter().segment(mp_image)
    raw = result.category_mask.numpy_view()
    mask = (np.asarray(raw).reshape(rgb_array.shape[0], rgb_array.shape[1]) > 0).astype(np.float32)
    shorter_side = min(rgb_array.shape[:2])
    kernel = max(3, int(shorter_side * 0.01) | 1)
    return np.clip(cv2.GaussianBlur(mask, (kernel, kernel), 0), 0.0, 1.0)


def reshape_silhouette(rgb_array: np.ndarray, delta_kg: float) -> np.ndarray:
    height, width = rgb_array.shape[:2]

    if delta_kg == 0:
        return rgb_array.copy()

    mp_image = to_mp_image(rgb_array)
    pose_result = get_pose_landmarker().detect(mp_image)
    if not pose_result.pose_landmarks:
        raise BodyNotDetectedError("Corps non detecte : impossible de simuler la silhouette.")
    landmarks = pose_result.pose_landmarks[0]

    lsx, lsy = _xy(landmarks, LEFT_SHOULDER, width, height)
    rsx, rsy = _xy(landmarks, RIGHT_SHOULDER, width, height)
    lhx, lhy = _xy(landmarks, LEFT_HIP, width, height)
    rhx, rhy = _xy(landmarks, RIGHT_HIP, width, height)
    lkx, lky = _xy(landmarks, LEFT_KNEE, width, height)
    rkx, rky = _xy(landmarks, RIGHT_KNEE, width, height)

    shoulder_y, shoulder_cx = (lsy + rsy) / 2, (lsx + rsx) / 2
    hip_y, hip_cx = (lhy + rhy) / 2, (lhx + rhx) / 2
    knee_y = (lky + rky) / 2

    if hip_y <= shoulder_y:
        raise BodyNotDetectedError("Geometrie corporelle incoherente detectee sur cette photo.")

    band_top = shoulder_y
    band_bottom = hip_y + BAND_BOTTOM_HIP_KNEE_FRACTION * max(1.0, knee_y - hip_y)
    band_bottom = min(band_bottom, height - 1)

    person_mask = _person_mask(rgb_array)

    target_scale = 1.0 + max(-0.4, min(0.4, delta_kg * PER_KG_WIDTH_FRACTION))

    map_x = np.tile(np.arange(width, dtype=np.float32), (height, 1))
    map_y = np.tile(np.arange(height, dtype=np.float32).reshape(-1, 1), (1, width))

    row_start = max(0, int(band_top))
    row_end = min(height, int(band_bottom) + 1)
    band_height = max(1, row_end - row_start)

    for row in range(row_start, row_end):
        t = (row - band_top) / max(1.0, band_bottom - band_top)  # 0 at top, 1 at bottom
        taper = min(_smoothstep(t / TAPER_FRACTION), _smoothstep((1 - t) / TAPER_FRACTION))
        effective_scale = 1.0 + taper * (target_scale - 1.0)

        # Centre de l'axe du corps interpole lineairement epaules -> hanches
        center_t = min(1.0, max(0.0, (row - shoulder_y) / max(1.0, hip_y - shoulder_y)))
        center_x = shoulder_cx + center_t * (hip_cx - shoulder_cx)

        row_mask = person_mask[row] > 0.5
        if row_mask.any():
            xs = np.nonzero(row_mask)[0]
            local_left, local_right = xs.min(), xs.max()
            if not (local_left <= center_x <= local_right):
                center_x = (local_left + local_right) / 2

        dst_x = np.arange(width, dtype=np.float32)
        src_x = center_x + (dst_x - center_x) / effective_scale
        map_x[row] = np.clip(src_x, 0, width - 1)

    warped = cv2.remap(rgb_array, map_x, map_y, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)

    band_row_taper = np.zeros((height, 1), dtype=np.float32)
    for row in range(row_start, row_end):
        t = (row - band_top) / max(1.0, band_bottom - band_top)
        band_row_taper[row, 0] = min(_smoothstep(t / TAPER_FRACTION), _smoothstep((1 - t) / TAPER_FRACTION))

    alpha = (person_mask * band_row_taper).clip(0, 1)[..., None]
    composited = alpha * warped.astype(np.float32) + (1 - alpha) * rgb_array.astype(np.float32)
    return composited.astype(np.uint8)
