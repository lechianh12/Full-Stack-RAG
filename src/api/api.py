from fastapi import FastAPI
from contextlib import asynccontextmanager

from src.api.routers.ingest_router import ingest_router
from src.api.routers.chat_router import chat_router
from src.api.routers.session_router import session_router
from src.api.routers.authen_router import authen_router
from db.mongo_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Connecting to MongoDB...")
    await init_db()
    print("Connect Successful!")
    yield


app = FastAPI(lifespan=lifespan)


app.include_router(ingest_router, prefix="/api/ingest", tags=["Ingest"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(session_router, prefix="/api/session", tags=["Session"])
app.include_router(authen_router, prefix="/api/auth", tags=["Authentication"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api.api:app", host="0.0.0.0", port=8000, reload=True)
