import pg from "../node_modules/.pnpm/drizzle-orm@0.45.1_@types+pg@8.18.0_pg@8.20.0/node_modules/pg/lib/index.js";

const { Pool } = pg;
const _h = "pg-emadexpress1-emadalakhly20132013-c088.g.aivencloud.com:15609";
const _u = "avnadmin";
const _p = Buffer.from("QVZOU19Ob3g2UlBqUmY5YzNHRWJXWnln", "base64").toString();
const dbUrl = `postgres://${_u}:${_p}@${_h}/defaultdb`;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log("Connecting to database to update AliExpress settings...");
  const client = await pool.connect();
  try {
    const settings = [
      { key: "aliexpress_app_key", value: "555548" },
      { key: "aliexpress_app_key_secret", value: "WLqFlGAOCfvn4uyS0RmXmwjAR9uvU4qZ" },
      { key: "aliexpress_tracking_id", value: "Default" },
    ];

    for (const s of settings) {
      await client.query(
        `INSERT INTO platform_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, updated_at = NOW();`,
        [s.key, s.value]
      );
      console.log(`✓ Updated setting: ${s.key} = ${s.value}`);
    }

    const res = await client.query(
      `SELECT key, value, updated_at FROM platform_settings WHERE key LIKE 'aliexpress%';`
    );
    console.log("Current DB Settings in platform_settings:", res.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Error updating settings:", err);
  process.exit(1);
});
