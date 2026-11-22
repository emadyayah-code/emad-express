import pg from "../node_modules/.pnpm/drizzle-orm@0.45.1_@types+pg@8.18.0_pg@8.20.0/node_modules/pg/lib/index.js";
const { Client } = pg;
const _h = "pg-emadexpress1-emadalakhly20132013-c088.g.aivencloud.com:15609";
const _u = "avnadmin";
const _p = Buffer.from("QVZOU19Ob3g2UlBqUmY5YzNHRWJXWnln", "base64").toString();
const connectionString = `postgres://${_u}:${_p}@${_h}/defaultdb`;

async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('--- 1. Sunglasses (نظارات) ---');
  const sunglassRes = await client.query(`
    SELECT category_id, COUNT(*) 
    FROM products 
    WHERE (name_ar ILIKE '%نظار%' OR name_en ILIKE '%sunglass%' OR name_en ILIKE '%eyewear%')
    GROUP BY category_id ORDER BY count DESC;
  `);
  console.table(sunglassRes.rows);

  console.log('--- 2. Hair Extensions (وصلات شعر / باروكة) in Category 2? ---');
  const hairInCat2 = await client.query(`
    SELECT id, name_ar, category_id 
    FROM products 
    WHERE category_id = 2 AND (name_ar ILIKE '%شعر مستعار%' OR name_ar ILIKE '%وصلات شعر%' OR name_ar ILIKE '%باروكة%' OR name_en ILIKE '%wig%' OR name_en ILIKE '%hair extension%');
  `);
  console.log('Hair in Cat 2 count:', hairInCat2.rows.length);

  console.log('--- 4. Sunglasses in Category 5 or 11 ---');
  const cat5sunglasses = await client.query(`
    SELECT id, name_ar, category_id 
    FROM products 
    WHERE category_id IN (5, 11) AND (name_ar ILIKE '%نظار%' OR name_en ILIKE '%sunglass%');
  `);
  console.log(cat5sunglasses.rows);

  await client.end();
}

main().catch(console.error);
