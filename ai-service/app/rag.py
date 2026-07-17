from __future__ import annotations

import math
import re
from pathlib import Path
from typing import Any

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import settings
from app.gemini_client import generate_text, has_gemini

_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=120)

# Simple in-memory knowledge store (no C++ / Chroma required on Windows)
_DOCS: list[dict[str, Any]] = []


def _tokenize(text: str) -> set[str]:
    return {t for t in re.findall(r"[a-zA-Z0-9\u0900-\u097F]{2,}", text.lower())}


def chunk_text(text: str) -> list[str]:
    return _splitter.split_text(text)


def ingest_text(
    text: str,
    *,
    source: str,
    title: str,
    url: str = "",
    doc_type: str = "faq",
) -> int:
    chunks = chunk_text(text)
    for i, c in enumerate(chunks):
        _DOCS.append(
            {
                "content": c,
                "title": title,
                "source": source,
                "url": url,
                "chunk_index": i,
                "doc_type": doc_type,
                "tokens": _tokenize(c),
            }
        )
    return len(chunks)


def ingest_knowledge_dir(directory: str | None = None) -> dict[str, Any]:
    root = Path(directory or settings.knowledge_dir)
    if not root.is_absolute():
        root = Path(__file__).resolve().parent.parent / root
    total = 0
    files = 0
    if not root.exists():
        return {"files": 0, "chunks": 0}
    for path in root.rglob("*"):
        if path.suffix.lower() not in {".txt", ".md"}:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        n = ingest_text(
            text,
            source=path.name,
            title=path.stem.replace("_", " ").title(),
            url="",
            doc_type="knowledge",
        )
        total += n
        files += 1
    return {"files": files, "chunks": total}


def retrieve(query: str, k: int = 5) -> list[dict[str, Any]]:
    if not _DOCS:
        return []
    q = _tokenize(query)
    if not q:
        return _DOCS[:k]
    scored = []
    for doc in _DOCS:
        inter = len(q & doc["tokens"])
        if inter == 0:
            continue
        union = len(q | doc["tokens"]) or 1
        score = inter / math.sqrt(union)
        scored.append((score, doc))
    scored.sort(key=lambda x: x[0], reverse=True)
    out = []
    for score, doc in scored[:k]:
        out.append(
            {
                "content": doc["content"],
                "title": doc["title"],
                "source": doc["source"],
                "url": doc.get("url") or "",
                "score": float(score),
            }
        )
    return out


def grounded_chat(message: str, language: str, twin: dict | None, history: list[dict]) -> dict[str, Any]:
    from app.prompts import SYSTEM_CITIZEN_ASSISTANT

    contexts = retrieve(message, k=5)
    context_block = "\n\n".join(
        f"[{i+1}] {c['title']} ({c['source']})\n{c['content']}" for i, c in enumerate(contexts)
    ) or "No retrieved documents available."

    system = SYSTEM_CITIZEN_ASSISTANT.format(language=language, twin=twin or {})
    hist = "\n".join(f"{m.get('role')}: {m.get('content')}" for m in (history or [])[-6:])
    prompt = f"RETRIEVED CONTEXT:\n{context_block}\n\nHISTORY:\n{hist}\n\nUSER:\n{message}"

    if has_gemini():
        reply = generate_text(prompt, system=system)
    else:
        if contexts:
            reply = (
                f"(Offline demo mode) Based on {contexts[0]['title']}:\n\n"
                f"{contexts[0]['content'][:600]}\n\n"
                "Configure GEMINI_API_KEY for full multilingual grounded answers."
            )
        else:
            reply = (
                "I don't have retrieved official context yet. "
                "Please ingest knowledge documents or set GEMINI_API_KEY. "
                "Meanwhile, use official portals like india.gov.in and myscheme.gov.in."
            )

    sources = [
        {"title": c["title"], "source": c["source"], "url": c.get("url") or None, "score": c["score"]}
        for c in contexts
    ]
    return {"reply": reply, "sources": sources}
