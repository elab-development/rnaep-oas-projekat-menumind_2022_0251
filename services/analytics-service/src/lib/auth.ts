import type { NextFunction, Request, RequestHandler, Response } from "express";
import CircuitBreaker from "opossum";
import { trackBreaker } from "./metrics.js";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:4001";

export interface SessionUser {
  restaurantId: string;
  role: string;
  [key: string]: unknown;
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

interface SessionResponse {
  user?: SessionUser;
}

async function fetchSession(
  cookie: string,
): Promise<SessionResponse | null> {
  const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/get-session`, {
    headers: { cookie },
  });
  if (!res.ok) throw new Error(`auth-service responded ${res.status}`);
  return res.json() as Promise<SessionResponse | null>; // null when there is no session
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
) {
  let session: SessionResponse | null;
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

// Express router.param guard: malformed UUIDs answer 404 instead of hitting
// Postgres and turning into a 500.
export function uuidParam(
  req: Request,
  res: Response,
  next: NextFunction,
  value: string,
) {
  if (!UUID_RE.test(value)) {
    return res.status(404).json({ error: "Not found" });
  }
  next();
}

// Wraps async route handlers so rejections become 500s instead of hanging.
export function wrap(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch((err: Error) => {
      console.error(`[http] ${req.method} ${req.originalUrl}: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    });
  };
}
