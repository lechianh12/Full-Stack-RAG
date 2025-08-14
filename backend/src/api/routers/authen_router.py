from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from typing import List, Union, Any, Optional
from beanie import PydanticObjectId
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
from datetime import datetime
from beanie import Document, PydanticObjectId
from pydantic import Field
from bson.objectid import ObjectId
from module.authen_schema import Authen, LoginRequest, TokenResponse
import logging






security = HTTPBearer()

logger = logging.getLogger(__file__)

authen_router = APIRouter()

SECURITY_ALGORITHM = 'HS256'
SECRET_KEY = '123456'

async def verify_password(username: str, password: str) -> bool:
    user = await Authen.find_one(Authen.username == username)
    if not user:
        return False
    return username == user.username and password == user.password

def generate_token(username: str) -> str:
    expire = datetime.utcnow() + timedelta(days=3)
    payload = {"exp": expire, "username": username}
    return jwt.encode(payload, SECRET_KEY, algorithm=SECURITY_ALGORITHM)

def verify_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[SECURITY_ALGORITHM])
        return payload.get("username")
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

async def get_current_user(token: str = Depends(security)) -> Optional[str]:
    return verify_token(token.credentials)

@authen_router.post('/login', response_model=TokenResponse)
async def login(request_data: LoginRequest):
    if await verify_password(request_data.username, request_data.password):
        token = generate_token(request_data.username)
        return TokenResponse(access_token=token)
    
    logger.info("Da dang nhap thanh cong")
    return request_data

    
@authen_router.get("/get_all_account", response_model=List[Authen])
async def get_all_accounts(current_user: Optional[str] = Depends(get_current_user)):
    if not current_user:
        return None
    
    logger.info("Fetching all accounts failed")
    return await Authen.find_all().to_list()

@authen_router.post("/register", status_code=201)
async def create_account(account: Authen):
    account.id = None
    await account.create()

    logger.info("Da dang ky thanh cong")
    return {"message": "Account created successfully"}

@authen_router.put("/update/{_id}", status_code=200)
async def update_account(
    _id: PydanticObjectId, 
    username: str, 
    password: str, 
    email: str,
    current_user: Optional[str] = Depends(get_current_user)
) -> Optional[Authen]:
    if not current_user:
        return None
    
    user_to_update = await Authen.find_one(Authen.id == _id)
    if not user_to_update:
        return None
    
    user_to_update.username = username
    user_to_update.password = password
    user_to_update.email = email
    await user_to_update.save()

    logger.info("Da update thanh cong")
    return user_to_update

@authen_router.delete("/delete/{_id}", status_code=204)
async def delete_account(_id: PydanticObjectId, current_user: Optional[str] = Depends(get_current_user)):
    if not current_user:
        return None
    
    user_to_delete = await Authen.find_one(Authen.id == _id)
    if not user_to_delete:
        return None
    
    await user_to_delete.delete()
    logger.info("Da xoa thanh cong")
    return {"message": "Account deleted successfully"}