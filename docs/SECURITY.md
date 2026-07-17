# Security — Sahayak AI

## Controls implemented

| Area | Implementation |
|------|----------------|
| Authentication | JWT access + refresh tokens; bcrypt password hashing (cost 12) |
| Authorization | `requireAuth` / `requireAdmin` middleware |
| Transport | Helmet security headers; CORS restricted to frontend origin |
| Abuse | express-rate-limit on API |
| Uploads | MIME allowlist, size caps, UUID filenames |
| Prompt injection | Pattern filters in `backend/src/utils/safety.ts` before AI calls |
| Logging | PII redaction helpers for Aadhaar/PAN-like patterns |
| Isolation | AI service intended for private Docker network; Express is the public edge |

## Privacy by design

- Digital Twin fields are user-controlled and purpose-limited to recommendations.
- Document binaries stored on server disk (swap to S3/GCS + KMS for production).
- Do not put raw Aadhaar numbers into prompts when avoidable; OCR summaries preferred.
- Clear disclaimers: Sahayak does not replace official portals.

## Prompt injection posture

Reject messages attempting to override system instructions. Ground answers with retrieved context. Instruct models never to request OTP/PIN.

## Hardening checklist (production)

- [ ] Rotate `JWT_SECRET` (≥32 random bytes)
- [ ] HTTPS everywhere
- [ ] Object storage for uploads with signed URLs
- [ ] Redis-backed rate limits
- [ ] Secrets via vault / platform secret manager
- [ ] Regular dependency scanning (npm audit / pip-audit)
- [ ] Delete documents on user request (GDPR-style)
