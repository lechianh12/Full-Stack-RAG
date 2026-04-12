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


    base_retriever  = vectorstore.as_retriever(search_kwargs={"k": 20})

    compressor = FlashrankRerank(top_n=10)

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


async def rag_tool_stream(query: str, collection_name: str, history: str):
    """
    Streaming version of rag_tool. Yields text chunks as they are generated.
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

    base_retriever = vectorstore.as_retriever(search_kwargs={"k": 20})
    compressor = FlashrankRerank(top_n=10)
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

    # Retrieve docs synchronously (retrieval doesn't need streaming)
    docs = retriever.invoke(query)
    context = format_docs(docs)

    # Stream only the LLM response
    chain = prompt | llm | StrOutputParser()
    async for chunk in chain.astream({"context": context, "question": query, "history": history}):
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

