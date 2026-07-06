export function buildSignParams(restaurantId: string, nowSeconds: number) {
  return {
    timestamp: nowSeconds,
    folder: `restaurants/${restaurantId}`,
  };
}
