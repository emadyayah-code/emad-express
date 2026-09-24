import { db, categories } from "@workspace/db";
import { isNull } from "drizzle-orm";

let categoryCache: { id: number; name_ar: string; name_en: string }[] | null = null;
let lastCacheTime = 0;

export async function getCategories() {
  const now = Date.now();
  if (categoryCache && now - lastCacheTime < 60000) {
    return categoryCache;
  }
  const cats = await db.select().from(categories).where(isNull(categories.deleted_at));
  categoryCache = cats.map(c => ({ id: c.id, name_ar: c.name_ar, name_en: c.name_en }));
  lastCacheTime = now;
  return categoryCache;
}

export const ALI_OFFICIAL_CAT_MAP: Record<string, string> = {
  // Watches & Jewelry
  "watches": "ساعات ومجوهرات وإكسسوارات",
  "wristwatches": "ساعات ومجوهرات وإكسسوارات",
  "jewelry & accessories": "ساعات ومجوهرات وإكسسوارات",
  "jewelry": "ساعات ومجوهرات وإكسسوارات",
  
  // Luggage & Shoes
  "luggage & bags": "حقائب وأحذية",
  "shoes": "حقائب وأحذية",
  "bags": "حقائب وأحذية",

  // Phones
  "phones & telecommunications": "هواتف ذكية وملحقاتها",
  "cellphones & telecommunications": "هواتف ذكية وملحقاتها",
  "mobile phones": "هواتف ذكية وملحقاتها",

  // Consumer Electronics
  "consumer electronics": "إلكترونيات استهلاكية",
  "electronic components & supplies": "إلكترونيات استهلاكية",

  // Computer & Office
  "computer & office": "أجهزة كمبيوتر ومكاتب",
  "computers & office": "أجهزة كمبيوتر ومكاتب",

  // Women's Clothing
  "women's clothing": "أزياء وملابس نسائية",
  "women clothing": "أزياء وملابس نسائية",

  // Men's Clothing
  "men's clothing": "أزياء وملابس رجالية",
  "men clothing": "أزياء وملابس رجالية",

  // Home & Garden
  "home & garden": "المنزل والحديقة والمطبخ",
  
  // Home Appliances
  "home appliances": "أجهزة منزلية كهربائية",
  "appliances": "أجهزة منزلية كهربائية",

  // Beauty & Health
  "beauty & health": "الجمال والصحة والعناية الشخصية",
  "hair extensions & wigs": "شعر مستعار وباروكات",

  // Toys, Kids & Babies
  "mother & kids": "ألعاب وأطفال ورضع",
  "toys & hobbies": "ألعاب وأطفال ورضع",

  // Sports & Outdoors
  "sports & entertainment": "رياضة ولياقة بدنية وخارجية",

  // Automobiles & Motorcycles
  "automobiles & motorcycles": "سيارات ودراجات نارية وقطع غيار",
  "automobiles, parts & accessories": "سيارات ودراجات نارية وقطع غيار",

  // Tools & Hardware
  "tools": "تحسين المنزل والعدد والأدوات",
  "tools & home improvement": "تحسين المنزل والعدد والأدوات",
  "home improvement": "تحسين المنزل والعدد والأدوات",

  // Lights & Lighting
  "lights & lighting": "أضواء وإنارة ذكية",

  // Security & Protection
  "security & protection": "أمن وحماية وكاميرات مراقبة",

  // Pet Supplies
  "pet products": "مستلزمات الحيوانات الأليفة",
  "pet supplies": "مستلزمات الحيوانات الأليفة",

  // Office & School Supplies
  "education & office supplies": "أدوات مكتبية ومدرسية",
  "office & school supplies": "أدوات مكتبية ومدرسية",

  // Furniture
  "furniture": "أثاث وديكور منزلي",
  "furniture & home decor": "أثاث وديكور منزلي",

  // Special categories
  "cameras & drones": "كاميرات وبصريات وطائرات درون",
  "smart home & iot": "أجهزة ذكية وإنترنت الأشياء",
  "event & party supplies": "مستلزمات الحفلات والمناسبات",
  "arts, crafts & sewing": "أقمشة وحرف يدوية وخياطة",
};

