import { apiUrl } from "@/lib/api";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAnalyticsSummary, fetchRecentViews } from "./analytics-api";

const sampleSummary = {
  restaurantId: "r1",
  counts: {
    menuViews: 10,
    itemsCreated: 2,
    recommendations: 1,
    notificationsSent: 1,
    usersCreated: 1,
  },
  avgItemPrice: { eur: 9.5, currency: "EUR", value: 9.5 },
  rateSource: null,
};

const sampleViews = [
  { id: "v1", slug: "burger", table: "4", viewedAt: "2026-07-01T10:00:00Z" },
];

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("analytics API helpers", () => {
  it("fetchAnalyticsSummary requests without currency by default", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(sampleSummary),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchAnalyticsSummary();

    expect(fetchMock).toHaveBeenCalledWith(
      apiUrl("/api/analytics/me/summary"),
      { credentials: "include" },
    );
    expect(result).toEqual(sampleSummary);
  });

  it("fetchAnalyticsSummary appends the currency query param", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(sampleSummary),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchAnalyticsSummary("USD");

    expect(fetchMock).toHaveBeenCalledWith(
      apiUrl("/api/analytics/me/summary?currency=USD"),
      { credentials: "include" },
    );
  });

  it("fetchAnalyticsSummary throws when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false }),
    );

    await expect(fetchAnalyticsSummary()).rejects.toThrow(
      "Failed to fetch analytics summary",
    );
  });

  it("fetchRecentViews requests the default limit and returns parsed views", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(sampleViews),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchRecentViews();

    expect(fetchMock).toHaveBeenCalledWith(
      apiUrl("/api/analytics/me/views?limit=50"),
      { credentials: "include" },
    );
    expect(result).toEqual(sampleViews);
  });

  it("fetchRecentViews throws when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false }),
    );

    await expect(fetchRecentViews()).rejects.toThrow(
      "Failed to fetch recent views",
    );
  });
});
