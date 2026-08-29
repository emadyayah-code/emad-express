import { db, categories } from "@workspace/db";
import { isNull } from "drizzle-orm";

let categoryCache: { id: number; name_ar: string; name_en: string }[] | null = null;
let lastCacheTime = 0;

export const CATEGORY_RULES: { keywords: string[]; categoryName: string }[] = [
  { keywords: ["هاتف", "جوال", "ايفون", "سامسونج", "شاحن", "كابل", "كفر", "حامل هاتف", "شاشة حماية", "phone", "iphone", "samsung", "charger", "cable", "case", "holder"], categoryName: "هواتف ذكية وملحقاتها" },
  { keywords: ["سماعة", "سماعات", "بلوتوث", "ميكروفون", "سبيكر", "مكبر صوت", "headphone", "earphone", "earbud", "bluetooth", "microphone", "speaker", "tws", "audio"], categoryName: "إلكترونيات استهلاكية" },
  { keywords: ["كمبيوتر", "لابتوب", "ماوس", "لوحة مفاتيح", "كيبورد", "طابعة", "usb", "laptop", "mouse", "keyboard", "printer", "drive", "pc", "computer", "desk"], categoryName: "أجهزة كمبيوتر ومكاتب" },
  { keywords: ["كاميرا", "درون", "طائرة درون", "تصوير", "عدسة", "ترايبود", "camera", "drone", "lens", "tripod", "photo", "gopro"], categoryName: "كاميرات وبصريات وطائرات درون" },
  { keywords: ["ذكي", "واي فاي", "حساس", "سمارت", "مفتاح ذكي", "smart home", "iot", "wifi switch", "sensor", "tuya", "sonoff"], categoryName: "أجهزة ذكية وإنترنت الأشياء" },
  { keywords: ["ساعة", "خاتم", "سوار", "قلادة", "مجوهرات", "سلسال", "قرط", "watch", "smartwatch", "ring", "bracelet", "necklace", "jewelry", "pendant"], categoryName: "ساعات ومجوهرات وإكسسوارات" },
  { keywords: ["حذاء", "شوز", "حقيبة", "شنطة", "محفظة", "حقائب", "shoes", "sneakers", "boots", "bag", "handbag", "wallet", "backpack"], categoryName: "حقائب وأحذية" },
  { keywords: ["فستان", "بلوزة", "عباية", "تنورة", "نسائي", "نسائية", "dress", "women", "skirt", "blouse", "abaya"], categoryName: "أزياء وملابس نسائية" },
  { keywords: ["قميص", "بنطلون", "هودي", "سترة", "رجالي", "رجالية", "shirt", "pants", "hoodie", "jacket", "men", "male"], categoryName: "أزياء وملابس رجالية" },
  { keywords: ["مطبخ", "حديقة", "ديكور", "سكين", "طنجرة", "صحن", "كوب", "منظم", "kitchen", "garden", "decor", "knife", "pan", "cup", "organizer", "hook", "hanger"], categoryName: "المنزل والحديقة والمطبخ" },
  { keywords: ["قلاية", "مكنسة", "خلاط", "غلاية", "ماكينة قهوة", "مكواة", "appliance", "air fryer", "vacuum", "blender", "kettle", "coffee maker", "iron"], categoryName: "أجهزة منزلية كهربائية" },
  { keywords: ["مكياج", "عناية", "عطر", "بشرة", "أحمر شفاه", "مسكرة", "كريم", "makeup", "beauty", "perfume", "skin", "lipstick", "cream", "mascara"], categoryName: "الجمال والصحة والعناية الشخصية" },
  { keywords: ["لعبة", "ألعاب", "أطفال", "رضع", "عربة طفل", "دمية", "toy", "toys", "kids", "baby", "doll", "puzzle"], categoryName: "ألعاب وأطفال ورضع" },
  { keywords: ["رياضة", "لياقة", "تخييم", "دراجة", "جيم", "تمرين", "كرة", "sport", "fitness", "camping", "bicycle", "gym", "workout", "ball"], categoryName: "رياضة ولياقة بدنية وخارجية" },
  { keywords: ["سيارة", "سيارات", "دراجة نارية", "زيت", "موتور", "car", "motorcycle", "auto", "vehicle", "dash cam"], categoryName: "سيارات ودراجات نارية وقطع غيار" },
  { keywords: ["دريل", "مفك", "شنيور", "أداة", "أدوات", "قياس", "سباكة", "drill", "screwdriver", "tool", "tools", "plumbing"], categoryName: "تحسين المنزل والعدد والأدوات" },
  { keywords: ["إنارة", "إضاءة", "لمبة", "ليد", "مصباح", "led", "light", "lamp", "lighting", "bulb", "rgb"], categoryName: "أضواء وإنارة ذكية" },
  { keywords: ["مراقبة", "إنذار", "قفل ذكي", "أمان", "حماية", "security", "alarm", "surveillance", "lock", "cctv"], categoryName: "أمن وحماية وكاميرات مراقبة" },
  { keywords: ["قطط", "كلاب", "حيوانات أليفة", "طوق", "قفص", "pet", "cat", "dog", "collar", "leash"], categoryName: "مستلزمات الحيوانات الأليفة" },
  { keywords: ["دفتر", "قلم", "مكتبية", "مدرسية", "قرطاسية", "pen", "notebook", "stationery", "school"], categoryName: "أدوات مكتبية ومدرسية" },
  { keywords: ["كرسي", "طاولة", "كنب", "أثاث", "رف", "chair", "table", "sofa", "furniture", "shelf"], categoryName: "أثاث وديكور منزلي" },
  { keywords: ["باروكة", "شعر مستعار", "خصلة", "wig", "hair extension", "wigs"], categoryName: "شعر مستعار وباروكات" },
  { keywords: ["بالون", "حفلة", "مناسبة", "زينة أعياد", "balloon", "party", "celebration", "costume"], categoryName: "مستلزمات الحفلات والمناسبات" },
  { keywords: ["خياطة", "قماش", "صوف", "خرز", "تطريز", "sewing", "fabric", "yarn", "beads", "craft"], categoryName: "أقمشة وحرف يدوية وخياطة" },
];

async function getCategories() {
  const now = Date.now();
  if (categoryCache && now - lastCacheTime < 60000) {
    return categoryCache;
  }
  const cats = await db.select().from(categories).where(isNull(categories.deleted_at));
  categoryCache = cats.map(c => ({ id: c.id, name_ar: c.name_ar, name_en: c.name_en }));
  lastCacheTime = now;
  return categoryCache;
}

export async function matchCategoryId(text: string, providedCatId?: number | null): Promise<number | null> {
  if (providedCatId && providedCatId > 0) return providedCatId;
  const cats = await getCategories();
  if (!cats.length) return null;

  const normalized = (text || "").toLowerCase();

  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        const found = cats.find(c => c.name_ar === rule.categoryName || c.name_en.toLowerCase() === rule.categoryName.toLowerCase());
        if (found) return found.id;
      }
    }
  }

  return cats[0]?.id || null;
}
