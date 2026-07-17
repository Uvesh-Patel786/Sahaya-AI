import { Router } from "express";
import fs from "fs";
import path from "path";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { DocumentModel } from "../models/Document.js";
import { Deadline } from "../models/Deadline.js";
import { config } from "../config.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();

async function postAiFile(
  aiPath: string,
  filePath: string,
  fields: Record<string, string> = {}
) {
  const buf = fs.readFileSync(filePath);
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buf)]), path.basename(filePath));
  for (const [k, v] of Object.entries(fields)) form.append(k, v);

  const res = await fetch(`${config.aiServiceUrl}${aiPath}`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

router.get("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const docs = await DocumentModel.find({ userId: req.user!.id }).sort({ createdAt: -1 });
    res.json({ documents: docs });
  } catch (e) {
    next(e);
  }
});

router.post("/upload", requireAuth, upload.single("file"), async (req: AuthedRequest, res, next) => {
  try {
    if (!req.file) throw new AppError("File required", 400);
    const category = String(req.body.type || "other");
    const allowed = ["aadhaar", "pan", "income", "residence", "caste", "passport", "letter", "other"];
    const doc = await DocumentModel.create({
      userId: req.user!.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storagePath: req.file.path,
      category: allowed.includes(category) ? category : "other",
    });
    res.status(201).json({ document: doc });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/analyze", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const doc = await DocumentModel.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!doc) return res.status(404).json({ error: "Document not found" });

    try {
      const result = (await postAiFile("/ai/documents/analyze", doc.storagePath, {
        hinted_category: doc.category,
      })) as {
        category: string;
        ocrText: string;
        extractedFields: Record<string, unknown>;
        summary: string;
        expiryDate?: string;
        missingHints?: string[];
      };

      doc.category = (result.category as typeof doc.category) || doc.category;
      doc.ocrText = result.ocrText || "";
      doc.extractedFields = result.extractedFields || {};
      doc.analysisSummary = result.summary || "";
      doc.status = "analyzed";
      if (result.expiryDate) {
        doc.expiryDate = new Date(result.expiryDate);
        await Deadline.create({
          userId: req.user!.id,
          title: `${doc.category.toUpperCase()} expiry — ${doc.originalName}`,
          type: "document_expiry",
          dueDate: doc.expiryDate,
          relatedDocumentId: doc._id,
          status: "upcoming",
        });
      }
      await doc.save();
      res.json({ document: doc, missingHints: result.missingHints || [] });
    } catch (aiErr) {
      doc.status = "error";
      doc.analysisSummary = "AI analysis unavailable. File stored securely in your vault.";
      await doc.save();
      res.json({ document: doc, warning: String(aiErr) });
    }
  } catch (e) {
    next(e);
  }
});

router.post(
  "/explain-letter",
  requireAuth,
  upload.single("file"),
  async (req: AuthedRequest, res, next) => {
    try {
      let storagePath = "";
      let documentId = req.body.documentId as string | undefined;

      if (req.file) {
        const doc = await DocumentModel.create({
          userId: req.user!.id,
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          storagePath: req.file.path,
          category: "letter",
        });
        storagePath = doc.storagePath;
        documentId = String(doc._id);
      } else if (documentId) {
        const doc = await DocumentModel.findOne({ _id: documentId, userId: req.user!.id });
        if (!doc) return res.status(404).json({ error: "Document not found" });
        storagePath = doc.storagePath;
      } else {
        throw new AppError("file or documentId required", 400);
      }

      const result = await postAiFile("/ai/documents/explain", storagePath);
      res.json({ documentId, explanation: result });
    } catch (e) {
      next(e);
    }
  }
);

router.delete("/:id", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const doc = await DocumentModel.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
    if (!doc) return res.status(404).json({ error: "Document not found" });
    if (fs.existsSync(doc.storagePath)) fs.unlinkSync(doc.storagePath);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
