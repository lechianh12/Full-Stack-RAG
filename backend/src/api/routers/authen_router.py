# backend/src/api/routers/authen_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from typing import List, Union, Any, Optional
from beanie import PydanticObjectId
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
from module.authen_schema import Authen, LoginRequest, RegisterRequest, TokenResponse
import logging

security = HTTPBearer()
logger = logging.getLogger(__file__)
authen_router = APIRouter()

SECURITY_ALGORITHM = 'HS256'
SECRET_KEY = '123456'

async def verify_password(username: str, password: str) -> Optional[Authen]:
    user = await Authen.find_one(Authen.username == username)
    if not user:
        return None
    
    # !!! Cảnh báo bảo mật: Nên dùng thư viện hash mật khẩu (ví dụ: passlib)
    # Tạm thời so sánh trực tiếp
    if user.password == password:
        return user
    
    return None

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

# SỬA 1: THAY ĐỔI CỐT LÕI
# Hàm này giờ sẽ trả về object Authen đầy đủ, không phải str
async def get_current_user(token: str = Depends(security)) -> Authen:
    username = verify_token(token.credentials)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await Authen.find_one(Authen.username == username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@authen_router.post('/login', response_model=TokenResponse)
async def login(request_data: LoginRequest):
    user = await verify_password(request_data.username, request_data.password)
    
    if user:
        token = generate_token(user.username)
        logger.info("Da dang nhap thanh cong")
        
        return TokenResponse(
            access_token=token,
            role=user.role,
            username=user.username
        )
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

    
@authen_router.get("/get_all_account", response_model=List[Authen])
# SỬA 2: Cập nhật dependency
async def get_all_accounts(current_user: Authen = Depends(get_current_user)):
    # Thêm kiểm tra phân quyền (chỉ admin được xem)
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    return await Authen.find_all().to_list()

@authen_router.post("/register", status_code=201)
async def create_account(account: RegisterRequest):
    existing_user = await Authen.find_one(Authen.username == account.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = Authen(
        username=account.username,
        password=account.password,
        email=account.email,
    )
    await new_user.create()
    logger.info(f"Da dang ky thanh cong: {account.username}")
    return {"message": "Account created successfully"}

@authen_router.put("/update/{_id}", status_code=200)
# SỬA 3: Cập nhật dependency
async def update_account(
    _id: PydanticObjectId, 
    username: str, 
    password: str, 
    email: str,
    current_user: Authen = Depends(get_current_user)
) -> Optional[Authen]:
    
    # Admin có thể sửa của người khác, user chỉ tự sửa của mình
    if current_user.role != "admin" and current_user.id != _id:
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    user_to_update = await Authen.find_one(Authen.id == _id)
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_to_update.username = username
    user_to_update.password = password # (Nên hash)
    user_to_update.email = email
    await user_to_update.save()

    logger.info("Da update thanh cong")
    return user_to_update

@authen_router.delete("/delete/{_id}", status_code=204)
# SỬA 4: Cập nhật dependency
async def delete_account(_id: PydanticObjectId, current_user: Authen = Depends(get_current_user)):
    if current_user.role != "admin":
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
         
    user_to_delete = await Authen.find_one(Authen.id == _id)
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    
    await user_to_delete.delete()
    logger.info("Da xoa thanh cong")
    return None