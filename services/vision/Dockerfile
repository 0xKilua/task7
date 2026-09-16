FROM python:3.11-slim

# Dependances systeme requises par OpenCV/MediaPipe (rendu logiciel, pas de GPU).
RUN apt-get update && apt-get install -y --no-install-recommends \
    libegl1 libgl1 libgles2 libglx-mesa0 libglib2.0-0 curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /srv

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY scripts/download_models.sh scripts/download_models.sh
RUN chmod +x scripts/download_models.sh && ./scripts/download_models.sh

COPY app app

EXPOSE 8100
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8100"]
