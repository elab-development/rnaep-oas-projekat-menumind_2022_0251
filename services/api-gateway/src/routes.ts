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
  ];
}
