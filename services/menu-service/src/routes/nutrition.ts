import { Router } from "express";
import { requireRestaurantAdmin, wrap } from "../lib/auth.js";

const OPENFOODFACTS_URL =
  process.env.OPENFOODFACTS_URL || "https://world.openfoodfacts.org";

interface OffProduct {
  product_name?: string;
  brands?: string;
  nutriments?: Record<string, number>;
  nutriscore_grade?: string;
}

export async function searchOpenFoodFacts(query: string) {
  const url = `${OPENFOODFACTS_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5`;
  const res = await fetch(url, {
    headers: { "User-Agent": "MenuMind/1.0 (academic project)" },
  });
  if (!res.ok) throw new Error(`OpenFoodFacts responded ${res.status}`);
  const data = (await res.json()) as { products?: OffProduct[] };
  return mapProducts(data);
}

export function mapProducts(data: { products?: OffProduct[] }) {
  return (data.products ?? [])
    .filter((p) => p.product_name)
    .map((p) => ({
      name: p.product_name,
      brand: p.brands || null,
      caloriesPer100g: p.nutriments?.["energy-kcal_100g"] ?? null,
      proteinsPer100g: p.nutriments?.proteins_100g ?? null,
      carbsPer100g: p.nutriments?.carbohydrates_100g ?? null,
      fatPer100g: p.nutriments?.fat_100g ?? null,
      nutriscore: p.nutriscore_grade || null,
    }));
}

export const nutritionRouter = Router();
nutritionRouter.use(requireRestaurantAdmin);

nutritionRouter.get(
  "/",
  wrap(async (req, res) => {
    const query = String(req.query.query ?? "").trim();
    if (query.length < 2 || query.length > 100) {
      return res
        .status(400)
        .json({ error: "query must be between 2 and 100 characters" });
    }

    try {
      const items = await searchOpenFoodFacts(query);
      res.json({ source: "openfoodfacts", items });
    } catch {
      res.json({ source: "fallback", items: [] });
    }
  }),
);
