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


import csv
import docx
import PyPDF2
import io
from pathlib import Path


class DocumentExtractor_2:
    
    def extract_text_from_pdf(self, path: Union[str, Path]) -> str:
        text = ""
        with open(path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() or ""
        return text

    def extract_text_from_csv(self, path: Union[str, Path]) -> str:
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            lines = [", ".join(row) for row in reader]
        return "\n".join(lines)

    def extract_text_from_docx(self, path: Union[str, Path]) -> str:
        doc = docx.Document(path)
        return "\n".join([para.text for para in doc.paragraphs])

    def extract_text(self, path: Union[str, Path]) -> str:
        ext = Path(path).suffix.lower()

        if ext == ".pdf":
            return self.extract_text_from_pdf(path)
        elif ext == ".csv":
            return self.extract_text_from_csv(path)
        elif ext == ".docx":
            return self.extract_text_from_docx(path)
        else:
            raise ValueError(f"Unsupported file extension: {ext}")

