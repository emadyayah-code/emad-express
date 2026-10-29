import pg from "../node_modules/.pnpm/drizzle-orm@0.45.1_@types+pg@8.18.0_pg@8.20.0/node_modules/pg/lib/index.js";

const { Pool } = pg;
const _h = "pg-emadexpress1-emadalakhly20132013-c088.g.aivencloud.com:15609";
const _u = "avnadmin";
const _p = Buffer.from("QVZOU19Ob3g2UlBqUmY5YzNHRWJXWnln", "base64").toString();
const dbUrl = `postgres://${_u}:${_p}@${_h}/defaultdb`;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    console.time("fetch-all");
    const res = await client.query("SELECT id, name_ar, name_en, category_id FROM products WHERE deleted_at IS NULL");
    console.timeEnd("fetch-all");
    console.log(`Successfully fetched ALL ${res.rows.length} products in memory!`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
