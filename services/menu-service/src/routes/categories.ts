import { Router } from "express";
import { sql } from "../db.js";
import { requireRestaurantAdmin, uuidParam, wrap } from "../lib/auth.js";
import { categorySchema } from "../schemas.js";

export const categoriesRouter = Router();
categoriesRouter.use(requireRestaurantAdmin);
categoriesRouter.param("id", uuidParam);

const SELECT_COLUMNS = `id, restaurant_id AS "restaurantId", name, description,
  is_active AS "isActive", created_at AS "createdAt"`;

categoriesRouter.get(
  "/",
  wrap(async (req, res) => {
    const data = await sql`
    SELECT ${sql.unsafe(SELECT_COLUMNS)} FROM categories
    WHERE restaurant_id = ${req.user!.restaurantId} ORDER BY created_at`;
    res.json(data);
  }),
);

categoriesRouter.post(
  "/",
  wrap(async (req, res) => {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.flatten() });
    const d = parsed.data;
    const [created] = await sql`
    INSERT INTO categories (restaurant_id, name, description, is_active)
    VALUES (${req.user!.restaurantId}, ${d.name}, ${d.description}, ${d.isActive ?? true})
    RETURNING ${sql.unsafe(SELECT_COLUMNS)}`;
    res.json(created);
  }),
);

categoriesRouter.put(
  "/:id",
  wrap(async (req, res) => {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.flatten() });
    const d = parsed.data;
    const [updated] = await sql`
    UPDATE categories SET name = ${d.name}, description = ${d.description}, is_active = ${d.isActive ?? true}
    WHERE id = ${req.params.id} AND restaurant_id = ${req.user!.restaurantId}
    RETURNING ${sql.unsafe(SELECT_COLUMNS)}`;
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  }),
);

categoriesRouter.delete(
  "/:id",
  wrap(async (req, res) => {
    await sql`DELETE FROM categories WHERE id = ${req.params.id} AND restaurant_id = ${req.user!.restaurantId}`;
    res.json({ success: true });
  }),
);
