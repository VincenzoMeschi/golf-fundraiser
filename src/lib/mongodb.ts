// lib/mongodb.ts
import { MongoClient } from "mongodb";

// Extend the global type to include _mongoClientPromise
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI!;
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db("golf_fundraiser");

  // Ensure the registrations collection exists and create an index
  await db.createCollection("registrations", {
    capped: false, // Non-capped collection for unlimited growth
  });
  await db.collection("registrations").createIndex({ userId: 1, paymentStatus: 1 }); // Compound index for common queries
  return { db, client };
}
