from beanie import Document, PydanticObjectId
from typing import Optional
from datetime import datetime
from pydantic import Field


class DocumentMetadata(Document):
    username: str
    session_id: Optional[str] = None
    collection_name: str
    original_filename: str
    upload_timestamp: datetime = Field(default_factory=datetime.now)
    is_global: bool = False

    class Settings:
        name = "document_metadata"
