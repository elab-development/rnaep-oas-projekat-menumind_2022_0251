import { MongoClient, type Collection, type Document } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/menumind_analytics";

let clientPromise: Promise<MongoClient> | null = null;

function getClient(): Promise<MongoClient> {
  if (!clientPromise) {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    clientPromise = client.connect().catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

async function getDb() {
  const client = await getClient();
  return client.db();
}

export async function eventCounts(): Promise<Collection<Document>> {
  return (await getDb()).collection("event_counts");
}

export async function menuViews(): Promise<Collection<Document>> {
  return (await getDb()).collection("menu_views");
}

export interface MenuItemStatsDoc extends Document {
  _id: string;
  itemCount?: number;
  priceSum?: number;
}

export async function menuItemStats(): Promise<Collection<MenuItemStatsDoc>> {
  return (await getDb()).collection<MenuItemStatsDoc>("menu_item_stats");
}

export async function ping(): Promise<void> {
  const db = await getDb();
  await db.command({ ping: 1 });
}
