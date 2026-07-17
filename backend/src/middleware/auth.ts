import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export interface AuthUser {
  id: string;
  role: "citizen" | "admin";
  email: string;
}

export interface AuthedRequest extends Request {
  user?: AuthUser;
}

export function signAccessToken(payload: AuthUser): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtAccessExpires } as jwt.SignOptions);
}

export function signRefreshToken(payload: AuthUser): string {
  return jwt.sign({ ...payload, type: "refresh" }, config.jwtSecret, {
    expiresIn: config.jwtRefreshExpires,
  } as jwt.SignOptions);
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(header.slice(7), config.jwtSecret) as AuthUser & { type?: string };
    if (decoded.type === "refresh") {
      return res.status(401).json({ error: "Invalid token type" });
    }
    req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}
