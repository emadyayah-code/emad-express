import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type SupportedLanguage = "ar" | "en";
export type SupportedCurrency = "SAR" | "USD" | "YER" | "EUR" | "AED";

interface AppContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  currency: SupportedCurrency;
  setCurrency: (curr: SupportedCurrency) => void;
  t: (key: string) => string;
  formatPrice: (amount: number) => string;
  dir: "rtl" | "ltr";
}

const translations: Record<SupportedLanguage, Record<string, string>> = {
  ar: {
    "app.name": "عماد إكسبرس",
    "nav.home": "الرئيسية",
    "nav.products": "المنتجات",
    "nav.categories": "الأقسام",
    "nav.cart": "السلة",
    "nav.orders": "طلباتي",
    "nav.profile": "حسابي",
    "nav.login": "تسجيل الدخول",
    "nav.logout": "تسجيل الخروج",
    "product.price": "السعر",
    "product.add_to_cart": "أضف للسلة",
    "product.buy_now": "اشتري الآن",
    "product.out_of_stock": "نفذت الكمية",
    "product.description": "الوصف",
    "product.related": "منتجات مشابهة",
    "cart.title": "سلة التسوق",
    "cart.empty": "السلة فارغة",
    "cart.checkout": "إتمام الشراء",
    "cart.total": "المجموع",
    "order.title": "طلباتي",
    "order.number": "رقم الطلب",
    "order.status": "الحالة",
    "order.total": "المبلغ",
    "order.date": "التاريخ",
    "order.pay_now": "ادفع الآن",
    "order.track": "تتبع الشحنة",
    "payment.title": "الدفع",
    "payment.method": "طريقة الدفع",
    "payment.cod": "الدفع عند الاستلام",
    "payment.card": "بطاقة ائتمان",
    "payment.paypal": "PayPal",
    "payment.confirm": "تأكيد الدفع",
    "common.loading": "جاري التحميل...",
    "common.error": "حدث خطأ",
    "common.success": "تم بنجاح",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.delete": "حذف",
    "common.edit": "تعديل",
    "common.search": "بحث",
    "common.filter": "تصفية",
    "currency.SAR": "ريال سعودي",
    "currency.USD": "دولار أمريكي",
    "currency.YER": "ريال يمني",
    "currency.EUR": "يورو",
    "currency.AED": "درهم إماراتي",
  },
  en: {
    "app.name": "Emad Express",
    "nav.home": "Home",
    "nav.products": "Products",
    "nav.categories": "Categories",
    "nav.cart": "Cart",
    "nav.orders": "My Orders",
    "nav.profile": "My Account",
    "nav.login": "Login",
    "nav.logout": "Logout",
    "product.price": "Price",
    "product.add_to_cart": "Add to Cart",
    "product.buy_now": "Buy Now",
    "product.out_of_stock": "Out of Stock",
    "product.description": "Description",
    "product.related": "Related Products",
    "cart.title": "Shopping Cart",
    "cart.empty": "Your cart is empty",
    "cart.checkout": "Checkout",
    "cart.total": "Total",
    "order.title": "My Orders",
    "order.number": "Order Number",
    "order.status": "Status",
    "order.total": "Total",
    "order.date": "Date",
    "order.pay_now": "Pay Now",
    "order.track": "Track Shipment",
    "payment.title": "Payment",
    "payment.method": "Payment Method",
    "payment.cod": "Cash on Delivery",
    "payment.card": "Credit Card",
    "payment.paypal": "PayPal",
    "payment.confirm": "Confirm Payment",
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.success": "Success",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.search": "Search",
    "common.filter": "Filter",
    "currency.SAR": "Saudi Riyal",
    "currency.USD": "US Dollar",
    "currency.YER": "Yemeni Rial",
    "currency.EUR": "Euro",
    "currency.AED": "UAE Dirham",
  },
};

const currencySymbols: Record<SupportedCurrency, string> = {
  SAR: "ر.س",
  USD: "$",
  YER: "ر.ي",
  EUR: "€",
  AED: "د.إ",
};

const exchangeRates: Record<SupportedCurrency, number> = {
  SAR: 3.75,
  USD: 1,
  YER: 1500,
  EUR: 0.92,
  AED: 3.67,
};

function convertPrice(amountUSD: number, toCurrency: SupportedCurrency): number {
  const rate = exchangeRates[toCurrency] || 1;
  return parseFloat((amountUSD * rate).toFixed(2));
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem("emad_lang") as SupportedLanguage) || "ar";
  });
  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => {
    return (localStorage.getItem("emad_currency") as SupportedCurrency) || "SAR";
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem("emad_lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  };

  const setCurrency = (curr: SupportedCurrency) => {
    setCurrencyState(curr);
    localStorage.setItem("emad_currency", curr);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const formatPrice = (amountUSD: number): string => {
    const converted = convertPrice(amountUSD, currency);
    const symbol = currencySymbols[currency];
    if (language === "ar") {
      return `${converted.toLocaleString("ar-SA")} ${symbol}`;
    }
    return `${symbol}${converted.toLocaleString("en-US")}`;
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  return (
    <AppContext.Provider value={{ language, setLanguage, currency, setCurrency, t, formatPrice, dir: language === "ar" ? "rtl" : "ltr" }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
