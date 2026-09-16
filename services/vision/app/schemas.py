from pydantic import BaseModel, Field


class LabColorIn(BaseModel):
    l: float = Field(ge=0, le=100)
    a: float = Field(ge=-128, le=127)
    b: float = Field(ge=-128, le=127)


class AnalyzeResponse(BaseModel):
    framing: str
    faceDetected: bool
    faceCount: int
    bodyDetected: bool
    fullBodyVisible: bool
    widthPx: int
    heightPx: int
    sharpnessScore: float
    warnings: list[str]


class ErrorResponse(BaseModel):
    error: str
    detail: str
