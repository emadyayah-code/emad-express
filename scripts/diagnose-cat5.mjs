import pg from "../node_modules/.pnpm/drizzle-orm@0.45.1_@types+pg@8.18.0_pg@8.20.0/node_modules/pg/lib/index.js";

const { Client } = pg;
const _h = "pg-emadexpress1-emadalakhly20132013-c088.g.aivencloud.com:15609";
const _u = "avnadmin";
const _p = Buffer.from("QVZOU19Ob3g2UlBqUmY5YzNHRWJXWnln", "base64").toString();
const dbUrl = `postgres://${_u}:${_p}@${_h}/defaultdb`;

async function main() {
  const c = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await c.connect();

  console.log("=== Category 5 Items Audit ===");
  const { rows } = await c.query(`
    SELECT id, name_ar 
    FROM products 
    WHERE category_id = 5 AND quantity > 0 AND deleted_at IS NULL
    ORDER BY RANDOM()
    LIMIT 35;
  `);

  rows.forEach((r, idx) => console.log(`${idx + 1}. [${r.id}] ${r.name_ar}`));

  await c.end();
}

main();
