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
const rawDbUrl = process.env.DATABASE_URL;
const needsSsl = rawDbUrl.includes("sslmode=require") || rawDbUrl.includes("neon.tech") || rawDbUrl.includes("render.com") || rawDbUrl.includes(".aws.") || rawDbUrl.includes("aivencloud.com") || isProduction;

// Strip ?sslmode=... or &sslmode=... from connection string so pg does not enforce strict CA verification on cloud DBs
const dbUrl = rawDbUrl.replace(/([?&])sslmode=[^&]+(&|$)/g, (_match, prefix, suffix) => suffix === "&" ? prefix : "").replace(/[?&]$/, "");

const pool = new Pool({
  connectionString: dbUrl,
  max: 20, // maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

// Ensure every client operates in read-write mode, overriding cloud provider read-only defaults
pool.on("connect", (client) => {
  client.query("SET default_transaction_read_only = off;").catch((err) => {
    console.error("Failed to set read-write transaction mode on client:", err);
  });
});

// Handle pool errors to prevent crashes
pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
});

export { pool };
export const db = drizzle(pool, { schema });

export * from "./schema";
export * from "./migrations";
