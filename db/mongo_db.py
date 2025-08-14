import beanie
import motor
import motor.motor_asyncio
from src.api.routers.authen_router import Authen
from src.api.routers.session_router import SessionRequest
from src.api.routers.chat_router import ChatMessage


async def init_db():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")

    await beanie.init_beanie(database=client.db_name, document_models=[Authen, SessionRequest, ChatMessage])
