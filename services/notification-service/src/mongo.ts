import { MongoClient } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27018/menumind_notifications";
let clientPromise: Promise<MongoClient> | null = null;

async function connect() {
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 3000,
  });
  await client.connect();
  return client;
}

async function getDb() {
  if (!clientPromise) {
    clientPromise = connect().catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  const client = await clientPromise;
  return client.db();
}

export async function notifications() {
  const db = await getDb();
  return db.collection("notifications");
}

export async function ping() {
  const db = await getDb();
  await db.command({ ping: 1 });
}
