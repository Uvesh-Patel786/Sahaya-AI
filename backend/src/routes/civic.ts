import { Router } from "express";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { requireAuth, requireAdmin, type AuthedRequest } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { CivicReport } from "../models/CivicReport.js";
import { config } from "../config.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";

const router = Router();

router.post("/reports", requireAuth, upload.single("photo"), async (req: AuthedRequest, res, next) => {
  try {
    if (!req.file) throw new AppError("photo required", 400);
    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) throw new AppError("lat and lng required", 400);

    const description = String(req.body.description || "");
    let issueType = "civic_issue";
    let severity: "low" | "medium" | "high" | "critical" = "medium";
    let department = "Municipal Corporation";
    let aiComplaintText = description || "Citizen civic issue report";
    let confidence = 0.6;

    try {
      const buf = fs.readFileSync(req.file.path);
      const form = new FormData();
      form.append("file", new Blob([new Uint8Array(buf)]), path.basename(req.file.path));
      form.append("description", description);
      form.append("lat", String(lat));
      form.append("lng", String(lng));
      const aiRes = await fetch(`${config.aiServiceUrl}/ai/vision/civic`, {
        method: "POST",
        body: form,
      });
      if (aiRes.ok) {
        const ai = (await aiRes.json()) as {
          issueType: string;
          severity: typeof severity;
          department: string;
          complaintText: string;
          confidence: number;
        };
        issueType = ai.issueType;
        severity = ai.severity;
        department = ai.department;
        aiComplaintText = ai.complaintText;
        confidence = ai.confidence;
      }
    } catch {
      // heuristic defaults
    }

    const trackingId = `SYK-${uuid().slice(0, 8).toUpperCase()}`;
    const report = await CivicReport.create({
      userId: req.user!.id,
      issueType,
      severity,
      department,
      description,
      aiComplaintText,
      photoPath: req.file.path,
      location: { type: "Point", coordinates: [lng, lat] },
      trackingId,
      confidence,
    });

    res.status(201).json({ report });
  } catch (e) {
    next(e);
  }
});

router.get("/reports", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const reports = await CivicReport.find({ userId: req.user!.id }).sort({ createdAt: -1 });
    res.json({ reports });
  } catch (e) {
    next(e);
  }
});

router.get("/reports/:id", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const report = await CivicReport.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json({ report });
  } catch (e) {
    next(e);
  }
});

const statusSchema = z.object({
  status: z.enum(["submitted", "acknowledged", "in_progress", "resolved"]),
});

router.patch(
  "/reports/:id/status",
  requireAuth,
  requireAdmin,
  validateBody(statusSchema),
  async (req, res, next) => {
    try {
      const report = await CivicReport.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
      );
      if (!report) return res.status(404).json({ error: "Report not found" });
      res.json({ report });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
