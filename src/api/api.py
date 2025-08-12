from routers.ingest_router import ingest_router
from routers.agent_router import agent_router
from fastapi import FastAPI

app = FastAPI()

app.include_router(ingest_router)
app.include_router(agent_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)