import json
import re
from typing import Any

import httpx

from app.config import settings

_configured = False


def _is_openrouter() -> bool:
    key = settings.gemini_api_key or ""
    model = settings.gemini_model or ""
    return key.startswith("sk-") or "/" in model or bool(settings.openrouter_base_url)


def _ensure() -> None:
    global _configured
    if _configured:
        return
    if settings.gemini_api_key and not _is_openrouter():
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
    _configured = True


def has_gemini() -> bool:
    return bool(settings.gemini_api_key)


def _openrouter_chat(prompt: str, system: str | None = None) -> str:
    base = settings.openrouter_base_url or "https://openrouter.ai/api/v1"
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    headers = {
        "Authorization": f"Bearer {settings.gemini_api_key.rstrip('+')}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Sahayak AI",
    }
    with httpx.Client(timeout=90.0) as client:
        res = client.post(
            f"{base.rstrip('/')}/chat/completions",
            headers=headers,
            json={
                "model": settings.gemini_model,
                "messages": messages,
            },
        )
        res.raise_for_status()
        data = res.json()
    return (data["choices"][0]["message"]["content"] or "").strip()


def generate_text(prompt: str, system: str | None = None) -> str:
    _ensure()
    if not has_gemini():
        raise RuntimeError("GEMINI_API_KEY not configured")
    if _is_openrouter():
        return _openrouter_chat(prompt, system=system)

    import google.generativeai as genai

    model = genai.GenerativeModel(settings.gemini_model, system_instruction=system)
    result = model.generate_content(prompt)
    return (result.text or "").strip()


def generate_json(prompt: str, system: str | None = None) -> dict[str, Any]:
    text = generate_text(prompt + "\nRespond with valid JSON only.", system=system)
    return parse_json(text)


def parse_json(text: str) -> dict[str, Any]:
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        return json.loads(text[start : end + 1])
    raise ValueError(f"Could not parse JSON from model output: {text[:200]}")


def generate_with_image(prompt: str, image_bytes: bytes, mime: str = "image/jpeg") -> dict[str, Any]:
    _ensure()
    if not has_gemini():
        raise RuntimeError("GEMINI_API_KEY not configured")

    # OpenRouter multimodal (best-effort); fall back to text-only JSON
    if _is_openrouter():
        import base64

        b64 = base64.b64encode(image_bytes).decode("ascii")
        base = settings.openrouter_base_url or "https://openrouter.ai/api/v1"
        content = [
            {"type": "text", "text": prompt + "\nRespond with valid JSON only."},
            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
        ]
        headers = {
            "Authorization": f"Bearer {settings.gemini_api_key.rstrip('+')}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Sahayak AI",
        }
        with httpx.Client(timeout=90.0) as client:
            res = client.post(
                f"{base.rstrip('/')}/chat/completions",
                headers=headers,
                json={
                    "model": settings.gemini_model,
                    "messages": [{"role": "user", "content": content}],
                },
            )
            if not res.is_success:
                return generate_json(prompt + "\n(Image unavailable; use description only.)")
            data = res.json()
        return parse_json(data["choices"][0]["message"]["content"] or "{}")

    import google.generativeai as genai

    model = genai.GenerativeModel(settings.gemini_model)
    result = model.generate_content(
        [
            prompt + "\nRespond with valid JSON only.",
            {"mime_type": mime, "data": image_bytes},
        ]
    )
    return parse_json(result.text or "{}")
