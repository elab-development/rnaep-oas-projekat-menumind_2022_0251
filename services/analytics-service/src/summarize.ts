import { convertFromEur } from "./convert.js";

const EVENT_TYPE_TO_COUNT_KEY: Record<string, string> = {
  "menu-viewed": "menuViews",
  "menu-item-created": "itemsCreated",
  "recommendation-generated": "recommendations",
  "notification-sent": "notificationsSent",
  "user-created": "usersCreated",
};

interface EventCountDoc {
  eventType?: string;
  count?: unknown;
  [key: string]: unknown;
}

interface StatsDoc {
  itemCount?: unknown;
  priceSum?: unknown;
  [key: string]: unknown;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildSummary(
  countsDocs: EventCountDoc[] | null | undefined,
  statsDoc: StatsDoc | null | undefined,
  currency: string | null,
  rate: number | null,
) {
  const counts = {
    menuViews: 0,
    itemsCreated: 0,
    recommendations: 0,
    notificationsSent: 0,
    usersCreated: 0,
  };
  for (const doc of countsDocs ?? []) {
    const key = doc?.eventType
      ? EVENT_TYPE_TO_COUNT_KEY[doc.eventType]
      : undefined;
    if (key) {
      (counts as Record<string, number>)[key] += Number(doc.count) || 0;
    }
  }

  const itemCount = Number(statsDoc?.itemCount) || 0;
  const priceSum = Number(statsDoc?.priceSum) || 0;
  const eur = itemCount > 0 ? round2(priceSum / itemCount) : null;

  const target = currency && currency !== "EUR" ? currency : "EUR";
  const value =
    target === "EUR" ? eur : convertFromEur(eur, target, { [target]: rate });

  return { counts, avgItemPrice: { eur, currency: target, value } };
}
