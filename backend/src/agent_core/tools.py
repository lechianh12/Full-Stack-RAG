from langchain_core.tools import tool
from langchain_ollama import OllamaEmbeddings
from src.agent_core.ingest import Ingest
from langchain_core.tools import tool
from config.config import QDRantConfig
from config.config import OllamaConfig
from qdrant_client import QdrantClient
from langchain_community.vectorstores import Qdrant
from langchain_qdrant import FastEmbedSparse, QdrantVectorStore
from langchain_qdrant import FastEmbedSparse, RetrievalMode
from langchain_qdrant import QdrantVectorStore
from langchain.chains import RetrievalQA
from llm import llm

qdrant_config = QDRantConfig()
ollama_config = OllamaConfig()

def rag_tool(query: str, collection_name: str) -> str:
    """
    Truy vấn Qdrant collection để lấy các tài liệu liên quan tới truy vấn đầu vào.
    Dung tool nay sau khi dung list_collections để kiểm tra các collection đã được tạo ra.

    Args:
        query: Câu hỏi cần tìm kiếm thông tin.
        collection_name: Tên của collection Qdrant đã lưu vector embeddings.

    Returns:
        Văn bản tài liệu liên quan đến truy vấn.
    """

    embeddings = OllamaEmbeddings(model=ollama_config.OLLAMA_EMBEDDINGS_MODEL)
    client = QdrantClient(
        url=qdrant_config.QDRANT_URL, prefer_grpc=False

    )

    vectorstore = QdrantVectorStore(
        client=client,
        collection_name=collection_name,
        embedding=embeddings,
        sparse_embedding=FastEmbedSparse(model_name=qdrant_config.QDRANT_MODEL_NAME),
        retrieval_mode=RetrievalMode.HYBRID,
    )

    # db = Qdrant(client=client, embeddings=embeddings, collection_name=collection_name)
    # docs = vectorstore.similarity_search_with_score(query=query, k=5)
    
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vectorstore.as_retriever(
            search_kwargs={"k": 10}
        ),
        return_source_documents=True,
    )

    # result = qa_chain.invoke({"query": query})

    # return "\n\n".join([doc.page_content for doc, _ in docs])

    return qa_chain






def list_collections() -> str:
    """
    Trả về danh sách các collection hiện có trong Qdrant.
    dung tool này để kiểm tra các collection đã được tạo ra truoc khi sử dụng rag_tool.
    """
    from qdrant_client import QdrantClient
    client = QdrantClient(url=qdrant_config.QDRANT_URL)
    collections = client.get_collections()
    collection_names = [c.name for c in collections.collections]
    return "Các collection hiện có: " + ", ".join(collection_names)


# if __name__ == "__main__":
#     # Ví dụ sử dụng rag_tool
#     # query = "Cho toi tat ca thong tin video youtube trong tai lieu"
#     query = "FastAPI là gì?"
#     collection_name = "9e37d83d-470f-49db-a2be-3e4de650a391"  # Thay bằng tên collection thực tế của bạn
#     result = rag_tool(query=query, collection_name=collection_name)
#     print("Kết quả tìm kiếm:", result)

#     # Ví dụ sử dụng list_collections
#     collections = list_collections()
#     print(collections)