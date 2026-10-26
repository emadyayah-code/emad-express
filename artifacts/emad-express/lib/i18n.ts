export type SupportedLang = "ar" | "en" | "fr" | "tr" | "zh";

export const CLEAN_CATEGORY_NAMES: Record<number, { ar: string; en: string; fr: string; tr: string; zh: string }> = {
  1: { ar: "إلكترونيات وأجهزة ذكية", en: "Electronics & Smart Devices", fr: "Électronique & Appareils Intelligents", tr: "Elektronik ve Akıllı Cihazlar", zh: "电子与智能设备" },
  2: { ar: "أزياء وموضة", en: "Fashion & Style", fr: "Mode & Style", tr: "Moda ve Stil", zh: "时尚与潮流" },
  3: { ar: "هواتف ذكية وإكسسوارات", en: "Smartphones & Accessories", fr: "Smartphones & Accessoires", tr: "Akıllı Telefonlar ve Aksesuarlar", zh: "智能手机与配件" },
  4: { ar: "ساعات ومجوهرات", en: "Watches & Jewelry", fr: "Montres & Bijoux", tr: "Saatler ve Takılar", zh: "手表与珠宝" },
  5: { ar: "المنزل والمطبخ", en: "Home & Kitchen", fr: "Maison & Cuisine", tr: "Ev ve Mutfak", zh: "家居与厨房" },
  6: { ar: "الصحة والجمال", en: "Health & Beauty", fr: "Santé & Beauté", tr: "Sağlık ve Güzellik", zh: "健康与美容" },
  7: { ar: "رياضة وترفيه", en: "Sports & Outdoors", fr: "Sports & Loisirs", tr: "Spor ve Açık Hava", zh: "运动与户外" },
  8: { ar: "ألعاب وأطفال", en: "Toys, Kids & Babies", fr: "Jouets, Enfants & Bébés", tr: "Oyuncak, Çocuk ve Bebek", zh: "母婴与玩具" },
  9: { ar: "سيارات ودراجات نارية", en: "Automotive & Motorcycles", fr: "Automobiles & Motos", tr: "Otomotiv ve Motosiklet", zh: "汽车与摩托车" },
  10: { ar: "أحذية وحقائب", en: "Shoes & Bags", fr: "Chaussures & Sacs", tr: "Ayakkabı ve Çantalar", zh: "鞋子与箱包" },
  11: { ar: "كمبيوتر ولابتوب", en: "Computers & Office", fr: "Ordinateurs & Bureautique", tr: "Bilgisayar ve Ofis", zh: "电脑与办公" },
  12: { ar: "أجهزة إلكترونية استهلاكية", en: "Consumer Electronics", fr: "Électronique Grand Public", tr: "Tüketici Elektroniği", zh: "消费类电子产品" },
  13: { ar: "أزياء وملابس رجالية", en: "Men's Fashion", fr: "Mode Homme", tr: "Erkek Modası", zh: "男装服饰" },
  14: { ar: "أدوات وتحسين المنزل", en: "Tools & Home Improvement", fr: "Outils & Bricolage", tr: "Aletler ve Ev Geliştirme", zh: "工具与家装" },
  15: { ar: "إضاءة ومصابيح", en: "Lights & Lighting", fr: "Lumières & Éclairage", tr: "Işıklar ve Aydınlatma", zh: "灯具与照明" },
  16: { ar: "أمان وحماية ذكية", en: "Security & Protection", fr: "Sécurité & Protection", tr: "Güvenlik ve Koruma", zh: "安防与智能监控" },
  17: { ar: "مستلزمات الحيوانات الأليفة", en: "Pet Supplies", fr: "Animalerie", tr: "Evcil Hayvan Ürünleri", zh: "宠物用品" },
  18: { ar: "أدوات مكتبية ومدرسية", en: "Office & School Supplies", fr: "Fournitures de Bureau & Scolaires", tr: "Ofis ve Okul Malzemeleri", zh: "办公与文具用品" },
  19: { ar: "أثاث وديكور منزلي", en: "Furniture & Home Decor", fr: "Meubles & Décoration", tr: "Mobilya ve Ev Dekorasyonu", zh: "家具与家居装饰" },
  20: { ar: "كاميرات وطائرات درون", en: "Cameras & Drones", fr: "Appareils Photo & Drones", tr: "Kameralar ve Dronlar", zh: "相机与无人机" },
  21: { ar: "المنزل الذكي وإنترنت الأشياء", en: "Smart Home & IoT", fr: "Maison Intelligente & IoT", tr: "Akıllı Ev ve IoT", zh: "智能家居与物联网" },
  22: { ar: "وصلات وشعر مستعار", en: "Hair Extensions & Wigs", fr: "Extensions & Perruques", tr: "Saç Kaynakları ve Peruklar", zh: "假发与接发" },
  23: { ar: "مستلزمات الحفلات والمناسبات", en: "Event & Party Supplies", fr: "Articles de Fête", tr: "Parti ve Etkinlik Malzemeleri", zh: "派对与节日用品" },
  24: { ar: "فنون وحرف وخياطة", en: "Arts, Crafts & Sewing", fr: "Arts, Loisirs Créatifs & Couture", tr: "Sanat, El Sanatları ve Dikiş", zh: "艺术、手工艺与缝纫" },
};