export const ALI_CAT_TO_DB_NAME: Record<string, string> = {
  "1511": "ساعات ومجوهرات وإكسسوارات",
  "44": "إلكترونيات استهلاكية",
  "509": "هواتف ذكية وملحقاتها",
  "15": "أجهزة منزلية كهربائية",
  "1524": "حقائب وأحذية",
  "1420": "تحسين المنزل والعدد والأدوات",
  "34": "سيارات ودراجات نارية وقطع غيار",
  "66": "الجمال والصحة والعناية الشخصية",
  "18": "رياضة ولياقة بدنية وخارجية",
  "7": "أجهزة كمبيوتر ومكاتب",
  "1509": "ساعات ومجوهرات وإكسسوارات",
  "1501": "ألعاب وأطفال ورضع",
  "39": "أضواء وإنارة ذكية",
  "30": "أمن وحماية وكاميرات مراقبة",
  "322": "حقائب وأحذية",
  "200000343": "أزياء وملابس رجالية",
  "200000345": "أزياء وملابس نسائية",
  "1503": "المنزل والحديقة والمطبخ",
  "200000787": "أدوات مكتبية ومدرسية",
  "200000297": "ألعاب وأطفال ورضع",
};

export interface CategoryRule {
  categoryName: string;
  phrases: string[];
  words: string[];
}

