import { db, categories } from "@workspace/db";
import { isNull } from "drizzle-orm";

let categoryCache: { id: number; name_ar: string; name_en: string }[] | null = null;
let lastCacheTime = 0;

export async function getCategories(): Promise<{ id: number; name_ar: string; name_en: string }[]> {
  const now = Date.now();
  if (categoryCache && now - lastCacheTime < 60000) {
    return categoryCache;
  }
  const cats = await db.select().from(categories).where(isNull(categories.deleted_at));
  categoryCache = cats.map(c => ({ id: c.id, name_ar: c.name_ar, name_en: c.name_en }));
  lastCacheTime = now;
  return categoryCache || [];
}

// Map AliExpress category names directly to local category IDs (1..24)
export const ALI_OFFICIAL_CAT_ID_MAP: Record<string, number> = {
  // 1: Electronics & Smart Devices
  "electronics": 1,
  "smart devices": 1,
  "consumer electronics": 12,
  "electronic components & supplies": 1,
  "home audio & video": 12,

  // 2: Fashion & Style (Women's Clothing)
  "women's clothing": 2,
  "women clothing": 2,
  "dresses": 2,
  "women dresses": 2,
  "women's apparel": 2,
  "ladies clothing": 2,
  "abaya": 2,

  // 3: Smartphones & Accessories
  "phones & telecommunications": 3,
  "cellphones & telecommunications": 3,
  "mobile phones": 3,
  "phone accessories": 3,
  "mobile phone accessories": 3,

  // 4: Watches & Jewelry
  "watches": 4,
  "wristwatches": 4,
  "jewelry & accessories": 4,
  "jewelry": 4,
  "fine jewelry": 4,

  // 5: Home & Kitchen
  "home & garden": 5,
  "kitchen & dining": 5,
  "kitchen,dining & bar": 5,
  "home appliances": 5,
  "appliances": 5,

  // 6: Health & Beauty
  "beauty & health": 6,
  "makeup": 6,
  "skin care": 6,
  "personal care": 6,

  // 7: Sports & Outdoors
  "sports & entertainment": 7,
  "sports & outdoors": 7,
  "fitness": 7,

  // 8: Toys, Kids & Babies
  "mother & kids": 8,
  "toys & hobbies": 8,
  "baby clothing": 8,
  "kids toys": 8,

  // 9: Automotive & Motorcycles
  "automobiles & motorcycles": 9,
  "automobiles, parts & accessories": 9,
  "car electronics": 9,

  // 10: Shoes & Bags
  "luggage & bags": 10,
  "shoes": 10,
  "bags": 10,
  "women's shoes": 10,
  "men's shoes": 10,
  "backpacks": 10,

  // 11: Computers & Office
  "computer & office": 11,
  "computers & office": 11,
  "office electronics": 11,

  // 12: Consumer Electronics (Audio / Headphones)
  "earphones & headphones": 12,
  "audio": 12,

  // 13: Men's Fashion
  "men's clothing": 13,
  "men clothing": 13,
  "men's apparel": 13,

  // 14: Tools & Home Improvement
  "tools": 14,
  "tools & home improvement": 14,
  "home improvement": 14,

  // 15: Lights & Lighting
  "lights & lighting": 15,
  "lamps": 15,
  "led lighting": 15,

  // 16: Security & Protection
  "security & protection": 16,
  "surveillance": 16,

  // 17: Pet Supplies
  "pet products": 17,
  "pet supplies": 17,

  // 18: Office & School Supplies
  "education & office supplies": 18,
  "office & school supplies": 18,

  // 19: Furniture & Home Decor
  "furniture": 19,
  "furniture & home decor": 19,
  "home decor": 19,

  // 20: Cameras & Drones
  "cameras & drones": 20,
  "camera & photo": 20,
  "drones": 20,

  // 21: Smart Home & IoT
  "smart home & iot": 21,
  "smart electronics": 21,

  // 22: Hair Extensions & Wigs
  "hair extensions & wigs": 22,
  "wigs": 22,

  // 23: Event & Party Supplies
  "event & party supplies": 23,
  "festive & party supplies": 23,

  // 24: Arts, Crafts & Sewing
  "arts, crafts & sewing": 24,
};

