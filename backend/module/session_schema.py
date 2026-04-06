# backend/module/session_schema.py

from beanie import Document, PydanticObjectId
from typing import List, Optional
from datetime import datetime       # <-- SỬA 1: Thêm import
from pydantic import Field          # <-- SỬA 2: Thêm import

class SessionRequest(Document):
    username: str
    session_id: str
    display_name: str
    # (Trường 'collection' đã bị xóa, là đúng)
    
    # SỬA 3: Thêm trường này để sắp xếp
    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "session_requests"
        # (Nếu collection của bạn tên là "session_request" thì giữ nguyên)