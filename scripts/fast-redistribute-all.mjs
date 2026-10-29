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

export const CATEGORIES_SYNC = [
  { id: 1, name_ar: "إلكترونيات وأجهزة ذكية", name_en: "Electronics & Smart Devices", icon: "⚡" },
  { id: 2, name_ar: "أزياء وموضة", name_en: "Fashion & Style", icon: "👗" },
  { id: 3, name_ar: "هواتف ذكية وإكسسوارات", name_en: "Smartphones & Accessories", icon: "📱" },
  { id: 4, name_ar: "ساعات ومجوهرات", name_en: "Watches & Jewelry", icon: "⌚" },
  { id: 5, name_ar: "المنزل والمطبخ", name_en: "Home & Kitchen", icon: "🍳" },
  { id: 6, name_ar: "الصحة والجمال", name_en: "Health & Beauty", icon: "💄" },
  { id: 7, name_ar: "رياضة وترفيه", name_en: "Sports & Outdoors", icon: "⚽" },
  { id: 8, name_ar: "ألعاب وأطفال", name_en: "Toys, Kids & Babies", icon: "🧸" },
  { id: 9, name_ar: "سيارات ودراجات نارية", name_en: "Automotive & Motorcycles", icon: "🚗" },
  { id: 10, name_ar: "أحذية وحقائب", name_en: "Shoes & Bags", icon: "👟" },
  { id: 11, name_ar: "كمبيوتر ولابتوب", name_en: "Computers & Office", icon: "💻" },
  { id: 12, name_ar: "أجهزة إلكترونية استهلاكية", name_en: "Consumer Electronics", icon: "🎧" },
  { id: 13, name_ar: "أزياء وملابس رجالية", name_en: "Men's Fashion", icon: "👔" },
  { id: 14, name_ar: "أدوات وتحسين المنزل", name_en: "Tools & Home Improvement", icon: "🛠️" },
  { id: 15, name_ar: "إضاءة ومصابيح", name_en: "Lights & Lighting", icon: "💡" },
  { id: 16, name_ar: "أمان وحماية ذكية", name_en: "Security & Protection", icon: "🔒" },
  { id: 17, name_ar: "مستلزمات الحيوانات الأليفة", name_en: "Pet Supplies", icon: "🐾" },
  { id: 18, name_ar: "أدوات مكتبية ومدرسية", name_en: "Office & School Supplies", icon: "📚" },
  { id: 19, name_ar: "أثاث وديكور منزلي", name_en: "Furniture & Home Decor", icon: "🛋️" },
  { id: 20, name_ar: "كاميرات وطائرات درون", name_en: "Cameras & Drones", icon: "📷" },
  { id: 21, name_ar: "المنزل الذكي وإنترنت الأشياء", name_en: "Smart Home & IoT", icon: "🤖" },
  { id: 22, name_ar: "وصلات وشعر مستعار", name_en: "Hair Extensions & Wigs", icon: "💇" },
  { id: 23, name_ar: "مستلزمات الحفلات والمناسبات", name_en: "Event & Party Supplies", icon: "🎉" },
  { id: 24, name_ar: "فنون وحرف وخياطة", name_en: "Arts, Crafts & Sewing", icon: "🧵" },
];

