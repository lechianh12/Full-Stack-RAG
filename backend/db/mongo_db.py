import beanie
import motor.motor_asyncio
# Đảm bảo import đúng model Authen đã cập nhật
from module.authen_schema import Authen
from module.session_schema import SessionRequest
from module.chat_chema import ChatMessage
from module.document_schema import DocumentMetadata


async def init_db():
    # client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017") # Thay bằng connection string của bạn nếu cần
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://172.30.80.1:27017")
    await beanie.init_beanie(
        database=client["rag_db"],
        document_models=[Authen, SessionRequest, ChatMessage, DocumentMetadata]
    )