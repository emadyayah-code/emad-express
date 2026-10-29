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
    console.time("explain");
    const res = await client.query(
      "EXPLAIN (ANALYZE, BUFFERS) SELECT id, name_ar, name_en FROM products WHERE category_id = 5 AND deleted_at IS NULL AND id > $1 ORDER BY id ASC LIMIT $2",
      [317757, 250]
    );
    console.timeEnd("explain");
    console.log(res.rows.map(r => r["QUERY PLAN"]).join("\n"));
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
