import { Router } from "express";
import { requireRestaurantAdmin, wrap } from "../lib/auth.js";
import { notifications } from "../mongo.js";

export const notificationsRouter = Router();
notificationsRouter.use(requireRestaurantAdmin);

notificationsRouter.get(
  "/me",
  wrap(async (req, res) => {
    const collection = await notifications();
    const docs = await collection
      .find({ restaurantId: { $in: [req.user!.restaurantId, null] } })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    res.json(
      docs.map((doc) => ({
        id: doc._id.toString(),
        restaurantId: doc.restaurantId,
        type: doc.type,
        message: doc.message,
        payload: doc.payload,
        createdAt: doc.createdAt,
      })),
    );
  }),
);
