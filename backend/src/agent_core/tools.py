import asyncio
import logging
from langchain_core.tools import tool
from langchain_ollama import OllamaEmbeddings
from src.agent_core.ingest import Ingest
from config.config import QDRantConfig
from config.config import OllamaConfig
from qdrant_client import QdrantClient
from langchain_qdrant import FastEmbedSparse, QdrantVectorStore, RetrievalMode
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from module.chat_chema import ChatMessage
from llm import llm
from langchain_community.document_compressors import FlashrankRerank
from langchain_classic.retrievers.contextual_compression import ContextualCompressionRetriever

logger = logging.getLogger(__name__)

qdrant_config = QDRantConfig()
ollama_config = OllamaConfig()

async def memory(session_id: str) -> str:
    """Get the most recent messages from memory."""
    record = await ChatMessage.find(ChatMessage.session_id == session_id).sort("-timestamp").limit(5).to_list()
    his = [f"Human: {i.message}\nAI: {i.response}" for i in record]
    return "\n\n".join(his)


def rag_tool(query: str, collection_name: str, history: str) -> str:
    """
    Truy vấn Qdrant collection để lấy các tài liệu liên quan tới truy vấn đầu vào.
    Dung tool nay sau khi dung list_collections để kiểm tra các collection đã được tạo ra.

    Args:
        query: Câu hỏi cần tìm kiếm thông tin.
        collection_name: Tên của collection Qdrant đã lưu vector embeddings.

    Returns:
        Câu trả lời dựa trên tài liệu liên quan đến truy vấn.
    """

    embeddings = OllamaEmbeddings(model=ollama_config.OLLAMA_EMBEDDINGS_MODEL)
    client = QdrantClient(
        url=qdrant_config.QDRANT_URL, 
        prefer_grpc=False
    )

    vectorstore = QdrantVectorStore(
        client=client,
        collection_name=collection_name,
        embedding=embeddings,
        sparse_embedding=FastEmbedSparse(model_name=qdrant_config.QDRANT_MODEL_NAME),
        retrieval_mode=RetrievalMode.HYBRID,
    )


    base_retriever  = vectorstore.as_retriever(search_kwargs={"k": 10})

    compressor = FlashrankRerank(top_n=5)

    retriever = ContextualCompressionRetriever(
        base_compressor=compressor,
        base_retriever=base_retriever
    )
    

    template = """Dựa trên các tài liệu sau đây, hãy trả lời câu hỏi một cách chính xác và chi tiết:

        Lich sử hội thoại:
        {history}

        Tài liệu:
        {context}

        Câu hỏi: {question}

        Câu trả lời:"""

    prompt = ChatPromptTemplate.from_template(template)
    

    def format_docs(docs):
        return "\n\n".join([f"Tài liệu {i+1}:\n{doc.page_content}" for i, doc in enumerate(docs)])
    

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough(), "history": lambda _: history }
        | prompt
        | llm
        | StrOutputParser()
    )
    

    result = rag_chain.invoke(query)
    
    return result


def rag_tool_with_sources(query: str, collection_name: str) -> dict:
    embeddings = OllamaEmbeddings(model=ollama_config.OLLAMA_EMBEDDINGS_MODEL)
    client = QdrantClient(
        url=qdrant_config.QDRANT_URL, 
        prefer_grpc=False
    )

    vectorstore = QdrantVectorStore(
        client=client,
        collection_name=collection_name,
        embedding=embeddings,
        sparse_embedding=FastEmbedSparse(model_name=qdrant_config.QDRANT_MODEL_NAME),
        retrieval_mode=RetrievalMode.HYBRID,
    )


    retriever = vectorstore.as_retriever(search_kwargs={"k": 10})
    docs = retriever.invoke(query)

    template = """Dựa trên các tài liệu sau đây, hãy trả lời câu hỏi một cách chính xác và chi tiết:

        Tài liệu:
        {context}

        Câu hỏi: {question}

        Câu trả lời:"""

    prompt = ChatPromptTemplate.from_template(template)
    

    context = "\n\n".join([f"Tài liệu {i+1}:\n{doc.page_content}" for i, doc in enumerate(docs)])
    

    chain = prompt | llm | StrOutputParser()
    answer = chain.invoke({"context": context, "question": query})
    
    return {
        "answer": answer,
        "source_documents": docs
    }


def _build_retriever(collection_name: str, k: int = 10):
    """Helper: xây dựng retriever cho một collection."""
    embeddings = OllamaEmbeddings(model=ollama_config.OLLAMA_EMBEDDINGS_MODEL)
    client = QdrantClient(url=qdrant_config.QDRANT_URL, prefer_grpc=False)
    vectorstore = QdrantVectorStore(
        client=client,
        collection_name=collection_name,
        embedding=embeddings,
        sparse_embedding=FastEmbedSparse(model_name=qdrant_config.QDRANT_MODEL_NAME),
        retrieval_mode=RetrievalMode.HYBRID,
    )
    return vectorstore.as_retriever(search_kwargs={"k": k})


