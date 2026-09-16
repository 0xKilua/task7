"""Recoloration reelle des cheveux par transfert de couleur en espace LAB.

Principe (transfert de couleur de type Reinhard, restreint au masque de
segmentation des cheveux) :
  1. Segmentation semantique des cheveux (modele MediaPipe Hair Segmenter).
  2. Conversion de l'image en LAB.
  3. Pour les pixels situes dans le masque, on RECENTRE la moyenne de
     chaque canal (L, a, b) sur la couleur cible, SANS toucher a la
     variance : la texture, les reflets et le volume du cheveu (qui sont
     portes par les variations locales, donc par la variance) sont donc
     conserves. Seule la teinte moyenne change.
  4. Pour les techniques bi-ton (balayage, ombre, degrade, meches,
     racines_differentes, bicolore) un gradient racines -> pointes melange
     deux couleurs cibles avant l'etape 3.
  5. Le masque est adouci (flou gaussien) pour un raccord de bord naturel,
     et seule la zone du masque est modifiee : le reste de l'image
     (visage, arriere-plan, vetements) reste bit-a-bit identique.

Ce n'est pas un filtre de teinte applique uniformement sur l'image : sans
detection reelle des cheveux, la fonction leve une erreur plutot que de
"faire semblant".
"""

from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np

from app.vision_models import get_hair_segmenter, to_mp_image

MIN_HAIR_PIXEL_RATIO = 0.005  # 0.5% de l'image ; en-dessous, on considere qu'il n'y a pas de cheveux exploitables.
FEATHER_KERNEL_FRACTION = 0.01  # taille du flou de bord, relative a la plus petite dimension de l'image


class HairNotDetectedError(Exception):
    pass


@dataclass
class LabTarget:
    l: float
    a: float
    b: float

    def to_opencv_scale(self) -> np.ndarray:
        # OpenCV encode L sur [0,255] (correspond a [0,100]) et a/b sur
        # [0,255] avec un offset de 128 (correspond a [-128,127]).
        return np.array([self.l * 255.0 / 100.0, self.a + 128.0, self.b + 128.0], dtype=np.float32)


def get_feathered_hair_mask(rgb_array: np.ndarray) -> np.ndarray:
    mp_image = to_mp_image(rgb_array)
    result = get_hair_segmenter().segment(mp_image)
    raw_mask = result.category_mask.numpy_view()  # (H, W) or (H, W, 1), valeurs {0,1}
    mask = (np.asarray(raw_mask).reshape(rgb_array.shape[0], rgb_array.shape[1]) > 0).astype(np.float32)

    ratio = float(mask.mean())
    if ratio < MIN_HAIR_PIXEL_RATIO:
        raise HairNotDetectedError(
            f"Cheveux non detectes de maniere fiable sur cette photo (ratio={ratio:.4f})."
        )

    shorter_side = min(rgb_array.shape[0], rgb_array.shape[1])
    kernel = max(3, int(shorter_side * FEATHER_KERNEL_FRACTION) | 1)  # impair
    feathered = cv2.GaussianBlur(mask, (kernel, kernel), 0)
    return np.clip(feathered, 0.0, 1.0)


def _vertical_gradient_weight(mask: np.ndarray) -> np.ndarray:
    """0 en haut du masque (racines), 1 en bas (pointes)."""
    ys, _ = np.nonzero(mask > 0.05)
    if ys.size == 0:
        return np.zeros_like(mask)
    top, bottom = ys.min(), ys.max()
    height = max(1, bottom - top)
    row_idx = np.arange(mask.shape[0], dtype=np.float32).reshape(-1, 1)
    gradient = np.clip((row_idx - top) / height, 0.0, 1.0)
    return np.repeat(gradient, mask.shape[1], axis=1)


def recolor_hair(
    rgb_array: np.ndarray,
    target: LabTarget,
    secondary: LabTarget | None = None,
) -> np.ndarray:
    mask = get_feathered_hair_mask(rgb_array)  # (H, W) float32 in [0,1]

    lab = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2LAB).astype(np.float32)

    hard_mask = mask > 0.5
    if not hard_mask.any():
        raise HairNotDetectedError("Masque de cheveux vide apres adoucissement.")

    mean_old = lab[hard_mask].mean(axis=0)  # [L, a, b] moyenne actuelle des cheveux

    target_cv = target.to_opencv_scale()
    if secondary is not None:
        gradient = _vertical_gradient_weight(mask)[..., None]  # (H, W, 1)
        secondary_cv = secondary.to_opencv_scale()
        target_field = (1 - gradient) * target_cv + gradient * secondary_cv
    else:
        target_field = np.broadcast_to(target_cv, lab.shape).astype(np.float32)

    shifted = lab - mean_old + target_field
    shifted[..., 0] = np.clip(shifted[..., 0], 0, 255)
    shifted[..., 1] = np.clip(shifted[..., 1], 0, 255)
    shifted[..., 2] = np.clip(shifted[..., 2], 0, 255)

    alpha = mask[..., None]
    recolored_lab = alpha * shifted + (1 - alpha) * lab
    recolored_rgb = cv2.cvtColor(recolored_lab.astype(np.uint8), cv2.COLOR_LAB2RGB)

    # Garantie stricte : hors masque, pixels identiques a l'original.
    outside = mask < 0.01
    recolored_rgb = recolored_rgb.copy()
    recolored_rgb[outside] = rgb_array[outside]

    return recolored_rgb
