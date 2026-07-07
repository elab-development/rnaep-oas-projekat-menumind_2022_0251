import type { NextFunction, Request, RequestHandler, Response } from "express";
import CircuitBreaker from "opossum";
import { trackBreaker } from "./metrics.js";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:4001";

export interface SessionUser {
  restaurantId?: string;
  role: string;
  [key: string]: unknown;
}

export interface Session {
  user: SessionUser;
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

async function fetchSession(cookie: string): Promise<Session | null> {
  const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/get-session`, {
    headers: { cookie },
  });
  if (!res.ok) throw new Error(`auth-service responded ${res.status}`);
  return (await res.json()) as Session | null;
}

export const sessionBreaker = new CircuitBreaker(fetchSession, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
});
trackBreaker(sessionBreaker, "auth-session");

export async function requireRestaurantAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> {
  let session: Session | null;
  try {
    session = await sessionBreaker.fire(req.headers.cookie ?? "");
  } catch {
    return res
      .status(503)
      .json({ error: "Authentication service unavailable, try again shortly" });
  }

  if (
    !session?.user?.restaurantId ||
    session.user.role !== "RESTAURANT_ADMIN"
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = session.user;
  next();
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function uuidParam(
  req: Request,
  res: Response,
  next: NextFunction,
  value: string,
): void | Response {
  if (!UUID_RE.test(value)) {
    return res.status(404).json({ error: "Not found" });
  }
  next();
}

export function wrap(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[http] ${req.method} ${req.originalUrl}: ${message}`);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    });
  };
}
