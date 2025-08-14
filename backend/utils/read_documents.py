import csv
from typing import Union
import docx
import PyPDF2
from fastapi import UploadFile
import io

class DocumentExtractor:
    @staticmethod
    async def extract_text_from_pdf(file: UploadFile) -> str:
        text = ""
        pdf_bytes = await file.read()
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        for page in reader.pages:
            text += page.extract_text() or ""
        return text

    @staticmethod
    async def extract_text_from_csv(file: UploadFile) -> str:
        contents = await file.read()
        decoded = contents.decode("utf-8")
        reader = csv.reader(io.StringIO(decoded))
        lines = [", ".join(row) for row in reader]
        return "\n".join(lines)

    @staticmethod
    async def extract_text_from_docx(file: UploadFile) -> str:
        contents = await file.read()
        doc = docx.Document(io.BytesIO(contents))
        return "\n".join([para.text for para in doc.paragraphs])

    @staticmethod
    async def extract_text(file: UploadFile) -> str:
        ext = file.filename.split(".")[-1].lower()

        if ext == "pdf":
            return await DocumentExtractor.extract_text_from_pdf(file)
        elif ext == "csv":
            return await DocumentExtractor.extract_text_from_csv(file)
        elif ext == "docx":
            return await DocumentExtractor.extract_text_from_docx(file)
        else:
            raise ValueError(f"Unsupported file extension: {ext}")
