import assert from "node:assert/strict";
import { test } from "node:test";
import { convertFromEur } from "../src/convert.js";

test("convertFromEur multiplies by the rate and rounds to 2 decimals", () => {
  assert.equal(convertFromEur(10, "USD", { USD: 1.0876 }), 10.88);
  assert.equal(convertFromEur(12.5, "RSD", { RSD: 117.19 }), 1464.88);
  assert.equal(convertFromEur(0, "USD", { USD: 1.1 }), 0);
});

test("convertFromEur returns null when the currency is missing from rates", () => {
  assert.equal(convertFromEur(10, "USD", {}), null);
  assert.equal(convertFromEur(10, "USD", { GBP: 0.85 }), null);
  assert.equal(convertFromEur(10, "USD", null), null);
  assert.equal(convertFromEur(10, "USD", undefined), null);
});

test("convertFromEur rejects non-numeric rates", () => {
  assert.equal(convertFromEur(10, "USD", { USD: "1.1" }), null);
  assert.equal(convertFromEur(10, "USD", { USD: NaN }), null);
  assert.equal(convertFromEur(10, "USD", { USD: Infinity }), null);
});

test("convertFromEur rejects non-numeric amounts", () => {
  assert.equal(convertFromEur(null, "USD", { USD: 1.1 }), null);
  assert.equal(convertFromEur(undefined, "USD", { USD: 1.1 }), null);
  assert.equal(convertFromEur("10", "USD", { USD: 1.1 }), null);
  assert.equal(convertFromEur(NaN, "USD", { USD: 1.1 }), null);
});
