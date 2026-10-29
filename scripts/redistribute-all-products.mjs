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

export const ALL_RULES = [
  // 17. Pet Supplies
  {
    id: 17,
    name: "مستلزمات الحيوانات الأليفة",
    strong: [
      "نافورة ماء للقطط", "نافورة مياه للقطط", "نافورة للحيوانات الأليفة", "موزع طعام أوتوماتيكي للقطط",
      "موزع مياه أوتوماتيكي للحيوانات", "فلتر نافورة القطط", "فلتر كربون لنافورة", "طوق قطط", "طوق كلاب",
      "سرير قطط", "سرير كلاب", "شجرة قطط", "خدوش قطط", "أحواض السمك", "مضخة أحواض", "مضخة ترشيح",
      "حمام طيور", "لوازم الطيور", "أقفاص طيور", "حوض استحمام ببغاء", "طعام قطط", "طعام كلاب",
      "cat water fountain", "pet water fountain", "pet food dispenser", "cat fountain filter",
      "dog collar", "cat collar", "cat tree", "aquarium pump", "bird bath", "pet supplies"
    ],
    phrases: [
      "نافورة ماء", "نافورة مياه", "نافورة القطط", "شرب القطط", "موزع طعام", "موزع مياه", "طعام الحيوانات",
      "فلتر نافورة", "أحواض السمك", "مضخة ترشيح", "رمل قطط", "لوازم الطيور", "حمام الطيور", "ملابس كلاب",
      "cat fountain", "pet feeder", "water dispenser pet", "aquarium filter", "dog harness"
    ],
    words: [
      "قطط", "قطة", "كلاب", "كلب", "ببغاء", "طيور", "حيوانات أليفة", "pet", "pets", "cat", "cats", "dog", "dogs", "aquarium", "bird"
    ]
  },

  // 9. Automotive & Motorcycles
  {
    id: 9,
    name: "سيارات ودراجات نارية",
    strong: [
      "داش كام", "كاميرا داش كام", "كاميرا لوحة القيادة", "جهاز تسجيل فيديو رقمي للسيارات", "كاميرا dvr للسيارة",
      "شاحن سيارة سريع", "مضخة إطارات سيارة", "منفاخ إطارات سيارة", "غطاء مقاعد سيارة", "حامل جوال للسيارة",
      "مكنسة سيارة لاسلكية", "مكنسة كهربائية للسيارة", "مرآة داش كام", "أضواء سيارات",
      "car dash cam", "car dvr 4k", "car charger fast", "tire inflator car", "car seat cover", "car phone holder", "car vacuum"
    ],
    phrases: [
      "كاميرا سيارة", "داش كام", "تسجيل فيديو رقمي للسيارات", "dvr للسيارة", "لوحة القيادة للسيارة",
      "شاحن سيارة", "منفاخ إطارات", "غطاء سيارة", "مكنسة سيارة", "إكسسوارات سيارات",
      "dash cam", "car dvr", "car charger", "tire inflator", "car vacuum cleaner"
    ],
    words: [
      "داش كام", "dashcam", "dvr"
    ]
  },

  // 3. Smartphones & Accessories
  {
    id: 3,
    name: "هواتف ذكية وإكسسوارات",
    strong: [
      "كفر جوال", "كفر هاتف", "جراب هاتف", "جراب جوال", "غطاء حماية شفاف مطفي مع حامل", "حافظة مقاومة للصدمات لآيفون",
      "واقي شاشة هاتف", "لاصق حماية شاشة", "شاحن هاتف", "شاحن سريع للجوال", "كابل شاحن ايفون", "باور بانك",
      "باوربانك", "حامل جوال", "حافظة هاتف", "كفر آيفون", "جراب سامسونج",
      "phone case", "screen protector", "magsafe case", "power bank", "fast phone charger", "iphone case", "shockproof case iphone"
    ],
    phrases: [
      "كفر جوال", "كفر هاتف", "جراب هاتف", "حامل جوال", "واقي شاشة", "كابل شحن", "سلك شاحن",
      "باور بانك", "باوربانك", "شاحن مغناطيسي", "حافظة مقاومة للصدمات", "غطاء حماية شفاف",
      "لآيفون 18", "لآيفون 17", "لآيفون 16", "لآيفون 15", "لآيفون 14", "لآيفون 13", "لآيفون 12",
      "phone case", "screen protector", "phone holder", "magsafe", "iphone 16", "iphone 15", "iphone 14"
    ],
    words: [
      "كفر", "جراب", "جوال", "آيفون", "ايفون", "smartphone"
    ]
  },

  // 11. Computers & Office
  {
    id: 11,
    name: "كمبيوتر ولابتوب",
    strong: [
      "لوحة مفاتيح ميكانيكية", "مفاتيح لوحة المفاتيح الميكانيكية", "مفتاح جاتيرون المغناطيسي", "أغطية مفاتيح لوحة المفاتيح",
      "فأرة ألعاب", "ماوس كمبيوتر", "حامل لابتوب", "وسادة مكتب", "وسادة ماوس كبيرة", "محول يو اس بي",
      "بطاقات الذاكرة sd", "بطاقة ذاكرة micro sd", "فلاش ميموري usb", "قرص صلب ssd", "لوحة مفاتيح ألعاب",
      "mechanical keyboard", "keyboard switches", "keycaps set", "gaming mouse", "laptop stand",
      "desk mouse pad", "mousepad large", "memory card sd", "micro sd card", "external ssd", "usb c hub"
    ],
    phrases: [
      "لوحة مفاتيح", "فأرة كمبيوتر", "ماوس ألعاب", "وسادة مكتب", "وسادة ماوس", "حامل لابتوب", "بطاقة ذاكرة",
      "فلاش ميموري", "مفاتيح ميكانيكية", "تشحيم لوحة المفاتيح",
      "mechanical keyboard", "keyboard switch", "mouse pad", "desk pad", "laptop stand", "sd card", "memory card"
    ],
    words: [
      "كمبيوتر", "لابتوب", "حاسوب", "كيبورد", "ماوس", "keyboard", "mousepad", "keycap", "keycaps"
    ]
  },

  // 22. Hair Extensions & Wigs
  {
    id: 22,
    name: "وصلات وشعر مستعار",
    strong: [
      "وصلة شعر", "وصلات شعر", "خصلات شعر", "شعر مستعار", "باروكة شعر", "كعكة شعر", "ذيل حصان",
      "شعر صناعي", "شعر طبيعي", "باروكات", "خصلة شعر", "شعر مجدول", "دانتيل شعر", "مشبك وصلات الشعر",
      "hair extension", "hair extensions", "ponytail", "hair bun", "wig", "wigs", "synthetic hair",
      "human hair", "hairpiece", "braided ponytail", "clip in hair", "hair topper"
    ],
    phrases: [
      "وصلة شعر", "وصلات شعر", "خصلات شعر", "شعر مستعار", "باروكة شعر", "كعكة شعر", "ذيل حصان",
      "شعر صناعي", "شعر طبيعي", "مشبك صناعي في وصلات الشعر", "قطعة شعر", "كعكة الشعر مخلب كليب",
      "hair extensions", "ponytail extension", "hair bun", "synthetic hair", "lace wig", "clip in hair"
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
      "حزام حامي الساعة", "حامي الساعة الذكية", "لساعة garmin", "حامل شحن بلاستيكي للساعات",
      "خاتم فضة", "خاتم ذهب", "قلادة فضة", "قلادة ذهب", "سوار معصم", "أقراط أذن", "نظارات شمسية",
      "wrist watch", "quartz watch", "automatic watch", "smartwatch", "smart watch", "watch case",
      "watch strap", "watch band", "watch charger", "silver ring", "gold necklace", "tennis bracelet", "sunglasses"
    ],
    phrases: [
      "ساعة يد", "ساعة كوارتز", "ساعة ذكية", "حزام ساعة", "غطاء حماية للساعة", "حامل شحن للساعات",
      "حامي الساعة", "خاتم فضة", "خاتم ذهب", "قلادة فضة", "سوار يد", "أقراط أذن", "نظارات شمسية",
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
      "مكبر صوت محمول", "مكبر صوت لاسلكي", "ميكروفون لاسلكي", "نظارات شمسية ذكية مزودة بتقنية البلوتوث",
      "نظارات بلوتوث", "أغطية عصا التحكم", "محرك اهتزاز لوحدة التحكم", "عصا تحكم ألعاب", "قبضة وحدة التحكم",
      "bluetooth earbuds", "wireless earbuds", "tws earbuds", "bluetooth speaker", "gaming headset",
      "smart audio glasses", "thumb grip caps", "controller grip", "analog stick caps"
    ],
    phrases: [
      "سماعات بلوتوث", "سماعة بلوتوث", "سماعات لاسلكية", "مكبر صوت", "سبيكر بلوتوث", "مكبر صوت محمول",
      "ميكروفون لاسلكي", "نظارات ذكية", "سماعات قيمنق", "عصا التحكم", "وحدة تحكم ألعاب", "محرك الاهتزاز",
      "bluetooth speaker", "wireless earbuds", "tws earbuds", "gaming headset", "smart glasses",
      "thumb grips", "game controller"
    ],
    words: [
      "سماعة", "سماعات", "سبيكر", "ميكروفون", "ايربودز", "earbuds", "earphone", "headphone", "speaker",
      "headset", "microphone", "tws", "soundbar", "joystick", "gamepad"
    ]
  },

  // 2. Women's Fashion & Style (Clothing, Dresses, Jackets, Denim, Cosplay)
  {
    id: 2,
    name: "أزياء وموضة",
    strong: [
      "فستان", "فساتين", "تنورة", "تنانير", "بلوزة", "بلوزات", "عباية", "عبايات", "قفطان",
      "لانجري", "كورسيه", "سترة معطف", "سترة دينم", "معطف المرأة", "سترة نسائ", "معطف نسائ",
      "جاكيت نسائ", "كنزة نسائ", "كارديجان نسائ", "بيجامة نسائ", "ملابس نوم نسائ", "أرواب نسائ",
      "ملابس نسائ", "بنطلون نسائ", "بناطيل نسائ", "جينز نسائ", "شورت نسائ", "قميص نسائ",
      "جمبسوت نسائ", "ملابس سباحة نسائ", "مايوه نسائ", "بكيني نسائ", "حمالة صدر", "أزياء كوسبلاي",
      "طقم نسائي", "بدلة نسائية", "ليوبارد طباعة", "دنيم سترة", "سترة شتوية للنساء", "سترة دينم مخملية",
      "خمر ليوبارد طباعة الدنيم معطف", "التطريز شرابة الدنيم سترة معطف",
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
      "أزياء الكوسبلاي", "سترة مخملية", "دنيم معطف",
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
      "طقم قميص وبنطلون خفيف الوزن للرجال",
      "men shirt", "men pants", "men jeans", "men jacket", "men coat", "men suit", "men blazer",
      "men hoodie", "men shorts", "men underwear", "men clothing"
    ],
    phrases: [
      "قميص رجالي", "بنطلون رجالي", "جينز رجالي", "جاكيت رجالي", "بدلة رجالي", "ملابس رجالية",
      "هودي رجالي", "معطف رجالي", "شورت رجالي", "تيشيرت رجالي", "طقم رجالي", "لرجال باللونين",
      "men shirt", "men pants", "men jacket", "men suit", "men hoodie", "men shorts"
    ],
    words: [
      "رجالي", "شماغ", "بشت", "ثوب"
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

  // 15. Lights & Lighting
  {
    id: 15,
    name: "إضاءة ومصابيح",
    strong: [
      "شريط ليد rgb", "إضاءة ليد ذكية", "مصباح مكتبي", "ثريا سقف", "مصباح طاقة شمسية", "كشاف ليد",
      "led strip rgb", "desk lamp", "ceiling light", "solar light", "neon sign", "chandelier"
    ],
    phrases: [
      "شريط ليد", "إضاءة ليد", "مصباح مكتبي", "ثريا سقف", "إضاءة ليلية", "مصباح طاقة شمسية",
      "كشاف ليد", "led strip", "rgb strip", "desk lamp", "night light", "solar light"
    ],
    words: [
      "إنارة", "إضاءة", "مصباح", "مصابيح", "لمبة", "لمبات", "ليد", "ثريا", "كشاف", "نيون",
      "lamp", "lamps", "lighting", "led", "chandelier", "flashlight"
    ]
  },

  // 16. Security & Protection
  {
    id: 16,
    name: "أمان وحماية ذكية",
    strong: [
      "كاميرا مراقبة خارجية", "كاميرا أمان wifi", "قفل باب ذكي ببصمة", "جرس باب ذكي بالفيديو",
      "security camera wifi", "cctv camera", "smart door lock", "video doorbell", "alarm system"
    ],
    phrases: [
      "كاميرا مراقبة", "كاميرا أمان", "كاميرا واي فاي", "قفل باب ذكي", "جرس باب ذكي",
      "security camera", "cctv camera", "smart door lock"
    ],
    words: [
      "مراقبة", "cctv", "surveillance", "doorbell"
    ]
  },

  // 14. Tools & Home Improvement
  {
    id: 14,
    name: "أدوات وتحسين المنزل",
    strong: [
      "دريل كهربائي", "شنيور لاسلكي", "طقم مفكات", "مفتاح عزم", "ميزان ليزر", "مكواة لحام", "منشار كهربائي",
      "cordless drill", "power drill", "screwdriver set", "socket wrench", "laser level", "soldering iron"
    ],
    phrases: [
      "دريل كهربائي", "طقم مفكات", "مفتاح عزم", "ميزان ليزر", "مكواة لحام", "منشار كهربائي",
      "cordless drill", "screwdriver set", "socket wrench"
    ],
    words: [
      "دريل", "شنيور", "مفك", "مفكات", "زرادية", "منشار", "لحام", "drill", "screwdriver", "wrench"
    ]
  },

  // 21. Smart Home & IoT
  {
    id: 21,
    name: "المنزل الذكي وإنترنت الأشياء",
    strong: [
      "مفتاح ذكي واي فاي", "قابس ذكي تويا", "فيش ذكي زيجبي", "مفتاح جداري ذكي", "مقبس تحكم رقمي في درجة الحرارة",
      "منظم حرارة رقمي", "حساس حركة ذكي",
      "tuya smart switch", "smart plug wifi", "zigbee smart plug", "sonoff switch", "temperature controller socket"
    ],
    phrases: [
      "مفتاح ذكي", "قابس ذكي", "فيش ذكي", "منظم حرارة", "حساس حركة", "تحكم ذكي",
      "smart switch", "smart plug", "tuya smart", "zigbee switch"
    ],
    words: [
      "تويا", "سونوف", "زيجبي", "tuya", "sonoff", "zigbee"
    ]
  },

  // 23. Event & Party Supplies
  {
    id: 23,
    name: "مستلزمات الحفلات والمناسبات",
    strong: [
      "بالونات هيليوم", "قوس بالونات حفلات", "زينة عيد ميلاد سعيد", "زينة كيك حفلة",
      "party balloons", "balloon garland arch", "birthday party decor", "cake topper"
    ],
    phrases: [
      "بالونات هيليوم", "قوس بالونات", "زينة عيد ميلاد", "زينة حفلات", "party balloons", "birthday decor"
    ],
    words: [
      "بالون", "بالونات", "balloon", "balloons", "confetti"
    ]
  },

  // 24. Arts, Crafts & Sewing
  {
    id: 24,
    name: "فنون وحرف وخياطة",
    strong: [
      "ماكينة خياطة", "أقمشة خياطة", "خيوط حياكة", "صوف كروشيه", "طقم تطريز", "قاطع أقمشة",
      "sewing machine", "knitting yarn", "crochet yarn", "embroidery kit", "rotary cutter"
    ],
    phrases: [
      "ماكينة خياطة", "أقمشة خياطة", "خيوط حياكة", "طقم تطريز", "أدوات خياطة", "خياطة يدوية",
      "sewing machine", "knitting yarn", "crochet yarn", "embroidery kit"
    ],
    words: [
      "خياطة", "تطريز", "كروشيه", "حياكة", "sewing", "knitting", "crochet"
    ]
  },

  // 8. Toys, Kids & Babies
  {
    id: 8,
    name: "ألعاب وأطفال",
    strong: [
      "سيارة تحكم عن بعد rc", "مكعبات بناء أطفال", "دمية قطنية محشوة", "عربة أطفال قابلة للطي",
      "لهاية سيليكون أطفال", "حفاضات مواليد", "ملابس أطفال رضع",
      "rc car remote control", "building blocks kids", "plush doll toy", "baby stroller", "baby romper"
    ],
    phrases: [
      "ملابس أطفال", "بيجامات أطفال", "طقم مواليد", "عربة أطفال", "حفاضات أطفال", "ألعاب أطفال",
      "baby clothes", "baby stroller", "rc car", "building blocks"
    ],
    words: [
      "أطفال", "رضيع", "مواليد", "لهاية", "دمية", "baby", "infant", "toddler"
    ]
  },

  // 20. Cameras & Drones
  {
    id: 20,
    name: "كاميرات وطائرات درون",
    strong: [
      "طائرة درون", "درون تصوير", "طائرة بدون طيار", "ترايبود كاميرا", "جيمبال مانع اهتزاز", "منظار تقريب",
      "rc drone", "drone 4k", "camera tripod", "gimbal stabilizer", "action camera", "telescope", "binoculars"
    ],
    phrases: [
      "طائرة درون", "ترايبود كاميرا", "حامل ثلاثي", "مانع اهتزاز", "منظار رؤية", "تلسكوب فلكي",
      "rc drone", "camera tripod", "gimbal stabilizer", "binoculars"
    ],
    words: [
      "درون", "ترايبود", "جيمبال", "تلسكوب", "drone", "drones", "quadcopter", "tripod", "gimbal"
    ]
  },

  // 19. Furniture & Home Decor
  {
    id: 19,
    name: "أثاث وديكور منزلي",
    strong: [
      "كرسي ألعاب قيمنق", "كرسي مكتب دوار", "طاولة طعام خشب", "أريكة استرخاء كنب", "زينة مكتبية مخصصة من الأكريليك",
      "gaming chair", "office chair ergonomic", "coffee table", "sofa couch"
    ],
    phrases: [
      "كرسي ألعاب", "كرسي قيمنق", "كرسي مكتب", "طاولة طعام", "أريكة استرخاء", "كنب صالة",
      "gaming chair", "office chair", "dining table", "sofa couch"
    ],
    words: [
      "أريكة", "أثاث", "دولاب", "كنب", "sofa", "couch", "furniture"
    ]
  },

  // 5. Genuine Home & Kitchen (ONLY kitchen, cooking, dining, food preparation, home cleaning)
  {
    id: 5,
    name: "المنزل والمطبخ",
    strong: [
      "طقم سكاكين مطبخ", "أواني طهي جرانيت", "مقلاة غير لاصقة", "فتاحة علب أوتوماتيك", "خلاط عصير محمول",
      "قلاية هوائية كهربائية", "صانعة قهوة اسبريسو", "ماكينة قهوة نينجا", "ماكينة قهوة إسبريسو",
      "ماكينة قهوة ذكية", "ماكينة قهوة محمولة", "صنع القهوة التركية", "وعاء موكا وعاء", "غلاية ماء كهربائية",
      "علب تخزين طعام", "خلاط رغوة الحليب", "خفاقة حليب كهربائية", "كوب قهوة كهربائي ذاتي الخلط",
      "آلة صنع حليب الصويا", "قطع غيار مكنسة كهربائية", "مكنسة كهربائية روبوتية", "فوهة تنجيد الأثاث",
      "كوب ماء شفاف بتصميم أنمي", "كوب ماء", "كوب قهوة", "فنجان قهوة", "وعاء موكا",
      "kitchen knife set", "cookware set", "frying pan non-stick", "can opener", "milk frother mixer",
      "portable blender", "coffee maker", "espresso machine", "electric kettle", "robot vacuum cleaner parts"
    ],
    phrases: [
      "أدوات مطبخ", "طقم سكاكين", "أواني طهي", "أطباق طعام", "علب تخزين", "كوب قهوة", "فنجان قهوة",
      "كوب ماء", "قلاية هوائية", "ماكينة قهوة", "صانعة قهوة", "صنع القهوة", "ماكينة إسبريسو",
      "غلاية ماء", "مكواة بخار", "خلاط كهربائي", "خفاقة حليب", "صانعة حليب", "مكنسة كهربائية",
      "مكنسة روبوت", "قطع غيار مكنسة", "مبخرة عود", "فوهة تنجيد", "وعاء موكا",
      "kitchen knife", "cookware set", "air fryer", "coffee maker", "espresso coffee", "milk frother", "vacuum cleaner"
    ],
    words: [
      "مطبخ", "طهي", "طبخ", "مقلاة", "قدور", "سكين", "خلاط", "قلاية", "غلاية", "عصارة", "مفرمة",
      "صحن", "أطباق", "فنجان", "صينية", "ترمس", "مكنسة", "ممسحة", "cookware", "blender", "kettle", "vacuum"
    ]
  },

  // 1. Electronics & Smart Devices (Baseline Electronics)
  {
    id: 1,
    name: "إلكترونيات وأجهزة ذكية",
    strong: [
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

export function classifyText(text) {
  const t = (text || "").toLowerCase();
  let best = null;
  let maxScore = 0;

  for (const r of ALL_RULES) {
    let score = 0;
    for (const sk of r.strong) {
      if (t.includes(sk.toLowerCase())) score += 70;
    }
    for (const p of r.phrases) {
      if (t.includes(p.toLowerCase())) score += 35;
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

  return { bestId: best ? best.id : null, score: maxScore, bestName: best ? best.name : null };
}

async function main() {
  console.log("=== STARTING FULL PAGINATED PRODUCT RE-DISTRIBUTION ===");
  const client = await pool.connect();
  try {
    let lastId = 0;
    let totalProcessed = 0;
    let totalUpdated = 0;
    let fromCat5Updated = 0;

    while (true) {
      const res = await client.query(
        "SELECT id, name_ar, name_en, category_id FROM products WHERE deleted_at IS NULL AND id > $1 ORDER BY id ASC LIMIT 500",
        [lastId]
      );
      if (res.rows.length === 0) break;

      const chunk = res.rows;
      lastId = chunk[chunk.length - 1].id;
      totalProcessed += chunk.length;

      const updates = [];
      for (const p of chunk) {
        const text = `${p.name_ar || ""} ${p.name_en || ""}`;
        const { bestId, score } = classifyText(text);

        if (bestId && score >= 30 && bestId !== p.category_id) {
          updates.push({ id: p.id, newCat: bestId });
          if (p.category_id === 5) fromCat5Updated++;
          totalUpdated++;
        }
      }

      if (updates.length > 0) {
        const caseClauses = updates.map(u => `WHEN id = ${u.id} THEN ${u.newCat}`).join(" ");
        const idList = updates.map(u => u.id).join(",");
        await client.query(`
          UPDATE products
          SET category_id = CASE ${caseClauses} END
          WHERE id IN (${idList})
        `);
      }

      process.stdout.write(`Processed ${totalProcessed} products... (Re-assigned ${totalUpdated} items, ${fromCat5Updated} from Home & Kitchen)\r`);
    }

    console.log(`\n\n=== RE-DISTRIBUTION FINISHED! ===`);
    console.log(`Total Products Examined: ${totalProcessed}`);
    console.log(`Total Products Re-assigned: ${totalUpdated}`);
    console.log(`Products Cleaned from Home & Kitchen (Cat 5): ${fromCat5Updated}`);

    // Final Distribution
    const finalCounts = await client.query(`
      SELECT category_id, COUNT(*) as count
      FROM products
      WHERE deleted_at IS NULL
      GROUP BY category_id
      ORDER BY category_id ASC
    `);
    console.log("\n--- Final Category Distribution After Optimization ---");
    finalCounts.rows.forEach(r => console.log(`Category ID ${r.category_id}: ${r.count} products`));

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
