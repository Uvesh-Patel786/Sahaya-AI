# Repository Folder Structure

```
Sahayak AI/
├── .github/workflows/ci.yml
├── docs/                     # PRD, architecture, APIs, security, pitch
├── backend/                  # Express + MongoDB API
│   └── src/
│       ├── models/
│       ├── routes/
│       ├── middleware/
│       ├── services/
│       └── utils/
├── ai-service/               # FastAPI + Gemini + Chroma + OCR
│   ├── app/
│   └── knowledge/            # Seed RAG corpus
├── frontend/                 # React + Vite + Tailwind
│   └── src/
│       ├── components/
│       ├── context/
│       ├── lib/
│       └── pages/
├── docker-compose.yml
├── .env.example
└── README.md
```
