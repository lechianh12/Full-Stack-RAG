FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ curl \
    libglib2.0-0 libsm6 libxext6 libxrender1 libgl1 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirement.txt .
RUN pip install --no-cache-dir -r requirement.txt

# FlashRank bị skip trong batch install → cài riêng
RUN pip install --no-cache-dir FlashRank==0.2.10

# Đảm bảo PyJWT thắng over package `jwt`
RUN pip install --force-reinstall --no-deps PyJWT==2.10.1

# MinerU pipeline backend (CPU, không cần vLLM)
RUN pip install --no-cache-dir "mineru[pipeline]"

# Fix paddlex plugin lỗi do langchain.docstore deprecated
RUN pip install --no-cache-dir "langchain-community>=0.3"

COPY . .
RUN mkdir -p log

RUN printf '#!/bin/bash\nset -e\nMODEL_DIR="/root/.cache/huggingface/hub/models--opendatalab--PDF-Extract-Kit-1.0"\nif [ ! -d "$MODEL_DIR" ]; then\n  echo "Tải MinerU models lần đầu..."\n  mineru-models-download --source huggingface --model_type pipeline\nfi\nexec uvicorn src.api.app:app --host 0.0.0.0 --port 8000\n' > /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
