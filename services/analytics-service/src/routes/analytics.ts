import { Router } from "express";
import { requireRestaurantAdmin, wrap } from "../lib/auth.js";
import { eventCounts, menuItemStats, menuViews } from "../mongo.js";
import { getRate } from "../rates.js";
import { buildSummary } from "../summarize.js";

export const analyticsRouter = Router();
analyticsRouter.use(requireRestaurantAdmin);

const CURRENCY_RE = /^[A-Z]{3}$/;

analyticsRouter.get(
  "/me/summary",
  wrap(async (req, res) => {
    let currency: string | null = null;
    if (req.query.currency !== undefined) {
      currency = String(req.query.currency).toUpperCase();
      if (!CURRENCY_RE.test(currency)) {
        return res
          .status(400)
          .json({ error: "currency must be a 3-letter ISO code" });
      }
    }

    const restaurantId = req.user!.restaurantId;
    const [countsDocs, statsDoc] = await Promise.all([
      eventCounts().then((c) =>
        c
          .find({
            $or: [
              { restaurantId },
              { restaurantId: "global", eventType: "user-created" },
            ],
          })
          .toArray(),
      ),
      menuItemStats().then((s) => s.findOne({ _id: restaurantId })),
    ]);

    let rate: number | null = null;
    let rateSource: string | null = null;
    if (currency && currency !== "EUR") {
      ({ rate, rateSource } = await getRate(currency));
    }

    const summary = buildSummary(countsDocs, statsDoc, currency, rate);
    res.json({ restaurantId, ...summary, rateSource });
  }),
);

analyticsRouter.get(
  "/me/views",
  wrap(async (req, res) => {
    const requested = Number.parseInt(String(req.query.limit ?? "50"), 10);
    const limit = Math.min(
      Math.max(Number.isNaN(requested) ? 50 : requested, 1),
      200,
    );

    const views = await menuViews();
    const docs = await views
      .find({ restaurantId: req.user!.restaurantId })
      .sort({ viewedAt: -1 })
      .limit(limit)
      .toArray();

    res.json(
      docs.map((doc) => ({
        id: doc._id,
        slug: doc.slug ?? null,
        table: doc.table ?? null,
        viewedAt: doc.viewedAt,
      })),
    );
  }),
);
