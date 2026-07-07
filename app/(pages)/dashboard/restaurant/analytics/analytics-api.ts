import { apiUrl } from "@/lib/api";

export type AnalyticsSummary = {
  restaurantId: string;
  counts: {
    menuViews: number;
    itemsCreated: number;
    recommendations: number;
    notificationsSent: number;
    usersCreated: number;
  };
  avgItemPrice: {
    eur: number | null;
    currency: string;
    value: number | null;
  };
  rateSource: string | null;
};

export type MenuView = {
  id: string;
  slug: string | null;
  table: string | null;
  viewedAt: string;
};

export async function fetchAnalyticsSummary(
  currency?: string,
): Promise<AnalyticsSummary> {
  const query = currency ? `?currency=${encodeURIComponent(currency)}` : "";
  const res = await fetch(apiUrl(`/api/analytics/me/summary${query}`), {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch analytics summary");
  return res.json();
}

export async function fetchRecentViews(limit = 50): Promise<MenuView[]> {
  const res = await fetch(
    apiUrl(`/api/analytics/me/views?limit=${limit}`),
    { credentials: "include" },
  );
  if (!res.ok) throw new Error("Failed to fetch recent views");
  return res.json();
}