const AR_TO_EN_DICT: Record<string, string> = {
  "ساعات": "Watches", "ساعة": "Watch", "ذكية": "Smart", "ذكي": "Smart",
  "فتاحة": "Opener", "علب": "Cases", "علبة": "Case", "أدوات": "Tools", "أداة": "Tool",
  "طقم": "Set", "مجموعة": "Kit", "فولاذ": "Steel", "أعلام": "Flags", "علم": "Flag",
  "لافتات": "Banners", "ملونة": "Color", "شاطئ": "Beach", "خياطة": "Sewing",
  "تطريز": "Embroidery", "حرف": "Craft", "أكريليك": "Acrylic", "مسطرة": "Ruler",
  "شفرة": "Blade", "شفرات": "Blades", "حصيرة": "Mat", "قص": "Cutting",
  "أمان": "Safety", "قفل": "Lock", "سكين": "Knife", "قاطع": "Cutter",
  "مقص": "Scissors", "ألمنيوم": "Aluminum", "جلد": "Leather", "سيارات": "Car",
  "سيارة": "Car", "إلكترونيات": "Electronics", "هاتف": "Phone", "جوال": "Mobile",
  "شاحن": "Charger", "سماعات": "Earbuds", "سماعة": "Headphone", "لاسلكي": "Wireless",
  "لاسلكية": "Wireless", "بلوتوث": "Bluetooth", "حقيبة": "Bag", "حقائب": "Bags",
  "سفر": "Travel", "حذاء": "Shoes", "أحذية": "Shoes", "رياضي": "Sport",
  "رياضية": "Sports", "ماكينة": "Machine", "حلاقة": "Trimmer", "مصباح": "Lamp",
  "إضاءة": "Lighting", "كاميرا": "Camera", "طائرة": "Drone", "درون": "Drone",
  "كمبيوتر": "Computer", "لوحة": "Keyboard", "مفاتيح": "Keys", "فأرة": "Mouse",
  "مطبخ": "Kitchen", "منزل": "Home", "منزلي": "Home", "منزلية": "Home",
  "تجميل": "Beauty", "عناية": "Care", "بشرة": "Skin", "مكياج": "Makeup",
  "مجوهرات": "Jewelry", "خاتم": "Ring", "سلسال": "Necklace", "أساور": "Bracelet",
  "ألعاب": "Toys", "لعبة": "Toy", "أطفال": "Kids", "مقاوم": "Waterproof",
  "مقاومة": "Waterproof", "للماء": "Waterproof", "سريع": "Fast", "سريعة": "Fast",
  "محمول": "Portable", "محمولة": "Portable", "صغير": "Mini", "صغيرة": "Mini",
  "كبير": "Pro Max", "كبيرة": "Pro Max", "عالي": "High-Quality", "عالية": "High-Quality",
  "جودة": "Quality", "ممتاز": "Premium", "ممتازة": "Premium", "أصلي": "Original",
  "أصلية": "Original", "مطور": "Upgraded", "مطورة": "Upgraded",
};

