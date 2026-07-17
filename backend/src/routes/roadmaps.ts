import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { DigitalTwin } from "../models/DigitalTwin.js";
import { aiFetch } from "../services/aiClient.js";

const router = Router();

const roadmapSchema = z.object({
  goal: z.string().min(3).max(200),
  context: z.string().max(2000).optional(),
});

router.post("/generate", requireAuth, validateBody(roadmapSchema), async (req: AuthedRequest, res, next) => {
  try {
    const twin = await DigitalTwin.findOne({ userId: req.user!.id });
    try {
      const roadmap = await aiFetch<{
        goal: string;
        phases: Array<{ name: string; duration: string; actions: string[] }>;
        documents: string[];
        risks: string[];
      }>("/ai/roadmap", {
        method: "POST",
        body: JSON.stringify({ goal: req.body.goal, context: req.body.context, twin }),
      });
      return res.json({ roadmap });
    } catch {
      res.json({
        roadmap: {
          goal: req.body.goal,
          phases: [
            {
              name: "Prepare",
              duration: "1–2 weeks",
              actions: [
                "Clarify eligibility and official portal",
                "Gather Aadhaar, PAN, address, income proofs",
                "Create Digital Twin categories for better matches",
              ],
            },
            {
              name: "Apply",
              duration: "2–6 weeks",
              actions: [
                "Complete application on the official website only",
                "Track acknowledgment / application ID",
                "Set Deadline Guardian reminders",
              ],
            },
            {
              name: "Follow through",
              duration: "ongoing",
              actions: [
                "Respond to official queries promptly",
                "Keep Document Vault updated",
                "Review related schemes via Scheme Finder",
              ],
            },
          ],
          documents: ["Aadhaar", "PAN", "Address proof", "Recent photograph"],
          risks: ["Avoid third-party agents demanding OTP or advance fees"],
        },
      });
    }
  } catch (e) {
    next(e);
  }
});

export default router;
