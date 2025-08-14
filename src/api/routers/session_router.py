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
import logging


session_router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__file__)



@session_router.post('/create_session')
async def create_session(current_user: str = Depends(get_current_user)):
    request_data = SessionRequest(
        username=current_user,
        collection=str(uuid.uuid4()),
        session_id=str(uuid.uuid4())
    )

    await request_data.create()

    logger.info(f"Session created for user {current_user} with session ID {request_data.session_id}")

    return {
        "id": request_data.id,
        "username": request_data.username,
        "collection": request_data.collection,
        "session_id": request_data.session_id,
    }

@session_router.get('/get_all_sessions', response_model=List[SessionRequest])
async def get_all_sessions(current_user: str = Depends(get_current_user)):
    if not current_user:
        return None
    return await SessionRequest.find(SessionRequest.username == current_user).to_list()


@session_router.delete('/delete_session/{session_id}', status_code=204)
async def delete_session(session_id: str, current_user: str = Depends(get_current_user)):
    if not current_user:
        return None

    session_to_delete = await SessionRequest.find_one(SessionRequest.session_id == session_id)
    

    if not session_to_delete or session_to_delete.username != current_user:
        raise HTTPException(status_code=404, detail="Session not found or you don't have permission to delete it")

    await session_to_delete.delete()


    logger.info(f"Session with session_id {session_id} deleted successfully")
    return None


@session_router.get("/get_current_session/{session_id}")
async def get_current_session(session_id: str, current_user: str = Depends(get_current_user)):
    session = await SessionRequest.find_one(
        SessionRequest.session_id == session_id,
        SessionRequest.username == current_user
    )

    logger.info(f"Retrieved session for user {current_user} with session ID {session_id}")
    return session

