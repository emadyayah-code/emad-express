import pg from "../node_modules/.pnpm/drizzle-orm@0.45.1_@types+pg@8.18.0_pg@8.20.0/node_modules/pg/lib/index.js";
const { Client } = pg;
const _h = "pg-emadexpress1-emadalakhly20132013-c088.g.aivencloud.com:15609";
const _u = "avnadmin";
const _p = Buffer.from("QVZOU19Ob3g2UlBqUmY5YzNHRWJXWnln", "base64").toString();
const connectionString = `postgres://${_u}:${_p}@${_h}/defaultdb`;

async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query("SET default_transaction_read_only = off;");

  console.log("Fixing remaining misclassified sunglasses...");
  // 1. Men sunglasses in Category 5 -> Cat 13
  const r1 = await client.query(`
    UPDATE products
    SET category_id = 13
    WHERE category_id = 5 AND (name_ar ILIKE '%نظارات%للرجال%' OR name_ar ILIKE '%نظارة%للرجال%' OR name_ar ILIKE '%نظارات شمسية مستقطبة%للرجال%')
  `);
  console.log(`Moved ${r1.rowCount} men sunglasses to Cat 13`);

  // 2. Women/General sunglasses in Category 5 or 11 -> Cat 2
  const r2 = await client.query(`
    UPDATE products
    SET category_id = 2
    WHERE category_id IN (5, 11) AND (
      name_ar ILIKE '%نظارة شمسية%' 
      OR name_ar ILIKE '%نظارات شمسية%'
      OR name_ar ILIKE '%نظارات عصرية%'
      OR name_ar ILIKE '%نظارات المضادة للضوء الأزرق%'
      OR name_ar ILIKE '%إطار نظارات%'
    )
  `);
  console.log(`Moved ${r2.rowCount} fashion sunglasses to Cat 2`);

  // 3. Glasses repair tool set in Category 5 -> Cat 14
  const r3 = await client.query(`
    UPDATE products
    SET category_id = 14
    WHERE category_id = 5 AND name_ar ILIKE '%طقم أدوات إصلاح النظارات%'
  `);
  console.log(`Moved ${r3.rowCount} repair kit to Cat 14`);

  // Print final distribution
  const res = await client.query(`
    SELECT c.id, c.name_ar, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.deleted_at IS NULL AND p.quantity > 0
    GROUP BY c.id, c.name_ar
    ORDER BY c.id ASC;
  `);
  console.table(res.rows);

  await client.end();
}

main().catch(console.error);
