import type { NextFunction, Request, Response } from "express";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4001";

export interface SessionUser {
  restaurantId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export async function requireRestaurantAdmin(req: Request, res: Response, next: NextFunction) {
  let session: { user?: SessionUser } | null;
  try {
    const r = await fetch(`${AUTH_SERVICE_URL}/api/auth/get-session`, {
      headers: { cookie: req.headers.cookie ?? "" },
    });
    if (!r.ok) throw new Error(`auth-service responded ${r.status}`);
    session = (await r.json()) as { user?: SessionUser } | null;
  } catch {
    return res.status(503).json({ error: "Authentication service unavailable, try again shortly" });
  }

  if (!session?.user?.restaurantId || session.user.role !== "RESTAURANT_ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = session.user;
  next();
}

export function wrap(handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch((err: Error) => {
      console.error(`[http] ${req.method} ${req.originalUrl}: ${err.message}`);
      if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
    });
  };
}
