from datetime import datetime
from pydantic import BaseModel, Field
from beanie import Document, PydanticObjectId



class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class Authen(Document):
    username: str = Field(max_length=30)
    password: str = Field(max_length=30)
    email: str = Field(max_length=30)
    date_created: datetime = datetime.now()