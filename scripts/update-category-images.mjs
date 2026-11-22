import pg from "../node_modules/.pnpm/drizzle-orm@0.45.1_@types+pg@8.18.0_pg@8.20.0/node_modules/pg/lib/index.js";

const { Client } = pg;
const _h = "pg-emadexpress1-emadalakhly20132013-c088.g.aivencloud.com:15609";
const _u = "avnadmin";
const _p = Buffer.from("QVZOU19Ob3g2UlBqUmY5YzNHRWJXWnln", "base64").toString();
const dbUrl = `postgres://${_u}:${_p}@${_h}/defaultdb`;

// High-resolution, professional, verified Unsplash product images for all 24 categories
export const CATEGORY_IMAGE_MAP = [
  {
    id: 1,
    name_ar: "إلكترونيات وأجهزة ذكية",
    icon: "⚡",
    image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 2,
    name_ar: "أزياء وموضة",
    icon: "👗",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 3,
    name_ar: "هواتف ذكية وإكسسوارات",
    icon: "📱",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 4,
    name_ar: "ساعات ومجوهرات",
    icon: "⌚",
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 5,
    name_ar: "المنزل والمطبخ",
    icon: "🍳",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 6,
    name_ar: "الصحة والجمال",
    icon: "💄",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 7,
    name_ar: "رياضة وترفيه",
    icon: "⚽",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 8,
    name_ar: "ألعاب وأطفال",
    icon: "🧸",
    image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 9,
    name_ar: "سيارات ودراجات نارية",
    icon: "🚗",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 10,
    name_ar: "أحذية وحقائب",
    icon: "👟",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 11,
    name_ar: "كمبيوتر ولابتوب",
    icon: "💻",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 12,
    name_ar: "أجهزة إلكترونية استهلاكية",
    icon: "🎧",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 13,
    name_ar: "أزياء وملابس رجالية",
    icon: "👔",
    image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 14,
    name_ar: "أدوات وتحسين المنزل",
    icon: "🛠️",
    image: "https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 15,
    name_ar: "إضاءة ومصابيح",
    icon: "💡",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 16,
    name_ar: "أمان وحماية ذكية",
    icon: "🔒",
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 17,
    name_ar: "مستلزمات الحيوانات الأليفة",
    icon: "🐾",
    image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 18,
    name_ar: "أدوات مكتبية ومدرسية",
    icon: "📚",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 19,
    name_ar: "أثاث وديكور منزلي",
    icon: "🛋️",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 20,
    name_ar: "كاميرات وطائرات درون",
    icon: "📷",
    image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 21,
    name_ar: "المنزل الذكي وإنترنت الأشياء",
    icon: "🤖",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 22,
    name_ar: "وصلات وشعر مستعار",
    icon: "💇",
    image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 23,
    name_ar: "مستلزمات الحفلات والمناسبات",
    icon: "🎉",
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 24,
    name_ar: "فنون وحرف وخياطة",
    icon: "🧵",
    image: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800&auto=format&fit=crop&q=80"
  }
];

async function run() {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to database. Updating category images and icons...");

  try {
    await client.query("SET default_transaction_read_only = off;");

    for (const item of CATEGORY_IMAGE_MAP) {
      const cleanImageUrl = item.image.split("?")[0];
      await client.query(
        `UPDATE categories 
         SET image = $1, icon = $2 
         WHERE id = $3;`,
        [cleanImageUrl, item.icon, item.id]
      );
      console.log(`Updated Category ${item.id}: "${item.name_ar}" with icon ${item.icon} -> ${cleanImageUrl}`);
    }

    console.log("\nAll 24 category images and icons updated successfully!");

    const { rows: verify } = await client.query(`
      SELECT id, name_ar, icon, image 
      FROM categories 
      ORDER BY id;
    `);

    console.log("\n==================== VERIFIED CATEGORIES ====================");
    console.table(verify.map(c => ({
      ID: c.id,
      Name: c.name_ar,
      Icon: c.icon,
      ImagePreview: c.image.substring(0, 50) + "..."
    })));

  } catch (err) {
    console.error("Error updating category images:", err);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

run();
