import express from "express";
import { sql } from "./db.js";

const PORT = Number(process.env.PORT || 4002);
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.get("/health", async (_req, res) => {
  try {
    await sql`SELECT 1`;
    res.json({ status: "ok", service: "menu-service", db: "up" });
  } catch {
    res
      .status(503)
      .json({ status: "degraded", service: "menu-service", db: "down" });
  }
});

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`[menu-service] listening on :${PORT}`);
});
