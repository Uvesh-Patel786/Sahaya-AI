# AI Pipeline & Prompt Strategy

## RAG pipeline

1. **Collect** — Markdown/PDF knowledge under `ai-service/knowledge/` (+ admin ingest API)
2. **Clean** — UTF-8 normalize, strip noise
3. **Chunk** — RecursiveCharacterTextSplitter (800 / 120 overlap)
4. **Embed & store** — ChromaDB collection `gov_knowledge`
5. **Retrieve** — top-k similarity for user query
6. **Generate** — Gemini with system prompt + twin context + citations
7. **Cite** — return source titles/URLs with the reply

## Prompt engineering principles

- Role: trustworthy citizen OS assistant
- Always prefer retrieved official context
- Multilingual output via `language` parameter (en/hi/gu)
- Structured JSON for analyzers (scam, schemes, civic, documents)
- Safety: refuse OTP harvesting; avoid fabricating eligibility

## Model routing

| Capability | Primary | Fallback |
|------------|---------|----------|
| Chat | Gemini + RAG | Retrieved snippet offline message |
| Scheme match | Gemini JSON | Heuristic twin overlap |
| OCR | EasyOCR / pypdf | Empty text + store file |
| Document/Letter | Gemini JSON | Truncated OCR summary |
| Civic vision | Gemini Vision | Keyword heuristic on description |
| Scam | Gemini JSON | Keyword risk cues |
| TTS | gTTS | Browser SpeechSynthesis |
| STT | Browser Web Speech API | Server hook ready for Whisper |

## Evaluation ideas

- Citation faithfulness spot-checks
- Scam precision/recall on labeled SMS set
- Scheme match @k with twin fixtures
