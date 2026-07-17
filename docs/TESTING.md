# Testing Strategy

## Layers

1. **Unit** — safety sanitizer, deadline status transitions, scam heuristics
2. **API** — auth register/login, twin upsert, schemes list (Node test runner)
3. **AI contract** — JSON schema shape for scam/scheme/civic responses
4. **E2E (manual hackathon)** — register → twin → chat → scam → civic report

## Backend tests

```bash
cd backend
npm test
```

## Frontend

Smoke: open landing, register, navigate each route.

## AI service

```bash
cd ai-service
# with venv active
pytest  # add tests as suite grows
curl http://localhost:8000/health
```

## Acceptance checklist

- [ ] User can register and login
- [ ] Digital Twin saves and powers dashboard
- [ ] Chat returns reply (with sources when knowledge ingested)
- [ ] Schemes recommend with confidence
- [ ] Document upload works
- [ ] Scam detector labels a sample SMS
- [ ] Civic report creates tracking ID
- [ ] Dark/light theme toggles
- [ ] Mobile sidebar usable
