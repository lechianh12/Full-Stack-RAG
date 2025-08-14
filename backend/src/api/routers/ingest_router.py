# import logging
# from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
# from src.agent_core.ingest import Ingest
# from pydantic import BaseModel
# from utils.read_documents import DocumentExtractor
# from src.agent_core.tools import rag_tool, list_collections
# import sys
# import os
# from src.api.routers.authen_router import get_current_user
# from src.api.routers.session_router import SessionRequest
# from module.ingest_schema import QueryData
# import logging

# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath('..'))))

# ingest_router = APIRouter()

# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__file__)



# @ingest_router.post("/ingest", tags=["Ingest"])
# async def ingest_data(session_id: str, file: UploadFile = File(...), current_user: str = Depends(get_current_user)):
#     text = await DocumentExtractor.extract_text(file)

#     await file.seek(0)  
#     content = await file.read()

#     collection_id = await SessionRequest.find_one(SessionRequest.session_id == session_id)
#     if not collection_id:
#         raise HTTPException(status_code=404, detail="Session not found")
    
#     vectorstore = Ingest(
#         documents=[text],
#         collection_name= collection_id.collection,
#         ).process()


#     logger.info(f"File {file.filename} ingested successfully into collection {collection_id.collection}")
#     return {
#         "filename": file.filename,
#         "text_preview": text[:300],
#         "size_in_bytes": len(content),
#         "message": "Ingested successfully",
#         "collection_name": collection_id.collection
#     }

# @ingest_router.post("/query", tags=["Ingest"])
# def query_data(query_data: QueryData, current_user: str = Depends(get_current_user)):
#     results = rag_tool(query_data.query, query_data.collection_name)
#     logging.info(f"Query executed: {query_data.query} | Collection: {query_data.collection_name}")
#     return {"results": results}



import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import List # Import List
from src.agent_core.ingest import Ingest
from pydantic import BaseModel
from utils.read_documents import DocumentExtractor
from src.agent_core.tools import rag_tool, list_collections
import sys
import os
from src.api.routers.authen_router import get_current_user
from src.api.routers.session_router import SessionRequest
from module.ingest_schema import QueryData
import logging

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath('..'))))

ingest_router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__file__)


# --- BẮT ĐẦU THAY ĐỔI ---

# 1. Thay đổi tham số từ `file: UploadFile` thành `files: List[UploadFile]`
@ingest_router.post("/ingest", tags=["Ingest"])
async def ingest_data(session_id: str, files: List[UploadFile] = File(...), current_user: str = Depends(get_current_user)):
    
    collection_id_obj = await SessionRequest.find_one(SessionRequest.session_id == session_id)
    if not collection_id_obj:
        raise HTTPException(status_code=404, detail="Session not found")
    
    collection_name = collection_id_obj.collection
    
    processed_files = []
    errors = []

    # 2. Lặp qua từng file trong danh sách để xử lý
    for file in files:
        try:
            logger.info(f"Processing file: {file.filename} for collection {collection_name}")
            
            # Trích xuất văn bản từ file
            text = await DocumentExtractor.extract_text(file)

            # Thực hiện embedding và lưu vào vector store
            Ingest(
                documents=[text],
                collection_name=collection_name,
            ).process()

            processed_files.append(file.filename)
            logger.info(f"File {file.filename} ingested successfully into collection {collection_name}")

        except Exception as e:
            logger.error(f"Failed to process file {file.filename}. Error: {e}")
            errors.append({"filename": file.filename, "error": str(e)})

    # 3. Trả về kết quả tổng hợp
    return {
        "message": f"Processing complete. {len(processed_files)} files ingested, {len(errors)} files failed.",
        "processed_files": processed_files,
        "errors": errors,
        "collection_name": collection_name
    }

# --- KẾT THÚC THAY ĐỔI ---


@ingest_router.post("/query", tags=["Ingest"])
def query_data(query_data: QueryData, current_user: str = Depends(get_current_user)):
    results = rag_tool(query_data.query, query_data.collection_name)
    logging.info(f"Query executed: {query_data.query} | Collection: {query_data.collection_name}")
    return {"results": results}


