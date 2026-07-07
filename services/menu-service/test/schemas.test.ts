import assert from "node:assert/strict";
import { test } from "node:test";
import { categorySchema, menuItemSchema, restaurantUpdateSchema } from "../src/schemas.js";

test("categorySchema rejects empty name", () => {
  const result = categorySchema.safeParse({ name: "", description: "x" });
  assert.equal(result.success, false);
});

test("menuItemSchema requires a valid categoryId (uuid)", () => {
  const result = menuItemSchema.safeParse({ name: "Pizza", categoryId: "not-a-uuid", price: 10 });
  assert.equal(result.success, false);
});

test("menuItemSchema accepts a valid payload", () => {
  const result = menuItemSchema.safeParse({
    name: "Pizza",
    categoryId: "22222222-2222-4222-8222-222222222222",
    price: 11.9,
  });
  assert.equal(result.success, true);
});

test("restaurantUpdateSchema rejects invalid slug characters", () => {
  const result = restaurantUpdateSchema.safeParse({ slug: "Not Valid Slug!" });
  assert.equal(result.success, false);
});
