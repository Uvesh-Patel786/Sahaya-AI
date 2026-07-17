# API Contracts — Sahayak AI

Base URLs:
- Express: `http://localhost:4000/api`
- AI (internal): `http://localhost:8000/ai`

Auth: `Authorization: Bearer <accessToken>` unless noted.

---

## Auth

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/auth/register` | `{ name, email, password, language? }` | `{ user, accessToken, refreshToken }` |
| POST | `/auth/login` | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| POST | `/auth/refresh` | `{ refreshToken }` | `{ accessToken }` |
| GET | `/auth/me` | — | `{ user }` |

## Digital Twin

| Method | Path | Notes |
|--------|------|-------|
| GET | `/twin` | Current twin |
| PUT | `/twin` | Upsert twin fields |
| GET | `/twin/recommendations` | Schemes + opportunities + alerts |

## Chat

| Method | Path | Body |
|--------|------|------|
| POST | `/chat` | `{ message, language?, sessionId? }` → `{ reply, sources[], sessionId }` |

## Schemes

| Method | Path |
|--------|------|
| GET | `/schemes?q=&category=&state=` |
| GET | `/schemes/:id` |
| GET | `/schemes/recommend` | Profile-ranked |

## Documents

| Method | Path |
|--------|------|
| GET | `/documents` |
| POST | `/documents/upload` | multipart `file`, `type?` |
| POST | `/documents/:id/analyze` |
| POST | `/documents/explain-letter` | multipart or `{ documentId }` |
| DELETE | `/documents/:id` |

## Civic

| Method | Path |
|--------|------|
| POST | `/civic/reports` | multipart: photo, lat, lng, description? |
| GET | `/civic/reports` |
| GET | `/civic/reports/:id` |
| PATCH | `/civic/reports/:id/status` | admin/prototype |

## Scam

| Method | Path |
|--------|------|
| POST | `/scam/analyze` | `{ text, channel? }` → `{ label, confidence, reasons[] }` |

## Life Events / Roadmaps / Opportunities / Deadlines

| Method | Path |
|--------|------|
| POST | `/life-events/plan` | `{ event, details? }` |
| POST | `/roadmaps/generate` | `{ goal, context? }` |
| GET | `/opportunities` |
| GET | `/deadlines` |
| POST | `/deadlines` |
| PATCH | `/deadlines/:id` |

## AI Service (FastAPI, called by Express)

| Method | Path |
|--------|------|
| POST | `/ai/chat` |
| POST | `/ai/rag/ingest` |
| POST | `/ai/documents/ocr` |
| POST | `/ai/documents/classify` |
| POST | `/ai/documents/explain` |
| POST | `/ai/vision/civic` |
| POST | `/ai/scam` |
| POST | `/ai/speech/stt` |
| POST | `/ai/speech/tts` |
| POST | `/ai/schemes/match` |
| POST | `/ai/life-event` |
| POST | `/ai/roadmap` |
