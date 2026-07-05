import type { NextFunction, Request, Response } from "express";

export const DEFAULT_ALLOWED = (
  process.env.FRONTEND_ORIGIN || "http://localhost:3000"
).split(",");

const STATE_CHANGING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function originCheck(allowedOrigins: string[] = DEFAULT_ALLOWED) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!STATE_CHANGING.has(req.method)) return next();
    const origin = req.headers.origin;
    if (!origin) return next();
    if (allowedOrigins.includes(origin)) return next();
    return res.status(403).json({ error: "Origin not allowed" });
  };
}
