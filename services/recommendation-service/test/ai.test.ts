// Ported from the monolith's app/lib/ai.test.ts (buildSystemInstruction /
// buildMenuText intent) plus coverage for the heuristic fallbacks. Pure logic
// only — no network, DB or Kafka.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildMenuText,
  buildSystemInstruction,
  heuristicAnswer,
  heuristicSuggestion,
} from "../src/ai.js";

test("buildSystemInstruction includes restaurant context and guardrails", () => {
  const instruction = buildSystemInstruction("MenuMind Bistro");

  assert.ok(instruction.includes('restaurant "MenuMind Bistro"'));
  assert.ok(instruction.includes("Never invent dishes."));
  assert.ok(instruction.includes("Max 3 recommendations."));
});

test("buildMenuText formats items and applies fallbacks", () => {
  const text = buildMenuText([
    {
      id: "1",
      restaurantId: "r-1",
      categoryId: undefined,
      name: "Pasta",
      description: null,
      dietary: [],
      popular: false,
      price: "12.50",
      isAvailable: true,
    },
  ]);

  assert.ok(text.includes("Item: Pasta"));
  assert.ok(text.includes("Category: -"));
  assert.ok(text.includes("Description: -"));
  assert.ok(text.includes("Price: 12.50 EUR"));
  assert.ok(text.includes("Dietary: -"));
});

test("heuristicAnswer prefers popular available items and caps at 3", () => {
  const answer = heuristicAnswer(
    "Demo Bistro",
    [
      { name: "Plain Toast", price: "3.00", popular: false, isAvailable: true },
      { name: "Truffle Pizza", price: "14.90", popular: true, isAvailable: true },
      { name: "Sold-out Stew", price: "9.00", popular: false, isAvailable: false },
      { name: "House Burger", price: 11.5, popular: true, isAvailable: true },
      { name: "Caesar Salad", price: "8.20", popular: true, isAvailable: true },
    ],
    "What do you recommend?",
  );

  // The three popular+available items are mentioned with name and price…
  assert.ok(answer.includes("Truffle Pizza (14.90 EUR)"));
  assert.ok(answer.includes("House Burger (11.5 EUR)"));
  assert.ok(answer.includes("Caesar Salad (8.20 EUR)"));
  // …while the lower-ranked items are not (max 3 picks).
  assert.ok(!answer.includes("Plain Toast"));
  assert.ok(!answer.includes("Sold-out Stew"));
  assert.ok(answer.includes("Demo Bistro"));
});

test("heuristicAnswer always appends the offline note and handles empty menus", () => {
  const note = "(AI assistant is temporarily offline — these are our staff picks.)";

  const withItems = heuristicAnswer(
    "Demo Bistro",
    [{ name: "Pasta", price: "12.50" }],
    "anything vegan?",
  );
  assert.ok(withItems.endsWith(note));
  assert.ok(withItems.includes("Pasta (12.50 EUR)"));

  const empty = heuristicAnswer("Demo Bistro", [], "hello");
  assert.ok(empty.endsWith(note));
  assert.ok(empty.includes("Demo Bistro"));
});

test("heuristicSuggestion is deterministic, non-empty and price-aware", () => {
  const item = {
    name: "Truffle Pizza",
    description: "Wood-fired",
    price: "18.00",
    dietary: [],
  };

  const first = heuristicSuggestion(item);
  const second = heuristicSuggestion(item);
  assert.equal(first, second);
  assert.ok(first.length > 0);
  assert.ok(first.includes("Truffle Pizza"));
  // String price >= 15 triggers the signature-dish upsell.
  assert.ok(first.includes("signature dish"));

  const cheap = heuristicSuggestion({ name: "Caesar Salad", price: 8.2 });
  assert.ok(cheap.includes("Caesar Salad"));
  assert.ok(cheap.includes("add-on"));
});

test("heuristicSuggestion respects dietary tags", () => {
  const vegan = heuristicSuggestion({
    name: "Green Bowl",
    price: "9.90",
    dietary: ["Vegan"],
  });
  assert.ok(vegan.toLowerCase().includes("vegan"));
});
