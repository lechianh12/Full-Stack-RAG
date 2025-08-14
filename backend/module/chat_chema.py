from beanie import Document, init_beanie
from datetime import datetime


class ChatMessage(Document):
    SessionId: str
    message: str
    response: str
    timestamp: datetime = datetime.now()