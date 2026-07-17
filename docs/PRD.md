# Product Requirements Document — Sahayak AI

## 1. Vision

Sahayak AI is an AI Operating System for Citizens that removes friction from discovering schemes, understanding policies, managing documents, reporting civic issues, and navigating life events—with answers grounded in official sources.

## 2. Goals & Success Metrics

| Goal | Metric |
|------|--------|
| Help users find eligible schemes | Scheme recommendation CTR, eligibility match rate |
| Reduce document confusion | Letter explainer satisfaction, time-to-action |
| Prevent scams | Scam detections flagged correctly (precision/recall) |
| Civic accountability | Reports filed → department routed |
| Accessibility | Usage across Hindi/Gujarati/English; voice sessions |

## 3. Personas (summary)

See [PERSONAS.md](./PERSONAS.md). Primary: students, farmers, seniors, job seekers, entrepreneurs, rural & urban citizens.

## 4. Functional Requirements

### FR-1 Citizen Digital Twin
Secure profile: demographics, occupation, state, documents, interests. Proactive recommendations for schemes, deadlines, opportunities.

### FR-2 Life Event Assistant
Select/describe life event → personalized checklist (documents, benefits, steps).

### FR-3 Scheme Finder
Profile-based recommendations with description, eligibility, benefits, documents, process, official URL, confidence score.

### FR-4 AI Chat
Multilingual (EN/HI/GU), RAG-grounded, source citations.

### FR-5 Knowledge Base
Ingest gov PDFs/FAQs → chunk → embed → Chroma → retrieve → Gemini.

### FR-6 Smart Document AI
OCR, classification, field validation, missing docs, plain-language explanation, expiry.

### FR-7 Civic Reporting
Photo + location → classify → severity → department → complaint draft → tracking.

### FR-8 Scam Detector
Analyze message text → genuine / suspicious / fraudulent + rationale + confidence.

### FR-9 Letter Explainer
Upload notice → summary, actions, deadlines, priority.

### FR-10 Voice
STT + TTS for EN/HI/GU.

### FR-11 Opportunity Engine
Scholarships, internships, jobs, grants, incubators from Digital Twin.

### FR-12 Roadmap Generator
Goal → phased action plan.

### FR-13 Deadline Guardian
Track expiries/windows → reminders.

### FR-14 Document Vault
Secure organize, search, preview, alerts.

## 5. Non-Functional Requirements

- AuthN/AuthZ, rate limiting, CORS, upload validation
- WCAG-oriented accessible UI
- Modular monorepo; Docker Compose local
- Privacy by design: minimize PII in prompts/logs
- Response target: chat p95 < 8s with RAG (Gemini latency dependent)

## 6. Out of Scope (MVP / Hackathon)

- Real government API submission (prototype complaint IDs only)
- Legal identity verification with UIDAI
- Payment processing
- Native mobile apps (responsive web first)
