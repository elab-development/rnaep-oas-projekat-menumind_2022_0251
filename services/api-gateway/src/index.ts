import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createProxyMiddleware } from "http-proxy-middleware";
import { setupMetrics } from "./lib/metrics.js";
import { buildRoutes } from "./routes.js";
import { DEFAULT_ALLOWED, originCheck } from "./security.js";

const PORT = Number(process.env.PORT || 8080);
const app = express();
app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"] } },
    crossOriginResourcePolicy: { policy: "same-site" },
    frameguard: { action: "deny" },
  }),
);

app.use(
  cors({
    origin: DEFAULT_ALLOWED,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(
  rateLimit({
    windowMs: 60_000,
    limit: Number(process.env.RATE_LIMIT_PER_MINUTE || 300),
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(originCheck(DEFAULT_ALLOWED));
setupMetrics(app, "api-gateway");

const routes = buildRoutes();

app.get("/health", async (_req, res) => {
  const checks = await Promise.allSettled(
    routes.map((route) =>
      fetch(`${route.target}/health`, { signal: AbortSignal.timeout(2000) }),
    ),
  );
  const services: Record<string, string> = {};
  routes.forEach((route, i) => {
    const check = checks[i];
    services[route.name] =
      check.status === "fulfilled" && check.value.ok ? "up" : "down";
  });
  res.json({ status: "ok", service: "api-gateway", services });
});

for (const route of routes) {
  app.use(
    createProxyMiddleware({
      pathFilter: route.pathFilter,
      target: route.target,
      changeOrigin: true,
      proxyTimeout: 120000,
    }),
  );
}

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`[api-gateway] listening on :${PORT}`);
});
