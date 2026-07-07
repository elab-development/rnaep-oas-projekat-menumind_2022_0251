import express from "express";
import { startConsumer } from "./consumer.js";
import { setupMetrics } from "./lib/metrics.js";
import { ping } from "./mongo.js";
import { analyticsRouter } from "./routes/analytics.js";

const PORT = Number(process.env.PORT || 4004);
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

setupMetrics(app, "analytics-service");

app.get("/health", async (_req, res) => {
  try {
    await ping();
    res.json({ status: "ok", service: "analytics-service", db: "up" });
  } catch {
    res
      .status(503)
      .json({ status: "degraded", service: "analytics-service", db: "down" });
  }
});

app.use("/api/analytics", analyticsRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

startConsumer().catch((err: Error) => {
  console.error(`[kafka] consumer failed to start: ${err.message}`);
});

app.listen(PORT, () => {
  console.log(`[analytics-service] listening on :${PORT}`);
});
