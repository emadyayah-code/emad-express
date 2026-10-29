import pg from "../node_modules/.pnpm/drizzle-orm@0.45.1_@types+pg@8.18.0_pg@8.20.0/node_modules/pg/lib/index.js";
import { RAW_RULES } from "./fast-redistribute-all.mjs";

const { Pool } = pg;
const _h = "pg-emadexpress1-emadalakhly20132013-c088.g.aivencloud.com:15609";
const _u = "avnadmin";
const _p = Buffer.from("QVZOU19Ob3g2UlBqUmY5YzNHRWJXWnln", "base64").toString();
const dbUrl = `postgres://${_u}:${_p}@${_h}/defaultdb`;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

// Prepare rules with Lowercase sets and arrays
const OPTIMIZED_RULES = RAW_RULES.map(r => ({
  id: r.id,
  name: r.name,
  strong: r.strong.map(s => s.toLowerCase().trim()),
  phrases: r.phrases.map(p => p.toLowerCase().trim()),
  words: r.words.map(w => w.toLowerCase().trim())
}));

function fastClassifyWithSet(text) {
  const t = (text || "").toLowerCase();
  const tokens = new Set(t.split(/[\s،.,!?;:"'()[\]{}/\\_\-]+/).filter(Boolean));

  let best = null;
  let maxScore = 0;

  for (let i = 0; i < OPTIMIZED_RULES.length; i++) {
    const r = OPTIMIZED_RULES[i];
    let score = 0;

    for (let j = 0; j < r.strong.length; j++) {
      if (t.includes(r.strong[j])) score += 70;
    }
    for (let j = 0; j < r.phrases.length; j++) {
      if (t.includes(r.phrases[j])) score += 35;
    }
    for (let j = 0; j < r.words.length; j++) {
      if (tokens.has(r.words[j])) score += 15;
    }

    if (score > maxScore) {
      maxScore = score;
      best = r;
    }
  }

  return { bestId: best ? best.id : null, score: maxScore, bestName: best ? best.name : null };
}

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id, name_ar, name_en, category_id FROM products WHERE deleted_at IS NULL LIMIT 500");
    console.log(`Fetched ${res.rows.length} rows.`);

    console.time("classify-500");
    let matches = 0;
    for (const p of res.rows) {
      const text = `${p.name_ar || ""} ${p.name_en || ""}`;
      const { bestId, score } = fastClassifyWithSet(text);
      if (bestId && score >= 25) matches++;
    }
    console.timeEnd("classify-500");
    console.log(`Matched ${matches} / ${res.rows.length} products!`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
