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

  console.log("=== Precise Edge-Case Sweeping ===");

  // 1. Any non-jewelry / non-watch products in Category 4 containing duration or kitchen/audio terms
  const r1 = await client.query(`
    UPDATE products
    SET category_id = 5
    WHERE category_id = 4 AND (
      name_ar ILIKE '%غلاية%'
      OR name_ar ILIKE '%زجاجة%'
      OR name_ar ILIKE '%قارورة%'
      OR name_ar ILIKE '%مطبخ%'
      OR name_ar ILIKE '%فراغ تدوم%'
      OR name_ar ILIKE '%تدوم%ساعة%'
      OR name_ar ILIKE '%لمدة%ساعة%'
    );
  `);
  console.log(`1. Moved ${r1.rowCount} kitchen/bottles out of Cat 4 -> Cat 5`);

  // 2. Earphones / Airpods / Cases in Category 4
  const r2 = await client.query(`
    UPDATE products
    SET category_id = 12
    WHERE category_id = 4 AND (
      name_ar ILIKE '%airpods%'
      OR name_ar ILIKE '%سماعة أذن%'
      OR name_ar ILIKE '%سماعات%'
      OR name_en ILIKE '%airpods%'
      OR name_en ILIKE '%earphone%'
    );
  `);
  console.log(`2. Moved ${r2.rowCount} audio/airpods out of Cat 4 -> Cat 12`);

  // 3. Keyboard switches / Keycaps mistakenly in Category 8 -> Category 11
  const r3 = await client.query(`
    UPDATE products
    SET category_id = 11
    WHERE category_id IN (1, 8) AND (
      name_ar ILIKE '%مفاتيح لوحة المفاتيح%'
      OR name_ar ILIKE '%لوحة المفاتيح الميكانيكية%'
      OR name_ar ILIKE '%لوحات المفاتيح%'
      OR name_ar ILIKE '%keycaps%'
      OR name_ar ILIKE '%keyboard switch%'
      OR name_en ILIKE '%keyboard switch%'
    );
  `);
  console.log(`3. Moved ${r3.rowCount} keyboard switches -> Cat 11`);

  // 4. Pet toys / pet balls mistakenly in Category 8 -> Category 17
  const r4 = await client.query(`
    UPDATE products
    SET category_id = 17
    WHERE category_id IN (8, 5) AND (
      name_ar ILIKE '%للقطط%'
      OR name_ar ILIKE '%للكلاب%'
      OR name_ar ILIKE '%للحصان%'
      OR name_ar ILIKE '%حيوانات أليفة%'
      OR name_ar ILIKE '%حيوان أليف%'
      OR name_en ILIKE '%for cat%'
      OR name_en ILIKE '%for dog%'
      OR name_en ILIKE '%for pet%'
    );
  `);
  console.log(`4. Moved ${r4.rowCount} pet items out of Cat 8/5 -> Cat 17`);

  // 5. Strollers, baby clips, baby gear in Category 9 (cars) -> Category 8
  const r5 = await client.query(`
    UPDATE products
    SET category_id = 8
    WHERE category_id = 9 AND (
      name_ar ILIKE '%عربة الأطفال%'
      OR name_ar ILIKE '%عربة أطفال%'
      OR name_ar ILIKE '%مواليد%'
      OR name_ar ILIKE '%رضيع%'
      OR name_en ILIKE '%baby stroller%'
      OR name_en ILIKE '%infant%'
    );
  `);
  console.log(`5. Moved ${r5.rowCount} baby/stroller items out of Cat 9 -> Cat 8`);

  // 6. Drones and quadcopters in Category 8 or 1 -> Category 20 (كاميرات وطائرات درون)
  const r6 = await client.query(`
    UPDATE products
    SET category_id = 20
    WHERE category_id IN (1, 8) AND (
      name_ar ILIKE '%درون%'
      OR name_ar ILIKE '%بدون طيار%'
      OR name_ar ILIKE '%كوادكوبتر%'
      OR name_en ILIKE '%drone%'
      OR name_en ILIKE '%quadcopter%'
    );
  `);
  console.log(`6. Moved ${r6.rowCount} drones to Cat 20`);

  // 6. Verify Category 4 sample
  const { rows: cat4check } = await client.query(`
    SELECT id, name_ar 
    FROM products 
    WHERE category_id = 4 AND deleted_at IS NULL AND quantity > 0
    ORDER BY id DESC
    LIMIT 10;
  `);
  console.log("\n=== Current First 10 Items in Category 4 (ساعات ومجوهرات) ===");
  for (const item of cat4check) {
    console.log(` - [ID ${item.id}] ${item.name_ar.slice(0, 70)}`);
  }

  // 7. Verify Category 8 sample
  const { rows: cat8check } = await client.query(`
    SELECT id, name_ar 
    FROM products 
    WHERE category_id = 8 AND deleted_at IS NULL AND quantity > 0
    ORDER BY id DESC
    LIMIT 10;
  `);
  console.log("\n=== Current First 10 Items in Category 8 (ألعاب وأطفال) ===");
  for (const item of cat8check) {
    console.log(` - [ID ${item.id}] ${item.name_ar.slice(0, 70)}`);
  }

  // Final count
  const { rows: dist } = await client.query(`
    SELECT c.id, c.name_ar, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.deleted_at IS NULL AND p.quantity > 0
    GROUP BY c.id, c.name_ar
    ORDER BY c.id ASC;
  `);
  console.table(dist);

  await client.end();
}

main().catch(console.error);
