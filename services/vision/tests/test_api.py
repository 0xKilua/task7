import io
import json

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

client = TestClient(app)


def _png_bytes(image_path) -> bytes:
    img = Image.open(image_path).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_analyze_endpoint(portrait_rgb, tmp_path):
    img_path = tmp_path / "p.png"
    Image.fromarray(portrait_rgb).save(img_path)
    with open(img_path, "rb") as f:
        resp = client.post("/analyze", files={"image": ("p.png", f, "image/png")})
    assert resp.status_code == 200
    body = resp.json()
    assert body["faceDetected"] is True
    assert "warnings" in body


def test_analyze_rejects_empty_file():
    resp = client.post("/analyze", files={"image": ("empty.png", b"", "image/png")})
    assert resp.status_code == 400


def test_recolor_hair_endpoint(portrait_rgb, tmp_path):
    img_path = tmp_path / "p.png"
    Image.fromarray(portrait_rgb).save(img_path)
    with open(img_path, "rb") as f:
        resp = client.post(
            "/recolor-hair",
            files={"image": ("p.png", f, "image/png")},
            data={"target_lab": json.dumps({"l": 80, "a": 0, "b": 25})},
        )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"
    assert len(resp.content) > 0


def test_recolor_hair_invalid_json(portrait_rgb, tmp_path):
    img_path = tmp_path / "p.png"
    Image.fromarray(portrait_rgb).save(img_path)
    with open(img_path, "rb") as f:
        resp = client.post(
            "/recolor-hair",
            files={"image": ("p.png", f, "image/png")},
            data={"target_lab": "not-json"},
        )
    assert resp.status_code == 400


def test_reshape_endpoint(pose_rgb, tmp_path):
    img_path = tmp_path / "pose.png"
    Image.fromarray(pose_rgb).save(img_path)
    with open(img_path, "rb") as f:
        resp = client.post("/reshape", files={"image": ("pose.png", f, "image/png")}, data={"delta_kg": "6"})
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"


def test_reshape_rejects_invalid_delta(pose_rgb, tmp_path):
    img_path = tmp_path / "pose.png"
    Image.fromarray(pose_rgb).save(img_path)
    with open(img_path, "rb") as f:
        resp = client.post("/reshape", files={"image": ("pose.png", f, "image/png")}, data={"delta_kg": "5"})
    assert resp.status_code == 400


def test_reshape_rejects_body_not_detected():
    from PIL import Image as PILImage
    import numpy as np

    blank = np.full((300, 300, 3), 100, dtype=np.uint8)
    buf = io.BytesIO()
    PILImage.fromarray(blank).save(buf, format="PNG")
    buf.seek(0)
    resp = client.post("/reshape", files={"image": ("blank.png", buf, "image/png")}, data={"delta_kg": "4"})
    assert resp.status_code == 422
