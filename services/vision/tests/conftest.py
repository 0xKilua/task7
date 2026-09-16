from pathlib import Path

import numpy as np
import pytest
from PIL import Image

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture(scope="session")
def portrait_rgb() -> np.ndarray:
    return np.array(Image.open(FIXTURES_DIR / "portrait.jpg").convert("RGB"))


@pytest.fixture(scope="session")
def pose_rgb() -> np.ndarray:
    return np.array(Image.open(FIXTURES_DIR / "pose.jpg").convert("RGB"))