const AR_TO_FR_DICT: Record<string, string> = {
  "ساعات": "Montres", "ساعة": "Montre", "ذكية": "Intelligente", "ذكي": "Intelligent",
  "أدوات": "Outils", "أداة": "Outil", "طقم": "Kit", "مجموعة": "Ensemble",
  "خياطة": "Couture", "جلد": "Cuir", "سيارة": "Voiture", "إلكترونيات": "Électronique",
  "هاتف": "Téléphone", "جوال": "Mobile", "شاحن": "Chargeur", "سماعات": "Écouteurs",
  "سماعة": "Casque", "لاسلكي": "Sans Fil", "لاسلكية": "Sans Fil", "بلوتوث": "Bluetooth",
  "حقيبة": "Sac", "حقائب": "Sacs", "سفر": "Voyage", "حذاء": "Chaussures",
  "أحذية": "Chaussures", "رياضي": "Sport", "رياضية": "Sport", "ماكينة": "Tondeuse",
  "حلاقة": "Rasage", "مصباح": "Lampe", "إضاءة": "Éclairage", "كاميرا": "Caméra",
  "طائرة": "Drone", "درون": "Drone", "كمبيوتر": "Ordinateur", "مطبخ": "Cuisine",
  "منزل": "Maison", "تجميل": "Beauté", "عناية": "Soin", "مجوهرات": "Bijoux",
  "مقاوم": "Étanche", "للماء": "Waterproof", "سريع": "Rapide", "محمول": "Portable",
  "أصلي": "Authentique", "ممتاز": "Premium",
};

const AR_TO_TR_DICT: Record<string, string> = {
  "ساعات": "Saatler", "ساعة": "Saat", "ذكية": "Akıllı", "ذكي": "Akıllı",
  "أدوات": "Aletler", "أداة": "Alet", "طقم": "Set", "مجموعة": "Paket",
  "خياطة": "Dikiş", "جلد": "Deri", "سيارة": "Araba", "إلكترونيات": "Elektronik",
  "هاتف": "Telefon", "جوال": "Cep Telefonu", "شاحن": "Şarj Cihazı", "سماعات": "Kulaklık",
  "سماعة": "Kulaklık", "لاسلكي": "Kablosuz", "لاسلكية": "Kablosuz", "بلوتوث": "Bluetooth",
  "حقيبة": "Çanta", "حقائب": "Çantalar", "سفر": "Seyahat", "حذاء": "Ayakkabı",
  "أحذية": "Ayakkabılar", "رياضي": "Spor", "رياضية": "Spor", "ماكينة": "Makine",
  "حلاقة": "Tıraş", "مصباح": "Lamba", "إضاءة": "Aydınlatma", "كاميرا": "Kamera",
  "طائرة": "Dron", "درون": "Dron", "كمبيوتر": "Bilgisayar", "مطبخ": "Mutfak",
  "منزل": "Ev", "تجميل": "Güzellik", "عناية": "Bakım", "مجوهرات": "Takı",
  "مقاوم": "Su Geçirmez", "للماء": "Suya Dayanıklı", "سريع": "Hızlı", "محمول": "Taşınabilir",
  "أصلي": "Orijinal", "ممتاز": "Premium",
};

const AR_TO_ZH_DICT: Record<string, string> = {
  "ساعات": "手表", "ساعة": "手表", "ذكية": "智能", "ذكي": "智能",
  "أدوات": "工具", "أداة": "工具", "طقم": "套装", "مجموعة": "组合",
  "خياطة": "缝纫", "جلد": "真皮", "سيارة": "汽车", "إلكترونيات": "电子",
  "هاتف": "手机", "جوال": "手机", "شاحن": "充电器", "سماعات": "耳机",
  "سماعة": "耳机", "لاسلكي": "无线", "لاسلكية": "无线", "بلوتوث": "蓝牙",
  "حقيبة": "包", "حقائب": "箱包", "سفر": "旅行", "حذاء": "鞋",
  "أحذية": "鞋靴", "رياضي": "运动", "رياضية": "运动", "ماكينة": "剃须刀",
  "حلاقة": "理发器", "مصباح": "台灯", "إضاءة": "照明灯", "كاميرا": "相机",
  "طائرة": "无人机", "درون": "无人机", "كمبيوتر": "电脑", "مطبخ": "厨房",
  "منزل": "家居", "تجميل": "美妆", "عناية": "护肤", "مجوهرات": "首饰",
  "مقاوم": "防水", "للماء": "防水", "سريع": "快速", "محمول": "便携",
  "أصلي": "正品", "ممتاز": "高品质",
};

