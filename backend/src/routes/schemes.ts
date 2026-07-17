import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { Scheme } from "../models/Scheme.js";
import { DigitalTwin } from "../models/DigitalTwin.js";
import { aiFetch } from "../services/aiClient.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q || "");
    const category = String(req.query.category || "");
    const state = String(req.query.state || "");
    const filter: Record<string, unknown> = { active: true };
    if (category) filter.category = category;
    if (state) filter.$or = [{ states: "ALL" }, { states: state }];
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }
    const schemes = await Scheme.find(filter).limit(50);
    res.json({ schemes });
  } catch (e) {
    next(e);
  }
});

router.get("/recommend", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const twin = await DigitalTwin.findOne({ userId: req.user!.id });
    const schemes = await Scheme.find({ active: true }).limit(100);

    try {
      const ranked = await aiFetch<{
        matches: Array<{ schemeId: string; confidence: number; reason: string }>;
      }>("/ai/schemes/match", {
        method: "POST",
        body: JSON.stringify({ twin, schemes }),
      });

      const byId = new Map(schemes.map((s) => [String(s._id), s]));
      const results = ranked.matches
        .map((m) => {
          const scheme = byId.get(m.schemeId);
          if (!scheme) return null;
          return { scheme, confidence: m.confidence, reason: m.reason };
        })
        .filter(Boolean);

      return res.json({ recommendations: results });
    } catch {
      // Fallback heuristic if AI unavailable
      const categories = twin?.categories || [];
      const scored = schemes
        .map((s) => {
          const overlap = s.targetGroups.filter((g) => categories.includes(g)).length;
          const stateOk =
            !twin?.state || s.states.includes("ALL") || s.states.includes(twin.state);
          const confidence = Math.min(0.95, 0.35 + overlap * 0.2 + (stateOk ? 0.15 : 0));
          return {
            scheme: s,
            confidence,
            reason: overlap
              ? `Matches your profile groups: ${s.targetGroups.filter((g) => categories.includes(g)).join(", ")}`
              : "General citizen scheme in catalog",
          };
        })
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10);
      return res.json({ recommendations: scored });
    }
  } catch (e) {
    next(e);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const scheme = await Scheme.findById(req.params.id);
    if (!scheme) return res.status(404).json({ error: "Scheme not found" });
    res.json({ scheme });
  } catch (e) {
    next(e);
  }
});

export default router;
