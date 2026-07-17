import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { ChatSession } from "../models/ChatSession.js";
import { DigitalTwin } from "../models/DigitalTwin.js";
import { aiFetch } from "../services/aiClient.js";
import { sanitizeUserText, redactedLog } from "../utils/safety.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1).max(8000),
  language: z.enum(["en", "hi", "gu"]).optional(),
  sessionId: z.string().optional(),
});

router.post("/", requireAuth, validateBody(chatSchema), async (req: AuthedRequest, res, next) => {
  try {
    let message: string;
    try {
      message = sanitizeUserText(req.body.message);
    } catch (e) {
      throw new AppError((e as Error).message, 400);
    }

    const language = req.body.language || "en";
    let session = req.body.sessionId
      ? await ChatSession.findOne({ _id: req.body.sessionId, userId: req.user!.id })
      : null;

    if (!session) {
      session = await ChatSession.create({
        userId: req.user!.id,
        language,
        title: message.slice(0, 60),
        messages: [],
      });
    }

    session.messages.push({ role: "user", content: message, sources: [], createdAt: new Date() });
    const twin = await DigitalTwin.findOne({ userId: req.user!.id });

    console.log("chat", redactedLog(message.slice(0, 120)));

    const ai = await aiFetch<{
      reply: string;
      sources: Array<{ title: string; source: string; url?: string }>;
    }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        language,
        twin: twin
          ? {
              age: twin.age,
              state: twin.state,
              occupation: twin.occupation,
              categories: twin.categories,
              education: twin.education,
            }
          : null,
        history: session.messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    session.messages.push({
      role: "assistant",
      content: ai.reply,
      sources: ai.sources || [],
      createdAt: new Date(),
    });
    await session.save();

    res.json({
      sessionId: session._id,
      reply: ai.reply,
      sources: ai.sources || [],
    });
  } catch (e) {
    next(e);
  }
});

router.get("/sessions", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user!.id })
      .select("title language createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json({ sessions });
  } catch (e) {
    next(e);
  }
});

router.get("/sessions/:id", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json({ session });
  } catch (e) {
    next(e);
  }
});

export default router;
