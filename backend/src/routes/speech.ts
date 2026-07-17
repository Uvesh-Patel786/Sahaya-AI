import { Router } from "express";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { validateBody } from "../middleware/validate.js";
import { config } from "../config.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();

router.post("/stt", requireAuth, upload.single("audio"), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError("audio required", 400);
    const language = String(req.body.language || "en");
    const buf = fs.readFileSync(req.file.path);
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(buf)]), path.basename(req.file.path));
    form.append("language", language);
    const aiRes = await fetch(`${config.aiServiceUrl}/ai/speech/stt`, { method: "POST", body: form });
    if (!aiRes.ok) throw new AppError("Speech recognition failed", 502);
    const data = await aiRes.json();
    res.json(data);
  } catch (e) {
    next(e);
  }
});

const ttsSchema = z.object({
  text: z.string().min(1).max(2000),
  language: z.enum(["en", "hi", "gu"]).optional(),
});

router.post("/tts", requireAuth, validateBody(ttsSchema), async (req, res, next) => {
  try {
    const aiRes = await fetch(`${config.aiServiceUrl}/ai/speech/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: req.body.text,
        language: req.body.language || "en",
      }),
    });
    if (!aiRes.ok) throw new AppError("TTS failed", 502);
    const contentType = aiRes.headers.get("content-type") || "application/json";
    if (contentType.includes("audio")) {
      const buf = Buffer.from(await aiRes.arrayBuffer());
      res.setHeader("Content-Type", contentType);
      return res.send(buf);
    }
    res.json(await aiRes.json());
  } catch (e) {
    next(e);
  }
});

export default router;
