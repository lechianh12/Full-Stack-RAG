from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv
load_dotenv()

class Config(BaseModel):
    GEMINI_API_KEY: str = os.getenv("GOOGLE_API_KEY")
    MODEL: str = os.getenv("MODEL")
    SYSTEM_MESSAGE: str = os.getenv("SYSTEM_MESSAGE")

class QDRantConfig(BaseModel):
    QDRANT_URL: str = os.getenv("QDRANT_URL")
    QDRANT_MODEL_NAME: str = os.getenv("QDRANT_MODEL_NAME")
    COLLECTION_NAME: str = os.getenv("COLLECTION_NAME")

class OllamaConfig(BaseModel):
    OLLAMA_EMBEDDINGS_MODEL: str = os.getenv("OLLAMA_EMBEDDINGS_MODEL")