# Sahayak AI

**Making Government Services Simple for Everyone.**

Sahayak AI is an **AI Operating System for Citizens**—a production-oriented platform that helps people discover schemes, understand official documents, manage a secure document vault, report civic issues, detect scams, and navigate life events in English, Hindi, and Gujarati.

Answers are grounded via **RAG** over official knowledge, with citations.

---

## Features

| Feature | Description |
|---------|-------------|
| Citizen Digital Twin | Secure profile + proactive recommendations |
| Life Event Assistant | Checklists for marriage, childbirth, business, etc. |
| Scheme Finder | Eligibility-aware recommendations + confidence |
| AI Chat (RAG) | Grounded answers with sources |
| Smart Document AI | OCR, classification, expiry, explanations |
| Civic Issue Reporting | Vision classify + map + complaint tracking |
| Scam Detector | Genuine / suspicious / fraudulent analysis |
| Letter Explainer | Plain-language notices + deadlines |
| Voice Assistant | STT + TTS (EN / HI / GU) |
| Opportunity Engine | Scholarships, jobs, grants, incubators |
| Roadmap Generator | Personalized multi-step plans |
| Deadline Guardian | Expiry & subsidy window reminders |
| Document Vault | Secure organize, search, alerts |

---

## Architecture (summary)

```
frontend (React/Vite) → backend (Express) → MongoDB
                              ↓
                        ai-service (FastAPI) → Gemini + ChromaDB
```

Full design: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

---

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose (recommended)
- Gemini API key

### 1. Clone & env

```bash
cp .env.example .env
# Set GEMINI_API_KEY and JWT_SECRET
```

### 2. Docker (all services)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000 |
| AI Service | http://localhost:8000 |
| MongoDB | localhost:27017 |
| ChromaDB | localhost:8001 |

### 3. Local development (without Docker for apps)

```bash
# Terminal 1 — Mongo + Chroma via Docker
docker compose up mongodb chromadb -d

# Terminal 2 — Backend
cd backend && npm install && npm run dev

# Terminal 3 — AI
cd ai-service && python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 4 — Frontend
cd frontend && npm install && npm run dev
```

Seed sample schemes:

```bash
cd backend && npm run seed
```

---

## Documentation

| Doc | Path |
|-----|------|
| Product requirements | [docs/PRD.md](docs/PRD.md) |
| Personas | [docs/PERSONAS.md](docs/PERSONAS.md) |
| IA & journeys | [docs/IA_AND_JOURNEYS.md](docs/IA_AND_JOURNEYS.md) |
| Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Database | [docs/DATABASE.md](docs/DATABASE.md) |
| API contracts | [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) |
| AI / RAG | [docs/AI_PIPELINE.md](docs/AI_PIPELINE.md) |
| Security | [docs/SECURITY.md](docs/SECURITY.md) |
| Deployment | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| Testing | [docs/TESTING.md](docs/TESTING.md) |
| Hackathon pitch | [docs/PITCH.md](docs/PITCH.md) |
| Roadmap | [docs/ROADMAP.md](docs/ROADMAP.md) |

---

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind, Framer Motion, React Query, React Router  
- **Backend:** Node.js, Express, MongoDB, JWT  
- **AI:** FastAPI, LangChain, Gemini, EasyOCR, ChromaDB  
- **Ops:** Docker, GitHub Actions, Vercel + Railway ready  

---

## Security highlights

JWT auth, bcrypt passwords, rate limiting, CORS, upload validation, prompt-injection guards, PII-aware logging. Details in [`docs/SECURITY.md`](docs/SECURITY.md).

---

## License

MIT — built for hackathons and social impact.
