import asyncio
import json
import logging
import httpx
from flashrank import Ranker, RerankRequest
from langchain_ollama import OllamaEmbeddings
from langchain_qdrant import FastEmbedSparse, QdrantVectorStore, RetrievalMode
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from qdrant_client import QdrantClient
from config.config import QDRantConfig, OllamaConfig
from module.chat_chema import ChatMessage
from llm import llm
from .prompt import TEMPLATE_RAG_TOOL, _RAG_SYSTEM

logger = logging.getLogger(__name__)

qdrant_config = QDRantConfig()
ollama_config = OllamaConfig()


_ranker = Ranker()


def _rerank(docs: list, query: str, top_n: int = 5) -> list:
    if not docs:
        return docs
    passages = [{"id": i, "text": d.page_content} for i, d in enumerate(docs)]
    results = _ranker.rerank(RerankRequest(query=query, passages=passages))
    top = sorted(results, key=lambda r: r["score"], reverse=True)[:top_n]
    return [docs[r["id"]] for r in top]


async def memory(session_id: str) -> str:
    """Lấy 5 tin nhắn gần nhất làm lịch sử hội thoại."""
    records = await (
        ChatMessage.find(ChatMessage.session_id == session_id).sort("-timestamp").limit(5).to_list()
    )
    return "\n\n".join(f"Human: {r.message}\nAI: {r.response}" for r in records)


def _build_retriever(collection_name: str, k: int = 10):
    embeddings = OllamaEmbeddings(
        model=ollama_config.OLLAMA_EMBEDDINGS_MODEL,
        base_url=ollama_config.OLLAMA_BASE_URL,
    )
    client = QdrantClient(url=qdrant_config.QDRANT_URL, prefer_grpc=False)
    vectorstore = QdrantVectorStore(
        client=client,
        collection_name=collection_name,
        embedding=embeddings,
        sparse_embedding=FastEmbedSparse(model_name=qdrant_config.QDRANT_MODEL_NAME),
        retrieval_mode=RetrievalMode.HYBRID,
    )
    return vectorstore.as_retriever(search_kwargs={"k": k})


def _fmt_docs(docs) -> str:
    parts = [
        f"[{d.metadata.get('source', f'Tài liệu {idx + 1}')}]\n{d.page_content}"
        for idx, d in enumerate(docs)
    ]
    return "\n\n---\n\n".join(parts)


def rag_tool(query: str, collection_name: str, history: str) -> str:
    """Single-doc RAG (sync) dùng LangChain chain."""
    raw_docs = _build_retriever(collection_name, k=10).invoke(query)
    docs = _rerank(raw_docs, query, top_n=5)

    context = _fmt_docs(docs)
    chain = ChatPromptTemplate.from_template(TEMPLATE_RAG_TOOL) | llm | StrOutputParser()
    return chain.invoke({"context": context, "question": query, "history": history})


def rag_tool_multi(query: str, collection_names: list, history: str) -> str:
    """Multi-doc RAG (sync): query nhiều collections → rerank → LangChain chain."""
    all_docs = []
    for cn in collection_names:
        try:
            all_docs.extend(_build_retriever(cn, k=10).invoke(query))
        except Exception as exc:
            logger.warning("Could not query collection %s: %s", cn, exc)

    if not all_docs:
        return "Không tìm thấy tài liệu liên quan."

    reranked = _rerank(all_docs, query, top_n=min(5, len(all_docs)))

    chain = ChatPromptTemplate.from_template(TEMPLATE_RAG_TOOL) | llm | StrOutputParser()
    return chain.invoke(
        {
            "context": _fmt_docs(reranked),
            "question": query,
            "history": history,
        }
    )


async def _stream_ollama(messages: list, think: bool = False):
    """
    Stream trực tiếp từ Ollama HTTP API — không qua LangChain.
    think=False tắt thinking mode của Qwen3 → token xuất hiện ngay.
    """
    payload = {
        "model": ollama_config.OLLAMA_CHAT_MODEL,
        "messages": messages,
        "stream": True,
        "think": think,
    }
    async with httpx.AsyncClient(timeout=httpx.Timeout(180.0)) as client:
        async with client.stream(
            "POST",
            f"{ollama_config.OLLAMA_BASE_URL}/api/chat",
            json=payload,
        ) as response:
            async for line in response.aiter_lines():
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                    content = data.get("message", {}).get("content", "")
                    if content:
                        yield content
                    if data.get("done"):
                        break
                except json.JSONDecodeError:
                    continue


def _build_user_msg(history: str, docs, query: str) -> str:
    return (
        f"Lịch sử hội thoại:\n{history}\n\n"
        f"Tài liệu tham khảo:\n{_fmt_docs(docs)}\n\n"
        f"Câu hỏi: {query}"
    )


async def rag_tool_stream(query: str, collection_name: str, history: str):
    """Single-doc RAG stream: retrieve → rerank → Ollama trực tiếp."""

    def _retrieve():
        raw = _build_retriever(collection_name, k=10).invoke(query)
        return _rerank(raw, query, top_n=5)

    docs = await asyncio.to_thread(_retrieve)
    messages = [
        {"role": "system", "content": _RAG_SYSTEM},
        {"role": "user", "content": _build_user_msg(history, docs, query)},
    ]
    async for chunk in _stream_ollama(messages, think=False):
        yield chunk


async def rag_tool_multi_stream(query: str, collection_names: list, history: str):
    """Multi-doc RAG stream: query nhiều collections → rerank → Ollama trực tiếp."""

    def _retrieve_all():
        all_docs = []
        for cn in collection_names:
            try:
                all_docs.extend(_build_retriever(cn, k=10).invoke(query))
            except Exception as exc:
                logger.warning("Could not query collection %s: %s", cn, exc)
        if not all_docs:
            return []
        return _rerank(all_docs, query, top_n=min(5, len(all_docs)))

    reranked = await asyncio.to_thread(_retrieve_all)

    if not reranked:
        yield "Không tìm thấy tài liệu liên quan trong các collection đã chọn."
        return

    messages = [
        {"role": "system", "content": _RAG_SYSTEM},
        {"role": "user", "content": _build_user_msg(history, reranked, query)},
    ]
    async for chunk in _stream_ollama(messages, think=False):
        yield chunk


def list_collections() -> str:
    client = QdrantClient(url=qdrant_config.QDRANT_URL)
    names = [c.name for c in client.get_collections().collections]
    return "Các collection hiện có: " + ", ".join(names)
