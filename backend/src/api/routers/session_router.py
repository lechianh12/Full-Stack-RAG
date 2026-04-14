# backend/src/api/routers/session_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
import uuid
import logging

# SỬA 1: Import dependency mới
from src.api.routers.authen_router import get_current_user
from module.authen_schema import Authen
from module.session_schema import SessionRequest
from module.document_schema import DocumentMetadata
from module.chat_chema import ChatMessage  # Import để xóa
from beanie.operators import Or  # <-- SỬA 2: Import OR

session_router = APIRouter()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__file__)


@session_router.post("/create_session")
async def create_session(current_user: Authen = Depends(get_current_user)):
    request_data = SessionRequest(
        username=current_user.username, session_id=str(uuid.uuid4()), display_name="New Session"
    )
    await request_data.create()
    logger.info(
        f"Session created for user {current_user.username} with session ID {request_data.session_id}"
    )
    return request_data


@session_router.get("/get_all_sessions", response_model=List[SessionRequest])
async def get_all_sessions(current_user: Authen = Depends(get_current_user)):
    sessions = (
        await SessionRequest.find(SessionRequest.username == current_user.username)
        .sort(-SessionRequest.created_at)
        .to_list()
    )
    return sessions


@session_router.get("/get_session_documents/{session_id}", response_model=List[DocumentMetadata])
async def get_session_documents(session_id: str, current_user: Authen = Depends(get_current_user)):
    session = await SessionRequest.find_one(
        SessionRequest.session_id == session_id, SessionRequest.username == current_user.username
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found or not authorized")

    query = Or((DocumentMetadata.is_global == True), (DocumentMetadata.session_id == session_id))

    documents = await DocumentMetadata.find(query).sort("-upload_timestamp").to_list()
    logger.info(f"Retrieved {len(documents)} documents (session + global) for session {session_id}")
    return documents


@session_router.delete("/delete_session/{session_id}", status_code=204)
async def delete_session(session_id: str, current_user: Authen = Depends(get_current_user)):
    session_to_delete = await SessionRequest.find_one(
        SessionRequest.session_id == session_id, SessionRequest.username == current_user.username
    )

    if not session_to_delete:
        raise HTTPException(
            status_code=404, detail="Session not found or you don't have permission to delete it"
        )

    await ChatMessage.find(ChatMessage.session_id == session_id).delete()
    await DocumentMetadata.find(
        DocumentMetadata.session_id == session_id, DocumentMetadata.is_global == False
    ).delete()

    await session_to_delete.delete()

    logger.info(f"Session with session_id {session_id} deleted successfully")
    return None


@session_router.get("/get_current_session/{session_id}")
async def get_current_session(session_id: str, current_user: Authen = Depends(get_current_user)):
    session = await SessionRequest.find_one(
        SessionRequest.session_id == session_id, SessionRequest.username == current_user.username
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found or not authorized")
    return session
