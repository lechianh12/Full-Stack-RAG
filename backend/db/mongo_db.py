import os
import beanie
import motor.motor_asyncio
from module.authen_schema import Authen
from module.session_schema import SessionRequest
from module.chat_chema import ChatMessage
from module.document_schema import DocumentMetadata

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://172.30.80.1:27017")


async def init_db():
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
    await beanie.init_beanie(
        database=client["rag_db"],
        document_models=[Authen, SessionRequest, ChatMessage, DocumentMetadata],
    )
