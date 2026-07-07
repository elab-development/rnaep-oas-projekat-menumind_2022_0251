import { Router } from "express";
import { sql } from "../db.js";
import { wrap } from "../lib/auth.js";

export const publicRouter = Router();

const MENU_ITEM_COLUMNS = `id, restaurant_id AS "restaurantId", category_id AS "categoryId",
  name, description, preparation_time AS "preparationTime", calories, dietary,
  image_url AS "imageUrl", is_popular AS "popular", price,
  is_available AS "isAvailable", created_at AS "createdAt"`;

publicRouter.get(
  "/restaurants/:slug",
  wrap(async (req, res) => {
    const slug = String(req.params.slug).slice(0, 100);

    const [restaurant] = await sql`
    SELECT id, name, description, theme_color AS "themeColor", slug, created_at AS "createdAt"
    FROM restaurants WHERE slug = ${slug} LIMIT 1`;
    if (!restaurant)
      return res.status(404).json({ error: "Restaurant not found" });

    const menuItems = await sql`
    SELECT ${sql.unsafe(MENU_ITEM_COLUMNS)} FROM menu_items
    WHERE restaurant_id = ${restaurant.id} ORDER BY created_at`;

    res.json({ restaurant, menuItems });
  }),
);
