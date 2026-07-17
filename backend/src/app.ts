import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import twinRoutes from "./routes/twin.js";
import chatRoutes from "./routes/chat.js";
import schemeRoutes from "./routes/schemes.js";
import documentRoutes from "./routes/documents.js";
import civicRoutes from "./routes/civic.js";
import scamRoutes from "./routes/scam.js";
import lifeEventRoutes from "./routes/lifeEvents.js";
import roadmapRoutes from "./routes/roadmaps.js";
import opportunityRoutes from "./routes/opportunities.js";
import deadlineRoutes from "./routes/deadlines.js";
import speechRoutes from "./routes/speech.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(
    rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/health", (_req, res) => res.json({ ok: true, service: "sahayak-backend" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/twin", twinRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/schemes", schemeRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/civic", civicRoutes);
  app.use("/api/scam", scamRoutes);
  app.use("/api/life-events", lifeEventRoutes);
  app.use("/api/roadmaps", roadmapRoutes);
  app.use("/api/opportunities", opportunityRoutes);
  app.use("/api/deadlines", deadlineRoutes);
  app.use("/api/speech", speechRoutes);

  app.use(errorHandler);
  return app;
}
