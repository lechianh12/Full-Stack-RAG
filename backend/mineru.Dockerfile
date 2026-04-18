FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ curl \
    libglib2.0-0 libsm6 libxext6 libxrender1 libgl1-mesa-glx libgomp1 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir "mineru[pipeline]"

# Fix paddlex plugin lỗi do langchain.docstore bị deprecated
RUN pip install --no-cache-dir "langchain-community>=0.3"

# Config mặc định: dùng pipeline backend, CPU
RUN echo '{"device-mode":"cpu"}' > /root/mineru.json

COPY scripts/mineru_entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8001
ENTRYPOINT ["/entrypoint.sh"]
