import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { ScamAnalysis } from "../models/ScamAnalysis.js";
import { aiFetch } from "../services/aiClient.js";
import { sanitizeUserText } from "../utils/safety.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();

const scamSchema = z.object({
  text: z.string().min(5).max(5000),
  channel: z.enum(["sms", "email", "whatsapp", "notice", "other"]).optional(),
});

function heuristicScam(text: string) {
  const lower = text.toLowerCase();
  const fraudSignals = [
    "urgent",
    "otp",
    "click link",
    "kyc pending",
    "account blocked",
    "lottery",
    "won prize",
    "send money",
    "gift card",
    "whatsapp://",
    "bit.ly",
  ];
  const hits = fraudSignals.filter((s) => lower.includes(s));
  if (hits.length >= 3) {
    return {
      label: "fraudulent" as const,
      confidence: 0.88,
      reasons: hits.map((h) => `Contains high-risk cue: "${h}"`),
    };
  }
  if (hits.length >= 1) {
    return {
      label: "suspicious" as const,
      confidence: 0.7,
      reasons: hits.map((h) => `Potential risk cue: "${h}"`),
    };
  }
  return {
    label: "genuine" as const,
    confidence: 0.55,
    reasons: ["No common scam patterns detected. Still verify via official portals."],
  };
}

router.post("/analyze", requireAuth, validateBody(scamSchema), async (req: AuthedRequest, res, next) => {
  try {
    let text: string;
    try {
      text = sanitizeUserText(req.body.text);
    } catch (e) {
      throw new AppError((e as Error).message, 400);
    }
    const channel = req.body.channel || "other";

    let result = heuristicScam(text);
    try {
      result = await aiFetch<typeof result>("/ai/scam", {
        method: "POST",
        body: JSON.stringify({ text, channel }),
      });
    } catch {
      // heuristic fallback
    }

    const saved = await ScamAnalysis.create({
      userId: req.user!.id,
      text,
      channel,
      label: result.label,
      confidence: result.confidence,
      reasons: result.reasons,
    });

    res.json({ analysis: saved });
  } catch (e) {
    next(e);
  }
});

router.get("/history", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const items = await ScamAnalysis.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(30);
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

export default router;
