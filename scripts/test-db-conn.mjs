import { pool } from "./lib/db/src/index.js";

async function test() {
  console.log("Connecting using @workspace/db pool config...");
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT COUNT(*) FROM products WHERE deleted_at IS NULL");
    console.log("Total products:", res.rows[0].count);
  } finally {
    client.release();
    await pool.end();
  }
}

test().catch(console.error);
