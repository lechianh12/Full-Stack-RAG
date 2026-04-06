from datetime import datetime
from pydantic import BaseModel, Field
from beanie import Document, PydanticObjectId
from typing import Literal # Thêm import này

# Định nghĩa các vai trò có thể có
UserRole = Literal["user", "admin"]


class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str = Field(max_length=30)
    password: str = Field(max_length=30)
    email: str = Field(max_length=50)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    # Thêm thông tin role vào token response để frontend biết
    role: UserRole
    username: str

class Authen(Document):
    username: str = Field(max_length=30)
    password: str = Field(max_length=30)
    email: str = Field(max_length=30)
    date_created: datetime = datetime.now()
    # Thêm trường role, mặc định là 'user'
    role: UserRole = "user"

    class Settings:
        # Đảm bảo tên collection là duy nhất, ví dụ 'users'
        name = "users"