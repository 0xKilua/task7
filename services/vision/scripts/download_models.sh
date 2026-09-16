#!/usr/bin/env bash
# Telecharge les modeles MediaPipe officiels (Google, licence Apache-2.0)
# utilises par le service de vision. Ces modeles tournent entierement en
# local sur CPU : aucune cle API n'est necessaire pour ce service.
set -euo pipefail

DEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/models"
mkdir -p "$DEST_DIR"

declare -A MODELS=(
  ["face_landmarker.task"]="https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
  ["pose_landmarker_lite.task"]="https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
  ["hair_segmenter.tflite"]="https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/1/hair_segmenter.tflite"
  ["selfie_segmenter.tflite"]="https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite"
)

for name in "${!MODELS[@]}"; do
  if [ -f "$DEST_DIR/$name" ]; then
    echo "OK deja present: $name"
    continue
  fi
  echo "Telechargement: $name"
  curl -sS -L -o "$DEST_DIR/$name" "${MODELS[$name]}"
done

echo "Modeles disponibles dans $DEST_DIR"
