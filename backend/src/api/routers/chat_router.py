import collections
from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from typing import List, Optional
import jwt
from datetime import datetime, timedelta
from beanie import Document
from src.api.routers.session_router import SessionRequest
from src.api.routers.authen_router import get_current_user
from src.agent_core.agent import Agent
from module.chat_chema import ChatMessage
import logging

chat_router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__file__)


@chat_router.post('/send_message/{session_id}')
async def send_message(session_id: str, message: str, current_user: str = Depends(get_current_user)):
    session = await SessionRequest.find_one(SessionRequest.session_id == session_id)
    if not session:
        return {"error": "Session not found"}

    collections = session.collection
    # final_prompt = f"collections: {collections}\n" + message

    # response = Agent().run(final_prompt) 

    response = Agent().qa_agent(query=message, collection_name=collections)
    # Agent().debug(final_prompt)  # Debugging output  
    chat = ChatMessage(
        SessionId=session.session_id,  
        message=message,
        response=response,
        timestamp=datetime.now()
    )

    await chat.create()

    logger.info(f"Message sent: {message} | Response: {response}")
    return chat

@chat_router.get('/get_all_messages/{session_id}', response_model=List[ChatMessage])
async def get_all_messages(session_id: str, current_user: str = Depends(get_current_user)):
    messages = await ChatMessage.find(ChatMessage.SessionId == session_id).to_list()
    logger.info(f"Retrieved {len(messages)} messages for session {session_id}")
    return messages

@chat_router.delete('/delete_message/{message_id}', status_code=204)
async def delete_message(message_id: PydanticObjectId, current_user: str = Depends(get_current_user)):
    message = await ChatMessage.find_one(ChatMessage.id == message_id)

    await message.delete()
    logger.info(f"Message with ID {message_id} deleted successfully")
    return {"message": "Message deleted successfully"}
