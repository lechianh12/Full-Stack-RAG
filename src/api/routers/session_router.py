from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from typing import List, Optional
from beanie import PydanticObjectId
import jwt
from datetime import datetime, timedelta
from src.api.routers.authen_router import get_current_user
import random
from beanie import Document, PydanticObjectId
import uuid
from module.session_schema import SessionRequest


session_router = APIRouter()




@session_router.post('/create_session')
async def create_session(current_user: str = Depends(get_current_user)):
    request_data = SessionRequest(
        username=current_user,
        collection=str(uuid.uuid4()),
        session_id=str(uuid.uuid4())
    )

    await request_data.create()

    return {
        "message": "Session created successfully",
    }

@session_router.get('/get_all_sessions', response_model=List[SessionRequest])
async def get_all_sessions(current_user: str = Depends(get_current_user)):
    if not current_user:
        return None
    return await SessionRequest.find_all().to_list()

@session_router.delete('/delete_session/{_id}', status_code=204)
async def delete_session(_id: PydanticObjectId, current_user: str = Depends(get_current_user)):
    if not current_user:
        return None

    session_to_delete = await SessionRequest.find_one(SessionRequest.id == _id)

    await session_to_delete.delete()

    return {"message": "Session deleted successfully"}


@session_router.get("/get_current_session/{session_id}")
async def get_current_session(session_id: str, current_user: str = Depends(get_current_user)):
    session = await SessionRequest.find_one(
        SessionRequest.session_id == session_id,
        SessionRequest.username == current_user
    )
    return session

