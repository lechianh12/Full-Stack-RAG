#!/bin/bash
echo "Killing any process on port 8000..."
fuser -k 8000/tcp 2>/dev/null
sleep 1
cd /mnt/d/Full-Stack-RAG/backend
/home/chianh/anaconda3/envs/chianh/bin/uvicorn src.api.app:app --host 0.0.0.0 --port 8000 --reload
