import { MongoClient } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/menumind_recommendations";

let clientPromise: Promise<MongoClient> | null = null;

async function connect() {
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 3000,
  });
  await client.connect();
  return client;
}

export async function getDb() {
  if (!clientPromise) {
    clientPromise = connect().catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  const client = await clientPromise;
  return client.db();
}

export async function pingDb() {
  const db = await getDb();
  await db.command({ ping: 1 });
}
