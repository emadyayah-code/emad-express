import pg from "../node_modules/.pnpm/drizzle-orm@0.45.1_@types+pg@8.18.0_pg@8.20.0/node_modules/pg/lib/index.js";

const { Client } = pg;
const _h = "pg-emadexpress1-emadalakhly20132013-c088.g.aivencloud.com:15609";
const _u = "avnadmin";
const _p = Buffer.from("QVZOU19Ob3g2UlBqUmY5YzNHRWJXWnln", "base64").toString();
const dbUrl = `postgres://${_u}:${_p}@${_h}/defaultdb`;

async function main() {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to PostgreSQL successfully!");

  try {
    await client.query("SET default_transaction_read_only = off;");

    // 1. Move ALL Hair Extensions / Wigs to Category 22
    console.log("1. Reclassifying Hair Extensions and Wigs to Category 22...");
    const qHair = `
      UPDATE products
      SET category_id = 22
      WHERE deleted_at IS NULL AND quantity > 0 AND category_id != 22
        AND (
          name_ar ILIKE '%وصلة شعر%' OR name_ar ILIKE '%وصلات شعر%' OR 
          name_ar ILIKE '%شعر مستعار%' OR name_ar ILIKE '%باروكة%' OR 
          name_ar ILIKE '%باروكات%' OR name_ar ILIKE '%خصلات شعر%' OR 
          name_ar ILIKE '%خصلة شعر%' OR name_ar ILIKE '%ذيل حصان%' OR
          name_ar ILIKE '%كعكة شعر%' OR name_ar ILIKE '%شعر مجدول%' OR
          name_ar ILIKE '%دانتيل شعر%' OR name_ar ILIKE '%مشبك وصلات الشعر%' OR
          name_en ILIKE '%hair extension%' OR name_en ILIKE '%ponytail extension%' OR
          name_en ILIKE '%wig%' OR name_en ILIKE '%wigs%' OR name_en ILIKE '%hairpiece%'
        );
    `;
    const resHair = await client.query(qHair);
    console.log(`  -> Moved ${resHair.rowCount} products to Category 22 (وصلات وشعر مستعار)`);

    // 2. Move Doll clothes / toys from Category 2 to Category 8
    console.log("\n2. Moving doll clothes/toys to Category 8 (ألعاب وأطفال)...");
    const qDoll = `
      UPDATE products
      SET category_id = 8
      WHERE deleted_at IS NULL AND quantity > 0 AND category_id != 8
        AND (
          name_ar ILIKE '%ملابس دمية%' OR name_ar ILIKE '%ملابس دمى%' OR
          name_ar ILIKE '%لدمية%' OR name_ar ILIKE '%لدمى%' OR
          name_ar ILIKE '%دمية بليث%' OR name_ar ILIKE '%دمى باربي%' OR
          name_en ILIKE '%doll clothes%' OR name_en ILIKE '%barbie%' OR name_en ILIKE '%blythe%'
        );
    `;
    const resDoll = await client.query(qDoll);
    console.log(`  -> Moved ${resDoll.rowCount} doll products to Category 8 (ألعاب وأطفال)`);

    // 3. Move Smart/Bluetooth Glasses from Category 4 to Category 12 (Consumer Electronics)
    console.log("\n3. Moving Smart/Bluetooth glasses to Category 12...");
    const qSmartGlasses = `
      UPDATE products
      SET category_id = 12
      WHERE deleted_at IS NULL AND quantity > 0 AND category_id = 4
        AND (
          name_ar ILIKE '%بلوتوث%' OR name_ar ILIKE '%ذكية%' OR 
          name_ar ILIKE '%لينوفو%' OR name_en ILIKE '%smart glass%' OR
          name_en ILIKE '%bluetooth%'
        );
    `;
    const resSmartGlasses = await client.query(qSmartGlasses);
    console.log(`  -> Moved ${resSmartGlasses.rowCount} smart glasses to Category 12 (أجهزة إلكترونية استهلاكية)`);

    // 4. Move Men's Sunglasses from Category 4 to Category 13 (Men's Fashion)
    console.log("\n4. Moving Men's sunglasses from Category 4 to Category 13...");
    const qMenGlasses = `
      UPDATE products
      SET category_id = 13
      WHERE deleted_at IS NULL AND quantity > 0 AND category_id = 4
        AND (name_ar ILIKE '%نظار%' OR name_en ILIKE '%glass%')
        AND (
          (name_ar ILIKE '%للرجال%' AND name_ar NOT ILIKE '%للنساء%') OR
          (name_ar ILIKE '%رجالي%' AND name_ar NOT ILIKE '%نسائي%') OR
          (name_en ILIKE '%men%' AND name_en NOT ILIKE '%women%')
        );
    `;
    const resMenGlasses = await client.query(qMenGlasses);
    console.log(`  -> Moved ${resMenGlasses.rowCount} men sunglasses to Category 13 (أزياء وملابس رجالية)`);

    // 5. Move All Remaining Sunglasses from Category 4 to Category 2 (Fashion & Style)
    console.log("\n5. Moving all remaining sunglasses from Category 4 to Category 2 (أزياء وموضة)...");
    const qRemGlasses = `
      UPDATE products
      SET category_id = 2
      WHERE deleted_at IS NULL AND quantity > 0 AND category_id = 4
        AND (name_ar ILIKE '%نظار%' OR name_en ILIKE '%glass%');
    `;
    const resRemGlasses = await client.query(qRemGlasses);
    console.log(`  -> Moved ${resRemGlasses.rowCount} fashion sunglasses to Category 2 (أزياء وموضة)`);

    // 6. Move Men's Clothing / Jackets from Category 2 to Category 13 (Men's Fashion)
    console.log("\n6. Moving Men's clothing / jackets / coats from Category 2 to Category 13...");
    const qMenClothing = `
      UPDATE products
      SET category_id = 13
      WHERE deleted_at IS NULL AND quantity > 0 AND category_id = 2
        AND (
          (name_ar ILIKE '%رجالي%' AND name_ar NOT ILIKE '%نسائي%') OR
          (name_ar ILIKE '%للرجال%' AND name_ar NOT ILIKE '%للنساء%') OR
          (name_ar ILIKE '%طقم رجالي%') OR
          (name_ar ILIKE '%بدلة رجالية%') OR
          (name_ar ILIKE '%جاكيت رجالي%') OR
          (name_ar ILIKE '%جاكت رجالي%') OR
          (name_ar ILIKE '%معطف رجالي%') OR
          (name_ar ILIKE '%معطف رجل%') OR
          (name_ar ILIKE '%سترة رجالية%') OR
          (name_ar ILIKE '%قميص رجالي%') OR
          (name_ar ILIKE '%بنطلون رجالي%') OR
          (name_ar ILIKE '%جينز رجالي%') OR
          (name_ar ILIKE '%طقم قميص وبنطلون خفيف الوزن للرجال%') OR
          (name_ar ILIKE '%شتاء قصيرة سترة جلدية حقيقية الرجال%') OR
          (name_ar ILIKE '%Night of Fool للرجال%') OR
          (name_ar ILIKE '%طقم رياضي رجالي%') OR
          (name_ar ILIKE '%معطف فرو الأغنام الطبيعي رجل%') OR
          (name_en ILIKE '%men%' AND name_en NOT ILIKE '%women%')
        );
    `;
    const resMenClothing = await client.query(qMenClothing);
    console.log(`  -> Moved ${resMenClothing.rowCount} men's clothing items to Category 13 (أزياء وملابس رجالية)`);

    // 7. Move Women's Clothing from Category 13 to Category 2
    console.log("\n7. Moving Women's clothing accidentally in Category 13 to Category 2...");
    const qWomenInMen = `
      UPDATE products
      SET category_id = 2
      WHERE deleted_at IS NULL AND quantity > 0 AND category_id = 13
        AND (
          (name_ar ILIKE '%نسائي%' AND name_ar NOT ILIKE '%رجالي%') OR
          (name_ar ILIKE '%للنساء%' AND name_ar NOT ILIKE '%للرجال%') OR
          (name_ar ILIKE '%فستان%') OR
          (name_ar ILIKE '%تنورة%') OR
          (name_ar ILIKE '%عباية%') OR
          (name_ar ILIKE '%بلوزة نسائية%') OR
          (name_en ILIKE '%women%' AND name_en NOT ILIKE '%men%')
        );
    `;
    // 8. Move Shoes & Footwear accidentally in Category 2 or 13 to Category 10 (Shoes & Bags)
    console.log("\n8. Moving shoes/boots/sandals from Category 2 and 13 to Category 10 (أحذية وحقائب)...");
    const qShoes = `
      UPDATE products
      SET category_id = 10
      WHERE deleted_at IS NULL AND quantity > 0 AND category_id IN (2, 13)
        AND (
          name_ar ILIKE '%حذاء%' OR name_ar ILIKE '%أحذية%' OR 
          name_ar ILIKE '%صندل%' OR name_ar ILIKE '%بوت%' OR 
          name_ar ILIKE '%شبشب%' OR name_ar ILIKE '%كعب%' OR 
          name_ar ILIKE '%سنيكرز%' OR name_en ILIKE '%shoes%' OR
          name_en ILIKE '%sneakers%' OR name_en ILIKE '%boots%'
        );
    `;
    const resShoes = await client.query(qShoes);
    console.log(`  -> Moved ${resShoes.rowCount} footwear items to Category 10 (أحذية وحقائب)`);

    // 9. Move party novelties to Category 23
    console.log("\n9. Moving party novelty glasses to Category 23...");
    const qParty = `
      UPDATE products
      SET category_id = 23
      WHERE deleted_at IS NULL AND quantity > 0
        AND (name_ar ILIKE '%مستلزمات التنكر%' OR name_ar ILIKE '%حفلات الزفاف ومستلزمات%')
        AND category_id != 23;
    `;
    const resParty = await client.query(qParty);
    console.log(`  -> Moved ${resParty.rowCount} party items to Category 23 (مستلزمات الحفلات)`);

    // 10. Clean up any remaining men items in Category 2
    console.log("\n10. Moving remaining Men items from Category 2 to Category 13...");
    const qRemMen = `
      UPDATE products
      SET category_id = 13
      WHERE deleted_at IS NULL AND quantity > 0 AND category_id = 2
        AND (
          (name_ar ILIKE '%الرجال%' AND name_ar NOT ILIKE '%النساء%' AND name_ar NOT ILIKE '%نسائي%') OR
          (name_ar ILIKE '%رجالي%' AND name_ar NOT ILIKE '%نسائي%') OR
          name_ar ILIKE '%Harajuku البيسبول جيرسي%'
        );
    `;
    const resRemMen = await client.query(qRemMen);
    console.log(`  -> Moved ${resRemMen.rowCount} remaining men items to Category 13 (أزياء وملابس رجالية)`);

    // Verification:
    console.log("\n=================== VERIFICATION AUDIT ===================");
    const { rows: verifyGlassesIn4 } = await client.query(`
      SELECT COUNT(*) as cnt FROM products 
      WHERE category_id = 4 AND (name_ar ILIKE '%نظار%' OR name_en ILIKE '%glass%');
    `);
    console.log(`Glasses in Category 4 (Watches/Jewelry): ${verifyGlassesIn4[0].cnt} (Should be 0)`);

    const { rows: verifyHairIn2 } = await client.query(`
      SELECT COUNT(*) as cnt FROM products 
      WHERE category_id = 2 AND (
        name_ar ILIKE '%وصلة شعر%' OR name_ar ILIKE '%وصلات شعر%' OR 
        name_ar ILIKE '%شعر مستعار%' OR name_ar ILIKE '%باروكة%' OR 
        name_ar ILIKE '%ذيل حصان مجدول%' OR name_en ILIKE '%hair extension%'
      );
    `);
    console.log(`Hair extensions/wigs in Category 2: ${verifyHairIn2[0].cnt} (Should be 0)`);

    const { rows: verifyMenIn2 } = await client.query(`
      SELECT COUNT(*) as cnt FROM products 
      WHERE category_id = 2 AND (
        (name_ar ILIKE '%رجالي%' AND name_ar NOT ILIKE '%نسائي%') OR 
        (name_ar ILIKE '%للرجال%' AND name_ar NOT ILIKE '%للنساء%') OR
        name_ar ILIKE '%معطف رجل%'
      );
    `);
    console.log(`Men clothing in Category 2: ${verifyMenIn2[0].cnt} (Should be 0)`);

    const { rows: dist } = await client.query(`
      SELECT c.id, c.name_ar, COUNT(p.id) as count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.deleted_at IS NULL AND p.quantity > 0
      GROUP BY c.id, c.name_ar
      ORDER BY c.id;
    `);

    console.log("\n==================== UPDATED DISTRIBUTION ====================");
    console.table(dist.map(d => ({
      ID: d.id,
      Category: d.name_ar,
      Products: parseInt(d.count, 10)
    })));

  } catch (err) {
    console.error("Error in fixing distributions:", err);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

main();