// Ali Numeric ID Map
export const ALI_NUMERIC_CAT_ID_MAP: Record<string, number> = {
  "200000345": 2,  // Women's Clothing -> Fashion & Style
  "200000343": 13, // Men's Clothing -> Men's Fashion
  "1511": 4,       // Watches -> Watches & Jewelry
  "1509": 4,       // Jewelry -> Watches & Jewelry
  "509": 3,        // Phones -> Smartphones & Accessories
  "44": 12,        // Consumer Electronics -> Consumer Electronics
  "7": 11,         // Computer & Office -> Computers & Office
  "1524": 10,      // Luggage & Bags -> Shoes & Bags
  "322": 10,       // Shoes -> Shoes & Bags
  "1503": 5,        // Home & Garden -> Home & Kitchen
  "15": 5,          // Appliances -> Home & Kitchen
  "66": 6,          // Beauty & Health -> Health & Beauty
  "18": 7,          // Sports -> Sports & Outdoors
  "1501": 8,        // Mother & Kids -> Toys, Kids & Babies
  "200000297": 8,   // Toys & Hobbies -> Toys, Kids & Babies
  "34": 9,          // Automobiles -> Automotive & Motorcycles
  "1420": 14,       // Tools -> Tools & Home Improvement
  "39": 15,         // Lights -> Lights & Lighting
  "30": 16,         // Security -> Security & Protection
  "200000787": 18,  // Office & School -> Office & School Supplies
};

export interface CategoryRule {
  categoryId: number;
  categoryName: string;
  strongKeywords: string[]; // Massive score (+50)
  phrases: string[];        // High score (+25)
  words: string[];          // Moderate score (+10)
}

