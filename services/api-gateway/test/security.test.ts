import type { NextFunction, Request, Response } from "express";
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildRoutes } from "../src/routes.js";
import { DEFAULT_ALLOWED, originCheck } from "../src/security.js";

const ALLOWED = ["http://localhost:3000"];

type FakeRequest = Pick<Request, "method" | "headers">;

interface FakeResponse {
  statusCode: number | null;
  body: unknown;
  status(code: number): FakeResponse;
  json(payload: unknown): FakeResponse;
}

function fakeReq(method: string, origin?: string): FakeRequest {
  return {
    method,
    headers: (origin ? { origin } : {}) as Request["headers"],
  };
}

function fakeRes(): FakeResponse {
  return {
    statusCode: null,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
}

function run(
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  req: FakeRequest,
) {
  const res = fakeRes();
  let nextCalled = false;
  middleware(req as Request, res as unknown as Response, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
}

test("originCheck allows GET regardless of Origin", () => {
  const mw = originCheck(ALLOWED);
  const { nextCalled, res } = run(mw, fakeReq("GET", "https://evil.example"));
  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
});

test("originCheck allows POST without an Origin header", () => {
  const mw = originCheck(ALLOWED);
  const { nextCalled, res } = run(mw, fakeReq("POST"));
  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
});

test("originCheck allows POST from an allowed Origin", () => {
  const mw = originCheck(ALLOWED);
  const { nextCalled } = run(mw, fakeReq("POST", "http://localhost:3000"));
  assert.equal(nextCalled, true);
});

test("originCheck rejects POST from a foreign Origin with 403", () => {
  const mw = originCheck(ALLOWED);
  const { nextCalled, res } = run(mw, fakeReq("POST", "https://evil.example"));
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "Origin not allowed" });
});

test("originCheck rejects PUT/PATCH/DELETE from a foreign Origin", () => {
  const mw = originCheck(ALLOWED);
  for (const method of ["PUT", "PATCH", "DELETE"]) {
    const { nextCalled, res } = run(
      mw,
      fakeReq(method, "https://evil.example"),
    );
    assert.equal(nextCalled, false, method);
    assert.equal(res.statusCode, 403, method);
  }
});

test("DEFAULT_ALLOWED falls back to the local frontend origin", () => {
  assert.ok(Array.isArray(DEFAULT_ALLOWED));
  if (!process.env.FRONTEND_ORIGIN) {
    assert.deepEqual(DEFAULT_ALLOWED, ["http://localhost:3000"]);
  }
});

test("buildRoutes returns default targets and path filters", () => {
  const routes = buildRoutes();
  assert.equal(routes.length, 6);

  const byName = Object.fromEntries(routes.map((r) => [r.name, r]));

  assert.deepEqual(byName["auth-service"].pathFilter, ["/api/auth"]);
  assert.equal(byName["auth-service"].target, "http://localhost:4001");

  assert.deepEqual(byName["menu-service"].pathFilter, [
    "/api/categories",
    "/api/menu_items",
    "/api/restaurants",
    "/api/public",
    "/api/nutrition",
  ]);
  assert.equal(byName["menu-service"].target, "http://localhost:4002");

  assert.deepEqual(byName["recommendation-service"].pathFilter, ["/api/chat"]);
  assert.equal(
    byName["recommendation-service"].target,
    "http://localhost:4003",
  );

  assert.deepEqual(byName["analytics-service"].pathFilter, ["/api/analytics"]);
  assert.equal(byName["analytics-service"].target, "http://localhost:4004");

  assert.deepEqual(byName["notification-service"].pathFilter, [
    "/api/notifications",
  ]);
  assert.equal(byName["notification-service"].target, "http://localhost:4005");

  assert.deepEqual(byName["media-service"].pathFilter, ["/api/cloudinary"]);
  assert.equal(byName["media-service"].target, "http://localhost:4006");
});

test("buildRoutes reads targets from the environment", () => {
  const prev = process.env.AUTH_SERVICE_URL;
  process.env.AUTH_SERVICE_URL = "http://auth-service:4001";
  try {
    const routes = buildRoutes();
    const auth = routes.find((r) => r.name === "auth-service");
    assert.equal(auth?.target, "http://auth-service:4001");
  } finally {
    if (prev === undefined) delete process.env.AUTH_SERVICE_URL;
    else process.env.AUTH_SERVICE_URL = prev;
  }
});
