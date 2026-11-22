import pg from "../node_modules/.pnpm/drizzle-orm@0.45.1_@types+pg@8.18.0_pg@8.20.0/node_modules/pg/lib/index.js";
import { fastClassifyText } from "../artifacts/api-server/src/lib/category-rules.ts";

const { Client } = pg;
const _h = "pg-emadexpress1-emadalakhly20132013-c088.g.aivencloud.com:15609";
const _u = "avnadmin";
const _p = Buffer.from("QVZOU19Ob3g2UlBqUmY5YzNHRWJXWnln", "base64").toString();
const connectionString = `postgres://${_u}:${_p}@${_h}/defaultdb`;

async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query("SET default_transaction_read_only = off;");

  console.log("=== PHASE 1: Targeted SQL corrections for known anomalies ===");

  // 1. RC cars / trucks mistakenly in Category 4 -> Category 8
  const r1 = await client.query(`
    UPDATE products
    SET category_id = 8
    WHERE category_id = 4 AND (
      name_ar ILIKE '%تحكم عن بعد%'
      OR name_ar ILIKE '%سيارة%'
      OR name_ar ILIKE '%شاحنة%'
      OR name_ar ILIKE '%rc%'
      OR name_en ILIKE '%rc car%'
      OR name_en ILIKE '%remote control%'
    );
  `);
  console.log(`Phase 1.1: Moved ${r1.rowCount} RC toys out of Cat 4 -> Cat 8`);

  // 2. Water bottles / thermal cups in Category 4 -> Category 5
  const r2 = await client.query(`
    UPDATE products
    SET category_id = 5
    WHERE category_id = 4 AND (
      name_ar ILIKE '%زجاجة%'
      OR name_ar ILIKE '%كوب حراري%'
      OR name_ar ILIKE '%قارورة%'
      OR name_ar ILIKE '%مطارة%'
      OR name_en ILIKE '%water bottle%'
      OR name_en ILIKE '%thermos%'
    );
  `);
  console.log(`Phase 1.2: Moved ${r2.rowCount} water bottles out of Cat 4 -> Cat 5`);

  // 3. Gaming controllers & Microphones in Category 5 or 8 -> Category 12
  const r3 = await client.query(`
    UPDATE products
    SET category_id = 12
    WHERE category_id IN (1, 5, 8) AND (
      name_ar ILIKE '%مايكروفون%'
      OR name_ar ILIKE '%ميكروفون%'
      OR name_ar ILIKE '%ماونو%'
      OR name_ar ILIKE '%يد تحكم%'
      OR name_ar ILIKE '%وحدة تحكم ألعاب%'
      OR name_ar ILIKE '%أذرع التحكم%'
      OR name_ar ILIKE '%لوحة ألعاب%'
      OR name_ar ILIKE '%عصا تحكم%'
      OR name_ar ILIKE '%مقبض تحكم%'
      OR name_ar ILIKE '%8bitdo%'
      OR name_en ILIKE '%gamepad%'
      OR name_en ILIKE '%controller%'
      OR name_en ILIKE '%microphone%'
      OR name_en ILIKE '%maono%'
    );
  `);
  console.log(`Phase 1.3: Moved ${r3.rowCount} gaming/audio items -> Cat 12`);

  // 4. Drawing tablets in Category 1 or 5 -> Category 11
  const r4 = await client.query(`
    UPDATE products
    SET category_id = 11
    WHERE category_id IN (1, 5) AND (
      name_ar ILIKE '%لوح رسم%'
      OR name_ar ILIKE '%لوحة رسم%'
      OR name_ar ILIKE '%أقراص الرسم%'
      OR name_ar ILIKE '%لوح كتابة إلكتروني%'
      OR name_ar ILIKE '%huion%'
      OR name_ar ILIKE '%ugee%'
      OR name_ar ILIKE '%kamvas%'
      OR name_en ILIKE '%drawing tablet%'
      OR name_en ILIKE '%graphic tablet%'
    );
  `);
  console.log(`Phase 1.4: Moved ${r4.rowCount} drawing tablets -> Cat 11`);

  // 5. Aquarium pumps with LED in Category 15 -> Category 17
  const r5 = await client.query(`
    UPDATE products
    SET category_id = 17
    WHERE category_id = 15 AND (
      name_ar ILIKE '%حوض السمك%'
      OR name_ar ILIKE '%حوض أسماك%'
      OR name_ar ILIKE '%حوض للأسماك%'
      OR name_en ILIKE '%aquarium%'
    );
  `);
  console.log(`Phase 1.5: Moved ${r5.rowCount} aquarium items -> Cat 17`);

  console.log("\n=== PHASE 2: Deep semantic classification across ALL active products ===");
  const { rows: allProds } = await client.query(`
    SELECT id, name_ar, name_en, category_id
    FROM products
    WHERE deleted_at IS NULL AND quantity > 0;
  `);
  console.log(`Evaluating ${allProds.length} active products...`);

  let movedCount = 0;
  const updates = [];

  for (const p of allProds) {
    const text = `${p.name_ar || ''} ${p.name_en || ''}`;
    const res = fastClassifyText(text);

    // If high-confidence classification (score >= 35) and category differs
    if (res.bestId && res.score >= 35 && res.bestId !== p.category_id) {
      updates.push({ id: p.id, newCat: res.bestId, oldCat: p.category_id, name: p.name_ar });
    }
  }

  console.log(`Found ${updates.length} products to re-classify to their exact categories.`);

  // Group by new category and execute ONE query per category
  const byCat = new Map();
  for (const u of updates) {
    if (!byCat.has(u.newCat)) byCat.set(u.newCat, []);
    byCat.get(u.newCat).push(u.id);
  }

  for (const [newCatId, ids] of byCat.entries()) {
    const res = await client.query(
      'UPDATE products SET category_id = $1 WHERE id = ANY($2::int[])',
      [newCatId, ids]
    );
    console.log(`  -> Successfully moved ${res.rowCount} products to Category ${newCatId}`);
    movedCount += res.rowCount;
  }

  console.log(`\nTOTAL PRODUCTS RECLASSIFIED IN PHASE 2: ${movedCount}`);

  console.log("\n=== FINAL ACCURATE DISTRIBUTION TABLE ===");
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
