import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { Deadline } from "../models/Deadline.js";

const router = Router();

function refreshStatus(due: Date): "upcoming" | "due_soon" | "overdue" | "done" {
  const now = Date.now();
  const t = due.getTime();
  if (t < now) return "overdue";
  if (t - now < 14 * 86400000) return "due_soon";
  return "upcoming";
}

const createSchema = z.object({
  title: z.string().min(2).max(200),
  type: z.enum(["document_expiry", "scholarship", "subsidy", "licence", "custom"]).optional(),
  dueDate: z.string().datetime().or(z.string().min(8)),
  relatedDocumentId: z.string().optional(),
  relatedSchemeId: z.string().optional(),
});

router.get("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const items = await Deadline.find({ userId: req.user!.id }).sort({ dueDate: 1 });
    for (const item of items) {
      if (item.status !== "done") {
        item.status = refreshStatus(item.dueDate);
        await item.save();
      }
    }
    res.json({ deadlines: items });
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, validateBody(createSchema), async (req: AuthedRequest, res, next) => {
  try {
    const dueDate = new Date(req.body.dueDate);
    const deadline = await Deadline.create({
      userId: req.user!.id,
      title: req.body.title,
      type: req.body.type || "custom",
      dueDate,
      relatedDocumentId: req.body.relatedDocumentId,
      relatedSchemeId: req.body.relatedSchemeId,
      status: refreshStatus(dueDate),
    });
    res.status(201).json({ deadline });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const deadline = await Deadline.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!deadline) return res.status(404).json({ error: "Not found" });
    if (req.body.title) deadline.title = req.body.title;
    if (req.body.status) deadline.status = req.body.status;
    if (req.body.dueDate) {
      deadline.dueDate = new Date(req.body.dueDate);
      if (deadline.status !== "done") deadline.status = refreshStatus(deadline.dueDate);
    }
    await deadline.save();
    res.json({ deadline });
  } catch (e) {
    next(e);
  }
});

export default router;
