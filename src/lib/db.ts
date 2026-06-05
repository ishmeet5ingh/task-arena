import mongoose from "mongoose";

declare global {
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cache;

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Add it to .env.local.");
  }

  if (cache.conn) return cache.conn;

  cache.promise ??= mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    dbName: "task-arena"
  });

  cache.conn = await cache.promise;
  return cache.conn;
}
