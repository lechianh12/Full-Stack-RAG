from fastapi import FastAPI
from contextlib import asynccontextmanager

from src.api.routers.ingest_router import ingest_router
from src.api.routers.chat_router import chat_router
from src.api.routers.session_router import session_router
from src.api.routers.authen_router import authen_router
from db.mongo_db import init_db
from log.logging_setup import setup_logging
import logging
from fastapi.middleware.cors import CORSMiddleware

log_config = setup_logging("./log/app.log")

logger = logging.getLogger(__file__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Connecting to MongoDB...")
    await init_db()
    logger.info("Connected to MongoDB successfully.")
    yield


app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost",
    "http://localhost:3000", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Cho phép tất cả các method (GET, POST, etc.)
    allow_headers=["*"], # Cho phép tất cả các header
)


app.include_router(ingest_router, prefix="/api/ingest", tags=["Ingest"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(session_router, prefix="/api/session", tags=["Session"])
app.include_router(authen_router, prefix="/api/auth", tags=["Authentication"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api.app:app", host="0.0.0.0", port=8000, reload=True, log_config=log_config)
