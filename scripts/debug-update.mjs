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
    console.log("Checking triggers...");
    const trig = await client.query("SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE event_object_table = 'products'");
    console.log("Triggers:", trig.rows);

    console.log("Testing single product update...");
    console.time("single-update");
    await client.query("UPDATE products SET category_id = category_id WHERE id = (SELECT id FROM products LIMIT 1)");
    console.timeEnd("single-update");
    console.log("Single update succeeded!");

    console.log("Testing batch of 100 updates...");
    const sample = await client.query("SELECT id, category_id FROM products LIMIT 100");
    const cases = sample.rows.map(r => `WHEN id = ${r.id} THEN ${r.category_id}`).join(" ");
    const ids = sample.rows.map(r => r.id).join(",");
    console.time("batch-update");
    await client.query(`UPDATE products SET category_id = CASE ${cases} END WHERE id IN (${ids})`);
    console.timeEnd("batch-update");
    console.log("Batch update of 100 succeeded!");

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
