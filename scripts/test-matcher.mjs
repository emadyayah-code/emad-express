import pg from "../node_modules/.pnpm/drizzle-orm@0.45.1_@types+pg@8.18.0_pg@8.20.0/node_modules/pg/lib/index.js";

const { Pool } = pg;
const _h = "pg-emadexpress1-emadalakhly20132013-c088.g.aivencloud.com:15609";
const _u = "avnadmin";
const _p = Buffer.from("QVZOU19Ob3g2UlBqUmY5YzNHRWJXWnln", "base64").toString();
const dbUrl = `postgres://${_u}:${_p}@${_h}/defaultdb`;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

// Category definition rules
const RULES = [
  // 2. Women's Fashion & Style
  {
    id: 2,
    name: "أزياء وموضة",
    strong: [
      "فستان", "فساتين", "تنورة", "تنانير", "بلوزة", "بلوزات", "عباية", "عبايات", "قفطان",
      "لانجري", "كورسيه", "سترة معطف", "سترة دينم", "معطف المرأة", "سترة نسائ", "معطف نسائ",
      "جاكيت نسائ", "كنزة نسائ", "كارديجان نسائ", "بيجامة نسائ", "ملابس نوم نسائ", "أرواب نسائ",
      "ملابس نسائ", "بنطلون نسائ", "بناطيل نسائ", "جينز نسائ", "شورت نسائ", "قميص نسائ",
      "جمبسوت نسائ", "ملابس سباحة نسائ", "مايوه نسائ", "بكيني نسائ", "حمالة صدر", "أزياء كوسبلاي",
      "طقم نسائي", "بدلة نسائية", "ليوبارد طباعة", "دنيم سترة", "سترة شتوية للنساء",
      "dress", "dresses", "gown", "skirt", "skirts", "blouse", "blouses", "lingerie",
      "corset", "nightgown", "women coat", "women jacket", "denim jacket women", "women jeans",
      "women pants", "women sweater", "women cardigan", "women blazer", "women pajamas",
      "zoki", "elfsack", "shein", "toleen", "huhugirl", "chaquet", "chaqueta", "cosplay costume"
    ],
    phrases: [
      "سترة معطف", "معطف شتوي", "سترة دينم", "سترة صوفية", "معطف نسائي", "جاكيت شتوي",
      "جاكيت نسائي", "بنطلون جينز", "ملابس نسائية", "أزياء نسائية", "أزياء سيدات", "بلوزة صيفية",
      "كارديجان صوف", "بيجامة حرير", "ملابس داخلية نسائية", "حمالات صدر", "ملابس سباحة",
      "فستان سهرة", "فستان صيفي", "فستان قصير", "فستان طويل", "طبعة ليوبارد", "أزياء تنكرية",
      "women jacket", "women coat", "denim jacket", "casual dress", "evening dress", "women trousers",
      "women hoodie", "women blouse", "women clothes", "party dress", "y2k style"
    ],
    words: [
      "فستان", "فساتين", "تنورة", "تنانير", "بلوزة", "بلوزات", "عباية", "عبايات", "قفطان",
      "سترة", "معطف", "جاكيت", "توب", "لانجري", "كورسيه", "كارديجان", "كنزة", "جمبسوت",
      "بكيني", "سيدات", "المرأة", "نسائي", "نسائية", "بناتي", "dress", "dresses", "skirt",
      "blouse", "jacket", "coat", "sweater", "cardigan", "blazer", "corset", "lingerie",
      "pajamas", "pyjamas", "jumpsuit", "swimwear", "bikini", "leggings", "women", "ladies"
    ]
  },

  // 13. Men's Fashion
  {
    id: 13,
    name: "أزياء وملابس رجالية",
    strong: [
      "قميص رجالي", "بنطلون رجالي", "جينز رجالي", "جاكيت رجالي", "معطف رجالي", "سترة رجالية",
      "بدلة رجالية", "هودي رجالي", "سويت شيرت رجالي", "شورت رجالي", "ملابس نوم رجالي", "بيجامة رجالي",
      "ملابس داخلية رجالي", "شماغ", "بشت", "ثوب رجالي", "ملابس رجالي", "أزياء رجالية", "طقم رجالي",
      "men shirt", "men pants", "men jeans", "men jacket", "men coat", "men suit", "men blazer",
      "men hoodie", "men shorts", "men underwear", "men clothing"
    ],
    phrases: [
      "قميص رجالي", "بنطلون رجالي", "جينز رجالي", "جاكيت رجالي", "بدلة رجالي", "ملابس رجالية",
      "هودي رجالي", "معطف رجالي", "شورت رجالي", "تيشيرت رجالي", "طقم رجالي",
      "men shirt", "men pants", "men jacket", "men suit", "men hoodie", "men shorts"
    ],
    words: [
      "رجالي", "شماغ", "بشت", "ثوب"
    ]
  },

  // 22. Hair Extensions & Wigs
  {
    id: 22,
    name: "وصلات وشعر مستعار",
    strong: [
      "وصلة شعر", "وصلات شعر", "خصلات شعر", "شعر مستعار", "باروكة شعر", "كعكة شعر",
      "ذيل حصان", "شعر صناعي", "شعر طبيعي", "باروكات", "خصلة شعر", "شعر مجدول", "دانتيل شعر",
      "hair extension", "hair extensions", "ponytail", "hair bun", "wig", "wigs", "synthetic hair",
      "human hair", "hairpiece", "braided ponytail", "clip in hair", "hair topper"
    ],
    phrases: [
      "وصلة شعر", "وصلات شعر", "خصلات شعر", "شعر مستعار", "باروكة شعر", "كعكة شعر صناعية",
      "ذيل حصان مجدول", "شعر صناعي بمشبك", "خصلة شعر ملونة", "شعر دانتيل",
      "hair extensions", "ponytail extension", "hair bun", "synthetic hair", "lace wig"
    ],
    words: [
      "باروكة", "باروكات", "wig", "wigs", "ponytail", "hairpiece"
    ]
  },

  // 4. Watches & Jewelry
  {
    id: 4,
    name: "ساعات ومجوهرات",
    strong: [
      "ساعة يد", "ساعات يد", "ساعة كوارتز", "ساعة أوتوماتيك", "ساعة ميكانيك", "ساعة رجالي",
      "ساعة نسائ", "غطاء حماية للساعة", "حامل شحن للساعة", "حزام ساعة", "سوار ساعة", "كفر ساعة",
      "خاتم فضة", "خاتم ذهب", "قلادة فضة", "قلادة ذهب", "سوار معصم", "أقراط أذن", "نظارات شمسية",
      "wrist watch", "quartz watch", "automatic watch", "smartwatch", "smart watch", "watch case",
      "watch strap", "watch band", "watch charger", "silver ring", "gold necklace", "tennis bracelet", "sunglasses"
    ],
    phrases: [
      "ساعة يد", "ساعة كوارتز", "ساعة ذكية", "حزام ساعة", "غطاء حماية للساعة", "حامل شحن للساعات",
      "خاتم فضة", "خاتم ذهب", "قلادة فضة", "سوار يد", "أقراط أذن", "نظارات شمسية",
      "wrist watch", "quartz watch", "watch strap", "watch band", "smartwatch", "silver ring",
      "gold necklace", "sunglasses men", "sunglasses women"
    ],
    words: [
      "ساعة", "ساعات", "خاتم", "خواتم", "سوار", "أساور", "قلادة", "قلائد", "مجوهرات", "أقراط",
      "قرط", "دبلة", "بروش", "حلق", "سلسال", "watch", "watches", "quartz", "necklace", "bracelet",
      "earrings", "pendant", "jewellery", "jewelry", "sunglasses"
    ]
  },

  // 12. Consumer Electronics (Audio, Earbuds, Speakers, Gaming)
  {
    id: 12,
    name: "أجهزة إلكترونية استهلاكية",
    strong: [
      "سماعات بلوتوث", "سماعة بلوتوث", "سماعات لاسلكية", "ايربودز", "سبيكر بلوتوث", "مكبر صوت بلوتوث",
      "مكبر صوت محمول", "مكبر صوت لاسلكي", "ميكروفون لاسلكي", "نظارات شمسية ذكية", "نظارات بلوتوث",
      "أغطية عصا التحكم", "محرك اهتزاز لوحدة التحكم", "عصا تحكم ألعاب", "قبضة وحدة التحكم",
      "bluetooth earbuds", "wireless earbuds", "tws earbuds", "bluetooth speaker", "gaming headset",
      "smart audio glasses", "thumb grip caps", "controller grip"
    ],
    phrases: [
      "سماعات بلوتوث", "سماعة بلوتوث", "سماعات لاسلكية", "مكبر صوت", "سبيكر بلوتوث", "مكبر صوت محمول",
      "ميكروفون لاسلكي", "نظارات ذكية", "سماعات قيمنق", "عصا التحكم", "وحدة تحكم ألعاب",
      "bluetooth speaker", "wireless earbuds", "tws earbuds", "gaming headset", "smart glasses",
      "thumb grips", "game controller"
    ],
    words: [
      "سماعة", "سماعات", "سبيكر", "ميكروفون", "ايربودز", "earbuds", "earphone", "headphone", "speaker",
      "headset", "microphone", "tws", "soundbar", "joystick", "gamepad"
    ]
  },

  // 10. Shoes & Bags
  {
    id: 10,
    name: "أحذية وحقائب",
    strong: [
      "حذاء رياضي", "حذاء نسائ", "حذاء رجالي", "حذاء ركض", "صندل نسائ", "كعب عالي", "بوت شتوي",
      "حقيبة ظهر", "حقيبة يد", "حقيبة كتف", "حقيبة سفر", "محفظة جلد", "شنطة نسائ", "شنطة سفر",
      "sneakers shoes", "running shoes", "leather boots", "high heels", "backpack", "shoulder bag",
      "handbag", "travel suitcase", "leather wallet"
    ],
    phrases: [
      "حقيبة ظهر", "حقيبة يد", "حقيبة سفر", "حقيبة كتف", "محفظة رجالي", "محفظة نسائ",
      "حذاء رياضي", "حذاء ركض", "صندل صيفي", "شنطة نسائ", "شنطة يد", "حقائب نسائ",
      "running shoes", "sneakers shoes", "leather wallet", "travel backpack", "shoulder bag",
      "crossbody bag", "tote bag", "ankle boots", "luggage suitcase"
    ],
    words: [
      "حذاء", "أحذية", "شوز", "سنيكرز", "صندل", "صنادل", "شبشب", "بوت", "كعب", "حقيبة", "حقائب",
      "شنطة", "شنط", "محفظة", "محافظ", "shoes", "sneakers", "boots", "sandals", "slippers", "backpack",
      "handbag", "wallet", "purse", "luggage", "suitcase"
    ]
  },

  // 7. Sports & Outdoors
  {
    id: 7,
    name: "رياضة وترفيه",
    strong: [
      "زجاجة مياه رياضية", "زجاجات مياه للرياضة", "موقد غاز سخان التخييم", "خيمة تخييم خارجية",
      "أحزمة مقاومة تمارين", "بساط يوجا رياضي", "مسدس مساج عضلات", "حبل قفز رياضي", "كيس نوم تخييم",
      "sports water bottle", "camping stove gas", "resistance bands workout", "yoga mat fitness", "camping tent"
    ],
    phrases: [
      "زجاجة مياه رياضية", "زجاجة مياه للرياضة", "موقد تخييم", "خيمة تخييم", "كيس نوم", "أحزمة مقاومة",
      "بساط يوجا", "مسدس مساج", "لياقة بدنية", "sports water bottle", "camping tent", "resistance bands"
    ],
    words: [
      "يوجا", "تخييم", "دامبل", "لياقة", "fitness", "workout", "gym", "yoga", "camping"
    ]
  },

  // 11. Computers & Office
  {
    id: 11,
    name: "كمبيوتر ولابتوب",
    strong: [
      "لوحة مفاتيح ميكانيكية", "فأرة ألعاب", "ماوس كمبيوتر", "حامل لابتوب", "وسادة مكتب للماوس",
      "وسادة ماوس كبيرة", "محول يو اس بي", "قاعدة تبريد لابتوب", "فلاش ميموري usb",
      "mechanical keyboard", "gaming mouse", "laptop stand", "desk mouse pad", "mousepad large", "usb hub"
    ],
    phrases: [
      "لوحة مفاتيح", "فأرة كمبيوتر", "ماوس ألعاب", "وسادة مكتب", "وسادة ماوس", "حامل لابتوب",
      "mouse pad", "desk pad", "laptop stand", "usb hub"
    ],
    words: [
      "كمبيوتر", "لابتوب", "ماوس", "كيبورد", "طابعة", "laptop", "keyboard", "mousepad"
    ]
  },

  // 6. Health & Beauty
  {
    id: 6,
    name: "الصحة والجمال",
    strong: [
      "وعاء تنظيف فرش المكياج", "فرشاة مكياج", "سيروم وجه", "كريم ترطيب", "أحمر شفاه",
      "مسكرة رموش", "مكواة شعر", "مجفف شعر", "ماكينة حلاقة كهربائية", "عطر رجالي", "عطر نسائي",
      "makeup brush cleaner", "skincare serum", "face cream", "electric shaver", "hair straightener"
    ],
    phrases: [
      "تنظيف فرش المكياج", "فرشاة مكياج", "عناية بالبشرة", "كريم ترطيب", "سيروم وجه", "أحمر شفاه",
      "ماكينة حلاقة", "مجفف شعر", "makeup brush", "skincare serum", "hair dryer", "electric shaver"
    ],
    words: [
      "مكياج", "أحمر شفاه", "مسكرة", "عطر", "عطور", "سيروم", "كريم", "شامبو", "حلاقة", "أظافر", "بشرة",
      "skincare", "serum", "lipstick", "mascara", "perfume", "makeup", "shaver"
    ]
  },

  // 5. Genuine Home & Kitchen
  {
    id: 5,
    name: "المنزل والمطبخ",
    strong: [
      "طقم سكاكين مطبخ", "أواني طهي جرانيت", "مقلاة غير لاصقة", "فتاحة علب أوتوماتيك", "خلاط عصير محمول",
      "قلاية هوائية كهربائية", "صانعة قهوة اسبريسو", "ماكينة قهوة نينجا", "غلاية ماء كهربائية", "علب تخزين طعام",
      "خلاط رغوة الحليب", "خفاقة حليب كهربائية", "كوب قهوة كهربائي ذاتي الخلط", "آلة صنع حليب الصويا",
      "قطع غيار مكنسة كهربائية", "مكنسة كهربائية روبوتية", "فوهة تنجيد الأثاث",
      "kitchen knife set", "cookware set", "frying pan non-stick", "can opener", "milk frother mixer",
      "portable blender", "coffee maker", "electric self stirring mug", "robot vacuum cleaner parts"
    ],
    phrases: [
      "أدوات مطبخ", "طقم سكاكين", "أواني طهي", "أطباق طعام", "علب تخزين", "كوب قهوة", "فنجان قهوة",
      "قلاية هوائية", "ماكينة قهوة", "صانعة قهوة", "غلاية ماء", "مكواة بخار", "خلاط كهربائي",
      "خفاقة حليب", "صانعة حليب", "مكنسة كهربائية", "مكنسة روبوت", "قطع غيار مكنسة", "مبخرة عود",
      "kitchen knife", "cookware set", "air fryer", "coffee maker", "milk frother", "vacuum cleaner"
    ],
    words: [
      "مطبخ", "طهي", "طبخ", "مقلاة", "قدور", "سكين", "خلاط", "قلاية", "غلاية", "عصارة", "مفرمة",
      "صحن", "أطباق", "فنجان", "صينية", "ترمس", "مكنسة", "ممسحة", "cookware", "blender", "kettle", "vacuum"
    ]
  }
];

