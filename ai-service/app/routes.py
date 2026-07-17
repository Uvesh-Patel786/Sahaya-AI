from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, Form, UploadFile
from pydantic import BaseModel, Field

from app import prompts
from app.gemini_client import generate_json, generate_text, generate_with_image, has_gemini
from app.ocr import classify_heuristic, ocr_file
from app.rag import grounded_chat, ingest_knowledge_dir, ingest_text, retrieve

router = APIRouter(prefix="/ai")


class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    twin: dict | None = None
    history: list[dict] = Field(default_factory=list)


class ScamRequest(BaseModel):
    text: str
    channel: str = "other"


class SchemeMatchRequest(BaseModel):
    twin: dict | None = None
    schemes: list[dict]


class LifeEventRequest(BaseModel):
    event: str
    details: str | None = None
    twin: dict | None = None


class RoadmapRequest(BaseModel):
    goal: str
    context: str | None = None
    twin: dict | None = None


class IngestRequest(BaseModel):
    text: str
    source: str
    title: str
    url: str = ""
    doc_type: str = "faq"


class TtsRequest(BaseModel):
    text: str
    language: str = "en"


@router.get("/health")
def health():
    return {"ok": True, "gemini": has_gemini()}


@router.post("/chat")
def chat(body: ChatRequest):
    return grounded_chat(body.message, body.language, body.twin, body.history)


@router.post("/rag/ingest")
def rag_ingest(body: IngestRequest):
    n = ingest_text(
        body.text,
        source=body.source,
        title=body.title,
        url=body.url,
        doc_type=body.doc_type,
    )
    return {"chunks": n}


@router.post("/rag/ingest-knowledge")
def rag_ingest_knowledge():
    return ingest_knowledge_dir()


@router.post("/rag/query")
def rag_query(message: str):
    return {"results": retrieve(message)}


@router.post("/documents/analyze")
async def documents_analyze(
    file: UploadFile = File(...),
    hinted_category: str = Form("other"),
):
    suffix = Path(file.filename or "doc.bin").suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        path = tmp.name

    text = ocr_file(path)
    category = classify_heuristic(text, hinted_category)

    if has_gemini() and text:
        data = generate_json(prompts.DOCUMENT_ANALYZE.format(text=text[:6000]))
        return {
            "category": data.get("category", category),
            "ocrText": text,
            "extractedFields": data.get("extractedFields", {}),
            "summary": data.get("summary", ""),
            "expiryDate": data.get("expiryDate"),
            "missingHints": data.get("missingHints", []),
        }

    return {
        "category": category,
        "ocrText": text,
        "extractedFields": {},
        "summary": "OCR extracted. Configure GEMINI_API_KEY for field-level analysis.",
        "expiryDate": None,
        "missingHints": ["Aadhaar", "Address proof"] if category != "aadhaar" else [],
    }


@router.post("/documents/explain")
async def documents_explain(file: UploadFile = File(...), language: str = Form("en")):
    suffix = Path(file.filename or "doc.bin").suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        path = tmp.name
    text = ocr_file(path) or "(no text extracted)"

    if has_gemini():
        data = generate_json(prompts.LETTER_EXPLAINER.format(language=language, text=text[:7000]))
        return data

    return {
        "summary": text[:400],
        "required_actions": ["Read the full notice carefully", "Visit the issuing office if unclear"],
        "deadlines": [],
        "priority": "medium",
        "plain_explanation": text[:800],
    }


@router.post("/vision/civic")
async def vision_civic(
    file: UploadFile = File(...),
    description: str = Form(""),
    lat: str = Form("0"),
    lng: str = Form("0"),
):
    raw = await file.read()
    mime = file.content_type or "image/jpeg"
    prompt = prompts.CIVIC_VISION.format(description=description, lat=lat, lng=lng)

    if has_gemini():
        try:
            return generate_with_image(prompt, raw, mime=mime)
        except Exception:
            pass

    lower = description.lower()
    issue = "other"
    if "pothole" in lower or "road" in lower:
        issue = "pothole"
    elif "garbage" in lower or "trash" in lower:
        issue = "garbage"
    elif "light" in lower:
        issue = "streetlight"
    elif "water" in lower or "leak" in lower:
        issue = "water_leakage"
    elif "dump" in lower:
        issue = "illegal_dumping"

    dept_map = {
        "pothole": "Public Works / Roads Department",
        "garbage": "Sanitation / Solid Waste Management",
        "streetlight": "Electrical / Street Lighting Wing",
        "water_leakage": "Water Supply Department",
        "illegal_dumping": "Sanitation / Enforcement",
        "other": "Municipal Corporation",
    }
    return {
        "issueType": issue,
        "severity": "medium",
        "department": dept_map[issue],
        "complaintText": (
            f"Respected Sir/Madam, I wish to report a {issue.replace('_', ' ')} "
            f"near coordinates ({lat}, {lng}). {description} Kindly take necessary action. "
            "Tracking via Sahayak AI prototype."
        ),
        "confidence": 0.62,
    }


