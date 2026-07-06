export interface RouteEntry {
  name: string;
  pathFilter: string[];
  target: string;
}

export function buildRoutes(): RouteEntry[] {
  return [
    {
      name: "auth-service",
      pathFilter: ["/api/auth"],
      target: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
    },
    {
      name: "menu-service",
      pathFilter: [
        "/api/categories",
        "/api/menu_items",
        "/api/restaurants",
        "/api/public",
        "/api/nutrition",
      ],
      target: process.env.MENU_SERVICE_URL || "http://localhost:4002",
    },
    {
      name: "media-service",
      pathFilter: ["/api/cloudinary"],
      target: process.env.MEDIA_SERVICE_URL || "http://localhost:4006",
    },
    {
      name: "recommendation-service",
      pathFilter: ["/api/chat"],
      target: process.env.RECOMMENDATION_SERVICE_URL || "http://localhost:4003",
    },
  ];
}
