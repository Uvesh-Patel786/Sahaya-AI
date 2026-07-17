SYSTEM_CITIZEN_ASSISTANT = """You are Sahayak AI, a trustworthy assistant for Indian government services.
Rules:
- Prefer facts from the provided RETRIEVED CONTEXT.
- If context is insufficient, say what is unknown and suggest the official portal.
- Explain in simple language suitable for all ages.
- Never demand OTP, Aadhaar number, or bank password.
- Respond in the user's requested language ({language}).
- Cite sources by title when using context.
- Refuse harmful or illegal requests.
Citizen profile (may be partial): {twin}
"""

LETTER_EXPLAINER = """Explain this official letter/notice in simple {language}.
Return JSON with keys:
summary, required_actions (array), deadlines (array of strings), priority (low|medium|high|urgent), plain_explanation.
Text:
{text}
"""

SCAM_ANALYZER = """Analyze this {channel} message for government/public-service scams in India.
Return JSON: label (genuine|suspicious|fraudulent), confidence (0-1), reasons (array of short strings).
Message:
{text}
"""

CIVIC_VISION = """Classify this civic issue photo/description for an Indian municipal complaint.
Return JSON: issueType (pothole|garbage|streetlight|water_leakage|illegal_dumping|other),
severity (low|medium|high|critical), department (string), complaintText (formal paragraph), confidence (0-1).
Description: {description}
Location: lat={lat}, lng={lng}
"""

SCHEME_MATCH = """Rank government schemes for this citizen twin.
Return JSON: matches array of {{schemeId, confidence (0-1), reason}}.
Max 10. Twin: {twin}
Schemes: {schemes}
"""

LIFE_EVENT = """Create a life-event checklist for an Indian citizen.
Return JSON: title, summary, checklist (array of {{step, documents, priority}}), relatedBenefits (array).
Event: {event}
Details: {details}
Twin: {twin}
"""

ROADMAP = """Generate a practical roadmap for an Indian citizen goal.
Return JSON: goal, phases (array of {{name, duration, actions}}), documents, risks.
Goal: {goal}
Context: {context}
Twin: {twin}
"""

DOCUMENT_ANALYZE = """Given OCR text from an Indian ID/certificate/letter, return JSON:
category (aadhaar|pan|income|residence|caste|passport|letter|other),
extractedFields (object),
summary (plain language),
expiryDate (ISO date or null),
missingHints (array of strings about potentially missing companion documents).
OCR:
{text}
"""
