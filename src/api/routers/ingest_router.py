from fastapi import APIRouter, UploadFile, File, HTTPException
from src.ingest import Ingest
from pydantic import BaseModel
from utils.read_documents import DocumentExtractor
from src.tools import rag_tool, list_collections
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath('..'))))

ingest_router = APIRouter()


class QueryData(BaseModel):
    query: str
    collection_name: str

@ingest_router.post("/ingest")
async def ingest_data(file: UploadFile = File(...)):
    text = await DocumentExtractor.extract_text(file)

    await file.seek(0)  
    content = await file.read()
    
    vectorstore = Ingest(
        documents=[text],
        collection_name=file.filename
        ).process()

    return {
        "filename": file.filename,
        "text_preview": text[:300],
        "size_in_bytes": len(content),
        "message": "Ingested successfully",
    }

@ingest_router.post("/query")
def query_data(query_data: QueryData):
    results = rag_tool(query_data.query, query_data.collection_name)
    return {"results": results}


