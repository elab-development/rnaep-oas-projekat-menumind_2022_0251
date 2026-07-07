db.createCollection("recommendations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "restaurantId",
        "itemName",
        "suggestion",
        "source",
        "createdAt",
      ],
      properties: {
        restaurantId: { bsonType: "string" },
        itemId: { bsonType: ["string", "null"] },
        itemName: { bsonType: "string" },
        suggestion: { bsonType: "string" },
        source: { enum: ["gemini", "heuristic"] },
        createdAt: { bsonType: "date" },
      },
    },
  },
});

db.recommendations.createIndex({ restaurantId: 1, createdAt: -1 });
