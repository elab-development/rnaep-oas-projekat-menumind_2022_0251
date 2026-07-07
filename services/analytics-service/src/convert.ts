export function convertFromEur(
  amountEur: unknown,
  currency: string,
  rates: Record<string, unknown> | null | undefined,
): number | null {
  if (typeof amountEur !== "number" || !Number.isFinite(amountEur)) {
    return null;
  }
  const rate = rates?.[currency];
  if (typeof rate !== "number" || !Number.isFinite(rate)) {
    return null;
  }
  return Math.round(amountEur * rate * 100) / 100;
}
