import express from "express";
import { pingDb } from "./mongo.js";
import { chatRouter } from "./routes/chat.js";

const PORT = Number(process.env.PORT || 4003);
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.get("/health", async (_req, res) => {
    try {
        await pingDb();
        res.json({ status: "ok", service: "recommendation-service", db: "up" });
    } catch {
        res
      .status(503)
      .json({
        status: "degraded",
        service: "recommendation-service",
        db: "down",
    });
}
});

app.use("/api/chat", chatRouter);
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`[recommendation-service] listening on :${PORT}`);
});
