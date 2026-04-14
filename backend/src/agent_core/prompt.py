# ─── Prompt Template for RAG Tool ────────────────────────────────────────────────

TEMPLATE_RAG_TOOL = """Dựa trên các tài liệu sau đây, hãy trả lời câu hỏi chính xác và chi tiết.

Lịch sử hội thoại:
{history}

Tài liệu:
{context}

Câu hỏi: {question}

Câu trả lời:"""


# ─── SYSTEM PROMPT ────────────────────────────────────────────────

_RAG_SYSTEM = (
    "Bạn là trợ lý RAG chuyên nghiệp. "
    "Dựa hoàn toàn vào tài liệu được cung cấp để trả lời chính xác bằng tiếng Việt. "
    "Nếu tài liệu không chứa thông tin liên quan, hãy nói rõ điều đó."
)
