import getpass
import os
from config.config import Config
from langchain.chat_models import init_chat_model
from llm.init_model import LLM
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from llm import llm
import sys
from langchain_qdrant import FastEmbedSparse, RetrievalMode
from langchain_qdrant import RetrievalMode
from langchain_ollama import OllamaEmbeddings
from config.config import QDRantConfig, OllamaConfig
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from qdrant_client import QdrantClient

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

qdrant_config = QDRantConfig()
ollama_config = OllamaConfig()


texts = ["""
FastAPI là một framework hiện đại, nhanh (high-performance) để xây 
dựng các API với Python 3.7+ dựa trên các chuẩn như OpenAPI và JSON Schema.
FastAPI được thiết kế để giúp lập trình viên tạo ra các API mạnh mẽ, dễ bảo 
trì và có tài liệu tự động hóa sẵn. Nó tận dụng type hints của Python để tự 
động kiểm tra dữ liệu đầu vào và tạo docs bằng Swagger UI hoặc ReDoc. Nhờ vào
hiệu suất cao dựa trên Starlette và Pydantic, FastAPI thường được so sánh với các
framework như Flask hoặc Django, nhưng vượt trội hơn về tốc độ và khả năng mở rộng.
         

Flask là một microframework cho Python, được thiết kế để đơn giản và dễ sử dụng.
Nó cung cấp các công cụ cơ bản để xây dựng ứng dụng web, nhưng không bao gồm
nhiều tính năng tích hợp sẵn như ORM hay form validation. Flask cho phép
lập trình viên tự do lựa chọn các thư viện và công cụ khác nhau để xây dựng
ứng dụng của mình. Điều này mang lại tính linh hoạt cao, nhưng cũng có thể
dẫn đến việc phải viết nhiều mã hơn so với các framework lớn hơn như Django.
Django là một framework web toàn diện cho Python, cung cấp nhiều tính năng tích hợp
như ORM, form validation, và hệ thống quản lý người dùng. Nó được thiết kế
để giúp lập trình viên xây dựng ứng dụng web nhanh chóng và hiệu quả, với
nhiều công cụ hỗ trợ sẵn có. Django thường được sử dụng cho các ứng dụng
lớn và phức tạp, nơi mà tính năng bảo mật và quản lý người dùng là rất quan trọng.
Django có một cộng đồng lớn và nhiều tài liệu hướng dẫn, giúp lập trình viên
dễ dàng tìm kiếm giải pháp cho các vấn đề thường gặp.
  
"""]


texts_2 = ["""
        Elden ring là một trò chơi nhập vai hành động được phát triển bởi FromSoftware và
        được phát hành bởi Bandai Namco Entertainment. Trò chơi được phát hành vào ngày
        25 tháng 2 năm 2022 cho các nền tảng PlayStation 4, PlayStation 5, Xbox One,
        Xbox Series X/S và Microsoft Windows. Elden Ring được đạo diễn bởi Hidetaka Miyazaki,
        người đã từng làm việc trong các trò chơi Dark Souls, Bloodborne và Sekiro: Shadows Die Twice.
        Trò chơi lấy bối cảnh trong một thế giới mở rộng lớn, nơi người chơi có thể khám phá,
        chiến đấu với quái vật và hoàn thành các nhiệm vụ. Elden Ring được đánh giá cao
        về đồ họa, gameplay và cốt truyện,
        và đã nhận được nhiều giải thưởng trong ngành công nghiệp game.  
"""]



class Ingest:
    def __init__(self, documents, 
                 collection_name=qdrant_config.COLLECTION_NAME,
                 url = qdrant_config.QDRANT_URL, 
                 qdrant_model_name=qdrant_config.QDRANT_MODEL_NAME,
                 ollama_embeddings_model=ollama_config.OLLAMA_EMBEDDINGS_MODEL):
        self.documents = documents
        self.url = url
        self.collection_name = collection_name
        self.ollama_embeddings_model = ollama_embeddings_model
        self.qdrant_model_name = qdrant_model_name

    from langchain_core.documents import Document

    def chunking(self, texts):
        """
        Chia nhỏ các văn bản thành các chunk (đoạn nhỏ) dạng Document.
        """
        # Chuyển str -> Document
        docs = [Document(page_content=text) for text in texts]

        # Chunking
        text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            chunk_size=700,
            chunk_overlap=50
        )
        doc_splits = text_splitter.split_documents(docs)
        return doc_splits


    def process(self):
        sparse_embeddings = FastEmbedSparse(model_name=self.qdrant_model_name)
        embeddings = OllamaEmbeddings(model=self.ollama_embeddings_model)

        doc_splits = self.chunking(self.documents)

        vectorstore = QdrantVectorStore.from_documents(
            doc_splits,
            embedding=embeddings,
            sparse_embedding=sparse_embeddings,
            url=self.url,
            prefer_grpc=False,
            collection_name=self.collection_name,
            retrieval_mode=RetrievalMode.HYBRID,
        )

        return vectorstore

        # retriever = vectorstore.similarity_search(query)

        # return retriever
    



    
if __name__ == "__main__":
    query = "Elden Ring là gì?"
    ingest = Ingest(documents=texts_2)
    results = ingest.process()
    print("Results: ", results)





