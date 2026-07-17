import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { DigitalTwin } from "../models/DigitalTwin.js";
import { validateBody } from "../middleware/validate.js";
import {
  requireAuth,
  signAccessToken,
  signRefreshToken,
  type AuthedRequest,
  type AuthUser,
} from "../middleware/auth.js";
import { config } from "../config.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  language: z.enum(["en", "hi", "gu"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, language } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, language: language || "en" });
    await DigitalTwin.create({ userId: user._id, categories: [], interests: [] });

    const auth: AuthUser = { id: String(user._id), role: user.role, email: user.email };
    res.status(201).json({
      user: { id: auth.id, name: user.name, email: user.email, role: user.role, language: user.language },
      accessToken: signAccessToken(auth),
      refreshToken: signRefreshToken(auth),
    });
  } catch (e) {
    next(e);
  }
});

router.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const auth: AuthUser = { id: String(user._id), role: user.role, email: user.email };
    res.json({
      user: { id: auth.id, name: user.name, email: user.email, role: user.role, language: user.language },
      accessToken: signAccessToken(auth),
      refreshToken: signRefreshToken(auth),
    });
  } catch (e) {
    next(e);
  }
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });
  try {
    const decoded = jwt.verify(refreshToken, config.jwtSecret) as AuthUser & { type?: string };
    if (decoded.type !== "refresh") return res.status(401).json({ error: "Invalid refresh token" });
    const auth: AuthUser = { id: decoded.id, role: decoded.role, email: decoded.email };
    res.json({ accessToken: signAccessToken(auth) });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

router.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const user = await User.findById(req.user!.id).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

export default router;
