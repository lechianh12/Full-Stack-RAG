FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ curl \
    && rm -rf /var/lib/apt/lists/*

# Cài tất cả dependencies
COPY requirement.txt .
RUN pip install --no-cache-dir -r requirement.txt

# FlashRank bị skip trong batch install (dependency resolution) → cài riêng
RUN pip install --no-cache-dir FlashRank==0.2.10

# Đảm bảo PyJWT thắng over package `jwt` (thiếu ExpiredSignatureError)
RUN pip install --force-reinstall --no-deps PyJWT==2.10.1

COPY . .
RUN mkdir -p log

EXPOSE 8000

CMD ["uvicorn", "src.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
