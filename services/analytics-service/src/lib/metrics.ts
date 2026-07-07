// Prometheus instrumentation shared (by copy) across MenuMind services.
import type { Express } from "express";
import client from "prom-client";
import type CircuitBreaker from "opossum";

export function setupMetrics(app: Express, serviceName: string) {
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

// Gauge tracking opossum circuit breaker state (0 = closed, 1 = half-open, 2 = open).
export function trackBreaker(
  breaker: CircuitBreaker<unknown[], unknown>,
  name: string,
) {
  const gauge =
    client.register.getSingleMetric("circuit_breaker_state") ??
    new client.Gauge({
      name: "circuit_breaker_state",
      help: "Circuit breaker state (0=closed, 1=half-open, 2=open)",
      labelNames: ["breaker"],
    });
  const g = gauge as client.Gauge<string>;
  g.set({ breaker: name }, 0);
  breaker.on("open", () => {
    g.set({ breaker: name }, 2);
    console.warn(`[breaker:${name}] OPEN`);
  });
  breaker.on("halfOpen", () => {
    g.set({ breaker: name }, 1);
    console.warn(`[breaker:${name}] HALF-OPEN`);
  });
  breaker.on("close", () => {
    g.set({ breaker: name }, 0);
    console.log(`[breaker:${name}] CLOSED`);
  });
}
