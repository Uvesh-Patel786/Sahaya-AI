from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from PIL import Image


@lru_cache(maxsize=1)
def _reader():
    import easyocr

    return easyocr.Reader(["en", "hi"], gpu=False)


def ocr_file(path: str) -> str:
    p = Path(path)
    suffix = p.suffix.lower()
    if suffix == ".pdf":
        try:
            from pypdf import PdfReader

            reader = PdfReader(str(p))
            return "\n".join((page.extract_text() or "") for page in reader.pages).strip()
        except Exception:
            return ""
    if suffix in {".txt", ".md"}:
        return p.read_text(encoding="utf-8", errors="ignore")

    try:
        img = Image.open(p)
        result = _reader().readtext([str(p)], detail=0, paragraph=True)
        return "\n".join(result).strip()
    except Exception:
        # Fallback without EasyOCR if model download fails
        return ""


def classify_heuristic(text: str, hinted: str = "other") -> str:
    lower = text.lower()
    if "aadhaar" in lower or "uidai" in lower:
        return "aadhaar"
    if "permanent account number" in lower or "income tax department" in lower:
        return "pan"
    if "passport" in lower:
        return "passport"
    if "caste" in lower:
        return "caste"
    if "income" in lower and "certificate" in lower:
        return "income"
    if "residence" in lower or "domicile" in lower:
        return "residence"
    if hinted and hinted != "other":
        return hinted
    return "other"
