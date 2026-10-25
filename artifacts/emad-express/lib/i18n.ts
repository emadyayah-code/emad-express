export type SupportedLang = "ar" | "en" | "fr" | "tr" | "zh";

export function getProductLocalizedName(p: any, lang: string): string {
  if (!p) return "";
  const l = (lang || "ar").toLowerCase();
  return (
    p[`name_${l}`] ||
    (l === "ar" ? p.name_ar : p[`name_${l}`]) ||
    p.name ||
    p.name_en ||
    p.name_ar ||
    ""
  );
}

export function getProductLocalizedDesc(p: any, lang: string): string {
  if (!p) return "";
  const l = (lang || "ar").toLowerCase();
  return (
    p[`description_${l}`] ||
    (l === "ar" ? p.description_ar : p[`description_${l}`]) ||
    p.description ||
    p.description_en ||
    p.description_ar ||
    ""
  );
}

export function getCategoryLocalizedName(c: any, lang: string): string {
  if (!c) return "";
  const l = (lang || "ar").toLowerCase();
  return (
    c[`name_${l}`] ||
    (l === "ar" ? c.name_ar : c[`name_${l}`]) ||
    c.name ||
    c.name_en ||
    c.name_ar ||
    ""
  );
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
};
