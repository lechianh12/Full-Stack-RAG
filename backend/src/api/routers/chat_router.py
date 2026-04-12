# backend/src/api/routers/chat_router.py

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import List, Optional
from datetime import datetime
from beanie import Document
from beanie.operators import Or
import json

from src.api.routers.session_router import SessionRequest
from src.api.routers.authen_router import get_current_user
from module.authen_schema import Authen
from src.agent_core.agent import Agent
from module.chat_chema import ChatMessage, MessageRequest
from module.document_schema import DocumentMetadata
from agent_core.tools import memory
import logging

chat_router = APIRouter()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__file__)


@chat_router.post('/send_message/{session_id}')
async def send_message(session_id: str, request: MessageRequest, current_user: Authen = Depends(get_current_user)):
    
    session = await SessionRequest.find_one(
        SessionRequest.session_id == session_id,
        SessionRequest.username == current_user.username
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or not authorized")

    session_updated = False
    message_content = request.message
    try:
        is_first_message = await ChatMessage.find(ChatMessage.session_id == session_id).count() == 0
        
        if is_first_message and session.display_name == "New Session":
            new_display_name = message_content[:50] + ('...' if len(message_content) > 50 else '')
            session.display_name = new_display_name
            await session.save()
            session_updated = True
            
    except Exception as e:
        logger.error(f"Error checking/updating session display name: {e}")
        
    collection_to_use = request.collection_name
    response_text = ""

    if collection_to_use:
        # Dòng 60 (gây lỗi) nằm ở đây. Giờ nó đã có 'DocumentMetadata' và 'Or'
        doc = await DocumentMetadata.find_one( 
            DocumentMetadata.collection_name == collection_to_use,
            Or(
                (DocumentMetadata.is_global == True),
                (DocumentMetadata.session_id == session_id)
            )
        )
        if not doc:
             raise HTTPException(status_code=403, detail="Not authorized to access this document collection")
        
        logger.info(f"Calling RAG agent for collection: {collection_to_use}")
        try:
            history = await memory(session_id)  
            response_text = Agent().qa_agent(query=message_content, collection_name=collection_to_use, history=history)
        except Exception as e:
            logger.error(f"RAG agent failed for collection {collection_to_use}: {e}")
            response_text = "Error accessing selected document."
    else:
        logger.info("Calling non-RAG agent (no collection selected)")
        response_text = "I am a RAG assistant. Please select a document to start chatting."

    chat = ChatMessage(
        session_id=session.session_id,  
        username=current_user.username,
        message=message_content,
        response=response_text,
        timestamp=datetime.now()
    )
    await chat.create()

    logger.info(f"Message sent: {message_content} | Response: {response_text}")
    
    return {"chat": chat, "session_updated": session_updated}

@chat_router.post('/send_message_stream/{session_id}')
async def send_message_stream(session_id: str, request: MessageRequest, current_user: Authen = Depends(get_current_user)):

    session = await SessionRequest.find_one(
        SessionRequest.session_id == session_id,
        SessionRequest.username == current_user.username
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or not authorized")

    session_updated = False
    message_content = request.message
    try:
        is_first_message = await ChatMessage.find(ChatMessage.session_id == session_id).count() == 0
        if is_first_message and session.display_name == "New Session":
            new_display_name = message_content[:50] + ('...' if len(message_content) > 50 else '')
            session.display_name = new_display_name
            await session.save()
            session_updated = True
    except Exception as e:
        logger.error(f"Error checking/updating session display name: {e}")

    collection_to_use = request.collection_name

    if collection_to_use:
        doc = await DocumentMetadata.find_one(
            DocumentMetadata.collection_name == collection_to_use,
            Or(
                (DocumentMetadata.is_global == True),
                (DocumentMetadata.session_id == session_id)
            )
        )
        if not doc:
            raise HTTPException(status_code=403, detail="Not authorized to access this document collection")

    history = ""
    if collection_to_use:
        history = await memory(session_id)

    async def event_generator():
        full_response = ""

        yield f"data: {json.dumps({'type': 'meta', 'session_updated': session_updated})}\n\n"

        try:
            if collection_to_use:
                async for chunk in Agent().qa_agent_stream(
                    query=message_content,
                    collection_name=collection_to_use,
                    history=history
                ):
                    full_response += chunk
                    yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"
            else:
                full_response = "Tôi là trợ lý RAG. Vui lòng chọn một tài liệu để bắt đầu hội thoại."
                yield f"data: {json.dumps({'type': 'chunk', 'text': full_response})}\n\n"

        except Exception as e:
            logger.error(f"Streaming error: {e}")
            if not full_response:
                full_response = "Đã xảy ra lỗi khi xử lý yêu cầu."
                yield f"data: {json.dumps({'type': 'chunk', 'text': full_response})}\n\n"

        chat = ChatMessage(
            session_id=session_id,
            username=current_user.username,
            message=message_content,
            response=full_response,
            timestamp=datetime.now()
        )
        await chat.create()

        yield f"data: {json.dumps({'type': 'done', 'chat_id': str(chat.id)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@chat_router.get('/get_all_messages/{session_id}', response_model=List[ChatMessage])
async def get_all_messages(session_id: str, current_user: Authen = Depends(get_current_user)):
    session = await SessionRequest.find_one(
        SessionRequest.session_id == session_id,
        SessionRequest.username == current_user.username
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or not authorized")

    messages = await ChatMessage.find(ChatMessage.session_id == session_id).to_list()
    logger.info(f"Retrieved {len(messages)} messages for session {session_id}")
    return messages

@chat_router.delete('/delete_message/{message_id}', status_code=204)
async def delete_message(message_id: PydanticObjectId, current_user: Authen = Depends(get_current_user)):
    message = await ChatMessage.find_one(ChatMessage.id == message_id)
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
        
    if message.username != current_user.username:
        raise HTTPException(status_code=403, detail="Not authorized to delete this message")

    await message.delete()
    logger.info(f"Message with ID {message_id} deleted successfully")
    return {"message": "Message deleted successfully"}