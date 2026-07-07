import { Router } from "express";
import { sql } from "../db.js";
import { requireRestaurantAdmin, uuidParam, wrap } from "../lib/auth.js";
import { restaurantUpdateSchema } from "../schemas.js";

export const restaurantsRouter = Router();
restaurantsRouter.use(requireRestaurantAdmin);
restaurantsRouter.param("id", uuidParam);

const SELECT_COLUMNS = `id, name, description, theme_color AS "themeColor", slug, created_at AS "createdAt"`;

restaurantsRouter.get(
  "/me",
  wrap(async (req, res) => {
    const [restaurant] = await sql`
    SELECT ${sql.unsafe(SELECT_COLUMNS)} FROM restaurants WHERE id = ${req.user!.restaurantId}`;
    if (!restaurant)
      return res.status(404).json({ error: "Restaurant not found" });
    res.json(restaurant);
  }),
);

restaurantsRouter.put(
  "/:id",
  wrap(async (req, res) => {
    if (req.user!.restaurantId !== req.params.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const parsed = restaurantUpdateSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.flatten() });

    const updates: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.slug !== undefined) updates.slug = parsed.data.slug;
    if (parsed.data.description !== undefined)
      updates.description = parsed.data.description;
    if (parsed.data.themeColor !== undefined)
      updates.theme_color = parsed.data.themeColor;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    let updated;
    try {
      [updated] = await sql`
      UPDATE restaurants SET ${sql(updates)} WHERE id = ${req.params.id}
      RETURNING ${sql.unsafe(SELECT_COLUMNS)}`;
    } catch (err) {
      if ((err as { code?: string }).code === "23505") {
        return res.status(400).json({ error: "Slug is already taken" });
      }
      throw err;
    }

    if (!updated)
      return res.status(404).json({ error: "Restaurant not found" });
    res.json(updated);
  }),
);
