from fastapi import APIRouter, UploadFile, File, HTTPException
from src.ingest import Ingest
from pydantic import BaseModel
from utils.read_documents import DocumentExtractor


ingest_router = APIRouter()


class IngestRequest(BaseModel):
    documents: UploadFile = File(...)


@ingest_router.post("/ingest")
async def ingest_data(file: UploadFile = File(...)):
    text = await DocumentExtractor.extract_text(file)

    await file.seek(0)  
    content = await file.read()

    return {
        "filename": file.filename,
        "text_preview": text[:300],
        "size_in_bytes": len(content),
        "message": "Ingested successfully"
    }



