import csv
from typing import List
from pathlib import Path
import docx
import PyPDF2

class DocumentExtractor:
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        text = ""
        with open(file_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() or ""
        return text

    @staticmethod
    def extract_text_from_csv(file_path: str) -> str:
        lines = []
        with open(file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                lines.append(', '.join(row))
        return '\n'.join(lines)

    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        doc = docx.Document(file_path)
        return '\n'.join([para.text for para in doc.paragraphs])

    @staticmethod
    def extract_text(file_path: str) -> str:
        ext = Path(file_path).suffix.lower()
        if ext == '.pdf':
            return DocumentExtractor.extract_text_from_pdf(file_path)
        elif ext == '.csv':
            return DocumentExtractor.extract_text_from_csv(file_path)
        elif ext == '.docx':
            return DocumentExtractor.extract_text_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file extension: {ext}")
        


