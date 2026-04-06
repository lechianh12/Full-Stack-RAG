# backend/module/document_schema.py

from beanie import Document, PydanticObjectId
from typing import Optional
from datetime import datetime
from pydantic import Field

class DocumentMetadata(Document):
    username: str # Lưu lại user (hoặc admin) đã upload
    session_id: Optional[str] = None # Sẽ là None nếu is_global = True
    collection_name: str 
    original_filename: str # Giữ nguyên tên gốc
    upload_timestamp: datetime = Field(default_factory=datetime.now)
    is_global: bool = False # Đánh dấu tài liệu global

    class Settings:
        name = "document_metadata"