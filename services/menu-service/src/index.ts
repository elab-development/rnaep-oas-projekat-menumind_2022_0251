import express from "express";
import { sql } from "./db.js";
import { categoriesRouter } from "./routes/categories.js";
import { menuItemsRouter } from "./routes/menu-items.js";
import { nutritionRouter } from "./routes/nutrition.js";
import { publicRouter } from "./routes/public.js";
import { restaurantsRouter } from "./routes/restaurants.js";

const PORT = Number(process.env.PORT || 4002);
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.get("/health", async (_req, res) => {
  try {
    await sql`SELECT 1`;
    res.json({ status: "ok", service: "menu-service", db: "up" });
  } catch {
    res
      .status(503)
      .json({ status: "degraded", service: "menu-service", db: "down" });
  }
});

app.use("/api/categories", categoriesRouter);
app.use("/api/menu_items", menuItemsRouter);
app.use("/api/restaurants", restaurantsRouter);
app.use("/api/public", publicRouter);
app.use("/api/nutrition", nutritionRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`[menu-service] listening on :${PORT}`);
});
