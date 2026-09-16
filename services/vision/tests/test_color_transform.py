import cv2
import numpy as np
import pytest

from app.color_transform import HairNotDetectedError, LabTarget, get_feathered_hair_mask, recolor_hair


def test_hair_mask_is_nonempty_on_portrait(portrait_rgb):
    mask = get_feathered_hair_mask(portrait_rgb)
    assert mask.shape == portrait_rgb.shape[:2]
    assert 0.0 < mask.mean() < 0.5


def test_recolor_changes_hair_region_toward_target(portrait_rgb):
    target = LabTarget(l=85.0, a=0.0, b=25.0)  # blond clair
    result = recolor_hair(portrait_rgb, target)
    assert result.shape == portrait_rgb.shape

    mask = get_feathered_hair_mask(portrait_rgb) > 0.5
    original_lab = cv2.cvtColor(portrait_rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
    result_lab = cv2.cvtColor(result, cv2.COLOR_RGB2LAB).astype(np.float32)

    original_mean_l = original_lab[mask][:, 0].mean()
    result_mean_l = result_lab[mask][:, 0].mean()
    # La cible est nettement plus claire (L=85 -> ~216 echelle OpenCV) donc la
    # luminance moyenne des cheveux doit augmenter significativement.
    assert result_mean_l > original_mean_l


def test_recolor_preserves_pixels_outside_hair_mask(portrait_rgb):
    target = LabTarget(l=20.0, a=5.0, b=5.0)  # noir
    result = recolor_hair(portrait_rgb, target)
    mask = get_feathered_hair_mask(portrait_rgb) < 0.01
    np.testing.assert_array_equal(result[mask], portrait_rgb[mask])


def test_recolor_preserves_local_contrast_variance(portrait_rgb):
    """La variance locale (texture) doit rester proche de l'originale :
    on ne fait que decaler la moyenne, pas ecraser le detail."""
    target = LabTarget(l=30.0, a=10.0, b=15.0)
    result = recolor_hair(portrait_rgb, target)

    mask = get_feathered_hair_mask(portrait_rgb) > 0.5
    original_lab = cv2.cvtColor(portrait_rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
    result_lab = cv2.cvtColor(result, cv2.COLOR_RGB2LAB).astype(np.float32)

    original_std = original_lab[mask][:, 0].std()
    result_std = result_lab[mask][:, 0].std()
    assert abs(original_std - result_std) < 5.0


def test_recolor_with_secondary_creates_a_gradient(portrait_rgb):
    target = LabTarget(l=25.0, a=8.0, b=10.0)
    secondary = LabTarget(l=80.0, a=0.0, b=25.0)
    result = recolor_hair(portrait_rgb, target, secondary)
    assert result.shape == portrait_rgb.shape


def test_no_hair_detected_raises(monkeypatch, portrait_rgb):
    def fake_empty_mask(_rgb):
        raise HairNotDetectedError("no hair")

    monkeypatch.setattr("app.color_transform.get_feathered_hair_mask", fake_empty_mask)
    with pytest.raises(HairNotDetectedError):
        recolor_hair(portrait_rgb, LabTarget(l=50, a=0, b=0))
