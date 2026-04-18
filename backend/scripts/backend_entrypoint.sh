#!/bin/bash
set -e

MODEL_DIR="/root/.cache/huggingface/hub/models--opendatalab--PDF-Extract-Kit-1.0"

if [ ! -d "$MODEL_DIR" ]; then
    echo "===== Tải MinerU pipeline models lần đầu (~2GB)... ====="
    mineru-models-download --model_type pipeline
    echo "===== Download xong ====="
fi

exec uvicorn src.api.app:app --host 0.0.0.0 --port 8000