export function isValidEnglishText(t: string | null | undefined): boolean {
  if (!t) return false;
  const cleaned = t.trim();
  if (cleaned.length < 3) return false;
  if (cleaned.includes("\uFFFD")) return false;
  if (/[\u0600-\u06FF]/.test(cleaned)) return false;
  if (/[\u4E00-\u9FFF\u3400-\u4DBF\uAC00-\uD7AF\u1100-\u11FF]/.test(cleaned)) return false;
  const latinLetters = cleaned.match(/[a-zA-Z]/g);
  return Boolean(latinLetters && latinLetters.length >= 3);
}

export function isCleanArabicText(t: string | null | undefined): boolean {
  if (!t) return false;
  const cleaned = t.trim();
  if (cleaned.length < 3) return false;
  if (cleaned.includes("\uFFFD")) return false;
  if (/[\u4E00-\u9FFF\u3400-\u4DBF\uAC00-\uD7AF\u1100-\u11FF]/.test(cleaned)) return false;
  const arLetters = cleaned.match(/[\u0600-\u06FF]/g);
  return Boolean(arLetters && arLetters.length >= 3);
}

export function getProductLocalizedName(p: any, lang: string): string {
  if (!p) return "";
  const l = (lang || "ar").toLowerCase() as SupportedLang;
  const cleanSku = p.sku?.replace(/^ALI-/, "").slice(0, 14) || String(p.id || "PROD");
  const cat = p.category_id ? CLEAN_CATEGORY_NAMES[Number(p.category_id)] : null;

  // 1. Direct language-specific field if already localized & clean
  if (l === "ar") {
    if (isCleanArabicText(p.name_ar)) return p.name_ar.trim();
    if (isCleanArabicText(p.name)) return p.name.trim();
    const catAr = cat?.ar || "علي إكسبرس الرسمي";
    return `${catAr} - منتج أصلي عالي الجودة (${cleanSku})`;
  }

  if (l === "en") {
    if (isValidEnglishText(p.name_en)) return p.name_en.trim();
    if (isValidEnglishText(p.name)) return p.name.trim();
    const raw = (p.name_ar || p.name || p.name_en || "").trim();
    const tokens = raw.split(/[\s,،\-–—._/()+]+/);
    const words: string[] = [];
    for (const t of tokens) {
      if (!t) continue;
      if (/^[a-zA-Z0-9]+$/.test(t)) words.push(t);
      else if (AR_TO_EN_DICT[t]) words.push(AR_TO_EN_DICT[t]);
    }
    if (words.length >= 2) return words.slice(0, 8).join(" ") + " Pro Edition";
    const catEn = cat?.en || "AliExpress Verified";
    return `${catEn} Premium Item (${cleanSku})`;
  }

  if (l === "fr") {
    if (p.name_fr && !/[\u0600-\u06FF]/.test(p.name_fr)) return p.name_fr.trim();
    const raw = (p.name_ar || p.name || p.name_en || "").trim();
    const tokens = raw.split(/[\s,،\-–—._/()+]+/);
    const words: string[] = [];
    for (const t of tokens) {
      if (!t) continue;
      if (AR_TO_FR_DICT[t]) words.push(AR_TO_FR_DICT[t]);
      else if (/^[0-9]+$/.test(t)) words.push(t);
    }
    if (words.length >= 2) return words.slice(0, 8).join(" ") + " Édition Pro";
    const catFr = cat?.fr || cat?.en || "AliExpress Certifié";
    return `${catFr} Article de Qualité (${cleanSku})`;
  }

  if (l === "tr") {
    if (p.name_tr && !/[\u0600-\u06FF]/.test(p.name_tr)) return p.name_tr.trim();
    const raw = (p.name_ar || p.name || p.name_en || "").trim();
    const tokens = raw.split(/[\s,،\-–—._/()+]+/);
    const words: string[] = [];
    for (const t of tokens) {
      if (!t) continue;
      if (AR_TO_TR_DICT[t]) words.push(AR_TO_TR_DICT[t]);
      else if (/^[0-9]+$/.test(t)) words.push(t);
    }
    if (words.length >= 2) return words.slice(0, 8).join(" ") + " Özel Seri";
    const catTr = cat?.tr || cat?.en || "AliExpress Orijinal";
    return `${catTr} Kaliteli Ürün (${cleanSku})`;
  }

  if (l === "zh") {
    if (p.name_zh && /[\u4E00-\u9FFF]/.test(p.name_zh)) return p.name_zh.trim();
    const raw = (p.name_ar || p.name || p.name_en || "").trim();
    const tokens = raw.split(/[\s,،\-–—._/()+]+/);
    const words: string[] = [];
    for (const t of tokens) {
      if (!t) continue;
      if (AR_TO_ZH_DICT[t]) words.push(AR_TO_ZH_DICT[t]);
      else if (/^[0-9]+$/.test(t)) words.push(t);
    }
    if (words.length >= 2) return words.slice(0, 8).join("") + " 优质版";
    const catZh = cat?.zh || "速卖通优选";
    return `${catZh} 精品正品 (${cleanSku})`;
  }

  return p.name_ar || p.name || String(p.id);
}

