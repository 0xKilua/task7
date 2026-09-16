from app.analyze import analyze_photo


def test_portrait_detects_a_face(portrait_rgb):
    result = analyze_photo(portrait_rgb)
    assert result.face_detected is True
    assert result.face_count >= 1
    assert result.width_px == portrait_rgb.shape[1]
    assert result.height_px == portrait_rgb.shape[0]
    assert 0.0 <= result.sharpness_score <= 1.0


def test_portrait_is_not_full_body(portrait_rgb):
    result = analyze_photo(portrait_rgb)
    assert result.framing != "pied_a_tete"
    assert result.full_body_visible is False
    assert any("tete aux pieds" in w for w in result.warnings)


def test_pose_photo_detects_a_body(pose_rgb):
    result = analyze_photo(pose_rgb)
    assert result.body_detected is True


def test_blank_image_has_no_detections():
    import numpy as np

    blank = np.full((600, 600, 3), 200, dtype=np.uint8)
    result = analyze_photo(blank)
    assert result.face_detected is False
    assert result.body_detected is False
    assert result.framing == "indetermine"
    assert any("Aucun visage" in w for w in result.warnings)