export const CATEGORY_RULES: CategoryRule[] = [
  // 2. Fashion & Style (Women's Fashion, Dresses, Skirts, Abayas) - HIGHEST PRIORITY FOR CLOTHING
  {
    categoryId: 2,
    categoryName: "أزياء وموضة",
    strongKeywords: [
      "فستان", "فساتين", "تنورة", "تنانير", "عباية", "عبايات", "بلوزة", "بلوزات", "لانجري",
      "قميص نوم", "روب نوم", "كورسيه", "حورية البحر", "فستان ماكسي", "فستان سهرة", "فستان صيفي",
      "dress", "dresses", "gown", "gowns", "skirt", "skirts", "blouse", "blouses", "lingerie",
      "corset", "maxi dress", "summer dress", "evening dress", "nightgown", "toleen", "huhugirl"
    ],
    phrases: [
      "فستان نسائ", "فستان أنيق", "فستان قصير", "فستان طويل", "فستان صيفي", "فستان سهرة", "ملابس نسائ",
      "طبعة زهور", "مكشوف الكتفين", "بدون أكمام", "ياقة مربعة", "حمالات بدون أكمام", "أكمام فقاعية",
      "عصري للنساء", "للسيدات", "حفلات بوهو", "أزياء شاطئية", "دانتيل شفاف", "حرير خالص",
      "women dress", "summer dress", "boho dress", "party dress", "floral dress", "sleeveless dress",
      "women skirt", "women blouse", "women shirt", "casual dress", "elegant dress"
    ],
    words: [
      "فستان", "فساتين", "عباية", "تنورة", "بلوزة", "لانجري", "كورسيه", "نسائية", "نسائي", "للسيدات",
      "dress", "dresses", "abaya", "skirt", "blouse", "women", "ladies"
    ]
  },

  // 4. Watches & Jewelry
  {
    categoryId: 4,
    categoryName: "ساعات ومجوهرات",
    strongKeywords: [
      "ساعة يد", "ساعة رجالي", "ساعة نسائ", "ساعة كوارتز", "ساعة أوتوماتيك", "ساعة ميكانيك",
      "خاتم فضة", "خاتم ذهب", "قلادة فضة", "قلادة ذهب", "سوار معصم", "أقراط أذن",
      "wrist watch", "quartz watch", "automatic watch", "silver ring", "gold necklace", "tennis bracelet"
    ],
    phrases: [
      "ساعة يد", "كرونوغراف", "طقم مجوهرات", "خاتم فضة", "سوار يد", "قلادة فضة", "سلسال رقبة",
      "حزام ساعة", "مجوهرات نسائ", "ألماس مويسانيتي", "silver ring", "gold necklace", "quartz watch",
      "chronograph", "pagani design", "naviforce", "curren", "watch strap"
    ],
    words: [
      "ساعة", "ساعات", "خاتم", "خواتم", "سوار", "أساور", "قلادة", "قلائد", "مجوهرات", "أقراط",
      "قرط", "دبلة", "بروش", "حلق", "سلسال", "watch", "watches", "quartz", "necklace", "bracelet",
      "earrings", "pendant", "jewellery", "jewelry"
    ]
  },

  // 10. Shoes & Bags
  {
    categoryId: 10,
    categoryName: "أحذية وحقائب",
    strongKeywords: [
      "حذاء رياضي", "حذاء نسائ", "حذاء رجالي", "حذاء ركض", "صندل نسائ", "كعب عالي", "بوت شتوي",
      "حقيبة ظهر", "حقيبة يد", "حقيبة كتف", "حقيبة سفر", "محفظة جلد", "شنطة نسائ", "شنطة سفر",
      "sneakers shoes", "running shoes", "leather boots", "high heels", "backpack", "shoulder bag",
      "handbag", "travel suitcase", "leather wallet"
    ],
    phrases: [
      "حقيبة ظهر", "حقيبة يد", "حقيبة سفر", "حقيبة كتف", "محفظة رجالي", "محفظة نسائ",
      "حذاء رياضي", "حذاء ركض", "صندل صيفي", "شنطة نسائ", "شنطة يد", "حقائب نسائ",
      "running shoes", "sneakers shoes", "leather wallet", "travel backpack", "shoulder bag",
      "crossbody bag", "tote bag", "ankle boots", "luggage suitcase", "card holder rfid"
    ],
    words: [
      "حذاء", "أحذية", "شوز", "سنيكرز", "صندل", "صنادل", "شبشب", "بوت", "كعب", "حقيبة", "حقائب",
      "شنطة", "شنط", "محفظة", "محافظ", "shoes", "sneakers", "boots", "sandals", "slippers", "backpack",
      "handbag", "wallet", "purse", "luggage", "suitcase"
    ]
  },

  // 12. Consumer Electronics (Audio / Earbuds / Speakers)
  {
    categoryId: 12,
    categoryName: "أجهزة إلكترونية استهلاكية",
    strongKeywords: [
      "سماعات بلوتوث", "سماعة بلوتوث", "سماعات لاسلكية", "ايربودز", "سبيكر بلوتوث", "مكبر صوت بلوتوث",
      "ميكروفون لاسلكي", "نظارات واقع افتراضي", "سماعات قيمنق",
      "bluetooth earbuds", "wireless earbuds", "tws earbuds", "bluetooth speaker", "gaming headset"
    ],
    phrases: [
      "سماعات بلوتوث", "سماعة بلوتوث", "سماعات لاسلكية", "مكبر صوت", "سبيكر بلوتوث", "ميكروفون لاسلكي",
      "نظارات ذكية", "نظارات واقع افتراضي", "مضخم صوت", "سماعات قيمنق", "عازل للضوضاء",
      "bluetooth speaker", "wireless earbuds", "tws earbuds", "noise cancelling", "gaming headset",
      "smart glasses", "vr headset", "sound bar", "audio amplifier"
    ],
    words: [
      "سماعة", "سماعات", "سبيكر", "ميكروفون", "ايربودز", "earbuds", "earphone", "headphone", "speaker",
      "headset", "microphone", "tws", "soundbar"
    ]
  },

  // 3. Smartphones & Accessories
  {
    categoryId: 3,
    categoryName: "هواتف ذكية وإكسسوارات",
    strongKeywords: [
      "كفر جوال", "كفر هاتف", "جراب هاتف", "جراب جوال", "واقي شاشة هاتف", "لاصق حماية شاشة",
      "شاحن هاتف", "شاحن سريع للجوال", "كابل شاحن ايفون", "باور بانك", "باوربانك", "حامل جوال",
      "phone case", "screen protector", "magsafe case", "power bank", "fast phone charger", "iphone case"
    ],
    phrases: [
      "كفر جوال", "كفر هاتف", "جراب هاتف", "حامل جوال", "حامل هاتف", "واقي شاشة", "شاحن هاتف",
      "شاحن سريع", "كابل شحن", "سلك شاحن", "باور بانك", "باوربانك", "لاصق حماية", "شاحن مغناطيسي",
      "phone case", "screen protector", "phone holder", "fast charger", "charging cable", "power bank",
      "wireless charger", "magsafe", "lightning cable", "type c cable"
    ],
    words: [
      "كفر", "جراب", "جوال", "هاتف", "آيفون", "ايفون", "سامسونج", "شاومي", "هواوي",
      "phone", "smartphone", "iphone", "samsung", "xiaomi"
    ]
  },

  // 13. Men's Fashion
  {
    categoryId: 13,
    categoryName: "أزياء وملابس رجالية",
    strongKeywords: [
      "قميص رجالي", "بنطلون رجالي", "هودي رجالي", "جاكيت رجالي", "بدلة رجالية", "معطف رجالي",
      "سروال رجالي", "تيشرت رجالي", "شورت رجالي", "شماغ رجالي", "ثوب رجالي",
      "men shirt", "men hoodie", "men jacket", "men pants", "men suit", "men blazer"
    ],
    phrases: [
      "قميص رجالي", "بنطلون رجالي", "هودي رجالي", "جاكيت رجالي", "بدلة رجالية", "ملابس رجالي",
      "سروال رجالي", "معطف رجالي", "تي شيرت رجالي", "ملابس داخلية رجالية",
      "men shirt", "men pants", "men hoodie", "men jacket", "men suit", "men blazer", "men t-shirt"
    ],
    words: [
      "رجالي", "هودي", "هوديز", "سروال", "بشت", "شماغ", "hoodie", "hoodies", "blazer"
    ]
  },

  // 24. Arts, Crafts & Sewing
  {
    categoryId: 24,
    categoryName: "فنون وحرف وخياطة",
    strongKeywords: [
      "ماكينة خياطة", "أقمشة خياطة", "خيوط حياكة", "صوف كروشيه", "طقم تطريز", "قاطع أقمشة",
      "مسطرة خياطة", "شفرات قطع أقمشة", "حصيرة قطع", "خرز تطريز", "إبر خياطة",
      "sewing machine", "knitting yarn", "crochet yarn", "embroidery kit", "rotary cutter", "cutting mat"
    ],
    phrases: [
      "ماكينة خياطة", "أقمشة خياطة", "خيوط حياكة", "صوف كروشيه", "طقم تطريز", "أدوات خياطة",
      "خياطة يدوية", "شفرات دوارة", "حصيرة قص", "أعمال حرفية", "خياطة وتطريز",
      "sewing machine", "knitting yarn", "crochet yarn", "embroidery kit", "rotary cutter", "sewing craft"
    ],
    words: [
      "خياطة", "تطريز", "كروشيه", "حياكة", "صوف", "خرز", "أقمشة", "sewing", "knitting", "crochet", "yarn", "fabric"
    ]
  },

  // 14. Tools & Home Improvement
  {
    categoryId: 14,
    categoryName: "أدوات وتحسين المنزل",
    strongKeywords: [
      "دريل كهربائي", "شنيور لاسلكي", "طقم مفكات", "مفتاح عزم", "ميزان ليزر", "مكواة لحام",
      "منشار كهربائي", "زرادية أدوات", "كماشة أسلاك", "متر ليزر",
      "cordless drill", "power drill", "screwdriver set", "socket wrench", "laser level", "soldering iron"
    ],
    phrases: [
      "دريل كهربائي", "شنيور لاسلكي", "طقم مفكات", "مفتاح عزم", "ميزان ليزر", "مكواة لحام",
      "منشار كهربائي", "أدوات يدوية", "مفتاح إنجليزي", "مسدس غراء", "معدات صيانة",
      "cordless drill", "screwdriver set", "socket wrench", "laser level", "soldering iron", "multimeter digital"
    ],
    words: [
      "دريل", "شنيور", "مفك", "مفكات", "زرادية", "منشار", "لحام", "سباكة", "drill", "screwdriver", "wrench", "pliers", "saw"
    ]
  },

  // 11. Computers & Office
  {
    categoryId: 11,
    categoryName: "كمبيوتر ولابتوب",
    strongKeywords: [
      "لوحة مفاتيح ميكانيكية", "فأرة ألعاب", "ماوس كمبيوتر", "حامل لابتوب", "محول يو اس بي",
      "لوحة كتابة إلكترونية", "شاشة لابتوب", "قاعدة تبريد لابتوب", "فلاش ميموري usb",
      "mechanical keyboard", "gaming mouse", "laptop stand", "usb hub", "type-c hub", "external ssd"
    ],
    phrases: [
      "لوحة مفاتيح", "فأرة كمبيوتر", "ماوس ألعاب", "حامل لابتوب", "محول يو اس بي", "فلاش ميموري",
      "شاشة كمبيوتر", "لوحة رسم", "قاعدة تبريد", "كاميرا ويب", "mechanical keyboard", "gaming mouse",
      "mouse pad", "laptop stand", "usb hub", "type-c hub", "external ssd", "flash drive"
    ],
    words: [
      "كمبيوتر", "لابتوب", "حاسوب", "ماوس", "كيبورد", "طابعة", "laptop", "desktop", "keyboard",
      "mousepad", "webcam", "printer", "monitor"
    ]
  },

  // 6. Health & Beauty
  {
    categoryId: 6,
    categoryName: "الصحة والجمال",
    strongKeywords: [
      "سيروم وجه", "كريم ترطيب", "أحمر شفاه", "فرشاة مكياج", "مسكرة رموش", "مكواة شعر",
      "مجفف شعر", "ماكينة حلاقة كهربائية", "تشذيب لحية", "عطر رجالي", "عطر نسائي", "طلاء أظافر",
      "skincare serum", "face cream", "makeup brush", "hair straightener", "electric shaver", "beard trimmer", "perfume"
    ],
    phrases: [
      "عناية بالبشرة", "كريم ترطيب", "سيروم وجه", "أحمر شفاه", "فرشاة مكياج", "مسكرة رموش",
      "مكواة شعر", "مجفف شعر", "ماكينة حلاقة", "تشذيب لحية", "عطر رجالي", "عطر نسائي",
      "skincare serum", "face cream", "makeup brush", "hair straightener", "hair dryer",
      "electric shaver", "beard trimmer", "perfume spray", "nail polish"
    ],
    words: [
      "مكياج", "أحمر شفاه", "مسكرة", "عطر", "عطور", "سيروم", "كريم", "شامبو", "حلاقة", "أظافر", "بشرة",
      "skincare", "serum", "lipstick", "mascara", "perfume", "fragrance", "makeup", "shaver", "trimmer"
    ]
  },

  // 20. Cameras & Drones
  {
    categoryId: 20,
    categoryName: "كاميرات وطائرات درون",
    strongKeywords: [
      "طائرة درون", "درون تصوير", "طائرة بدون طيار", "ترايبود كاميرا", "جيمبال مانع اهتزاز",
      "منظار تقريب", "تلسكوب فلكي", "كاميرا رياضية 4k",
      "rc drone", "drone 4k", "camera tripod", "gimbal stabilizer", "action camera", "telescope", "binoculars"
    ],
    phrases: [
      "طائرة درون", "طائرة بدون طيار", "ترايبود كاميرا", "حامل ثلاثي", "مانع اهتزاز", "عدسة كاميرا",
      "منظار رؤية", "تلسكوب فلكي", "كاميرا رياضية", "rc drone", "drone 4k", "camera tripod",
      "gimbal stabilizer", "binoculars", "telescope", "action camera"
    ],
    words: [
      "درون", "ترايبود", "جيمبال", "منظار", "تلسكوب", "drone", "drones", "quadcopter", "tripod", "gimbal", "telescope"
    ]
  },

  // 15. Lights & Lighting
  {
    categoryId: 15,
    categoryName: "إضاءة ومصابيح",
    strongKeywords: [
      "شريط ليد rgb", "إضاءة ليد ذكية", "مصباح مكتبي", "ثريا سقف", "مصباح طاقة شمسية", "كشاف ليد",
      "led strip rgb", "desk lamp", "ceiling light", "solar light", "neon sign", "chandelier"
    ],
    phrases: [
      "شريط ليد", "إضاءة ليد", "مصباح مكتبي", "ثريا سقف", "إضاءة ليلية", "سلسلة إضاءة", "مصباح طاقة شمسية",
      "كشاف ليد", "مصباح حائط", "إضاءة طاولة", "led strip", "rgb strip", "desk lamp", "night light",
      "string lights", "solar light", "ceiling light", "neon sign"
    ],
    words: [
      "إنارة", "إضاءة", "مصباح", "مصابيح", "لمبة", "لمبات", "ليد", "ثريا", "كشاف", "نيون",
      "lamp", "lamps", "lighting", "led", "chandelier", "flashlight", "bulb", "bulbs"
    ]
  },

  // 16. Security & Protection
  {
    categoryId: 16,
    categoryName: "أمان وحماية ذكية",
    strongKeywords: [
      "كاميرا مراقبة خارجية", "كاميرا أمان wifi", "قفل باب ذكي ببصمة", "جرس باب ذكي بالفيديو", "جهاز إنذار سرقة",
      "security camera wifi", "cctv camera", "smart door lock", "video doorbell", "alarm system"
    ],
    phrases: [
      "كاميرا مراقبة", "كاميرا أمان", "كاميرا واي فاي", "قفل باب ذكي", "قفل إلكتروني", "جرس باب ذكي",
      "جهاز إنذار", "كاشف دخان", "security camera", "cctv camera", "ip camera", "smart door lock",
      "video doorbell", "alarm system"
    ],
    words: [
      "مراقبة", "أمان", "إنذار", "cctv", "surveillance", "doorbell"
    ]
  },

  // 17. Pet Supplies
  {
    categoryId: 17,
    categoryName: "مستلزمات الحيوانات الأليفة",
    strongKeywords: [
      "طوق قطط", "طوق كلاب", "سرير قطط", "سرير كلاب", "ألعاب قطط", "نافورة قطط", "شجرة قطط", "حزام كلاب",
      "cat collar", "dog collar", "cat bed", "dog bed", "cat tree", "pet fountain"
    ],
    phrases: [
      "طوق قطط", "طوق كلاب", "سرير قطط", "سرير كلاب", "ألعاب قطط", "نافورة قطط", "رمل قطط",
      "فرشاة شعر قطط", "شجرة قطط", "ملابس كلاب", "pet collar", "cat bed", "dog bed", "cat toys",
      "pet fountain", "cat tree", "dog leash"
    ],
    words: [
      "قطط", "قطة", "كلاب", "كلب", "pet", "pets", "cat", "cats", "dog", "dogs", "puppy", "kitten"
    ]
  },

  // 18. Office & School Supplies
  {
    categoryId: 18,
    categoryName: "أدوات مكتبية ومدرسية",
    strongKeywords: [
      "طقم أقلام حبر", "دفتر ملاحظات جلدي", "مقلمة مدرسية", "ألوان تلوين مائية", "دباسة ورق مكتبية",
      "ballpoint pens", "notebook journal", "pencil case", "colored pencils", "office stapler"
    ],
    phrases: [
      "طقم أقلام", "دفتر ملاحظات", "مقلمة مدرسية", "ملصقات كيوت", "ورق ملاحظات", "أقلام حبر",
      "دباسة ورق", "أقلام تلوين", "ballpoint pen", "pencil case", "notebook journal", "sticky notes"
    ],
    words: [
      "دفتر", "دفاتر", "أقلام", "قرطاسية", "مقلمة", "ملصقات", "ستيكرات", "notebook", "stationery", "stickers"
    ]
  },

  // 19. Furniture & Home Decor
  {
    categoryId: 19,
    categoryName: "أثاث وديكور منزلي",
    strongKeywords: [
      "كرسي ألعاب قيمنق", "كرسي مكتب دوار", "طاولة طعام خشب", "طاولة شاي قهوة", "أريكة استرخاء كنب",
      "gaming chair", "office chair ergonomic", "coffee table", "sofa couch"
    ],
    phrases: [
      "كرسي ألعاب", "كرسي قيمنق", "كرسي مكتب", "طاولة طعام", "طاولة شاي", "أريكة استرخاء",
      "كنب صالة", "رف جداري", "gaming chair", "office chair", "dining table", "coffee table", "sofa couch"
    ],
    words: [
      "أريكة", "أثاث", "دولاب", "كنب", "sofa", "couch", "furniture", "wardrobe"
    ]
  },

  // 21. Smart Home & IoT
  {
    categoryId: 21,
    categoryName: "المنزل الذكي وإنترنت الأشياء",
    strongKeywords: [
      "مفتاح ذكي واي فاي", "قابس ذكي تويا", "فيش ذكي زيجبي", "مفتاح جداري ذكي",
      "tuya smart switch", "smart plug wifi", "zigbee smart plug", "sonoff switch"
    ],
    phrases: [
      "مفتاح ذكي", "قابس ذكي", "فيش ذكي", "حساس حركة ذكي", "تحكم ذكي", "smart switch", "smart plug",
      "smart socket", "tuya smart", "zigbee switch", "sonoff switch"
    ],
    words: [
      "تويا", "سونوف", "زيجبي", "tuya", "sonoff", "zigbee"
    ]
  },

  // 22. Hair Extensions & Wigs
  {
    categoryId: 22,
    categoryName: "وصلات وشعر مستعار",
    strongKeywords: [
      "باروكة شعر طبيعي", "باروكة دانتيل", "شعر مستعار كامل", "خصلات شعر طبيعي",
      "lace wig", "human hair wig", "synthetic wig", "hair extensions clip"
    ],
    phrases: [
      "شعر مستعار", "باروكة شعر", "خصلات شعر", "lace wig", "human hair wig", "hair extensions"
    ],
    words: [
      "باروكة", "باروكات", "wig", "wigs", "hairpiece"
    ]
  },

  // 23. Event & Party Supplies
  {
    categoryId: 23,
    categoryName: "مستلزمات الحفلات والمناسبات",
    strongKeywords: [
      "بالونات هيليوم", "قوس بالونات حفلات", "زينة عيد ميلاد سعيد", "زينة كيك حفلة",
      "party balloons", "balloon garland arch", "birthday party decor", "cake topper"
    ],
    phrases: [
      "بالونات هيليوم", "قوس بالونات", "زينة عيد ميلاد", "زينة حفلات", "party balloons", "balloon arch", "birthday decor"
    ],
    words: [
      "بالون", "بالونات", "balloon", "balloons", "confetti"
    ]
  },

  // 7. Sports & Outdoors
  {
    categoryId: 7,
    categoryName: "رياضة وترفيه",
    strongKeywords: [
      "أحزمة مقاومة تمارين", "بساط يوجا رياضي", "مسدس مساج عضلات", "حبل قفز رياضي", "خيمة تخييم خارجية",
      "resistance bands workout", "yoga mat fitness", "massage gun deep tissue", "camping tent waterproof"
    ],
    phrases: [
      "أحزمة مقاومة", "بساط يوجا", "مسدس مساج", "حبل قفز", "خيمة تخييم", "كيس نوم", "حقيبة رياضية",
      "دراجة هوائية", "دامبلز أوزان", "تمارين جيم", "لياقة بدنية",
      "resistance bands", "yoga mat", "massage gun", "jump rope", "camping tent", "sleeping bag"
    ],
    words: [
      "جيم", "لياقة", "يوجا", "تخييم", "دراجة", "دامبل", "تمارين", "رياضي", "fitness", "workout", "gym", "yoga", "camping", "cycling"
    ]
  },

  // 8. Toys, Kids & Babies
  {
    categoryId: 8,
    categoryName: "ألعاب وأطفال",
    strongKeywords: [
      "سيارة تحكم عن بعد rc", "مكعبات بناء أطفال", "دمية قطنية محشوة", "عربة أطفال قابلة للطي",
      "لهاية سيليكون أطفال", "حفاضات مواليد", "ملابس أطفال رضع",
      "rc car remote control", "building blocks kids", "plush doll toy", "baby stroller foldable", "baby romper"
    ],
    phrases: [
      "ملابس أطفال", "بيجامات أطفال", "طقم مواليد", "عربة أطفال", "حفاضات أطفال", "ألعاب أطفال",
      "سيارة تحكم عن بعد", "مكعبات بناء", "طائرة لعبة", "دمية قطنية", "لهاية أطفال", "رضاعة أطفال",
      "ألعاب رضع", "baby clothes", "kids pajamas", "baby romper", "baby stroller", "rc car", "building blocks"
    ],
    words: [
      "أطفال", "طفل", "رضيع", "مواليد", "ولادي", "بناتي", "حفاضات", "لهاية", "لعبة", "ألعاب", "دمية",
      "baby", "infant", "toddler", "kids", "toy", "toys", "puzzle", "doll", "stroller"
    ]
  },

  // 9. Automotive & Motorcycles
  {
    categoryId: 9,
    categoryName: "سيارات ودراجات نارية",
    strongKeywords: [
      "داش كام سيارة", "كاميرا سيارة أمامية", "شاحن سيارة سريع", "مضخة إطارات سيارة", "غطاء مقاعد سيارة",
      "حامل جوال للسيارة", "مكنسة سيارة لاسلكية",
      "car dash cam", "car charger fast", "tire inflator car", "car seat cover", "car phone holder"
    ],
    phrases: [
      "إكسسوارات سيارات", "كاميرا سيارة", "داش كام", "شاحن سيارة", "مضخة إطارات", "غطاء سيارة",
      "شاحن سيارات", "إضاءة سيارة", "مكنسة سيارة", "منفاخ إطارات", "مرآة سيارة", "حامل سيارة",
      "car dash cam", "car charger", "tire inflator", "car seat cover", "car led", "car vacuum"
    ],
    words: [
      "سيارة", "سيارات", "مركبة", "إطارات", "دراجة نارية", "car", "automobile", "vehicle", "motorcycle", "dashcam"
    ]
  },

  // 5. Home & Kitchen (Kitchen Gadgets, Home Utensils, Cookware)
  {
    categoryId: 5,
    categoryName: "المنزل والمطبخ",
    strongKeywords: [
      "طقم سكاكين مطبخ", "أواني طهي جرانيت", "مقلاة غير لاصقة", "فتاحة علب أوتوماتيك", "خلاط عصير محمول",
      "قلاية هوائية كهربائية", "صانعة قهوة اسبريسو", "غلاية ماء كهربائية", "علب تخزين طعام",
      "kitchen knife set", "cookware set", "frying pan non-stick", "can opener", "portable blender", "coffee maker"
    ],
    phrases: [
      "أدوات مطبخ", "طقم سكاكين", "أواني طهي", "وسائد سرير", "غطاء سرير", "ستائر نافذة",
      "مبخرة عطرية", "علب تخزين", "سلال تخزين", "كوب قهوة", "مكنسة كهربائية", "مكنسة روبوت",
      "قلاية هوائية", "ماكينة قهوة", "غلاية ماء", "مكواة بخار", "خلاط كهربائي",
      "kitchen knife", "knife set", "cookware set", "storage box", "coffee mug", "water bottle",
      "robot vacuum", "air fryer", "electric kettle"
    ],
    words: [
      "مطبخ", "سكين", "كوب", "صحن", "ستارة", "وسادة", "مبخرة", "منظم", "مكنسة", "قلاية", "غلاية", "خلاط",
      "kitchen", "cookware", "mug", "cushion", "pillow", "vacuum", "blender", "kettle"
    ]
  },

  // 1. Electronics & Smart Devices (Baseline Electronics)
  {
    categoryId: 1,
    categoryName: "إلكترونيات وأجهزة ذكية",
    strongKeywords: [
      "باور بانك شحن سريع", "محول طاقة ذكي", "شاشة عرض رقمية",
      "power bank 20000mah", "smart electronic device", "digital display tester"
    ],
    phrases: [
      "جهاز ذكي", "أجهزة إلكترونية", "باور بانك", "باوربانك", "محول طاقة", "شاحن لاسلكي",
      "smart device", "electronic gadget", "power bank", "digital meter"
    ],
    words: [
      "إلكترونيات", "إلكتروني", "electronics", "electronic"
    ]
  }
];

