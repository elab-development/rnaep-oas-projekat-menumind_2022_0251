import { Router } from "express";
import { sql } from "../db.js";
import { requireRestaurantAdmin, uuidParam, wrap } from "../lib/auth.js";
import { menuItemSchema } from "../schemas.js";

export const menuItemsRouter = Router();
menuItemsRouter.use(requireRestaurantAdmin);
menuItemsRouter.param("id", uuidParam);

const SELECT_COLUMNS = `id, restaurant_id AS "restaurantId", category_id AS "categoryId",
  name, description, preparation_time AS "preparationTime", calories, dietary,
  image_url AS "imageUrl", is_popular AS "popular", price,
  is_available AS "isAvailable", created_at AS "createdAt"`;

menuItemsRouter.get(
  "/",
  wrap(async (req, res) => {
    const data = await sql`
    SELECT ${sql.unsafe(SELECT_COLUMNS)} FROM menu_items
    WHERE restaurant_id = ${req.user!.restaurantId} ORDER BY created_at`;
    res.json(data);
  }),
);

menuItemsRouter.post(
  "/",
  wrap(async (req, res) => {
    const parsed = menuItemSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.flatten() });
    const d = parsed.data;
    const [created] = await sql`
    INSERT INTO menu_items
      (restaurant_id, category_id, name, description, price, preparation_time, calories, dietary, image_url, is_popular, is_available)
    VALUES
      (${req.user!.restaurantId}, ${d.categoryId}, ${d.name}, ${d.description ?? null},
       ${String(d.price ?? 0)}, ${String(d.preparationTime ?? 15)}, ${String(d.calories ?? 0)},
       ${d.dietary ?? []}, ${d.imageUrl ?? ""}, ${d.popular ?? false}, ${d.isAvailable ?? true})
    RETURNING ${sql.unsafe(SELECT_COLUMNS)}`;

    res.json(created);
  }),
);

menuItemsRouter.put(
  "/:id",
  wrap(async (req, res) => {
    const parsed = menuItemSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.flatten() });
    const d = parsed.data;
    const [updated] = await sql`
    UPDATE menu_items SET
      category_id = ${d.categoryId}, name = ${d.name}, description = ${d.description ?? null},
      price = ${String(d.price)}, preparation_time = ${String(d.preparationTime ?? 15)},
      calories = ${String(d.calories ?? 0)}, dietary = ${d.dietary ?? []},
      image_url = ${d.imageUrl ?? ""}, is_popular = ${d.popular ?? false}, is_available = ${d.isAvailable ?? true}
    WHERE id = ${req.params.id} AND restaurant_id = ${req.user!.restaurantId}
    RETURNING ${sql.unsafe(SELECT_COLUMNS)}`;
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  }),
);

menuItemsRouter.delete(
  "/:id",
  wrap(async (req, res) => {
    await sql`DELETE FROM menu_items WHERE id = ${req.params.id} AND restaurant_id = ${req.user!.restaurantId}`;
    res.json({ success: true });
  }),
);
