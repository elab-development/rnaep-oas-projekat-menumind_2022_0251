// Shared API types, previously inferred from the drizzle schema
// (app/db/schema/*). The database moved into the microservices; the wire
// shapes are unchanged.
export type Restaurants = {
  id: string;
  name: string;
  description: string | null;
  themeColor: string | null;
  slug: string;
  createdAt: Date | string | null;
};
