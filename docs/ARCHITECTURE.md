# Sahayak AI — System Architecture

## Product Identity

**Sahayak AI** is an AI Operating System for Citizens: a proactive digital companion that simplifies government services through RAG-grounded answers, document intelligence, life-event guidance, civic reporting, and scam detection.

**Tagline:** Making Government Services Simple for Everyone.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client (React + Vite)                        │
│  Dashboard · Chat · Schemes · Documents · Civic · Scam · Voice  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / REST / SSE
┌────────────────────────────▼────────────────────────────────────┐
│              API Gateway Layer (Express.js)                      │
│  Auth · Rate limit · Validation · File upload · RBAC             │
│  Routes: /auth /users /twin /schemes /docs /civic /deadlines     │
└───────┬──────────────────────────────┬──────────────────────────┘
        │                              │
        ▼                              ▼
┌───────────────────┐        ┌───────────────────────────────┐
│  MongoDB          │        │  AI Service (FastAPI)          │
│  Users, Twin,     │        │  RAG · OCR · Vision · TTS/STT │
│  Docs meta, Civic │        │  Scam · Letters · Roadmaps    │
│  Schemes, Alerts  │        │  LangChain + Gemini + Chroma  │
└───────────────────┘        └───────────┬───────────────────┘
                                         │
                             ┌───────────▼───────────┐
                             │ ChromaDB (vectors)     │
                             │ Official gov knowledge │
                             └───────────────────────┘
```

## Service Responsibilities

| Service | Role | Why |
|---------|------|-----|
| **frontend** | SPA UX, accessibility, i18n shell | Vite + React is ideal for fast SaaS UX and Vercel deploy |
| **backend (Express)** | Auth, CRUD, orchestration, uploads | Node fits JSON APIs, JWT, middleware, file handling |
| **ai-service (FastAPI)** | RAG, OCR, vision, speech, LLM calls | Python ecosystem (LangChain, EasyOCR, embeddings) |
| **MongoDB** | Flexible citizen profiles & document metadata | Document model maps cleanly to Digital Twin |
| **ChromaDB** | Vector store for grounded retrieval | Lightweight, Docker-friendly for hackathons |
| **Redis (optional)** | Rate limits, cache, job queues | Scale path; in-memory fallback when absent |

## Request Flows

### Chat (RAG)
1. User message → Express `/api/chat`
2. Express authenticates, sanitizes, forwards to FastAPI `/ai/chat`
3. FastAPI embeds query → Chroma retrieve top-k → Gemini with citations
4. Response streamed/returned with sources

### Document AI
1. Upload → Express (validate MIME/size) → store file + metadata in Mongo
2. Async/sync call to FastAPI `/ai/documents/analyze`
3. OCR + classify + extract fields → update vault + Deadline Guardian

### Civic Report
1. Photo + geo → Express
2. FastAPI Vision classifies issue + severity + department
3. Complaint draft persisted; map pin in UI

## Security Boundaries

- JWT access + refresh tokens (httpOnly cookies for refresh in production)
- Separate AI service network (internal Docker network)
- Prompt-injection filters before LLM calls
- PII redaction in logs
- Encrypted-at-rest document paths; private upload storage

## Scalability Path

- Stateless API replicas behind load balancer
- AI service horizontal scale with queue for heavy OCR/vision
- Chroma → managed vector DB (Pinecone/Weaviate) when needed
- CDN for static assets; object storage (S3/GCS) for documents

## Deployment Topology

- **Frontend:** Vercel
- **Backend + AI + DBs:** Railway / Docker Compose
- **CI/CD:** GitHub Actions (lint, test, build, deploy)
