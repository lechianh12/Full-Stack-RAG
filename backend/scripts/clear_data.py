"""
Script xóa toàn bộ dữ liệu cũ để test lại:
  - Xóa tất cả Qdrant collections (vector embeddings)
  - Xóa tất cả DocumentMetadata trong MongoDB
  - (Tuỳ chọn) Xóa ChatMessage history + Sessions

Cách chạy:
  cd /mnt/d/Full-Stack-RAG/backend
  python scripts/clear_data.py           # chỉ xóa documents
  python scripts/clear_data.py --all     # xóa cả chat history + sessions
"""

import asyncio
import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from qdrant_client import QdrantClient
from config.config import QDRantConfig

qdrant_config = QDRantConfig()

MONGO_URL = os.getenv("MONGODB_URL", "mongodb://172.30.80.1:27017")
MONGO_DB = "rag_db"


def clear_qdrant():
    try:
        client = QdrantClient(url=qdrant_config.QDRANT_URL, prefer_grpc=False)
        collections = client.get_collections().collections
        if not collections:
            print("  ℹ  No Qdrant collections found")
            return
        for col in collections:
            client.delete_collection(col.name)
            print(f"  ✓ Deleted Qdrant collection: {col.name}")
    except Exception as e:
        print(f"  ⚠  Could not connect to Qdrant: {e}")
        print("     Make sure Qdrant is running first: bash backend/scripts/qdrant.sh")


async def clear_mongo(clear_history: bool):
    import motor.motor_asyncio

    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client[MONGO_DB]

    doc_count = await db["document_metadata"].count_documents({})
    await db["document_metadata"].delete_many({})
    print(f"  ✓ Deleted {doc_count} DocumentMetadata records")

    if clear_history:
        msg_count = await db["chat_history"].count_documents({})
        await db["chat_history"].delete_many({})
        ses_count = await db["session_requests"].count_documents({})
        await db["session_requests"].delete_many({})
        print(f"  ✓ Deleted {msg_count} ChatMessage records")
        print(f"  ✓ Deleted {ses_count} SessionRequest records")

    client.close()


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--all", action="store_true", help="Also clear chat history and sessions")
    args = parser.parse_args()

    print("=" * 50)
    print("Clearing Qdrant vector data...")
    clear_qdrant()

    print("\nClearing MongoDB document metadata...")
    await clear_mongo(clear_history=args.all)

    print("\n✅ Done!")
    if not args.all:
        print("   Chat history and sessions were kept.")
        print("   Use --all flag to remove them too.")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