export const CATEGORY_RULES: CategoryRule[] = [
  // 1. Watches & Jewelry
  {
    categoryName: "ساعات ومجوهرات وإكسسوارات",
    phrases: [
      "ساعة يد", "ساعة رجالي", "ساعة نسائ", "ساعة كوارتز", "ساعة ذكية", "ساعة رياضية", "ساعة أوتوماتيك",
      "ساعة ميكانيك", "كرونوغراف", "طقم مجوهرات", "خاتم فضة", "خاتم ذهب", "سوار يد", "قلادة فضة",
      "سلسال رقبة", "سوار معصم", "حزام ساعة", "smart watch", "men watch", "women watch", "quartz watch",
      "automatic watch", "chronograph", "pagani design", "naviforce", "curren", "silver ring", "gold necklace",
      "tennis bracelet", "stud earrings", "moissanite ring", "watch strap", "watch band"
    ],
    words: [
      "ساعة", "ساعات", "خاتم", "خواتم", "سوار", "أساور", "قلادة", "قلائد", "مجوهرات", "أقراط",
      "قرط", "دبلة", "بروش", "حلق", "سلسال", "watch", "watches", "smartwatch", "quartz", "necklace",
      "bracelet", "earring", "earrings", "pendant", "bangle", "cufflink", "brooch", "jewellery", "jewelry"
    ]
  },
  // 2. Home Appliances (Vacuums, Pool Cleaners, Kitchen Electric, Blenders)
  {
    categoryName: "أجهزة منزلية كهربائية",
    phrases: [
      "مكنسة كهربائية", "مكنسة روبوت", "روبوت تنظيف", "تنظيف المسابح", "تنظيف حمامات السباحة", "منظف فراغي",
      "قلاية هوائية", "ماكينة قهوة", "صانعة قهوة", "غلاية ماء", "مكواة بخار", "مرطب هواء", "منقي هواء",
      "خلاط كهربائي", "مفرمة لحم", "صانع رغوة", "غسالة صغيرة", "robot vacuum", "vacuum cleaner", "pool cleaner",
      "air fryer", "coffee maker", "coffee machine", "electric kettle", "steam iron", "air humidifier",
      "air purifier", "blender portable", "food processor", "meat grinder", "electric juicer", "roborock"
    ],
    words: [
      "مكنسة", "مكانس", "قلاية", "غلاية", "مكواة", "خلاط", "مرطب", "منقي", "شفاط",
      "vacuum", "blender", "kettle", "humidifier", "purifier", "toaster", "juicer", "roborock"
    ]
  },
  // 3. Toys, Kids & Babies
  {
    categoryName: "ألعاب وأطفال ورضع",
    phrases: [
      "ملابس أطفال", "بيجامات أطفال", "طقم مواليد", "عربة أطفال", "حفاضات أطفال", "ألعاب أطفال",
      "سيارة تحكم عن بعد", "مكعبات بناء", "طائرة لعبة", "دمية قطنية", "لهاية أطفال", "رضاعة أطفال",
      "ملابس نوم للأطفال", "ألعاب رضع", "baby clothes", "kids pajamas", "baby romper", "baby stroller",
      "diaper bag", "rc car", "building blocks", "plush toy", "water gun", "baby bottle", "baby bib"
    ],
    words: [
      "أطفال", "طفل", "رضيع", "مواليد", "ولادي", "بناتي", "بيجامة", "بيجامات", "حفاضات", "لهاية",
      "عضاضة", "لعبة", "ألعاب", "دمية", "مكعبات", "baby", "infant", "toddler", "kids", "toy", "toys",
      "puzzle", "doll", "plush", "stroller", "romper", "pacifier", "diaper"
    ]
  },
  // 4. Automotive & Motorcycles
  {
    categoryName: "سيارات ودراجات نارية وقطع غيار",
    phrases: [
      "إكسسوارات سيارات", "كاميرا سيارة", "داش كام", "شاحن سيارة", "مضخة إطارات", "مضخة وقود",
      "غطاء سيارة", "وسادة مقعد سيارة", "شاحن سيارات كهربائية", "إضاءة سيارة", "مكنسة سيارة",
      "منفاخ إطارات", "مرآة سيارة", "حامل سيارة", "car dash cam", "car charger", "tire inflator",
      "fuel pump", "car seat cover", "car led", "ev charger", "car vacuum", "obd2 scanner", "motorcycle helmet"
    ],
    words: [
      "سيارة", "سيارات", "مركبة", "إطارات", "بنزين", "وقود", "دراجة نارية", "مرآب",
      "car", "automobile", "vehicle", "motorcycle", "automotive", "dashcam", "obd2"
    ]
  },
  // 5. Bags & Shoes
  {
    categoryName: "حقائب وأحذية",
    phrases: [
      "حقيبة ظهر", "حقيبة يد", "حقيبة سفر", "حقيبة كتف", "حقيبة خصر", "محفظة رجالي", "محفظة نسائ",
      "حذاء رياضي", "حذاء ركض", "حذاء نسائ", "حذاء رسمي", "صندل صيفي", "شنطة نسائ", "شنطة سفر",
      "حذاء كرة قدم", "running shoes", "sneakers shoes", "leather wallet", "travel backpack", "shoulder bag",
      "crossbody bag", "tote bag", "ankle boots", "luggage suitcase", "card holder rfid", "casual shoes"
    ],
    words: [
      "حذاء", "أحذية", "شوز", "سنيكرز", "صندل", "صنادل", "شبشب", "بوت", "كعب", "حقيبة", "حقائب",
      "شنطة", "شنط", "محفظة", "محافظ", "shoes", "sneakers", "boots", "sandals", "slippers",
      "loafers", "backpack", "handbag", "wallet", "purse", "luggage", "suitcase"
    ]
  },
  // 6. Phones & Telecommunications
  {
    categoryName: "هواتف ذكية وملحقاتها",
    phrases: [
      "كفر جوال", "كفر هاتف", "جراب هاتف", "حامل جوال", "حامل هاتف", "واقي شاشة", "شاحن هاتف",
      "شاحن سريع", "كابل شحن", "سلك شاحن", "باور بانك", "باوربانك", "لاصق حماية", "شاحن مغناطيسي",
      "phone case", "screen protector", "phone holder", "fast charger", "charging cable", "power bank",
      "wireless charger", "magsafe", "lightning cable", "type c cable"
    ],
    words: [
      "هاتف", "جوال", "آيفون", "ايفون", "سامسونج", "شاومي", "هواوي", "smartphone", "iphone", "samsung", "xiaomi"
    ]
  },
  // 7. Consumer Electronics (Audio, VR, Gaming)
  {
    categoryName: "إلكترونيات استهلاكية",
    phrases: [
      "سماعات بلوتوث", "سماعة بلوتوث", "سماعات لاسلكية", "مكبر صوت", "سبيكر بلوتوث", "ميكروفون لاسلكي",
      "نظارات ذكية", "نظارات واقع افتراضي", "مضخم صوت", "سماعات قيمنق", "bluetooth speaker", "wireless earbuds",
      "tws earbuds", "noise cancelling", "gaming headset", "smart glasses", "vr headset", "sound bar",
      "audio amplifier", "voice recorder"
    ],
    words: [
      "سماعة", "سماعات", "سبيكر", "ميكروفون", "ايربودز", "بلوتوث", "earbuds", "earphone", "headphone",
      "speaker", "headset", "microphone", "tws", "audio", "soundbar", "amplifier"
    ]
  },
  // 8. Computer & Office
  {
    categoryName: "أجهزة كمبيوتر ومكاتب",
    phrases: [
      "لوحة مفاتيح", "فأرة كمبيوتر", "ماوس ألعاب", "حامل لابتوب", "محول يو اس بي", "فلاش ميموري",
      "شاشة كمبيوتر", "لوحة رسم", "قاعدة تبريد", "كاميرا ويب", "mechanical keyboard", "gaming mouse",
      "mouse pad", "laptop stand", "usb hub", "type-c hub", "external ssd", "flash drive", "graphic tablet",
      "displayport cable", "hdmi adapter", "thermal paste"
    ],
    words: [
      "كمبيوتر", "لابتوب", "حاسوب", "ماوس", "كيبورد", "طابعة", "laptop", "desktop", "keyboard",
      "mousepad", "webcam", "printer", "monitor", "keycap", "keycaps"
    ]
  },
  // 9. Cameras & Drones
  {
    categoryName: "كاميرات وبصريات وطائرات درون",
    phrases: [
      "طائرة درون", "طائرة بدون طيار", "ترايبود كاميرا", "حامل ثلاثي", "مانع اهتزاز", "عدسة كاميرا",
      "منظار رؤية", "تلسكوب فلكي", "كاميرا رياضية", "rc drone", "drone 4k", "camera tripod",
      "gimbal stabilizer", "binoculars", "telescope", "action camera", "monocular"
    ],
    words: [
      "درون", "ترايبود", "جيمبال", "منظار", "تلسكوب", "عدسة", "drone", "drones", "quadcopter",
      "tripod", "gimbal", "telescope", "binoculars", "gopro"
    ]
  },
  // 10. Lights & Lighting
  {
    categoryName: "أضواء وإنارة ذكية",
    phrases: [
      "شريط ليد", "إضاءة ليد", "مصباح مكتبي", "ثريا سقف", "إضاءة ليلية", "سلسلة إضاءة", "مصباح طاقة شمسية",
      "كشاف ليد", "مصباح حائط", "إضاءة طاولة", "led strip", "rgb strip", "desk lamp", "night light",
      "string lights", "solar light", "ceiling light", "neon sign", "floodlight", "fairy lights"
    ],
    words: [
      "إنارة", "إضاءة", "مصباح", "مصابيح", "لمبة", "لمبات", "ليد", "ثريا", "أباجورة", "كشاف", "نيون",
      "lamp", "lamps", "lighting", "led", "chandelier", "flashlight", "bulb", "bulbs", "spotlight"
    ]
  },
  // 11. Security & Protection
  {
    categoryName: "أمن وحماية وكاميرات مراقبة",
    phrases: [
      "كاميرا مراقبة", "كاميرا أمان", "كاميرا واي فاي", "قفل باب ذكي", "قفل إلكتروني", "جرس باب ذكي",
      "جهاز إنذار", "كاشف دخان", "security camera", "cctv camera", "ip camera", "smart door lock",
      "video doorbell", "alarm system", "motion sensor alarm"
    ],
    words: [
      "مراقبة", "أمان", "إنذار", "cctv", "surveillance", "doorbell"
    ]
  },
  // 12. Pet Supplies
  {
    categoryName: "مستلزمات الحيوانات الأليفة",
    phrases: [
      "طوق قطط", "طوق كلاب", "سرير قطط", "سرير كلاب", "ألعاب قطط", "نافورة قطط", "رمل قطط",
      "فرشاة شعر قطط", "شجرة قطط", "ملابس كلاب", "pet collar", "cat bed", "dog bed", "cat toys",
      "pet fountain", "cat tree", "dog leash", "litter box"
    ],
    words: [
      "قطط", "قطة", "كلاب", "كلب", "pet", "pets", "cat", "cats", "dog", "dogs", "puppy", "kitten"
    ]
  },
  // 13. Office & School
  {
    categoryName: "أدوات مكتبية ومدرسية",
    phrases: [
      "طقم أقلام", "دفتر ملاحظات", "مقلمة مدرسية", "ملصقات كيوت", "ورق ملاحظات", "أقلام حبر",
      "دباسة ورق", "أقلام تلوين", "ballpoint pen", "pencil case", "notebook journal", "cute stickers",
      "sticky notes", "highlighter pens"
    ],
    words: [
      "دفتر", "دفاتر", "أقلام", "قرطاسية", "مقلمة", "ملصقات", "ستيكرات", "notebook", "stationery",
      "stickers", "stapler", "highlighter"
    ]
  },
  // 14. Smart Home & IoT
  {
    categoryName: "أجهزة ذكية وإنترنت الأشياء",
    phrases: [
      "مفتاح ذكي", "قابس ذكي", "فيش ذكي", "حساس حركة ذكي", "تحكم ذكي", "smart switch", "smart plug",
      "smart socket", "tuya smart", "zigbee switch", "sonoff switch"
    ],
    words: [
      "تويا", "سونوف", "زيجبي", "tuya", "sonoff", "zigbee"
    ]
  },
  // 15. Women's Clothing
  {
    categoryName: "أزياء وملابس نسائية",
    phrases: [
      "فستان نسائ", "عباية نسائ", "تنورة نسائ", "بلوزة نسائ", "فستان سهرة", "فستان صيفي", "ملابس نسائ",
      "لانجري نسائ", "قميص نوم نسائ", "women dress", "women blouse", "women skirt", "women abaya",
      "summer dress", "women lingerie", "women cardigan", "women coat"
    ],
    words: [
      "فستان", "فساتين", "عباية", "عبايات", "تنورة", "تنانير", "بلوزة", "بلوزات", "لانجري",
      "dress", "dresses", "abaya", "skirt", "blouse", "lingerie"
    ]
  },
  // 16. Men's Clothing
  {
    categoryName: "أزياء وملابس رجالية",
    phrases: [
      "قميص رجالي", "بنطلون رجالي", "هودي رجالي", "جاكيت رجالي", "بدلة رجالية", "ملابس رجالي",
      "سروال رجالي", "معطف رجالي", "men shirt", "men pants", "men hoodie", "men jacket", "men suit", "men blazer"
    ],
    words: [
      "هودي", "هوديز", "سروال", "بشت", "شماغ", "hoodie", "hoodies", "blazer"
    ]
  },
  // 17. Beauty & Health
  {
    categoryName: "الجمال والصحة والعناية الشخصية",
    phrases: [
      "عناية بالبشرة", "كريم ترطيب", "سيروم وجه", "أحمر شفاه", "فرشاة مكياج", "مسكرة رموش",
      "مكواة شعر", "مجفف شعر", "ماكينة حلاقة", "تشذيب لحية", "عطر رجالي", "عطر نسائي", "محدد عيون",
      "طلاء أظافر", "skincare serum", "face cream", "makeup brush", "hair straightener", "hair dryer",
      "electric shaver", "beard trimmer", "perfume spray", "nail polish", "lip balm"
    ],
    words: [
      "مكياج", "أحمر شفاه", "مسكرة", "عطر", "عطور", "سيروم", "كريم", "شامبو", "حلاقة", "أظافر",
      "skincare", "serum", "lipstick", "mascara", "perfume", "fragrance", "makeup", "shaver", "trimmer"
    ]
  },
  // 18. Furniture
  {
    categoryName: "أثاث وديكور منزلي",
    phrases: [
      "كرسي ألعاب", "كرسي قيمنق", "كرسي مكتب", "طاولة طعام", "طاولة شاي", "أريكة استرخاء",
      "كنب صالة", "رف جداري", "gaming chair", "office chair", "dining table", "coffee table", "sofa couch"
    ],
    words: [
      "طاولة", "طاولات", "أريكة", "أثاث", "دولاب", "sofa", "couch", "furniture", "wardrobe"
    ]
  },
  // 19. Wigs
  {
    categoryName: "شعر مستعار وباروكات",
    phrases: [
      "شعر مستعار", "باروكة شعر", "خصلات شعر", "lace wig", "human hair wig", "hair extensions"
    ],
    words: [
      "باروكة", "باروكات", "wig", "wigs", "hairpiece"
    ]
  },
  // 20. Party Supplies
  {
    categoryName: "مستلزمات الحفلات والمناسبات",
    phrases: [
      "بالونات هيليوم", "قوس بالونات", "زينة عيد ميلاد", "زينة حفلات", "party balloons", "balloon arch", "birthday decor"
    ],
    words: [
      "بالون", "بالونات", "balloon", "balloons", "cosplay", "confetti"
    ]
  },
  // 21. Crafts & Sewing
  {
    categoryName: "أقمشة وحرف يدوية وخياطة",
    phrases: [
      "ماكينة خياطة", "أقمشة خياطة", "خيوط حياكة", "صوف كروشيه", "طقم تطريز", "sewing machine", "knitting yarn", "crochet yarn"
    ],
    words: [
      "خياطة", "تطريز", "كروشيه", "حياكة", "صوف", "خرز", "sewing", "knitting", "crochet", "yarn"
    ]
  },
  // 22. Tools & Hardware
  {
    categoryName: "تحسين المنزل والعدد والأدوات",
    phrases: [
      "دريل كهربائي", "شنيور لاسلكي", "طقم مفكات", "مفتاح عزم", "ميزان ليزر", "مكواة لحام", "منشار كهربائي",
      "cordless drill", "screwdriver set", "socket wrench", "laser level", "soldering iron", "multimeter digital"
    ],
    words: [
      "دريل", "شنيور", "مفك", "مفكات", "زرادية", "منشار", "لحام", "سباكة", "drill", "screwdriver", "wrench", "pliers", "saw"
    ]
  },
  // 23. Sports & Fitness
  {
    categoryName: "رياضة ولياقة بدنية وخارجية",
    phrases: [
      "أحزمة مقاومة", "بساط يوجا", "مسدس مساج", "حبل قفز", "خيمة تخييم", "كيس نوم", "حقيبة رياضية",
      "دراجة هوائية", "دامبلز أوزان", "resistance bands", "yoga mat", "massage gun", "jump rope", "camping tent", "sleeping bag"
    ],
    words: [
      "جيم", "لياقة", "يوجا", "تخييم", "دراجة", "دامبل", "تمارين", "fitness", "workout", "gym", "yoga", "camping", "cycling"
    ]
  },
  // 24. Home & Garden (Default baseline)
  {
    categoryName: "المنزل والحديقة والمطبخ",
    phrases: [
      "أدوات مطبخ", "طقم سكاكين", "أواني طهي", "ديكور منزلي", "وسائد سرير", "غطاء سرير", "ستائر نافذة",
      "مبخرة عطرية", "علب تخزين", "سلال تخزين", "كوب قهوة", "kitchen knife", "knife set", "cookware set",
      "home decor", "storage box", "coffee mug", "water bottle"
    ],
    words: [
      "مطبخ", "سكين", "كوب", "صحن", "ستارة", "ستائر", "وسادة", "وسائد", "مبخرة", "مزهرية", "منظم", "سجاد",
      "kitchen", "cookware", "mug", "cushion", "pillow", "curtain", "decor", "towel", "carpet"
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

  // 1. Direct match by providedCatId if it matches local DB
  if (providedCatId && providedCatId > 0) {
    const directMatch = cats.find(c => c.id === providedCatId);
    if (directMatch) return directMatch.id;

    const mappedName = ALI_CAT_TO_DB_NAME[String(providedCatId)];
    if (mappedName) {
      const foundByMap = cats.find(c => c.name_ar === mappedName || c.name_en.toLowerCase() === mappedName.toLowerCase());
      if (foundByMap) return foundByMap.id;
    }
  }

  // 2. Direct match by AliExpress official category name
  if (officialCatName) {
    const normOfficial = officialCatName.trim().toLowerCase();
    const mappedOfficialName = ALI_OFFICIAL_CAT_MAP[normOfficial];
    if (mappedOfficialName) {
      const found = cats.find(c => c.name_ar === mappedOfficialName || c.name_en.toLowerCase() === mappedOfficialName.toLowerCase());
      if (found) return found.id;
    }
  }

  // 3. Multi-layer smart scoring match
  const t = (text || "").toLowerCase();
  let bestCatName = "المنزل والحديقة والمطبخ";
  let maxScore = 0;

  for (const rule of CATEGORY_RULES) {
    let score = 0;

    // Check multi-word phrases (+15)
    for (const phrase of rule.phrases) {
      if (t.includes(phrase.toLowerCase())) {
        score += 15;
      }
    }

    // Check words with word boundaries (+5)
    for (const w of rule.words) {
      const isArabic = /[\u0600-\u06FF]/.test(w);
      if (isArabic) {
        const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(^|[\\s،.,!?;:"'()\\[\\]{}/-])${escaped}([\\s،.,!?;:"'()\\[\\]{}/-]|$)`, 'i');
        if (re.test(t)) {
          score += 5;
        }
      } else {
        const re = new RegExp(`\\b${w}\\b`, 'i');
        if (re.test(t)) {
          score += 5;
        }
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestCatName = rule.categoryName;
    }
  }

  // Find category ID by best matched name
  const found = cats.find(c => c.name_ar === bestCatName || c.name_en.toLowerCase() === bestCatName.toLowerCase());
  if (found) return found.id;

  // Safe fallback: Home & Garden or first non-phone category
  const safeHome = cats.find(c => c.name_ar === "المنزل والحديقة والمطبخ");
  return safeHome?.id || cats[0]?.id || null;
}
