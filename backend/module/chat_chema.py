# backend/module/chat_chema.py

from pydantic import BaseModel, Field
from typing import List, Optional
from beanie import Document, PydanticObjectId
from datetime import datetime

# SỬA: Thêm collection_name vào model này
class MessageRequest(BaseModel):
    message: str
    collection_name: Optional[str] = None

class ChatMessage(Document):
    session_id: str
    username: str
    message: str
    response: str
    sources: Optional[List[dict]] = None
    timestamp: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "chat_history"