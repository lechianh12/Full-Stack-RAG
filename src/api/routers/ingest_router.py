from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from src.agent_core.ingest import Ingest
from pydantic import BaseModel
from utils.read_documents import DocumentExtractor
from src.agent_core.tools import rag_tool, list_collections
import sys
import os
from src.api.routers.authen_router import get_current_user
from src.api.routers.session_router import SessionRequest
from module.ingest_schema import QueryData

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath('..'))))

ingest_router = APIRouter()




@ingest_router.post("/ingest", tags=["Ingest"])
async def ingest_data(session_id: str, file: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    text = await DocumentExtractor.extract_text(file)

    await file.seek(0)  
    content = await file.read()

    collection_id = await SessionRequest.find_one(SessionRequest.session_id == session_id)
    if not collection_id:
        raise HTTPException(status_code=404, detail="Session not found")
    
    vectorstore = Ingest(
        documents=[text],
        collection_name= collection_id.collection,
        ).process()

    return {
        "filename": file.filename,
        "text_preview": text[:300],
        "size_in_bytes": len(content),
        "message": "Ingested successfully",
        "collection_name": collection_id.collection
    }

@ingest_router.post("/query", tags=["Ingest"])
def query_data(query_data: QueryData, current_user: str = Depends(get_current_user)):
    results = rag_tool(query_data.query, query_data.collection_name)
    return {"results": results}


