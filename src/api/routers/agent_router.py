from fastapi import APIRouter, Depends, HTTPException
from fastapi import UploadFile, File
from src.agent import Agent


agent_router = APIRouter()

@agent_router.post("/chat/completions")
def chat_completions(prompt: str):
    agent = Agent()
    response = agent.run(prompt)
    return {
        "response": response
        }