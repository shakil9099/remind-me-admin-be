import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config.js";

export type AdminTokenPayload = {
  sub: "admin";
  username: string;
  mustChangePassword: boolean;
};

export type AuthenticatedRequest = Request & {
  admin?: AdminTokenPayload;
};

export function createAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "8h" });
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ message: "Missing authorization token" });
    return;
  }

  try {
    req.admin = jwt.verify(token, config.jwtSecret) as AdminTokenPayload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
