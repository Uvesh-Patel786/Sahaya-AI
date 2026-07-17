import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { DigitalTwin } from "../models/DigitalTwin.js";
import { aiFetch } from "../services/aiClient.js";

const router = Router();

const planSchema = z.object({
  event: z.string().min(2).max(120),
  details: z.string().max(2000).optional(),
});

const FALLBACK_EVENTS: Record<string, string[]> = {
  marriage: [
    "Update name/status in Aadhaar & PAN if applicable",
    "Apply for marriage certificate from local registrar",
    "Review family health insurance / Ayushman eligibility",
    "Update bank KYC and nominee details",
    "Check housing / women-oriented welfare schemes in your state",
  ],
  childbirth: [
    "Register birth and obtain birth certificate",
    "Enroll infant in immunization schedule",
    "Explore maternity/newborn nutrition schemes (e.g., PMMVY where eligible)",
    "Update ration card / family records",
    "Secure child health card / insurance add-on",
  ],
  "start a business": [
    "Decide business structure (proprietorship/LLP/Pvt Ltd)",
    "Obtain Udyam / MSME registration if eligible",
    "Open current account and GST registration if needed",
    "Explore Startup India / state incubator grants",
    "Prepare DPIIT / bank documentation checklist",
  ],
  retirement: [
    "Verify pension / EPFO / NPS status",
    "Update healthcare coverage for seniors",
    "Review property tax and will/nomination",
    "Check senior citizen schemes and travel concessions",
  ],
};

router.post("/plan", requireAuth, validateBody(planSchema), async (req: AuthedRequest, res, next) => {
  try {
    const twin = await DigitalTwin.findOne({ userId: req.user!.id });
    try {
      const plan = await aiFetch<{
        title: string;
        summary: string;
        checklist: Array<{ step: string; documents?: string[]; priority: string }>;
        relatedBenefits: string[];
      }>("/ai/life-event", {
        method: "POST",
        body: JSON.stringify({ event: req.body.event, details: req.body.details, twin }),
      });
      return res.json({ plan });
    } catch {
      const key = Object.keys(FALLBACK_EVENTS).find((k) =>
        req.body.event.toLowerCase().includes(k)
      );
      const steps = FALLBACK_EVENTS[key || ""] || [
        "List required certificates for your life event",
        "Visit official state / MyGov portal for updates",
        "Collect identity, address, and income proofs",
        "Set reminders for application windows",
      ];
      res.json({
        plan: {
          title: `Plan: ${req.body.event}`,
          summary: "Personalized starter checklist (AI offline — using curated template).",
          checklist: steps.map((step, i) => ({
            step,
            priority: i < 2 ? "high" : "medium",
            documents: ["Aadhaar", "Address proof"],
          })),
          relatedBenefits: ["Check Scheme Finder for state-specific benefits"],
        },
      });
    }
  } catch (e) {
    next(e);
  }
});

export default router;
