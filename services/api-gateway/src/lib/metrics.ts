import type { Express } from "express";
import client from "prom-client";

export function setupMetrics(app: Express, serviceName: string): void {
  client.collectDefaultMetrics({ labels: { service: serviceName } });

  const httpRequestDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  });

  app.use((req, res, next) => {
    if (req.path === "/metrics" || req.path === "/health") return next();
    const end = httpRequestDuration.startTimer();
    res.on("finish", () => {
      const route = req.route?.path
        ? req.baseUrl + req.route.path
        : req.path.replace(/\/[0-9a-f-]{8,}/gi, "/:id");
      end({ method: req.method, route, status_code: res.statusCode });
    });
    next();
  });

  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  });
}
