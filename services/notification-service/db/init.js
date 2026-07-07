db = db.getSiblingDB("menumind_notifications");

if (!db.getCollectionNames().includes("notifications")) {
  db.createCollection("notifications", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["type", "message", "createdAt"],
        properties: {
          restaurantId: {
            bsonType: ["string", "null"],
            description:
              "Owning restaurant id, or null for global/system notifications",
          },
          type: {
            bsonType: "string",
            description: "Notification type, e.g. recommendation or user",
          },
          message: {
            bsonType: "string",
            description: "Human-readable notification message",
          },
          payload: {
            bsonType: "object",
            description: "Event-specific payload",
          },
          createdAt: {
            bsonType: "date",
            description: "When the notification was created",
          },
        },
      },
    },
  });
}

db.notifications.createIndex({ restaurantId: 1, createdAt: -1 });
