import assert from "node:assert/strict";
import { test } from "node:test";
import { buildRecommendationNotification } from "../src/messages.js";

test("builds a recommendation notification with fallback text", () => {
  const n = buildRecommendationNotification({
    itemName: "Pizza",
    restaurantId: "r1",
  });
  assert.equal(n.type, "recommendation");
  assert.match(n.message, /Pizza/);
  assert.equal(n.restaurantId, "r1");
});

test("falls back to 'unknown item' when itemName missing", () => {
  const n = buildRecommendationNotification({});
  assert.match(n.message, /unknown item/);
});
