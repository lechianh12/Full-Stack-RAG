from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv
load_dotenv()

class Config(BaseModel):
    GEMINI_API_KEY: str = os.getenv("GOOGLE_API_KEY")
    MODEL: str = os.getenv("MODEL")
