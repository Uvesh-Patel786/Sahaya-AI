import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.BACKEND_PORT || 4000),
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/sahayak",
  jwtSecret: process.env.JWT_SECRET || "dev-insecure-secret-change-me",
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://localhost:8000",
  uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, "../../uploads"),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 10),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 200),
};
