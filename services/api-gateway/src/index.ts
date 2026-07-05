import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { buildRoutes } from "./routes.js";

const PORT = Number(process.env.PORT || 8080);
const app = express();
app.disable("x-powered-by");

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
