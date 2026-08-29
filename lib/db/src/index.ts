import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isProduction = process.env.NODE_ENV === "production";
const dbUrl = process.env.DATABASE_URL;
const needsSsl = dbUrl.includes("sslmode=require") || dbUrl.includes("neon.tech") || dbUrl.includes("render.com") || dbUrl.includes(".aws.") || isProduction;

const pool = new Pool({
  connectionString: dbUrl,
  max: 20, // maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

// Handle pool errors to prevent crashes
pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
});

export { pool };
export const db = drizzle(pool, { schema });

export * from "./schema";
export * from "./migrations";