export const RAW_RULES = [
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
      "مكنسة سيارة لاسلكية", "مكنسة كهربائية للسيارة", "مرآة داش كام", "أضواء سيارات", "لمرسيدس بنز",
      "لسيارات فولكس", "لسيارة فولكس", "لسيارة فولفو", "لسيارات بيجو", "مسجل فيديو للسيارة",
      "car dash cam", "car dvr 4k", "car charger fast", "tire inflator car", "car seat cover", "car phone holder", "car vacuum"
    ],
    phrases: [
      "كاميرا سيارة", "داش كام", "تسجيل فيديو رقمي للسيارات", "dvr للسيارة", "لوحة القيادة للسيارة",
      "شاحن سيارة", "منفاخ إطارات", "غطاء سيارة", "مكنسة سيارة", "إكسسوارات سيارات", "مرآة داش",
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
      "باوربانك", "بنك طاقة مغناطيسي", "بنك طاقة", "حامل جوال", "حافظة هاتف", "كفر آيفون", "جراب سامسونج",
      "حامل مغناطيسي دوار", "حافظة مقاومة للصدمات",
      "phone case", "screen protector", "magsafe case", "power bank", "fast phone charger", "iphone case", "shockproof case iphone"
    ],
    phrases: [
      "كفر جوال", "كفر هاتف", "جراب هاتف", "حامل جوال", "واقي شاشة", "كابل شحن", "سلك شاحن",
      "باور بانك", "باوربانك", "بنك طاقة", "شاحن مغناطيسي", "حافظة مقاومة للصدمات", "غطاء حماية شفاف",
      "لآيفون 18", "لآيفون 17", "لآيفون 16", "لآيفون 15", "لآيفون 14", "لآيفون 13", "لآيفون 12", "لآيفون 11",
      "phone case", "screen protector", "phone holder", "magsafe", "iphone 16", "iphone 15", "iphone 14", "power bank"
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
      "فأرة ألعاب", "ماوس كمبيوتر", "حامل لابتوب", "وسادة مكتب", "وسادة ماوس كبيرة", "وسادة مكتب لطيفة",
      "لوحات لوحة المفاتيح", "لوحة مفاتيح الألعاب", "لوحة المفاتيح التشحيم", "محول يو اس بي",
      "بطاقات الذاكرة sd", "بطاقة ذاكرة micro sd", "بطاقات ذاكرة sd", "فلاش ميموري usb", "قرص صلب ssd",
      "mechanical keyboard", "keyboard switches", "keycaps set", "gaming mouse", "laptop stand",
      "desk mouse pad", "mousepad large", "memory card sd", "micro sd card", "external ssd", "usb c hub"
    ],
    phrases: [
      "لوحة مفاتيح", "فأرة كمبيوتر", "ماوس ألعاب", "وسادة مكتب", "وسادة ماوس", "حامل لابتوب", "بطاقة ذاكرة",
      "بطاقات ذاكرة", "فلاش ميموري", "مفاتيح ميكانيكية", "تشحيم لوحة المفاتيح", "سدادات مفاتيح",
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
      "وصلات الشعر للنساء", "وصلة شعر صناعية", "وصلات شعر صناعية", "وصلات شعر طبيعي", "كعكة شعر صناعية",
      "hair extension", "hair extensions", "ponytail", "hair bun", "wig", "wigs", "synthetic hair",
      "human hair", "hairpiece", "braided ponytail", "clip in hair", "hair topper"
    ],
    phrases: [
      "وصلة شعر", "وصلات شعر", "خصلات شعر", "شعر مستعار", "باروكة شعر", "كعكة شعر", "ذيل حصان",
      "شعر صناعي", "شعر طبيعي", "مشبك صناعي في وصلات الشعر", "قطعة شعر", "كعكة الشعر مخلب كليب", "ذيل حصان مجدول",
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
      "حزام حامي الساعة", "حامي الساعة الذكية", "لساعة garmin", "حامل شحن بلاستيكي للساعات", "حامل شحن بلاستيكي ثابت للساعات",
      "خاتم فضة", "خاتم ذهب", "قلادة فضة", "قلادة ذهب", "سوار معصم", "أقراط أذن",
      "نظارات شمسية مربعة", "نظارات شمسية فاخرة", "نظارات شمسية أنيقة", "نظارات شمسية مستقطبة", "نظارات شمسية",
      "wrist watch", "quartz watch", "automatic watch", "smartwatch", "smart watch", "watch case",
      "watch strap", "watch band", "watch charger", "silver ring", "gold necklace", "tennis bracelet", "sunglasses"
    ],
    phrases: [
      "ساعة يد", "ساعة كوارتز", "ساعة ذكية", "حزام ساعة", "غطاء حماية للساعة", "حامل شحن للساعات",
      "حامي الساعة", "خاتم فضة", "خاتم ذهب", "قلادة فضة", "سوار يد", "أقراط أذن", "نظارات شمسية", "نظارات شمسيه",
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
      "أغطية عصا التحكم لجهاز إكس بوكس", "محرك الاهتزاز الأيسر والأيمن لجهاز", "شريط قبضة وحدة التحكم",
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
      "طقم نسائي", "بدلة نسائية", "ليوبارد طباعة", "دنيم سترة", "سترة شتوية للنساء", "سترة دينم مخملية",
      "خمر ليوبارد طباعة الدنيم معطف", "التطريز شرابة الدنيم سترة معطف", "أزياء الكوسبلاي القديمة",
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
      "زجاجة ماء معزولة من الفولاذ", "زجاجات مياه للرياضة الملونة", "زجاجة مياه رياضية محمولة",
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

  // 18. Office & School Supplies
  {
    id: 18,
    name: "أدوات مكتبية ومدرسية",
    strong: [
      "دفاتر مدرسة", "أقلام حبر جاف", "حقيبة مدرسية للأطفال", "أدوات هندسية", "مبراة أقلام كهربائية",
      "school notebook", "gel pens set", "pencil case", "electric pencil sharpener"
    ],
    phrases: [
      "دفتر ملاحظات", "أقلام تلوين", "مستلزمات مكتبية", "حقيبة مدرسية", "أدوات مدرسية",
      "stationery set", "school supplies", "pen pencil set"
    ],
    words: [
      "دفتر", "أقلام", "براية", "ممحاة", "مسطرة", "notebook", "stationery"
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

// Pre-compile lowercase keywords and words for O(1) Set lookup
const COMPILED_RULES = RAW_RULES.map(r => ({
  id: r.id,
  name: r.name,
  strongLower: r.strong.map(s => s.toLowerCase().trim()),
  phrasesLower: r.phrases.map(p => p.toLowerCase().trim()),
  wordsLower: r.words.map(w => w.toLowerCase().trim())
}));

export function fastClassifyText(text) {
  const t = (text || "").toLowerCase();
  const tokens = new Set(t.split(/[\s،.,!?;:"'()[\]{}/\\_\-]+/).filter(Boolean));

  let best = null;
  let maxScore = 0;

  for (let i = 0; i < COMPILED_RULES.length; i++) {
    const r = COMPILED_RULES[i];
    let score = 0;

    for (let j = 0; j < r.strongLower.length; j++) {
      if (t.includes(r.strongLower[j])) score += 70;
    }
    for (let j = 0; j < r.phrasesLower.length; j++) {
      if (t.includes(r.phrasesLower[j])) score += 35;
    }
    for (let j = 0; j < r.wordsLower.length; j++) {
      if (tokens.has(r.wordsLower[j])) score += 15;
    }

    if (score > maxScore) {
      maxScore = score;
      best = r;
    }
  }

  return { bestId: best ? best.id : null, score: maxScore, bestName: best ? best.name : null };
}

async function main() {
  console.log("=== STEP 1: SYNCHRONIZING POSTGRES CATEGORIES TABLE (1..24) ===");
  const client = await pool.connect();

  try {
    for (const cat of CATEGORIES_SYNC) {
      await client.query(`
        INSERT INTO categories (id, name_ar, name_en, icon, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (id) DO UPDATE
        SET name_ar = EXCLUDED.name_ar,
            name_en = EXCLUDED.name_en,
            icon = EXCLUDED.icon,
            is_active = true,
            deleted_at = NULL
      `, [cat.id, cat.name_ar, cat.name_en, cat.icon]);
    }
    console.log("Categories table successfully synced with official 24 categories!");

    // Get initial state
    const initialCounts = await client.query(`
      SELECT category_id, COUNT(*) as count
      FROM products
      WHERE deleted_at IS NULL
      GROUP BY category_id
      ORDER BY count DESC
    `);
    console.log("\n--- Initial Product Distribution ---");
    initialCounts.rows.forEach(r => console.log(`Cat ${r.category_id}: ${r.count} products`));

    console.log("\n=== STEP 2: FAST PRODUCT RE-DISTRIBUTION ===");
    const startTime = Date.now();
    let lastId = 0;
    let totalExamined = 0;
    let totalUpdated = 0;
    let cleanedFromCat5 = 0;

    const BATCH_SIZE = 500;
    let batchNum = 0;

    while (true) {
      batchNum++;
      const tSelectStart = Date.now();
      const res = await client.query(
        "SELECT id, name_ar, name_en, category_id FROM products WHERE deleted_at IS NULL AND id > $1 ORDER BY id ASC LIMIT $2",
        [lastId, BATCH_SIZE]
      );
      if (res.rows.length === 0) break;

      const chunk = res.rows;
      lastId = chunk[chunk.length - 1].id;
      totalExamined += chunk.length;

      const tClassifyStart = Date.now();
      const updates = [];
      for (const p of chunk) {
        const text = `${p.name_ar || ""} ${p.name_en || ""}`;
        const { bestId, score } = fastClassifyText(text);

        // Reassign if matched with confidence score >= 25 and different category
        if (bestId && score >= 25 && bestId !== p.category_id) {
          updates.push({ id: p.id, newCat: bestId });
          if (p.category_id === 5) cleanedFromCat5++;
          totalUpdated++;
        }
      }
      const classifyMs = Date.now() - tClassifyStart;

      let updateMs = 0;
      if (updates.length > 0) {
        const tUpdateStart = Date.now();
        const caseClauses = updates.map(u => `WHEN id = ${u.id} THEN ${u.newCat}`).join(" ");
        const idList = updates.map(u => u.id).join(",");
        await client.query(`
          UPDATE products
          SET category_id = CASE ${caseClauses} END
          WHERE id IN (${idList})
        `);
        updateMs = Date.now() - tUpdateStart;
      }

      console.log(`[Batch ${batchNum}] Processed ${totalExamined}/10964 products (Classify: ${classifyMs}ms, DB Update: ${updateMs}ms, Reassigned in batch: ${updates.length}, Total Updated: ${totalUpdated})`);
    }

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n=== RE-DISTRIBUTION COMPLETED IN ${durationSec}s ===`);
    console.log(`Total Products Examined: ${totalExamined}`);
    console.log(`Total Products Re-assigned: ${totalUpdated}`);
    console.log(`Products Relocated from Category 5: ${cleanedFromCat5}`);

    // Final state
    const finalCounts = await client.query(`
      SELECT c.id, c.name_ar, c.name_en, c.icon, COUNT(p.id) as count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.deleted_at IS NULL
      WHERE c.deleted_at IS NULL
      GROUP BY c.id, c.name_ar, c.name_en, c.icon
      ORDER BY c.id ASC
    `);

    console.log("\n=== FINAL BALANCED CATEGORY BREAKDOWN ===");
    finalCounts.rows.forEach(r => {
      console.log(`[ID ${String(r.id).padStart(2, ' ')}] ${r.icon} ${r.name_ar.padEnd(30, ' ')} (${r.name_en}): ${r.count} products`);
    });

  } finally {
    client.release();
    await pool.end();
  }
}

// Only run if called directly
if (process.argv[1]?.endsWith("fast-redistribute-all.mjs")) {
  main().catch(err => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
  });
}
