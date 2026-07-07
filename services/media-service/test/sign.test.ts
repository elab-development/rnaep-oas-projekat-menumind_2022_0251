import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSignParams } from "../src/sign.js";

test("buildSignParams builds the restaurant upload folder", () => {
  const params = buildSignParams(
    "11111111-1111-4111-8111-111111111111",
    1700000000,
  );

  assert.deepEqual(params, {
    timestamp: 1700000000,
    folder: "restaurants/11111111-1111-4111-8111-111111111111",
  });
});

test("buildSignParams passes the timestamp through untouched", () => {
  const now = Math.round(Date.now() / 1000);
  const params = buildSignParams("abc", now);

  assert.equal(params.timestamp, now);
  assert.equal(params.folder, "restaurants/abc");
});

test("buildSignParams only exposes the two signed fields", () => {
  const params = buildSignParams("abc", 1);

  assert.deepEqual(Object.keys(params).sort(), ["folder", "timestamp"]);
});