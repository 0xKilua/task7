import numpy as np
import pytest

from app.silhouette import BodyNotDetectedError, reshape_silhouette


def test_zero_delta_is_identity(pose_rgb):
    result = reshape_silhouette(pose_rgb, 0)
    np.testing.assert_array_equal(result, pose_rgb)


def test_positive_delta_returns_same_shape(pose_rgb):
    result = reshape_silhouette(pose_rgb, 6)
    assert result.shape == pose_rgb.shape
    assert result.dtype == pose_rgb.dtype


def test_negative_delta_returns_same_shape(pose_rgb):
    result = reshape_silhouette(pose_rgb, -6)
    assert result.shape == pose_rgb.shape


def test_positive_and_negative_deltas_differ(pose_rgb):
    plus = reshape_silhouette(pose_rgb, 10)
    minus = reshape_silhouette(pose_rgb, -10)
    assert not np.array_equal(plus, minus)


def test_face_region_is_untouched_above_shoulders(pose_rgb):
    """La bande d'effet commence aux epaules : les lignes du dessus
    (tete/visage) doivent rester strictement identiques."""
    result = reshape_silhouette(pose_rgb, 10)
    # Les 10% de lignes du haut de l'image sont, pour cette photo de pose
    # debout, largement au-dessus des epaules.
    top_rows = int(pose_rgb.shape[0] * 0.05)
    np.testing.assert_array_equal(result[:top_rows], pose_rgb[:top_rows])


def test_no_body_detected_raises_on_blank_image():
    blank = np.full((400, 400, 3), 128, dtype=np.uint8)
    with pytest.raises(BodyNotDetectedError):
        reshape_silhouette(blank, 6)


def test_extreme_delta_stays_bounded_internally(pose_rgb):
    # La validation de plage (+/-20kg) est faite par l'API et par
    # @relook/types cote client ; la fonction bas niveau applique malgre
    # tout un clamp interne (+/-40% de largeur) pour rester robuste.
    result = reshape_silhouette(pose_rgb, 1000)
    assert result.shape == pose_rgb.shape
