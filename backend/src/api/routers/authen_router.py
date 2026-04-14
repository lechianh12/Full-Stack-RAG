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

SECURITY_ALGORITHM = "HS256"
SECRET_KEY = "123456"


async def verify_password(username: str, password: str) -> Optional[Authen]:
    user = await Authen.find_one(Authen.username == username)
    if not user:
        return None

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


@authen_router.get("/me")
async def get_me(current_user: Authen = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
    }


@authen_router.patch("/me/role", status_code=200)
async def set_user_role(
    target_username: str, new_role: str, current_user: Authen = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can change roles")
    if new_role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="role phải là 'user' hoặc 'admin'")
    target = await Authen.find_one(Authen.username == target_username)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.role = new_role
    await target.save()
    return {"message": f"Updated {target_username} → role={new_role}"}


@authen_router.get("/list_users")
async def list_users(current_user: Authen = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can list users")
    users = await Authen.find_all().to_list()
    return [{"username": u.username, "email": u.email, "role": u.role} for u in users]


@authen_router.post("/login", response_model=TokenResponse)
async def login(request_data: LoginRequest):
    user = await verify_password(request_data.username, request_data.password)

    if user:
        token = generate_token(user.username)
        logger.info("Da dang nhap thanh cong")

        return TokenResponse(access_token=token, role=user.role, username=user.username)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )


@authen_router.get("/get_all_account", response_model=List[Authen])
async def get_all_accounts(current_user: Authen = Depends(get_current_user)):
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
async def update_account(
    _id: PydanticObjectId,
    username: str,
    password: str,
    email: str,
    current_user: Authen = Depends(get_current_user),
) -> Optional[Authen]:

    # Admin có thể sửa của người khác, user chỉ tự sửa của mình
    if current_user.role != "admin" and current_user.id != _id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    user_to_update = await Authen.find_one(Authen.id == _id)
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")

    user_to_update.username = username
    user_to_update.password = password  # (Nên hash)
    user_to_update.email = email
    await user_to_update.save()

    logger.info("Da update thanh cong")
    return user_to_update


@authen_router.delete("/delete/{_id}", status_code=204)
async def delete_account(_id: PydanticObjectId, current_user: Authen = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    user_to_delete = await Authen.find_one(Authen.id == _id)
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")

    await user_to_delete.delete()
    logger.info("Da xoa thanh cong")
    return None