function scoreProduct(title) {
  const t = (title || "").toLowerCase();
  let best = null;
  let maxScore = 0;

  for (const r of RULES) {
    let score = 0;
    for (const sk of r.strong) {
      if (t.includes(sk.toLowerCase())) score += 60;
    }
    for (const p of r.phrases) {
      if (t.includes(p.toLowerCase())) score += 30;
    }
    for (const w of r.words) {
      const isArabic = /[\u0600-\u06FF]/.test(w);
      if (isArabic) {
        const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(^|[\\s،.,!?;:"'()\\[\\]{}/-])${escaped}([\\s،.,!?;:"'()\\[\\]{}/-]|$)`, 'i');
        if (re.test(t)) score += 15;
      } else {
        const re = new RegExp(`\\b${w}\\b`, 'i');
        if (re.test(t)) score += 15;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      best = r;
    }
  }
  return { best, score: maxScore };
}

async function run() {
  const client = await pool.connect();
  try {
    const cat5Sample = await client.query(`
      SELECT id, name_ar, name_en
      FROM products
      WHERE category_id = 5 AND deleted_at IS NULL
      LIMIT 100
    `);

    console.log(`Testing 100 products from Category 5:`);
    let movedCount = 0;
    cat5Sample.rows.forEach(p => {
      const text = `${p.name_ar} ${p.name_en}`;
      const { best, score } = scoreProduct(text);
      if (best && best.id !== 5 && score >= 30) {
        movedCount++;
        console.log(`[ID ${p.id}] -> SHOULD BE CAT ${best.id} (${best.name}) [Score: ${score}] | Title: ${p.name_ar.slice(0, 50)}`);
      } else if (best && best.id === 5) {
        console.log(`[ID ${p.id}] -> KEEPS CAT 5 (Home & Kitchen) [Score: ${score}] | Title: ${p.name_ar.slice(0, 50)}`);
      } else {
        console.log(`[ID ${p.id}] -> Unsure [Score: ${score}] | Title: ${p.name_ar.slice(0, 50)}`);
      }
    });

    console.log(`\nResults: ${movedCount}/100 products correctly identified as belonging to other categories!`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
