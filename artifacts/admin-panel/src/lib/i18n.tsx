import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "ar" | "en";

export interface Translations {
  // Navigation
  dashboard: string;
  products: string;
  categories: string;
  orders: string;
  customers: string;
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
    customers: "العملاء",
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
    customers: "Customers",
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
    return (localStorage.getItem("admin_lang") as Language) || "ar";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("admin_lang", lang);
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
  "ساعات": "Watch",
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

export function getProductLocalizedName(p: any, lang: Language): string {
  if (!p) return "";
  const isArabic = (t: string) => /[\u0600-\u06FF]/.test(t || "");

  if (lang === "en") {
    if (p.name_en && !isArabic(p.name_en)) {
      return p.name_en;
    }
    if (p.name && !isArabic(p.name)) {
      return p.name;
    }
    
    // Convert Arabic product title dynamically to clear English
    const rawAr = p.name_ar || p.name || p.name_en || "";
    if (!rawAr) return "AliExpress Verified Product";
    
    // Extract English numbers and words if already embedded
    const words = rawAr.split(/[\s,،\-–—._/]+/);
    const translatedWords: string[] = [];
    
    for (const w of words) {
      if (!w) continue;
      if (/^[a-zA-Z0-9]+$/.test(w)) {
        translatedWords.push(w);
      } else if (AR_EN_DICT[w]) {
        translatedWords.push(AR_EN_DICT[w]);
      }
    }

    if (translatedWords.length >= 2) {
      return translatedWords.join(" ") + " Pro Edition";
    }

    // Default fallback based on SKU or category
    return `AliExpress Premium Item (${p.sku || "PROD"})`;
  } else {
    if (p.name_ar && isArabic(p.name_ar)) return p.name_ar;
    return p.name_ar || p.name || p.name_en || "منتج رسمي عالي الجودة";
  }
}

export function getProductLocalizedDesc(p: any, lang: Language): string {
  if (!p) return "";
  const isArabic = (t: string) => /[\u0600-\u06FF]/.test(t || "");

  if (lang === "en") {
    if (p.description_en && !isArabic(p.description_en)) return p.description_en;
    return `Authentic AliExpress verified item (SKU: ${p.sku || "—"}). High quality standards and fast international shipping.`;
  } else {
    if (p.description_ar && isArabic(p.description_ar)) return p.description_ar;
    return p.description_ar || p.description || "منتج عالي الجودة ومضمون من المورد الرسمي مع شحن سريع.";
  }
}
