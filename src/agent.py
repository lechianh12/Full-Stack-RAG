import getpass
import os
from config.config import Config
from langchain.chat_models import init_chat_model
from llm.llm import Gemini
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore

llm = Gemini().init_gemini()

embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

texts = """
FastAPI là một framework hiện đại, nhanh (high-performance) để xây 
dựng các API với Python 3.7+ dựa trên các chuẩn như OpenAPI và JSON Schema.
FastAPI được thiết kế để giúp lập trình viên tạo ra các API mạnh mẽ, dễ bảo 
trì và có tài liệu tự động hóa sẵn. Nó tận dụng type hints của Python để tự 
động kiểm tra dữ liệu đầu vào và tạo docs bằng Swagger UI hoặc ReDoc. Nhờ vào
hiệu suất cao dựa trên Starlette và Pydantic, FastAPI thường được so sánh với các
framework như Flask hoặc Django, nhưng vượt trội hơn về tốc độ và khả năng mở rộng.
"""

doc_store = QdrantVectorStore.from_texts(
    texts, embeddings, url="http://localhost:6333", collection_name="demo_collection"
)



from langchain_qdrant import RetrievalMode


query = "What is the main function of fastapi?"
found_docs = doc_store.similarity_search(query)