def rag_tool_multi(query: str, collection_names: list, history: str) -> str:
    """
    Query nhiều Qdrant collection, merge kết quả, rerank và trả lời.
    Mỗi chunk được gắn metadata source (tên file) để hiển thị nguồn.
    """
    all_docs = []
    for cn in collection_names:
        try:
            retriever = _build_retriever(cn)
            docs = retriever.invoke(query)
            all_docs.extend(docs)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Could not query collection {cn}: {e}")

    if not all_docs:
        return "Không tìm thấy tài liệu liên quan trong các collection đã chọn."

    # Rerank toàn bộ (chọn top 10 tốt nhất từ tất cả các doc)
    compressor = FlashrankRerank(top_n=min(10, len(all_docs)))
    reranked = compressor.compress_documents(all_docs, query)

    def format_multi_docs(docs):
        parts = []
        for i, doc in enumerate(docs):
            src = doc.metadata.get("source", "Tài liệu")
            parts.append(f"[Nguồn: {src}]\n{doc.page_content}")
        return "\n\n---\n\n".join(parts)

    template = """Dựa trên các tài liệu sau đây (mỗi đoạn có ghi rõ nguồn), hãy trả lời câu hỏi một cách chính xác và chi tiết:

Lịch sử hội thoại:
{history}

Tài liệu:
{context}

Câu hỏi: {question}

Câu trả lời:"""

    prompt = ChatPromptTemplate.from_template(template)
    chain = prompt | llm | StrOutputParser()
    return chain.invoke({"context": format_multi_docs(reranked), "question": query, "history": history})


async def _stream_ollama(messages: list, think: bool = False):
    """
    Stream trực tiếp từ Ollama HTTP API (không qua LangChain).
    - think=False: tắt thinking mode của Qwen3 → token đầu tiên xuất hiện ngay
    - Không có LangChain wrapper overhead
    """
    import httpx, json as _json
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
                    data = _json.loads(line)
                    content = data.get("message", {}).get("content", "")
                    if content:
                        yield content
                    if data.get("done"):
                        break
                except _json.JSONDecodeError:
                    continue


def _fmt_docs(docs):
    parts = [
        f"[{d.metadata.get('source', f'Tài liệu {i+1}')}]\n{d.page_content}"
        for i, d in enumerate(docs)
    ]
    return "\n\n---\n\n".join(parts)


_RAG_SYSTEM = (
    "Bạn là trợ lý RAG chuyên nghiệp. "
    "Dựa hoàn toàn vào tài liệu được cung cấp để trả lời chính xác bằng tiếng Việt. "
    "Nếu tài liệu không chứa thông tin, hãy nói rõ điều đó."
)


async def rag_tool_multi_stream(query: str, collection_names: list, history: str):
    """Multi-doc RAG stream: retrieve nhiều collection → rerank → stream Ollama trực tiếp."""
    def _retrieve_all():
        all_docs = []
        for cn in collection_names:
            try:
                r = _build_retriever(cn, k=10)
                all_docs.extend(r.invoke(query))
            except Exception as e:
                logger.warning(f"Could not query collection {cn}: {e}")
        if not all_docs:
            return []
        compressor = FlashrankRerank(top_n=min(5, len(all_docs)))
        return compressor.compress_documents(all_docs, query)

    reranked = await asyncio.to_thread(_retrieve_all)

    if not reranked:
        yield "Không tìm thấy tài liệu liên quan trong các collection đã chọn."
        return

    user_msg = f"""Lịch sử hội thoại:
{history}

Tài liệu tham khảo:
{_fmt_docs(reranked)}

Câu hỏi: {query}"""

    messages = [
        {"role": "system", "content": _RAG_SYSTEM},
        {"role": "user",   "content": user_msg},
    ]
    async for chunk in _stream_ollama(messages, think=False):
        yield chunk


async def rag_tool_stream(query: str, collection_name: str, history: str):
    """Single-doc RAG stream: retrieve → rerank → stream Ollama trực tiếp."""
    def _retrieve():
        r = _build_retriever(collection_name, k=10)
        comp_r = ContextualCompressionRetriever(
            base_compressor=FlashrankRerank(top_n=5),
            base_retriever=r,
        )
        return comp_r.invoke(query)

    docs = await asyncio.to_thread(_retrieve)

    user_msg = f"""Lịch sử hội thoại:
{history}

Tài liệu tham khảo:
{_fmt_docs(docs)}

Câu hỏi: {query}"""

    messages = [
        {"role": "system", "content": _RAG_SYSTEM},
        {"role": "user",   "content": user_msg},
    ]
    async for chunk in _stream_ollama(messages, think=False):
        yield chunk


def list_collections() -> str:
    """
    Trả về danh sách các collection hiện có trong Qdrant.
    dung tool này để kiểm tra các collection đã được tạo ra truoc khi sử dụng rag_tool.
    """
    client = QdrantClient(url=qdrant_config.QDRANT_URL)
    collections = client.get_collections()
    collection_names = [c.name for c in collections.collections]
    return "Các collection hiện có: " + ", ".join(collection_names)


# if __name__ == "__main__":
#     # Ví dụ sử dụng rag_tool
#     query = "FastAPI là gì?"
#     collection_name = "9e37d83d-470f-49db-a2be-3e4de650a391"
    
#     print("=== Sử dụng rag_tool ===")
#     result = rag_tool(query=query, collection_name=collection_name)
#     print("Kết quả:", result)
    
#     print("\n=== Sử dụng rag_tool_with_sources ===")
#     result_with_sources = rag_tool_with_sources(query=query, collection_name=collection_name)
#     print("Câu trả lời:", result_with_sources["answer"])
#     print(f"\nSố tài liệu tham khảo: {len(result_with_sources['source_documents'])}")
    
#     print("\n=== Danh sách collections ===")
#     collections = list_collections()
#     print(collections)

