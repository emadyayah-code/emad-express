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

async function main() {
  const client = await pool.connect();
  try {
    const counts = await client.query(`
      SELECT category_id, COUNT(*) as count
      FROM products
      WHERE deleted_at IS NULL
      GROUP BY category_id
      ORDER BY category_id ASC
    `);
    console.log("Product count per category:");
    counts.rows.forEach(r => console.log(`Category ID ${r.category_id}: ${r.count} products`));

    // Get 50 products from category 5
    const cat5Sample = await client.query(`
      SELECT id, name_ar, name_en, sku
      FROM products
      WHERE category_id = 5 AND deleted_at IS NULL
      LIMIT 50
    `);
    console.log(`\nSample of 50 products in Category 5:`);
    cat5Sample.rows.forEach(p => {
      console.log(`[ID ${p.id}] AR: ${p.name_ar?.slice(0, 45)} | EN: ${p.name_en?.slice(0, 45)}`);
    });
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
