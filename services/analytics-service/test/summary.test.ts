import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSummary } from "../src/summarize.js";

const countsDocs = [
  { restaurantId: "r1", eventType: "menu-viewed", count: 12 },
  { restaurantId: "r1", eventType: "menu-item-created", count: 4 },
  { restaurantId: "r1", eventType: "recommendation-generated", count: 3 },
  { restaurantId: "r1", eventType: "notification-sent", count: 2 },
  { restaurantId: "global", eventType: "user-created", count: 7 },
];

test("buildSummary maps event types onto named counters", () => {
  const { counts } = buildSummary(countsDocs, null, null, null);
  assert.deepEqual(counts, {
    menuViews: 12,
    itemsCreated: 4,
    recommendations: 3,
    notificationsSent: 2,
    usersCreated: 7,
  });
});

test("buildSummary defaults missing counters to zero and ignores unknown types", () => {
  const { counts } = buildSummary(
    [{ restaurantId: "r1", eventType: "something-else", count: 99 }],
    null,
    null,
    null,
  );
  assert.deepEqual(counts, {
    menuViews: 0,
    itemsCreated: 0,
    recommendations: 0,
    notificationsSent: 0,
    usersCreated: 0,
  });
});

test("buildSummary tolerates missing docs and malformed counts", () => {
  assert.deepEqual(buildSummary(null, null, null, null).counts, {
    menuViews: 0,
    itemsCreated: 0,
    recommendations: 0,
    notificationsSent: 0,
    usersCreated: 0,
  });
  const { counts } = buildSummary(
    [{ restaurantId: "r1", eventType: "menu-viewed", count: "oops" }],
    null,
    null,
    null,
  );
  assert.equal(counts.menuViews, 0);
});

test("buildSummary computes the EUR average price", () => {
  const { avgItemPrice } = buildSummary(
    [],
    { _id: "r1", itemCount: 4, priceSum: 50 },
    null,
    null,
  );
  assert.deepEqual(avgItemPrice, { eur: 12.5, currency: "EUR", value: 12.5 });
});

test("buildSummary returns a null average when there are no items", () => {
  const { avgItemPrice } = buildSummary([], null, null, null);
  assert.deepEqual(avgItemPrice, { eur: null, currency: "EUR", value: null });
});

test("buildSummary treats an explicit EUR request as no conversion", () => {
  const { avgItemPrice } = buildSummary(
    [],
    { _id: "r1", itemCount: 2, priceSum: 20 },
    "EUR",
    null,
  );
  assert.deepEqual(avgItemPrice, { eur: 10, currency: "EUR", value: 10 });
});

test("buildSummary converts to the requested currency with the given rate", () => {
  const { avgItemPrice } = buildSummary(
    [],
    { _id: "r1", itemCount: 2, priceSum: 20 },
    "USD",
    1.1,
  );
  assert.deepEqual(avgItemPrice, { eur: 10, currency: "USD", value: 11 });
});

test("buildSummary reports a null value when the rate is unavailable", () => {
  const { avgItemPrice } = buildSummary(
    [],
    { _id: "r1", itemCount: 2, priceSum: 20 },
    "USD",
    null,
  );
  assert.deepEqual(avgItemPrice, { eur: 10, currency: "USD", value: null });
});
