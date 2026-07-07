import { createKafkaClient } from "./lib/kafka.js";
import { eventCounts, menuItemStats, menuViews } from "./mongo.js";

const TOPICS = [
  "user-created",
  "menu-item-created",
  "menu-viewed",
  "recommendation-generated",
  "notification-sent",
];

const { consume } = createKafkaClient("analytics-service");

export async function handleEvent(
  topic: string,
  payload: Record<string, unknown> | null,
): Promise<void> {
  const restaurantId =
    (payload?.restaurantId as string | undefined) ?? "global";

  const counts = await eventCounts();
  await counts.updateOne(
    { restaurantId, eventType: topic },
    { $inc: { count: 1 }, $set: { updatedAt: new Date() } },
    { upsert: true },
  );

  if (topic === "menu-viewed") {
    const views = await menuViews();
    await views.insertOne({
      restaurantId,
      slug: (payload?.slug as string | undefined) ?? null,
      table: (payload?.table as string | undefined) ?? null,
      viewedAt: payload?.at ? new Date(payload.at as string) : new Date(),
    });
  }

  if (topic === "menu-item-created") {
    const stats = await menuItemStats();
    await stats.updateOne(
      { _id: payload?.restaurantId as string },
      {
        $inc: { itemCount: 1, priceSum: Number(payload?.price) || 0 },
        $set: { updatedAt: new Date() },
      },
      { upsert: true },
    );
  }
}

export function startConsumer() {
  return consume("analytics-service", TOPICS, handleEvent);
}