export function getProductLocalizedDesc(p: any, lang: string): string {
  if (!p) return "";
  const l = (lang || "ar").toLowerCase() as SupportedLang;
  const cleanSku = p.sku?.replace(/^ALI-/, "").slice(0, 14) || String(p.id || "PROD");
  const cat = p.category_id ? CLEAN_CATEGORY_NAMES[Number(p.category_id)] : null;

  if (l === "ar") {
    if (isCleanArabicText(p.description_ar)) return p.description_ar.trim();
    if (isCleanArabicText(p.description)) return p.description.trim();
    const catAr = cat?.ar || "منتج رسمي من علي إكسبرس";
    return `${catAr} أصلي عالي الجودة ومضمون 100% من المورد المعتمد (كود: ${cleanSku}) مع شحن سريع ومباشر.`;
  }

  if (l === "en") {
    if (isValidEnglishText(p.description_en)) return p.description_en.trim();
    if (isValidEnglishText(p.description)) return p.description.trim();
    const catEn = cat?.en || "AliExpress verified item";
    return `Authentic ${catEn} (SKU: ${cleanSku}). High quality standards, official warranty and express shipping.`;
  }

  if (l === "fr") {
    if (p.description_fr && !/[\u0600-\u06FF]/.test(p.description_fr)) return p.description_fr.trim();
    const catFr = cat?.fr || "Article vérifié AliExpress";
    return `${catFr} authentique (Réf: ${cleanSku}). Normes de haute qualité certifiées, garantie fournisseur officielle et expédition rapide.`;
  }

  if (l === "tr") {
    if (p.description_tr && !/[\u0600-\u06FF]/.test(p.description_tr)) return p.description_tr.trim();
    const catTr = cat?.tr || "Orijinal AliExpress ürünü";
    return `Orijinal ${catTr} (Stok Kodu: ${cleanSku}). Yüksek kalite standartları, resmi tedarikçi garantisi ve hızlı kargo.`;
  }

  if (l === "zh") {
    if (p.description_zh && /[\u4E00-\u9FFF]/.test(p.description_zh)) return p.description_zh.trim();
    const catZh = cat?.zh || "官方认证商品";
    return `正品 ${catZh}（编号：${cleanSku}）。官方严选正品保障，高品质工艺标准，支持国际极速直发。`;
  }

  return p.description_ar || p.description || "";
}

export function getCategoryLocalizedName(c: any, lang: string): string {
  if (!c) return "";
  const l = (lang || "ar").toLowerCase() as SupportedLang;
  const cleanCat = CLEAN_CATEGORY_NAMES[Number(c.id)];
  if (cleanCat && cleanCat[l]) {
    return cleanCat[l];
  }
  if (l === "ar") {
    return c.name_ar || c.name || "فئة";
  }
  if (l === "en") {
    return isValidEnglishText(c.name_en) ? c.name_en : (cleanCat?.en || c.name || "Category");
  }
  return c[`name_${l}`] || cleanCat?.[l] || cleanCat?.en || c.name_en || c.name_ar || c.name || "";
}

