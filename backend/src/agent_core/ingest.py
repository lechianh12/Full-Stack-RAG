import sys
import os
from langchain_qdrant import QdrantVectorStore, FastEmbedSparse, RetrievalMode
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from config.config import QDRantConfig, OllamaConfig

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

qdrant_config = QDRantConfig()
ollama_config = OllamaConfig()

# 1 token ≈ 4 chars tiếng Anh / ≈ 2-3 chars tiếng Việt
# chunk_size=2800 chars ≈ 700 tokens (tương đương cũ)
_CHUNK_SIZE = 2800
_CHUNK_OVERLAP = 200


class Ingest:
    def __init__(
        self,
        documents,
        collection_name=qdrant_config.COLLECTION_NAME,
        url=qdrant_config.QDRANT_URL,
        qdrant_model_name=qdrant_config.QDRANT_MODEL_NAME,
        ollama_embeddings_model=ollama_config.OLLAMA_EMBEDDINGS_MODEL,
        original_filename=None,
    ):
        self.documents = documents
        self.url = url
        self.collection_name = collection_name
        self.ollama_embeddings_model = ollama_embeddings_model
        self.qdrant_model_name = qdrant_model_name
        self.original_filename = original_filename

    def chunking(self, texts: list) -> list:
        meta = {
            "source": self.original_filename or "unknown",
            "doc_id": self.collection_name,
        }
        docs = [Document(page_content=text, metadata=meta) for text in texts]

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=_CHUNK_SIZE,
            chunk_overlap=_CHUNK_OVERLAP,
            separators=["\n\n", "\n", ".", "。", "!", "?", ";", " ", ""],
        )
        return splitter.split_documents(docs)

    def process(self):
        embeddings = OllamaEmbeddings(
            model=self.ollama_embeddings_model,
            base_url=ollama_config.OLLAMA_BASE_URL,
        )
        sparse_embeddings = FastEmbedSparse(model_name=self.qdrant_model_name)

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
