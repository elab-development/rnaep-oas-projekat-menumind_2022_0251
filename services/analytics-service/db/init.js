db = db.getSiblingDB("menumind_analytics");

db.createCollection("event_counts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["restaurantId", "eventType", "count"],
      properties: {
        restaurantId: { bsonType: "string" },
        eventType: { bsonType: "string" },
        count: { bsonType: ["int", "long", "double"] },
        updatedAt: { bsonType: "date" },
      },
    },
  },
});
db.event_counts.createIndex(
  { restaurantId: 1, eventType: 1 },
  { unique: true },
);

db.createCollection("menu_views", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["restaurantId", "viewedAt"],
      properties: {
        restaurantId: { bsonType: "string" },
        slug: {},
        table: {},
        viewedAt: { bsonType: "date" },
      },
    },
  },
});
db.menu_views.createIndex({ restaurantId: 1, viewedAt: -1 });

db.createCollection("menu_item_stats");