export const UI_LABELS = {
  featured: {
    ar: "✨ منتج مميز",
    en: "✨ Featured",
    fr: "✨ En vedette",
    tr: "✨ Öne Çıkan",
    zh: "✨ 精选商品",
  },
  viewProduct: {
    ar: "عرض المنتج",
    en: "View",
    fr: "Voir",
    tr: "İncele",
    zh: "查看详情",
  },
  sku: {
    ar: "كود المنتج",
    en: "SKU",
    fr: "Réf Produit",
    tr: "Ürün Kodu",
    zh: "商品编号",
  },
  stock: {
    ar: "الكمية المتاحة",
    en: "Available Stock",
    fr: "Stock Disponible",
    tr: "Mevcut Stok",
    zh: "库存数量",
  },
  inCart: {
    ar: "في السلة",
    en: "In Cart",
    fr: "Dans le panier",
    tr: "Sepette",
    zh: "已在购物车",
  },
  addMore: {
    ar: "إضافة المزيد",
    en: "Add More",
    fr: "Ajouter plus",
    tr: "Daha Fazla Ekle",
    zh: "继续添加",
  },
  currency: {
    ar: "العملة",
    en: "Currency",
    fr: "Devise",
    tr: "Para Birimi",
    zh: "货币",
  },
  selectCurrency: {
    ar: "اختر العملة",
    en: "Select Currency",
    fr: "Choisir la devise",
    tr: "Para Birimi Seç",
    zh: "选择货币",
  },
  language: {
    ar: "اللغة",
    en: "Language",
    fr: "Langue",
    tr: "Dil",
    zh: "语言",
  },
  selectLanguage: {
    ar: "اختر اللغة",
    en: "Select Language",
    fr: "Choisir la langue",
    tr: "Dil Seçin",
    zh: "选择语言",
  },
  privacyPolicy: {
    ar: "سياسة الخصوصية",
    en: "Privacy Policy",
    fr: "Politique de Confidentialité",
    tr: "Gizlilik Politikası",
    zh: "隐私政策",
  },
  returns: {
    ar: "المرتجعات واسترداد الأموال",
    en: "Returns & Refunds",
    fr: "Retours & Remboursements",
    tr: "İade ve Geri Ödemeler",
    zh: "退货与退款",
  },
  favorites: {
    ar: "المفضلة",
    en: "Favorites",
    fr: "Favoris",
    tr: "Favoriler",
    zh: "我的收藏",
  },
  emptyFavorites: {
    ar: "قائمة المفضلة فارغة",
    en: "Your favorites list is empty",
    fr: "Votre liste de favoris est vide",
    tr: "Favori listeniz boş",
    zh: "您的收藏夹是空的",
  },
  browseProducts: {
    ar: "تصفح المنتجات الآن",
    en: "Browse Products Now",
    fr: "Parcourir les produits",
    tr: "Ürünleri İncele",
    zh: "立即浏览商品",
  },
  inSupplierStock: {
    ar: "متوفر في مستودع المورد",
    en: "In Supplier Stock",
    fr: "En stock chez le fournisseur",
    tr: "Tedarikçi Stokunda",
    zh: "供应商现货库存",
  },
  unitsAvailable: {
    ar: "قطعة متوفرة",
    en: "units available",
    fr: "unités disponibles",
    tr: "adet mevcut",
    zh: "件现货",
  },
  outOfStock: {
    ar: "نفد من المخزون",
    en: "Out of Stock",
    fr: "Rupture de stock",
    tr: "Tükendi",
    zh: "已售罄",
  },
  productNotFound: {
    ar: "المنتج غير موجود أو تم حذفه",
    en: "Product not found or removed",
    fr: "Produit non trouvé ou supprimé",
    tr: "Ürün bulunamadı veya kaldırıldı",
    zh: "商品未找到或已下架",
  },
  addToCart: {
    ar: "أضف للسلة",
    en: "Add to Cart",
    fr: "Ajouter au Panier",
    tr: "Sepete Ekle",
    zh: "加入购物车",
  },
  added: {
    ar: "تمت الإضافة ✓",
    en: "Added ✓",
    fr: "Ajouté ✓",
    tr: "Eklendi ✓",
    zh: "已添加 ✓",
  },
  qualityGuarantee: {
    ar: "ضمان الجودة 100% واستيراد رسمي",
    en: "100% Quality Guarantee & Verified Import",
    fr: "Garantie de qualité 100% & Import vérifié",
    tr: "%100 Kalite Garantisi ve Doğrulanmış İthalat",
    zh: "100% 正品保障与官方认证直采",
  },
  fastShipping: {
    ar: "شحن سريع ومباشر",
    en: "Fast Direct Shipping",
    fr: "Expédition Rapide & Directe",
    tr: "Hızlı ve Doğrudan Kargo",
    zh: "极速直发配送",
  },
};
