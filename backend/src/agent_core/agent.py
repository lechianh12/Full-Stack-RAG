from llm import llm
from src.agent_core.tools import (
    rag_tool,
    rag_tool_stream,
    rag_tool_multi,
    rag_tool_multi_stream,
    list_collections,
)


class Agent:
    """
    Agent wrapper cho RAG pipeline.
    - Streaming (qa_agent_stream / qa_agent_multi_stream): dùng httpx → Ollama trực tiếp
    - Sync (qa_agent / qa_agent_multi): dùng LangChain chain
    LangGraph đã được loại bỏ vì không còn dùng trong bất kỳ route nào.
    """

    def __init__(self):
        pass

    def qa_agent(self, query: str, collection_name: str, history: str) -> str:
        return rag_tool(query=query, collection_name=collection_name, history=history)

    def qa_agent_multi(self, query: str, collection_names: list, history: str) -> str:
        return rag_tool_multi(query=query, collection_names=collection_names, history=history)

    async def qa_agent_stream(self, query: str, collection_name: str, history: str):
        async for chunk in rag_tool_stream(
            query=query, collection_name=collection_name, history=history
        ):
            yield chunk

    async def qa_agent_multi_stream(self, query: str, collection_names: list, history: str):
        async for chunk in rag_tool_multi_stream(
            query=query, collection_names=collection_names, history=history
        ):
            yield chunk
