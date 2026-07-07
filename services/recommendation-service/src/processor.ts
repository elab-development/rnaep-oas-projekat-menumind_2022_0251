import { heuristicSuggestion } from "./ai.js";
import { generateSuggestion } from "./gemini.js";
import { createKafkaClient } from "./lib/krafka.js";
import { recommendationsCollection } from "./mongo.js";

export interface MenuItemCreatedEvent {
  itemId?: string | null;
  restaurantId?: string;
  name?: string;
  description?: string | null;
  price?: number | null;
  dietary?: string[];
}

const { publish, consume } = createKafkaClient("recommendation-service");

export function buildSuggestionPrompt(item: MenuItemCreatedEvent): string {
  const dietary = item.dietary?.length ? item.dietary.join(", ") : "-";
  return [
    "You are a restaurant consultant. In 1-2 sentences suggest a pairing or upsell for the menu item below.",
    `Name: ${item.name}`,
    `Description: ${item.description ?? "-"}`,
    `Price: ${item.price ?? "-"} EUR`,
    `Dietary: ${dietary}`,
  ].join("\n");
}

async function handleMenuItemCreated(
  event: MenuItemCreatedEvent | null | undefined,
): Promise<void> {
  const { itemId, restaurantId, name } = event ?? {};
  if (!restaurantId || !name) {
    console.warn(
      "[processor] menu-item-created missing restaurantId/name, skipping",
    );
    return;
  }

  let suggestion: string;
  let source: "gemini" | "heuristic";
  const menuItemForSuggestion = event
    ? {
        ...event,
        name: name ?? "",
        price: event.price ?? 0,
      }
    : null;
  try {
    suggestion = await generateSuggestion(buildSuggestionPrompt(event!));
    source = "gemini";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[processor] gemini unavailable (${message}), using heuristic suggestion`,
    );
    suggestion = heuristicSuggestion(menuItemForSuggestion);
    source = "heuristic";
  }

  const collection = await recommendationsCollection();
  await collection.insertOne({
    restaurantId,
    itemId: itemId ?? null,
    itemName: name,
    suggestion,
    source,
    createdAt: new Date(),
  });

  await publish("recommendation-generated", {
    restaurantId,
    itemId: itemId ?? null,
    itemName: name,
    suggestion,
    source,
    at: new Date().toISOString(),
  });
}

export async function startProcessor(): Promise<void> {
  await consume(
    "recommendation-service",
    ["menu-item-created"],
    (_topic, payload) => handleMenuItemCreated(payload as MenuItemCreatedEvent),
  );
  console.log("[processor] consuming menu-item-created");
}
