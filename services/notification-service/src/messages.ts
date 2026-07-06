interface NotificationInput {
  restaurantId?: string | null;
  itemName?: string;
  itemId?: string | null;
  suggestion?: string;
  source?: string;
}

export function buildRecommendationNotification(data: NotificationInput) {
  return {
    restaurantId: data.restaurantId ?? null,
    type: "recommendation",
    message: `New AI suggestion for "${data.itemName ?? "unknown item"}"`,
    payload: {
      itemId: data.itemId ?? null,
      suggestion: data.suggestion ?? null,
      source: data.source ?? null,
    },
  };
}