export async function matchCategoryId(
  text: string,
  providedCatId?: number | null,
  officialCatName?: string | null
): Promise<number | null> {
  const cats = await getCategories();
  if (!cats.length) return null;

  // 1. Check numeric category ID match if provided from AliExpress API
  if (providedCatId && providedCatId > 0) {
    if (ALI_NUMERIC_CAT_ID_MAP[String(providedCatId)]) {
      const targetId = ALI_NUMERIC_CAT_ID_MAP[String(providedCatId)];
      if (cats.some(c => c.id === targetId)) return targetId;
    }
    // If it's already a valid category ID in our DB
    const directMatch = cats.find(c => c.id === providedCatId);
    if (directMatch) return directMatch.id;
  }

  // 2. Direct match by AliExpress official category name
  if (officialCatName) {
    const normOfficial = officialCatName.trim().toLowerCase();
    const mappedTargetId = ALI_OFFICIAL_CAT_ID_MAP[normOfficial];
    if (mappedTargetId && cats.some(c => c.id === mappedTargetId)) {
      return mappedTargetId;
    }
  }

  // 3. Multi-layer intelligent semantic scoring
  const t = (text || "").toLowerCase();
  let bestCategoryId = 5; // Default: Home & Kitchen
  let maxScore = 0;

  for (const rule of CATEGORY_RULES) {
    let score = 0;

    // Check strong keywords (+50)
    for (const sk of rule.strongKeywords) {
      if (t.includes(sk.toLowerCase())) {
        score += 50;
      }
    }

    // Check multi-word phrases (+25)
    for (const phrase of rule.phrases) {
      if (t.includes(phrase.toLowerCase())) {
        score += 25;
      }
    }

    // Check individual words (+10)
    for (const w of rule.words) {
      const isArabic = /[\u0600-\u06FF]/.test(w);
      if (isArabic) {
        const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(^|[\\s،.,!?;:"'()\\[\\]{}/-])${escaped}([\\s،.,!?;:"'()\\[\\]{}/-]|$)`, 'i');
        if (re.test(t)) {
          score += 10;
        }
      } else {
        const re = new RegExp(`\\b${w}\\b`, 'i');
        if (re.test(t)) {
          score += 10;
        }
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestCategoryId = rule.categoryId;
    }
  }

  // Verify chosen category ID exists in DB
  const verifiedCat = cats.find(c => c.id === bestCategoryId);
  if (verifiedCat) return verifiedCat.id;

  return cats.find(c => c.id === 5)?.id || cats[0]?.id || 5;
}
