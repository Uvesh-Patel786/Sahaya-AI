# Deployment Guide

## Local (Docker Compose)

```bash
cp .env.example .env
# set GEMINI_API_KEY and JWT_SECRET
docker compose up --build
```

Seed schemes after Mongo is up:

```bash
docker compose exec backend npm run seed
# or from host with MONGODB_URI pointing at localhost
```

Ingest knowledge (auto on AI startup; can re-run):

```bash
curl -X POST http://localhost:8000/ai/rag/ingest-knowledge
```

## Vercel (frontend)

1. Root directory: `frontend`
2. Build: `npm run build`
3. Output: `dist`
4. Env: `VITE_API_URL=https://your-api.example.com/api`

## Railway / Render (backend + AI)

Deploy `backend` and `ai-service` as separate services. Attach MongoDB plugin or Atlas. Set:

- `MONGODB_URI`
- `AI_SERVICE_URL` (internal URL of AI service)
- `JWT_SECRET`
- `FRONTEND_URL`
- `GEMINI_API_KEY` on AI service
- `CHROMA_URL` (managed Chroma or sidecar)

## GitHub Actions

Workflow lint/build on push (see `.github/workflows/ci.yml`).

## Environments

| Env | Frontend | API |
|-----|----------|-----|
| Dev | localhost:5173 | localhost:4000 |
| Staging | Vercel preview | Railway staging |
| Prod | Vercel prod | Railway prod + Atlas |
