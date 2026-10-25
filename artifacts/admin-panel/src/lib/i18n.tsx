import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "ar" | "en";

export interface Translations {
  // Navigation
  dashboard: string;
  products: string;
  categories: string;
  orders: string;
  returns: string;
  customers: string;
  users: string;
  vendors: string;
  dropshipping: string;
  affiliates: string;
  my_commission: string;
  supplier_payments: string;
  accounting: string;
  reports: string;
  partner_ads: string;
  affiliate_settings: string;
  settings: string;
  privacy_policy: string;
  logout: string;
  admin_panel: string;
  
  // Login
  login_title: string;
  login_subtitle: string;
  email: string;
  password: string;
  login_button: string;
  logging_in: string;
  login_error: string;
  
  // Common Actions
  add_new: string;
  save: string;
  edit: string;
  delete: string;
  cancel: string;
  search: string;
  status: string;
  actions: string;
  active: string;
  inactive: string;
  total: string;
  loading: string;
  no_data: string;
}

const translations: Record<Language, Translations> = {
  ar: {
    dashboard: "لوحة التحكم",
    products: "المنتجات",
    categories: "الفئات والأقسام",
    orders: "الطلبات والمبيعات",
    returns: "المرتجعات والاسترداد",
    customers: "العملاء",
    users: "بيانات المستخدمين",
    vendors: "البائعون والتجار",
    dropshipping: "الدروبشيبينغ",
    affiliates: "عمولات المسوقين",
    my_commission: "عمولاتي الشخصية",
    supplier_payments: "مدفوعات الموردين",
    accounting: "المحاسبة والمالية",
    reports: "التقارير والإحصائيات",
    partner_ads: "إعلانات الشركاء",
    affiliate_settings: "المنصات العالمية",
    settings: "الإعدادات العامة",
    privacy_policy: "سياسة الخصوصية",
    logout: "تسجيل الخروج",
    admin_panel: "لوحة إدارة عماد إكسبريس",
    
    login_title: "تسجيل الدخول للمدير",
    login_subtitle: "المنصة الشاملة لإدارة التجارة والتسويق",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    login_button: "تسجيل الدخول",
    logging_in: "جارٍ تسجيل الدخول...",
    login_error: "بيانات الدخول غير صحيحة",
    
    add_new: "إضافة جديد",
    save: "حفظ التغييرات",
    edit: "تعديل",
    delete: "حذف",
    cancel: "إلغاء",
    search: "بحث...",
    status: "الحالة",
    actions: "الإجراءات",
    active: "مفعل",
    inactive: "معطل",
    total: "الإجمالي",
    loading: "جارٍ التحميل...",
    no_data: "لا توجد بيانات متاحة",
  },
  en: {
    dashboard: "Dashboard",
    products: "Products",
    categories: "Categories",
    orders: "Orders & Sales",
    returns: "Returns & Refunds",
    customers: "Customers",
    users: "Users & Accounts",
    vendors: "Vendors & Sellers",
    dropshipping: "Dropshipping",
    affiliates: "Affiliate Commissions",
    my_commission: "My Commission",
    supplier_payments: "Supplier Payments",
    accounting: "Accounting & Finance",
    reports: "Reports & Analytics",
    partner_ads: "Partner Ads",
    affiliate_settings: "Global Platforms",
    settings: "Settings",
    privacy_policy: "Privacy Policy",
    logout: "Logout",
    admin_panel: "Emad Express Admin Panel",
    
    login_title: "Admin Sign In",
    login_subtitle: "Comprehensive Platform for Commerce & Marketing",
    email: "Email Address",
    password: "Password",
    login_button: "Sign In",
    logging_in: "Signing in...",
    login_error: "Invalid credentials",
    
    add_new: "Add New",
    save: "Save Changes",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    search: "Search...",
    status: "Status",
    actions: "Actions",
    active: "Active",
    inactive: "Inactive",
    total: "Total",
    loading: "Loading...",
    no_data: "No data available",
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
  dir: "rtl" | "ltr";
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("app_lang") || localStorage.getItem("site_lang") || localStorage.getItem("admin_lang") || "ar") as Language;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("admin_lang", lang);
    localStorage.setItem("app_lang", lang);
    localStorage.setItem("site_lang", lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  useEffect(() => {
    const dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  const value: I18nContextType = {
    language,
    setLanguage,
    toggleLanguage,
    t: translations[language],
    dir: language === "ar" ? "rtl" : "ltr",
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}

const AR_EN_DICT: Record<string, string> = {
  "ساعات": "Watches",
  "ساعة": "Watch",
  "ذكية": "Smart",
  "ذكي": "Smart",
  "فتاحة": "Opener",
  "علب": "Cases",
  "علبة": "Case",
  "أدوات": "Tools",
  "أداة": "Tool",
  "طقم": "Set",
  "مجموعة": "Kit",
  "فولاذ": "Steel",
  "أعلام": "Flags",
  "علم": "Flag",
  "لافتات": "Banners",
  "ملونة": "Color",
  "شاطئ": "Beach",
  "خياطة": "Sewing",
  "تطريز": "Embroidery",
  "حرف": "Craft",
  "أكريليك": "Acrylic",
  "مسطرة": "Ruler",
  "شفرة": "Blade",
  "شفرات": "Blades",
  "حصيرة": "Mat",
  "قص": "Cutting",
  "أمان": "Safety",
  "قفل": "Lock",
  "سكين": "Knife",
  "قاطع": "Cutter",
  "مقص": "Scissors",
  "ألمنيوم": "Aluminum",
  "جلد": "Leather",
  "سيارات": "Car",
  "سيارة": "Car",
  "إلكترونيات": "Electronics",
  "هاتف": "Phone",
  "جوال": "Mobile",
  "شاحن": "Charger",
  "سماعات": "Earbuds",
  "سماعة": "Headphone",
  "لاسلكي": "Wireless",
  "لاسلكية": "Wireless",
  "بلوتوث": "Bluetooth",
  "حقيبة": "Bag",
  "حقائب": "Bags",
  "سفر": "Travel",
  "حذاء": "Shoes",
  "أحذية": "Shoes",
  "رياضي": "Sport",
  "رياضية": "Sports",
  "ماكينة": "Machine",
  "حلاقة": "Trimmer",
  "مصباح": "Lamp",
  "إضاءة": "Lighting",
  "كاميرا": "Camera",
  "طائرة": "Drone",
  "درون": "Drone",
  "كمبيوتر": "Computer",
  "لوحة": "Keyboard",
  "مفاتيح": "Keys",
  "فأرة": "Mouse",
  "مطبخ": "Kitchen",
  "منزل": "Home",
  "منزلي": "Home",
  "منزلية": "Home",
  "تجميل": "Beauty",
  "عناية": "Care",
  "بشرة": "Skin",
  "مكياج": "Makeup",
  "مجوهرات": "Jewelry",
  "خاتم": "Ring",
  "سلسال": "Necklace",
  "أساور": "Bracelet",
  "ألعاب": "Toys",
  "لعبة": "Toy",
  "أطفال": "Kids",
  "مقاوم": "Waterproof",
  "مقاومة": "Waterproof",
  "للماء": "Waterproof",
  "سريع": "Fast",
  "سريعة": "Fast",
  "محمول": "Portable",
  "محمولة": "Portable",
  "صغير": "Mini",
  "صغيرة": "Mini",
  "كبير": "Pro Max",
  "كبيرة": "Pro Max",
  "عالي": "High-Quality",
  "عالية": "High-Quality",
  "جودة": "Quality",
  "ممتاز": "Premium",
  "ممتازة": "Premium",
  "أصلي": "Original",
  "أصلية": "Original",
  "مطور": "Upgraded",
  "مطورة": "Upgraded",
};

export const CLEAN_CATEGORY_NAMES: Record<number, { ar: string; en: string }> = {
  1: { ar: "إلكترونيات وأجهزة ذكية", en: "Electronics & Smart Devices" },
  2: { ar: "أزياء وموضة", en: "Fashion & Style" },
  3: { ar: "هواتف ذكية وإكسسوارات", en: "Smartphones & Accessories" },
  4: { ar: "ساعات ومجوهرات", en: "Watches & Jewelry" },
  5: { ar: "المنزل والمطبخ", en: "Home & Kitchen" },
  6: { ar: "الصحة والجمال", en: "Health & Beauty" },
  7: { ar: "رياضة وترفيه", en: "Sports & Outdoors" },
  8: { ar: "ألعاب وأطفال", en: "Toys, Kids & Babies" },
  9: { ar: "سيارات ودراجات نارية", en: "Automotive & Motorcycles" },
  10: { ar: "أحذية وحقائب", en: "Shoes & Bags" },
  11: { ar: "كمبيوتر ولابتوب", en: "Computers & Office" },
  12: { ar: "أجهزة إلكترونية استهلاكية", en: "Consumer Electronics" },
  13: { ar: "أزياء وملابس رجالية", en: "Men's Fashion" },
  14: { ar: "أدوات وتحسين المنزل", en: "Tools & Home Improvement" },
  15: { ar: "إضاءة ومصابيح", en: "Lights & Lighting" },
  16: { ar: "أمان وحماية ذكية", en: "Security & Protection" },
  17: { ar: "مستلزمات الحيوانات الأليفة", en: "Pet Supplies" },
  18: { ar: "أدوات مكتبية ومدرسية", en: "Office & School Supplies" },
  19: { ar: "أثاث وديكور منزلي", en: "Furniture & Home Decor" },
  20: { ar: "كاميرات وطائرات درون", en: "Cameras & Drones" },
  21: { ar: "المنزل الذكي وإنترنت الأشياء", en: "Smart Home & IoT" },
  22: { ar: "وصلات وشعر مستعار", en: "Hair Extensions & Wigs" },
  23: { ar: "مستلزمات الحفلات والمناسبات", en: "Event & Party Supplies" },
  24: { ar: "فنون وحرف وخياطة", en: "Arts, Crafts & Sewing" },
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

export function getProductLocalizedName(p: any, lang: Language): string {
  if (!p) return "";
  if (p[`name_${lang}`]) return p[`name_${lang}`];
  const cat = p.category_id ? CLEAN_CATEGORY_NAMES[Number(p.category_id)] : null;
  const catEn = cat ? cat.en : "AliExpress Verified";
  const catAr = cat ? cat.ar : "علي إكسبرس الرسمي";
  const cleanSku = p.sku?.replace(/^ALI-/, "").slice(0, 14) || String(p.id || "PROD");

  if (lang === "en") {
    if (isValidEnglishText(p.name_en)) {
      return p.name_en;
    }
    if (isValidEnglishText(p.name)) {
      return p.name;
    }
    
    // Convert Arabic product title dynamically to clear English
    const rawAr = p.name_ar || p.name || p.name_en || "";
    const tokens = rawAr.split(/[\s,،\-–—._/()+]+/);
    const translatedWords: string[] = [];
    
    for (const w of tokens) {
      if (!w) continue;
      if (/^[a-zA-Z0-9]+$/.test(w)) {
        translatedWords.push(w);
      } else if (AR_EN_DICT[w]) {
        translatedWords.push(AR_EN_DICT[w]);
      }
    }

    if (translatedWords.length >= 2) {
      return translatedWords.slice(0, 8).join(" ") + " Pro Edition";
    }

    return `${catEn} Premium Item (${cleanSku})`;
  } else {
    if (isCleanArabicText(p.name_ar)) return p.name_ar;
    if (isCleanArabicText(p.name)) return p.name;
    return `${catAr} - منتج أصلي عالي الجودة (${cleanSku})`;
  }
}

export function getProductLocalizedDesc(p: any, lang: Language): string {
  if (!p) return "";
  if (p[`description_${lang}`]) return p[`description_${lang}`];
  const cat = p.category_id ? CLEAN_CATEGORY_NAMES[Number(p.category_id)] : null;
  const catEn = cat ? cat.en : "AliExpress verified item";
  const catAr = cat ? cat.ar : "منتج رسمي من علي إكسبرس";
  const cleanSku = p.sku?.replace(/^ALI-/, "").slice(0, 14) || String(p.id || "PROD");

  if (lang === "en") {
    if (isValidEnglishText(p.description_en)) return p.description_en;
    return `Authentic ${catEn} (SKU: ${cleanSku}). High quality standards and fast international shipping.`;
  } else {
    if (isCleanArabicText(p.description_ar)) return p.description_ar;
    return `${catAr} أصلي عالي الجودة ومضمون 100% من المورد المعتمد (كود: ${cleanSku}) مع شحن سريع ومباشر.`;
  }
}
