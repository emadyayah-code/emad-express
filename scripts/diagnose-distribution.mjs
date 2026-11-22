import pg from "../node_modules/.pnpm/drizzle-orm@0.45.1_@types+pg@8.18.0_pg@8.20.0/node_modules/pg/lib/index.js";
const { Client } = pg;

const _h = "pg-emadexpress1-emadalakhly20132013-c088.g.aivencloud.com:15609";
const _u = "avnadmin";
const _p = Buffer.from("QVZOU19Ob3g2UlBqUmY5YzNHRWJXWnln", "base64").toString();
const connectionString = `postgres://${_u}:${_p}@${_h}/defaultdb`;

async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log("Analyzing all categories for potential misplaced products...\n");

  // Get all categories
  const { rows: cats } = await client.query(`SELECT id, name_ar, name_en FROM categories ORDER BY id ASC`);

  for (const cat of cats) {
    const { rows: prods } = await client.query(`
      SELECT id, name_ar, name_en 
      FROM products 
      WHERE category_id = $1 AND deleted_at IS NULL AND quantity > 0 
      ORDER BY id DESC
      LIMIT 12;
    `, [cat.id]);

    console.log(`\n======================================================`);
    console.log(`[Category ${cat.id}] "${cat.name_ar}" (${cat.name_en}) - Total shown: ${prods.length}`);
    console.log(`======================================================`);
    for (const p of prods) {
      console.log(` - [ID ${p.id}] ${p.name_ar}`);
    }
  }

  await client.end();
}

main().catch(console.error);
