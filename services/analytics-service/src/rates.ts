import CircuitBreaker from "opossum";
import { trackBreaker } from "./lib/metrics.js";

const EXCHANGE_RATE_API_URL =
  process.env.EXCHANGE_RATE_API_URL || "https://open.er-api.com/v6/latest/EUR";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export type RateSource = "live" | "cache" | "fallback";

interface RatesResult {
  rates: Record<string, number>;
  fetchedAt: string;
}

interface Cache extends RatesResult {
  fetchedAtMs: number;
}

export async function fetchRates(): Promise<RatesResult> {
  const res = await fetch(EXCHANGE_RATE_API_URL);
  if (!res.ok) throw new Error(`exchange-rate API responded ${res.status}`);
  const body = (await res.json()) as { rates?: Record<string, number> };
  if (!body?.rates || typeof body.rates !== "object") {
    throw new Error("exchange-rate API returned no rates");
  }
  return { rates: body.rates, fetchedAt: new Date().toISOString() };
}

export const ratesBreaker = new CircuitBreaker(fetchRates, {
  timeout: 5000,
  resetTimeout: 60000,
});
trackBreaker(ratesBreaker, "exchange-rates");

let cache: Cache | null = null;

function rateFrom(
  rates: Record<string, number> | null | undefined,
  currency: string,
): number | null {
  const rate = rates?.[currency];
  return typeof rate === "number" && Number.isFinite(rate) ? rate : null;
}

export async function getRate(
  currency: string,
): Promise<{ rate: number | null; rateSource: RateSource }> {
  if (cache && Date.now() - cache.fetchedAtMs < CACHE_TTL_MS) {
    const rate = rateFrom(cache.rates, currency);
    if (rate !== null) return { rate, rateSource: "cache" };
  }

  try {
    const { rates, fetchedAt } = await ratesBreaker.fire();
    cache = { rates, fetchedAt, fetchedAtMs: Date.now() };
    const rate = rateFrom(rates, currency);
    if (rate !== null) return { rate, rateSource: "live" };
  } catch (err) {
    console.error(`[rates] fetch failed: ${(err as Error).message}`);
    const rate = rateFrom(cache?.rates, currency);
    if (rate !== null) return { rate, rateSource: "cache" };
  }

  return { rate: null, rateSource: "fallback" };
}
