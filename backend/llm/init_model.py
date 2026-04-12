import sys
import os
from langchain.chat_models import init_chat_model
from config.config import Config

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
config = Config()


class Gemini():
    def __init__(self, api_key=config.GEMINI_API_KEY, model=config.MODEL):
        self.api_key = api_key
        self.model = model

    def init_gemini(self):
        return init_chat_model(
            model=self.model,
            model_provider="google_genai",
        )


class Ollama():
    def __init__(self, model="qwen3.5:4b"):
        self.model = model

    def init_ollama(self):
        return init_chat_model(
            model=self.model,
            model_provider="ollama",
        )


class LLM():
    def __init__(self, use_gemini=False):
        self.llm = Gemini().init_gemini() if use_gemini else Ollama().init_ollama()

    def init_llm(self):
        return self.llm