@router.post("/scam")
def scam(body: ScamRequest):
    if has_gemini():
        return generate_json(prompts.SCAM_ANALYZER.format(channel=body.channel, text=body.text))

    lower = body.text.lower()
    cues = [c for c in ["otp", "click", "kyc", "blocked", "lottery", "send money"] if c in lower]
    if len(cues) >= 2:
        return {
            "label": "fraudulent",
            "confidence": 0.85,
            "reasons": [f"Contains risk cue: {c}" for c in cues],
        }
    if cues:
        return {
            "label": "suspicious",
            "confidence": 0.68,
            "reasons": [f"Contains risk cue: {c}" for c in cues],
        }
    return {
        "label": "genuine",
        "confidence": 0.55,
        "reasons": ["No strong scam patterns found; verify via official portals."],
    }


@router.post("/schemes/match")
def schemes_match(body: SchemeMatchRequest):
    schemes_compact = [
        {
            "schemeId": str(s.get("_id") or s.get("id") or s.get("slug")),
            "name": s.get("name"),
            "targetGroups": s.get("targetGroups"),
            "states": s.get("states"),
            "eligibility": s.get("eligibility"),
            "category": s.get("category"),
        }
        for s in body.schemes
    ]
    if has_gemini():
        return generate_json(
            prompts.SCHEME_MATCH.format(twin=body.twin, schemes=schemes_compact)
        )

    twin = body.twin or {}
    cats = set(twin.get("categories") or [])
    state = twin.get("state")
    matches = []
    for s in schemes_compact:
        groups = set(s.get("targetGroups") or [])
        overlap = len(cats & groups)
        states = s.get("states") or ["ALL"]
        state_ok = (not state) or ("ALL" in states) or (state in states)
        conf = min(0.95, 0.4 + overlap * 0.2 + (0.15 if state_ok else 0))
        matches.append(
            {
                "schemeId": s["schemeId"],
                "confidence": conf,
                "reason": f"Overlap={overlap}, state_ok={state_ok}",
            }
        )
    matches.sort(key=lambda m: m["confidence"], reverse=True)
    return {"matches": matches[:10]}


@router.post("/life-event")
def life_event(body: LifeEventRequest):
    if has_gemini():
        return generate_json(
            prompts.LIFE_EVENT.format(event=body.event, details=body.details or "", twin=body.twin)
        )
    return {
        "title": f"Plan: {body.event}",
        "summary": "Starter checklist (offline mode).",
        "checklist": [
            {"step": "Collect identity & address proofs", "documents": ["Aadhaar"], "priority": "high"},
            {"step": "Check related schemes in Scheme Finder", "documents": [], "priority": "medium"},
        ],
        "relatedBenefits": ["Explore MyScheme.gov.in"],
    }


@router.post("/roadmap")
def roadmap(body: RoadmapRequest):
    if has_gemini():
        return generate_json(
            prompts.ROADMAP.format(goal=body.goal, context=body.context or "", twin=body.twin)
        )
    return {
        "goal": body.goal,
        "phases": [
            {"name": "Prepare", "duration": "1–2 weeks", "actions": ["Gather documents", "Confirm eligibility"]},
            {"name": "Execute", "duration": "2–6 weeks", "actions": ["Apply on official portal only"]},
        ],
        "documents": ["Aadhaar", "PAN", "Address proof"],
        "risks": ["Beware of agents asking for OTP"],
    }


@router.post("/speech/stt")
async def speech_stt(file: UploadFile = File(...), language: str = Form("en")):
    # Browser Web Speech API is primary; server returns guidance + optional Gemini note
    return {
        "text": "",
        "language": language,
        "note": "Use browser SpeechRecognition for STT in the client. Server STT hook ready for Whisper integration.",
    }


@router.post("/speech/tts")
def speech_tts(body: TtsRequest):
    from fastapi.responses import Response
    from gtts import gTTS
    import io

    lang_map = {"en": "en", "hi": "hi", "gu": "gu"}
    lang = lang_map.get(body.language, "en")
    buf = io.BytesIO()
    gTTS(text=body.text[:500], lang=lang).write_to_fp(buf)
    return Response(content=buf.getvalue(), media_type="audio/mpeg")
