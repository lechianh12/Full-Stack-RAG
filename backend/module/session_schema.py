# backend/module/session_schema.py

from beanie import Document, PydanticObjectId
from typing import List, Optional
from datetime import datetime
from pydantic import Field


class SessionRequest(Document):
    username: str
    session_id: str
    display_name: str

    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "session_requests"
