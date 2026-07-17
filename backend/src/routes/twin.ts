import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { DigitalTwin } from "../models/DigitalTwin.js";
import { Scheme } from "../models/Scheme.js";
import { Opportunity } from "../models/Opportunity.js";
import { Deadline } from "../models/Deadline.js";
import { DocumentModel } from "../models/Document.js";

const router = Router();

const twinSchema = z.object({
  age: z.number().int().min(1).max(120).optional(),
  gender: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  education: z.string().optional(),
  occupation: z.string().optional(),
  incomeBand: z.string().optional(),
  categories: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  preferences: z
    .object({
      notifications: z.boolean().optional(),
      voiceEnabled: z.boolean().optional(),
    })
    .optional(),
});

router.get("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const twin = await DigitalTwin.findOne({ userId: req.user!.id });
    res.json({ twin });
  } catch (e) {
    next(e);
  }
});

router.put("/", requireAuth, validateBody(twinSchema), async (req: AuthedRequest, res, next) => {
  try {
    const twin = await DigitalTwin.findOneAndUpdate(
      { userId: req.user!.id },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ twin });
  } catch (e) {
    next(e);
  }
});

router.get("/recommendations", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const twin = await DigitalTwin.findOne({ userId: req.user!.id });
    const categories = twin?.categories || [];
    const state = twin?.state;

    const schemeFilter: Record<string, unknown> = { active: true };
    if (categories.length) schemeFilter.targetGroups = { $in: categories };
    if (state) schemeFilter.$or = [{ states: "ALL" }, { states: state }];

    const schemes = await Scheme.find(schemeFilter).limit(8);
    const opportunities = await Opportunity.find({
      active: true,
      ...(categories.length ? { targetGroups: { $in: categories } } : {}),
    }).limit(8);

    const deadlines = await Deadline.find({
      userId: req.user!.id,
      status: { $in: ["upcoming", "due_soon", "overdue"] },
    })
      .sort({ dueDate: 1 })
      .limit(10);

    const expiringDocs = await DocumentModel.find({
      userId: req.user!.id,
      expiryDate: { $ne: null, $lte: new Date(Date.now() + 90 * 86400000) },
    }).limit(5);

    res.json({
      twin,
      schemes,
      opportunities,
      deadlines,
      expiringDocuments: expiringDocs,
      insights: [
        categories.length
          ? `Based on your profile (${categories.join(", ")}), here are tailored recommendations.`
          : "Complete your Digital Twin for more accurate recommendations.",
      ],
    });
  } catch (e) {
    next(e);
  }
});

export default router;
