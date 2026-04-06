# backend/src/api/routers/ingest_router.py

import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import List
from src.agent_core.ingest import Ingest
from utils.read_documents import DocumentExtractor
from src.agent_core.tools import rag_tool # Bỏ list_collections nếu không dùng
import sys
import os
import uuid
# SỬA 1: Import dependency mới
from src.api.routers.authen_router import get_current_user
from module.authen_schema import Authen # <-- Thêm
from module.session_schema import SessionRequest # <-- Sửa tên (nếu file session_schema.py của bạn tên là SessionRequest)
from module.ingest_schema import QueryData
from module.document_schema import DocumentMetadata
import logging

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath('..'))))
ingest_router = APIRouter()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__file__)


@ingest_router.post("/ingest", tags=["Ingest"])
# SỬA 2: Cập nhật dependency
async def ingest_data(session_id: str, files: List[UploadFile] = File(...), current_user: Authen = Depends(get_current_user)):
    
    # SỬA 3: Kiểm tra quyền sở hữu session (chỉ khi user thường upload)
    session = None
    if current_user.role != "admin":
        session = await SessionRequest.find_one(
            SessionRequest.session_id == session_id,
            SessionRequest.username == current_user.username
        )
        if not session:
            raise HTTPException(status_code=404, detail="Session not found or not authorized")
    
    processed_files_info = []
    errors = []

    for file in files:
        try:
            collection_name = str(uuid.uuid4())
            logger.info(f"Processing file: {file.filename} for new collection {collection_name}")
            
            text = await DocumentExtractor.extract_text(file)
            Ingest(documents=[text], collection_name=collection_name).process()

            # SỬA 4: LOGIC PHÂN QUYỀN ADMIN
            doc_meta = None
            if current_user.role == "admin":
                # Admin upload -> Tài liệu GLOBAL
                doc_meta = DocumentMetadata(
                    username=current_user.username,
                    session_id=None, # <-- GLOBAL
                    collection_name=collection_name,
                    original_filename=file.filename,
                    is_global=True # <-- GLOBAL
                )
                logger.info(f"Admin {current_user.username} uploaded GLOBAL document: {file.filename}")
            else:
                # User thường upload -> Tài liệu CỤC BỘ
                doc_meta = DocumentMetadata(
                    username=current_user.username,
                    session_id=session_id, # <-- Cụ thể cho session
                    collection_name=collection_name,
                    original_filename=file.filename,
                    is_global=False # <-- Không phải global
                )
            
            await doc_meta.create()

            processed_files_info.append({
                "id": str(doc_meta.id),
                "collection_name": doc_meta.collection_name,
                "original_filename": doc_meta.original_filename,
                "is_global": doc_meta.is_global
            })
            
            logger.info(f"File {file.filename} ingested successfully into collection {collection_name}")

        except Exception as e:
            logger.error(f"Failed to process file {file.filename}. Error: {e}")
            errors.append({"filename": file.filename, "error": str(e)})

    return {
        "message": f"Processing complete. {len(processed_files_info)} files ingested, {len(errors)} files failed.",
        "processed_files_info": processed_files_info,
        "errors": errors,
    }

# (Endpoint query giữ nguyên)
@ingest_router.post("/query", tags=["Ingest"])
def query_data(query_data: QueryData, current_user: Authen = Depends(get_current_user)): # Sửa dependency
    results = rag_tool(query_data.query, query_data.collection_name)
    logging.info(f"Query executed: {query_data.query} | Collection: {query_data.collection_name}")
    return {"results": results}