import express from "express";
import { ping } from "./mongo.js";
import { internalRouter, notificationsRouter } from "./routes/notifications.js";

const PORT = Number(process.env.PORT || 4005);
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.get("/health", async (_req, res) => {
  try {
    await ping();
    res.json({ status: "ok", service: "notification-service", db: "up" });
  } catch {
    res.status(503).json({
      status: "degraded",
      service: "notification-service",
      db: "down",
    });
  }
});

app.use("/api/notifications/internal", internalRouter);
app.use("/api/notifications", notificationsRouter);

app.use("/api/notifications", notificationsRouter);
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`[notification-service] listening on :${PORT}`);
});
