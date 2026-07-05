import { toNodeHandler } from "better-auth/node";
import express, { Request, Response } from "express";
import { auth, pool } from "./auth.js";

const PORT = Number(process.env.PORT || 4001);
const app = express();
app.disable("x-powered-by");

app.get("/health", async (_req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "auth-service", db: "up" });
  } catch {
    res.status(503).json({ status: "degraded", service: "auth-service", db: "down" });
  }
});

app.all("/api/auth/*", toNodeHandler(auth));

app.listen(PORT, () => {
  console.log(`[auth-service] listening on :${PORT}`);
});
