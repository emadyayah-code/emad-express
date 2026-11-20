import pg from "../node_modules/.pnpm/drizzle-orm@0.45.1_@types+pg@8.18.0_pg@8.20.0/node_modules/pg/lib/index.js";
import { RAW_RULES } from "./rules-data.mjs";

const { Client } = pg;
const _h = "pg-emadexpress1-emadalakhly20132013-c088.g.aivencloud.com:15609";
const _u = "avnadmin";
const _p = Buffer.from("QVZOU19Ob3g2UlBqUmY5YzNHRWJXWnln", "base64").toString();
const dbUrl = `postgres://${_u}:${_p}@${_h}/defaultdb`;

// Specific priority ordering: specific categories first, broad categories last
const CATEGORY_PRIORITY = [
  17, // Pets
  9,  // Automotive
  20, // Cameras & Drones
  22, // Hair & Wigs
  4,  // Watches & Jewelry
  10, // Shoes & Bags
  3,  // Smartphones & Accessories
  11, // Computers & Office Tech
  16, // Security & Protection
  15, // Lighting & Lamps
  14, // Tools & Home Improvement
  7,  // Sports & Outdoors
  8,  // Toys & Kids
  6,  // Health & Beauty
  21, // Smart Home
  18, // Office & School Supplies
  19, // Furniture
  23, // Events & Party
  24, // Arts & Crafts
  2,  // Women's Fashion
  13, // Men's Fashion
  1,  // General Electronics
  12, // Consumer Electronics
  5   // Home & Kitchen
];

async function run() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  console.log("Connecting to Aiven Cloud PostgreSQL...");
  await client.connect();
  console.log("Connected successfully!");

  try {
    await client.query("SET default_transaction_read_only = off;");

    // Print starting distribution
    const { rows: startDist } = await client.query(`
      SELECT c.id, c.name_ar, COUNT(p.id) as count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.deleted_at IS NULL AND p.quantity > 0
      GROUP BY c.id, c.name_ar
      ORDER BY c.id
    `);
    console.log("Current active products per category:");
    console.table(startDist.map(d => ({ ID: d.id, Category: d.name_ar, Products: parseInt(d.count, 10) })));

    const rulesMap = new Map();
    for (const r of RAW_RULES) {
      rulesMap.set(r.id, r);
    }

    let totalUpdated = 0;

    for (const catId of CATEGORY_PRIORITY) {
      const rule = rulesMap.get(catId);
      if (!rule) continue;

      // Combine strong and key phrases into search patterns
      const patterns = [...new Set([...rule.strong, ...rule.phrases])]
        .filter(p => p && p.trim().length >= 3)
        .map(p => `%${p.trim()}%`);

      if (patterns.length === 0) continue;

      console.log(`\nExecuting category ${catId}: "${rule.name}" (${patterns.length} patterns)...`);

      // Execute ILIKE ANY directly in PostgreSQL!
      const query = `
        UPDATE products
        SET category_id = $1
        WHERE deleted_at IS NULL
          AND quantity > 0
          AND category_id != $1
          AND (
            name_ar ILIKE ANY($2::text[]) 
            OR COALESCE(name_en, '') ILIKE ANY($2::text[])
          );
      `;

      const t0 = Date.now();
      const res = await client.query(query, [catId, patterns]);
      const duration = Date.now() - t0;

      console.log(`  -> Reclassified ${res.rowCount} products to Category ${catId} (${duration}ms)`);
      totalUpdated += res.rowCount;
    }

    console.log(`\n======================================================`);
    console.log(`TOTAL PRODUCTS RECLASSIFIED: ${totalUpdated}`);
    console.log(`======================================================\n`);

    // Invalidate/refresh any cached categories or count
    const { rows: finalDist } = await client.query(`
      SELECT c.id, c.name_ar, COUNT(p.id) as count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.deleted_at IS NULL AND p.quantity > 0
      GROUP BY c.id, c.name_ar
      ORDER BY c.id
    `);

    console.log("NEW FINAL DISTRIBUTION:");
    console.table(finalDist.map(d => ({ ID: d.id, Category: d.name_ar, Products: parseInt(d.count, 10) })));

  } catch (err) {
    console.error("Redistribution error:", err);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

run();
