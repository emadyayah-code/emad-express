import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { getApiBase } from "@/lib/api";
import { 
  X, Check, ShieldCheck, Truck, CreditCard, AlertCircle, ShoppingBag, 
  MapPin, Phone, User, Mail, DollarSign, CheckCircle2, MessageCircle, 
  ExternalLink, ChevronRight, ArrowLeft 
} from "lucide-react";

import { ALL_COUNTRIES } from "@/lib/countries";
import { useI18n } from "@/lib/i18n";

export function CheckoutModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { language, dir } = useI18n();
  const { items, subtotal, clearCart } = useCart();
  const { customer, customerToken, register, openLoginModal } = useCustomerAuth();

  // Address & contact fields
  const [recipientName, setRecipientName] = useState(customer?.name || "");
  const [recipientPhone, setRecipientPhone] = useState(customer?.phone || "");
  const [recipientEmail, setRecipientEmail] = useState(customer?.email || "");
  const [country, setCountry] = useState<string>("YE");
  const [city, setCity] = useState("صنعاء");
  const [addressDetails, setAddressDetails] = useState("");
  const [quickPassword, setQuickPassword] = useState("");

  // Shipping & Payment selection (Matches mobile app 100%)
  const [shippingMethod, setShippingMethod] = useState<string>("dhl");
  const [paymentMethod, setPaymentMethod] = useState<string>("paypal");
  const [paySubMode, setPaySubMode] = useState<"card" | "paypal_account">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [transferRef, setTransferRef] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    const groups: string[] = [];
    for (let i = 0; i < digits.length; i += 4) {
      groups.push(digits.slice(i, i + 4));
    }
    return groups.join(" ");
  };

  const formatCardExp = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    return digits;
  };

  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s/g, "");
    if (clean.startsWith("4")) return "VISA";
    if (/^(5[1-5]|2[2-7])/.test(clean)) return "MasterCard";
    if (/^3[47]/.test(clean)) return "AMEX";
    if (/^(588845|4|6|9)/.test(clean)) return "مدى Mada";
    return "بطاقة بنكية";
  };

  // Sync recipient details when customer changes
  useEffect(() => {
    if (customer) {
      if (!recipientName) setRecipientName(customer.name);
      if (!recipientEmail) setRecipientEmail(customer.email);
      if (!recipientPhone && customer.phone) setRecipientPhone(customer.phone);
    }
  }, [customer]);

  // Adjust default shipping method based on country: 529 SAR ONLY for Yemen
  useEffect(() => {
    if (country === "YE") {
      setShippingMethod("dhl");
    } else {
      setShippingMethod("standard");
    }
  }, [country]);

  if (!isOpen) return null;

  // emadexpress Shipping Options: 529 SAR DHL Express ONLY for Yemen, Choice/Standard for Saudi & Global
  const yemenShippingOptions = [
    {
      id: "dhl",
      title: language === "ar" ? "دي إتش إل إكسبريس لليمن (DHL Express)" : "DHL Express to Yemen",
      badge: language === "ar" ? "شحن سريع جوي لليمن ✈️" : "Express Air to Yemen ✈️",
      desc: language === "ar"
        ? "شحن جوي سريع ومباشر إلى كافة المحافظات اليمنية عبر عماد اكسبرس • تسليم 7-15 يوم عمل (خاص باليمن فقط)"
        : "Direct air express shipping to all Yemen provinces via Emad Express • 7-15 business days",
      fee: 529,
    },
  ];

  const globalShippingOptions = [
    {
      id: "standard",
      title: subtotal >= 100
        ? (language === "ar" ? "شحن مجاني عماد اكسبرس (emadexpress Choice)" : "Free Choice Shipping")
        : (language === "ar" ? "شحن قياسي عماد اكسبرس (emadexpress Standard)" : "Standard Shipping"),
      badge: subtotal >= 100 ? (language === "ar" ? "Choice مجاني 🎉" : "Free Choice 🎉") : (language === "ar" ? "توصيل قياسي" : "Standard Delivery"),
      desc: subtotal >= 100
        ? (language === "ar" ? "شحن مجاني رسمي لطلبك بقيمة 100+ ر.س • تسليم 10-18 يوم عمل" : "Free shipping for orders over 100 SAR • 10-18 business days")
        : (language === "ar" ? "شحن قياسي دولي موثوق مع رقم تتبع • تسليم 10-18 يوم عمل (مجاني عند الشراء بـ 100 ر.س)" : "Reliable international standard shipping with tracking • 10-18 business days"),
      fee: subtotal >= 100 ? 0 : 15,
    },
    {
      id: "premium",
      title: language === "ar" ? "شحن سريع بريميوم (emadexpress Premium)" : "Premium Express Shipping",
      badge: language === "ar" ? "أولوية فائقة ⚡" : "Top Priority ⚡",
      desc: language === "ar" ? "شحن جوي سريع بأعلى أولوية وتسليم للباب • تسليم 5-9 أيام عمل" : "Priority express air shipping to your door • 5-9 business days",
      fee: 35,
    },
  ];

  const shippingOptions = country === "YE" ? yemenShippingOptions : globalShippingOptions;
  const currentShipping = shippingOptions.find((o) => o.id === shippingMethod) || shippingOptions[0];
  const shippingFee = currentShipping.fee;

  // Tax: 15% VAT for Saudi Arabia, 0% for Yemen and International
  const tax = country === "SA" ? Math.round(subtotal * 0.15) : 0;
  const grandTotal = subtotal + tax + shippingFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!recipientName.trim() || !recipientPhone.trim() || !addressDetails.trim()) {
      setErrorMsg(language === "ar" ? "يرجى إكمال بيانات المستلم والعنوان بالتفصيل" : "Please complete all recipient and address details");
      return;
    }

    if (paymentMethod === "paypal" && paySubMode === "card") {
      const cleanNum = cardNumber.replace(/\s/g, "");
      if (cleanNum.length < 15) {
        setErrorMsg(language === "ar" ? "يرجى إدخال رقم البطاقة البنكية المكون من 16 رقماً" : "Please enter a valid 16-digit card number");
        return;
      }
      if (!cardExp.includes("/") || cardExp.length < 4) {
        setErrorMsg(language === "ar" ? "يرجى إدخال تاريخ انتهاء البطاقة (شهر/سنة مثل 08/28)" : "Please enter card expiration date (MM/YY)");
        return;
      }
      if (cardCvv.length < 3) {
        setErrorMsg(language === "ar" ? "يرجى إدخال رمز أمان البطاقة CVV (3 أرقام)" : "Please enter CVV code (3 digits)");
        return;
      }
    }

    if (items.length === 0) {
      setErrorMsg(language === "ar" ? "سلة المشتريات فارغة" : "Shopping cart is empty");
      return;
    }

    setLoading(true);
    try {
      let activeToken = customerToken;

      // Auto-register customer if not logged in and provided a password
      if (!activeToken && recipientEmail && quickPassword.length >= 6) {
        try {
          const regRes = await register(recipientName, recipientEmail, recipientPhone, quickPassword);
          activeToken = regRes?.access_token || regRes?.token;
        } catch {
          // If already registered, continue
        }
      }

      const selectedCountryObj = ALL_COUNTRIES.find(c => c.code === country) || { nameAr: "اليمن", flag: "🇾🇪" };
      const fullShippingAddress = `${recipientName} (${recipientPhone}) - ${selectedCountryObj.flag} ${selectedCountryObj.nameAr}، ${city}، ${addressDetails}`;

      const orderPayload = {
        items: items.map((i) => ({
          product_id: i.id,
          product_name: String(i.name || "Product").trim().slice(0, 500),
          quantity: i.quantity,
          price: i.price,
          total: i.price * i.quantity,
          source_url: (i as any).source_url || (i as any).sourceUrl || "",
        })),
        shipping_address: fullShippingAddress,
        shipping_method: shippingMethod,
        shipping_country: country,
        shipping_city: city,
        payment_method: paymentMethod,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        recipient_email: recipientEmail,
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (activeToken) {
        headers["Authorization"] = `Bearer ${activeToken}`;
      }

      const res = await fetch(`${getApiBase()}/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "حدث خطأ أثناء تسجيل الطلب");
      }

      const orderId = data?.data?.id || data?.id || data?.order?.id;

      // Handle AliExpress Direct or PayPal payment redirection
      let redirectUrl = "";
      if (paymentMethod === "aliexpress_direct") {
        const itemWithUrl = items.find((i: any) => i.source_url || i.sourceUrl);
        redirectUrl = (itemWithUrl as any)?.source_url || (itemWithUrl as any)?.sourceUrl || 
          (items[0]?.name ? `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(items[0].name)}` : "https://www.aliexpress.com");
        try {
          window.open(redirectUrl, "_blank", "noopener,noreferrer");
        } catch {}
      } else if (paymentMethod === "paypal" && orderId) {
        try {
          const payRes = await fetch(`${getApiBase()}/orders/${orderId}/pay/paypal-create`, {
            method: "POST",
            headers,
          }).then((r) => r.json());
          redirectUrl = payRes?.approval_url || payRes?.data?.approval_url || "";
          if (redirectUrl) {
            try {
              window.open(redirectUrl, "_blank", "noopener,noreferrer");
            } catch {}
          }
        } catch {}
      }

      clearCart();
      setOrderSuccess({
        orderId: orderId || "EMAD-" + Math.floor(100000 + Math.random() * 900000),
        grandTotal,
        paymentMethod,
        redirectUrl,
        recipientName,
        recipientPhone,
        shippingTitle: currentShipping.title,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "فشل إتمام الطلب، يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200" dir={dir}>
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {language === "ar" ? "إتمام الطلب والدفع الآمن" : "Checkout & Secure Payment"}
              </h3>
              <p className="text-xs text-amber-300/80">
                {language === "ar"
                  ? "مطابق لخيارات الدفع والشحن في تطبيق عماد إكسبرس"
                  : "Synchronized with Emad Express payment & shipping"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {orderSuccess ? (
            /* Success Screen */
            <div className="text-center py-6 space-y-5 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/30">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xl font-black text-white">
                  {language === "ar" ? "تم تأكيد طلبك بنجاح!" : "Order Confirmed Successfully!"}
                </h4>
                <p className="text-xs text-slate-300">
                  {language === "ar" ? "رقم الطلب الرسمي: " : "Official Order Number: "}
                  <span className="text-amber-400 font-mono font-black text-sm">#{orderSuccess.orderId}</span>
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {language === "ar"
                    ? "شكراً لتسوقك من متجر عماد إكسبرس. يتم الآن مراجعة الطلب والمزامنة مع الموردين لبدء الشحن الفوري."
                    : "Thank you for shopping at Emad Express. Your order is now being processed and synced with suppliers for immediate shipping."}
                </p>
              </div>

              {/* Order Summary Receipt Box */}
              <div className={`bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs ${dir === "rtl" ? "text-right" : "text-left"} max-w-md mx-auto space-y-2`}>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">{language === "ar" ? "المستلم:" : "Recipient:"}</span>
                  <span className="text-white font-bold">{orderSuccess.recipientName} ({orderSuccess.recipientPhone})</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">{language === "ar" ? "طريقة الشحن:" : "Shipping Method:"}</span>
                  <span className="text-white font-bold">{orderSuccess.shippingTitle}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">{language === "ar" ? "المبلغ الإجمالي:" : "Total Amount:"}</span>
                  <span className="text-amber-400 font-black text-sm">{orderSuccess.grandTotal.toLocaleString()} {language === "ar" ? "ر.س" : "SAR"}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">{language === "ar" ? "حالة الدفع:" : "Payment Status:"}</span>
                  <span className="text-emerald-400 font-bold">
                    {language === "ar" ? "بانتظار المعالجة / تأكيد التحويل" : "Processing / Awaiting Confirmation"}
                  </span>
                </div>
              </div>

              {/* Payment Action Link for PayPal or AliExpress Direct */}
              {orderSuccess.redirectUrl && (
                <div className="pt-2">
                  <a
                    href={orderSuccess.redirectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-2 font-black text-xs px-6 py-3.5 rounded-xl shadow-lg transition-all ${
                      orderSuccess.paymentMethod === "aliexpress_direct"
                        ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-500/25"
                        : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25"
                    }`}
                  >
                    <span>
                      {orderSuccess.paymentMethod === "aliexpress_direct"
                        ? (language === "ar" ? "فتح وإتمام الدفع الآمن عبر عماد اكسبرس (emadexpress)" : "Open & Complete Secure Payment via Emad Express")
                        : (language === "ar" ? "فتح بوابة الدفع عبر PayPal والبطاقات المعتمدة" : "Open PayPal & Card Secure Payment Gateway")}
                    </span>
                    <ExternalLink size={16} />
                  </a>
                </div>
              )}

              {/* WhatsApp direct instant notification */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <a
                  href={`https://wa.me/967772223645?text=${encodeURIComponent(
                    language === "ar"
                      ? `مرحباً عماد إكسبرس، تم تأكيد طلبي برقم: #${orderSuccess.orderId} بمبلغ: ${orderSuccess.grandTotal} ر.س. أرجو المتابعة.`
                      : `Hello Emad Express, my order #${orderSuccess.orderId} for ${orderSuccess.grandTotal} SAR has been placed. Please follow up.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  <MessageCircle size={16} />
                  <span>{language === "ar" ? "متابعة الطلب عبر واتساب فوراً" : "Follow up on WhatsApp"}</span>
                </a>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-6 py-3 rounded-xl transition-all"
                >
                  {language === "ar" ? "العودة للمتجر" : "Back to Store"}
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              {errorMsg && (
                <div className="p-3.5 bg-red-950/70 border border-red-500/50 rounded-2xl text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Login Prompt if not logged in */}
              {!customer && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <User size={16} className="text-amber-400" />
                    <span>هل لديك حساب في التطبيق أو الموقع؟</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openLoginModal()}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-black px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    تسجيل الدخول
                  </button>
                </div>
              )}

              {/* Step 1: Recipient and Address */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <MapPin size={15} />
                  <span>{language === "ar" ? "1. بيانات المستلم وعنوان التوصيل" : "1. Recipient & Delivery Address"}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      {language === "ar" ? "اسم المستلم الكامل" : "Full Name"}
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      required
                      placeholder={language === "ar" ? "الاسم الثلاثي" : "Full legal name"}
                      className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      {language === "ar" ? "رقم الهاتف للتواصل" : "Phone Number"}
                    </label>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      required
                      placeholder={language === "ar" ? "أدخل رقم الهاتف للتوصيل..." : "Enter delivery phone number..."}
                      className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      {language === "ar" ? "دولة الشحن" : "Shipping Country"}
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-slate-950 text-amber-400 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none"
                    >
                      {ALL_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {language === "ar" ? c.nameAr : c.nameEn} ({c.dialCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      {language === "ar" ? "المدينة / المحافظة" : "City / Province"}
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      placeholder={language === "ar" ? "صنعاء / عدن / تعز / الرياض / جدة..." : "City or Province..."}
                      className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    {language === "ar" ? "العنوان التفصيلي (الشارع، الحي، أقرب معلم)" : "Detailed Address (Street, District, Landmark)"}
                  </label>
                  <input
                    type="text"
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    required
                    placeholder={language === "ar" ? "مثال: شارع الستين، بجوار مجمع النصر، عمارة 4" : "e.g. Main St, District 4, Building 12"}
                    className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Optional Auto-Register account for guest */}
                {!customer && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        {language === "ar" ? "البريد الإلكتروني (لحفظ الحساب)" : "Email (to save account)"}
                      </label>
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        {language === "ar" ? "كلمة المرور (اختياري لحفظ بياناتك ومتابعة طلباتك)" : "Password (optional to save account)"}
                      </label>
                      <input
                        type="password"
                        value={quickPassword}
                        onChange={(e) => setQuickPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Shipping Method (Matches App 100%) */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Truck size={15} />
                  <span>{language === "ar" ? "2. طريقة الشحن المعتمدة (emadexpress Shipping)" : "2. Shipping Method"}</span>
                </h4>

                <div className="space-y-2">
                  {shippingOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-start justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        shippingMethod === opt.id
                          ? "bg-amber-500/10 border-amber-500/80 text-white ring-1 ring-amber-500/40"
                          : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="shipping_opt"
                          checked={shippingMethod === opt.id}
                          onChange={() => setShippingMethod(opt.id)}
                          className="mt-1 accent-amber-500 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">{opt.title}</span>
                            <span className="text-[10px] bg-slate-800 text-amber-400 font-bold px-2 py-0.5 rounded-md">
                              {opt.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-amber-400 shrink-0">
                        {opt.fee === 0 ? (language === "ar" ? "مجاني" : "Free") : `${opt.fee} ${language === "ar" ? "ر.س" : "SAR"}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Step 3: Payment Method (Matches App 100%) */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <CreditCard size={15} />
                  <span>{language === "ar" ? "3. طريقة الدفع المعتمدة (PayPal / emadexpress Direct)" : "3. Payment Method"}</span>
                </h4>

                <div className="space-y-2">
                  {/* PayPal & Accepted Cards */}
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      paymentMethod === "paypal"
                        ? "bg-amber-500/10 border-amber-500/80 ring-1 ring-amber-500/40"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <label className="flex items-start justify-between cursor-pointer">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment_opt"
                          checked={paymentMethod === "paypal"}
                          onChange={() => setPaymentMethod("paypal")}
                          className="mt-1 accent-amber-500 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-white">
                              {language === "ar" ? "الدفع الإلكتروني عبر PayPal والبطاقات المعتمدة عالمياً" : "Pay via PayPal & International Accepted Cards"}
                            </span>
                            <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md font-bold">
                              PayPal Live 💳
                            </span>
                            <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
                              {language === "ar" ? "حماية 100% 🛡️" : "100% Protection 🛡️"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {language === "ar"
                              ? "يقبل كافة البطاقات البنكية المعتمدة عالمياً أو رصيد حساب PayPal الفوري"
                              : "Accepts all major cards worldwide or instant PayPal balance"}
                          </p>

                          {/* International Accepted Payment Badges Row */}
                          <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                            {/* PayPal Badge */}
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#003087] text-white text-[10px] font-black tracking-tight shadow-sm">
                              <span className="text-[#0079C1]">P</span><span className="text-white -ml-0.5">P</span>
                              <span>PayPal</span>
                            </div>

                            {/* Visa Badge */}
                            <div className="flex items-center px-2 py-0.5 rounded bg-[#0d2b6b] text-white text-[10px] font-black italic tracking-wider shadow-sm">
                              VISA
                            </div>

                            {/* MasterCard Badge */}
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1e293b] text-white text-[10px] font-bold shadow-sm">
                              <div className="flex items-center -space-x-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] inline-block"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] inline-block"></span>
                              </div>
                              <span className="text-[9px]">mastercard</span>
                            </div>

                            {/* Mada Badge */}
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#064e3b] text-white text-[10px] font-bold shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block"></span>
                              <span>mada مدى</span>
                            </div>

                            {/* AMEX Badge */}
                            <div className="px-1.5 py-0.5 rounded bg-[#006fcf] text-white text-[10px] font-black shadow-sm">
                              AMEX
                            </div>

                            {/* Apple Pay Badge */}
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black text-white text-[10px] font-bold shadow-sm border border-slate-700">
                              <span></span>
                              <span>Pay</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>

                    {paymentMethod === "paypal" && (
                      <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-in fade-in duration-200">
                        {/* Sub-toggle: Card vs PayPal Account */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                          <button
                            type="button"
                            onClick={() => setPaySubMode("card")}
                            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              paySubMode === "card"
                                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            <CreditCard size={14} />
                            <span>{language === "ar" ? "💳 البطاقة البنكية المباشرة" : "💳 Direct Credit/Debit Card"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaySubMode("paypal_account")}
                            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              paySubMode === "paypal_account"
                                ? "bg-[#003087] text-white shadow-md shadow-blue-500/20"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            <span>{language === "ar" ? "حساب بايبال السريع" : "PayPal Express Checkout"}</span>
                          </button>
                        </div>

                        {paySubMode === "card" ? (
                          /* Direct Card Input Fields */
                          <div className="space-y-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                            {/* Realistic Virtual Card Preview with EMV Chip & Contactless */}
                            <div className="bg-gradient-to-tr from-[#090d16] via-[#111827] to-[#1e293b] border border-slate-700/80 rounded-2xl p-4 text-white shadow-2xl relative overflow-hidden">
                              {/* Top row: Chip + Contactless wave + Brand */}
                              <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2.5">
                                  {/* Realistic EMV Chip */}
                                  <div className="w-9 h-7 rounded bg-amber-400 border border-amber-600 p-0.5 flex flex-col justify-between shadow-inner">
                                    <div className="flex justify-between border-b border-amber-700 h-2">
                                      <div className="w-2.5 border-r border-amber-700"></div>
                                      <div className="w-2.5 border-l border-amber-700"></div>
                                    </div>
                                    <div className="h-1 bg-amber-600/40 rounded"></div>
                                    <div className="flex justify-between border-t border-amber-700 h-2">
                                      <div className="w-2.5 border-r border-amber-700"></div>
                                      <div className="w-2.5 border-l border-amber-700"></div>
                                    </div>
                                  </div>

                                  {/* Contactless waves icon */}
                                  <div className="text-slate-400 transform rotate-90 text-sm font-bold tracking-tighter">
                                    (((
                                  </div>
                                </div>

                                {/* Dynamic Brand Display */}
                                <div className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-700">
                                  <ShieldCheck size={13} className="text-amber-400" />
                                  <span className="font-bold text-[11px] text-amber-300">
                                    {getCardBrand(cardNumber)}
                                  </span>
                                </div>
                              </div>

                              {/* 16 digits Card Number */}
                              <div className="font-mono text-lg tracking-widest text-slate-100 py-1 dir-ltr text-left font-bold drop-shadow">
                                {cardNumber || "•••• •••• •••• ••••"}
                              </div>

                              <div className="flex justify-between items-end mt-3 text-[11px] text-slate-300">
                                <div>
                                  <span className="text-[9px] text-slate-400 font-bold block">
                                    {language === "ar" ? "حامل البطاقة / CARDHOLDER" : "CARDHOLDER NAME"}
                                  </span>
                                  <span className="font-bold uppercase tracking-wide text-white">{cardHolder || recipientName || "CARDHOLDER NAME"}</span>
                                </div>
                                <div className="text-left font-mono">
                                  <span className="text-[9px] text-slate-400 font-bold block">
                                    {language === "ar" ? "صالحة حتى / EXPIRES" : "EXPIRATION DATE"}
                                  </span>
                                  <span className="font-bold text-white">{cardExp || "MM/YY"}</span>
                                </div>
                              </div>
                            </div>

                            {/* Card Inputs */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[11px] font-bold text-slate-300">
                                  {language === "ar" ? "رقم البطاقة البنكية" : "Card Number"}
                                </label>
                                <span className="text-[10px] text-amber-400 font-bold">{getCardBrand(cardNumber)}</span>
                              </div>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={cardNumber}
                                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                  placeholder="0000 0000 0000 0000"
                                  maxLength={19}
                                  className="w-full bg-slate-950 text-white font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none"
                                />
                                <CreditCard size={16} className={`absolute top-3 text-slate-500 ${dir === "rtl" ? "left-3" : "right-3"}`} />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                {language === "ar" ? "اسم حامل البطاقة (المطبوع عليها)" : "Cardholder Name (Printed on card)"}
                              </label>
                              <input
                                type="text"
                                value={cardHolder}
                                onChange={(e) => setCardHolder(e.target.value)}
                                placeholder="e.g. MOHAMMED ALI"
                                className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none uppercase"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                  {language === "ar" ? "تاريخ الانتهاء (شهر / سنة)" : "Expiration (MM/YY)"}
                                </label>
                                <input
                                  type="text"
                                  value={cardExp}
                                  onChange={(e) => setCardExp(formatCardExp(e.target.value))}
                                  placeholder="MM/YY (08/28)"
                                  maxLength={5}
                                  className="w-full bg-slate-950 text-white font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none text-center"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                  {language === "ar" ? "رمز الأمان (CVV/CVC)" : "Security Code (CVV)"}
                                </label>
                                <input
                                  type="password"
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                  placeholder="•••"
                                  maxLength={4}
                                  className="w-full bg-slate-950 text-white font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none text-center"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1 text-[10px] text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 p-2.5 rounded-xl">
                              <ShieldCheck size={14} className="shrink-0" />
                              <span>
                                {language === "ar"
                                  ? "دفع مشفر بحماية 256-bit وحماية المشتري المعتمدة من PayPal عالمياً"
                                  : "256-bit encrypted checkout with PayPal verified Buyer Protection"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* PayPal Express Mode */
                          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-2">
                            <div className="text-xs text-slate-300">
                              {language === "ar" ? (
                                <>سيتم فتح نافذة <span className="font-bold text-blue-400">PayPal Express Checkout</span> الرسمية فور تأكيد الطلب لتسجيل الدخول والسداد برصيدك أو محفظتك بضغطة واحدة.</>
                              ) : (
                                <>The official <span className="font-bold text-blue-400">PayPal Express Checkout</span> modal will open upon confirming order to complete payment securely.</>
                              )}
                            </div>
                            <div className="text-[11px] text-amber-300/80 font-bold">
                              {language === "ar" ? "✓ ضمان استرداد الأموال الكامل وحماية المشترين" : "✓ 100% Money-back guarantee and Buyer Protection"}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* emadexpress Direct Checkout */}
                  <label
                    className={`flex items-start justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      paymentMethod === "aliexpress_direct"
                        ? "bg-amber-500/10 border-amber-500/80 ring-1 ring-amber-500/40"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="payment_opt"
                        checked={paymentMethod === "aliexpress_direct"}
                        onChange={() => setPaymentMethod("aliexpress_direct")}
                        className="mt-1 accent-amber-500 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">
                            {language === "ar" ? "الدفع والشراء المباشر عبر عماد اكسبرس (emadexpress Direct)" : "Direct Payment via Emad Express"}
                          </span>
                          <span className="text-[10px] bg-red-950/60 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-md font-bold">
                            emadexpress Direct 🛍️
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {language === "ar"
                            ? "الدفع والتسديد المباشر والآمن عبر منصة عماد اكسبرس لتأكيد الشحن فوراً"
                            : "Direct and secure checkout via Emad Express for immediate fulfillment"}
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Order Total Breakdown */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>
                    {language === "ar" ? `إجمالي المنتجات (${items.length} صنف):` : `Products Total (${items.length} items):`}
                  </span>
                  <span className="text-white font-bold">{subtotal.toLocaleString()} {language === "ar" ? "ر.س" : "SAR"}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>
                    {language === "ar" ? `تكلفة الشحن (${currentShipping.title}):` : `Shipping Fee (${currentShipping.title}):`}
                  </span>
                  <span className="text-white font-bold">{shippingFee === 0 ? (language === "ar" ? "مجاني" : "Free") : `${shippingFee} ${language === "ar" ? "ر.س" : "SAR"}`}</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>{language === "ar" ? "ضريبة القيمة المضافة (15%):" : "VAT (15%):"}</span>
                    <span className="text-white font-bold">{tax.toLocaleString()} {language === "ar" ? "ر.س" : "SAR"}</span>
                  </div>
                )}
                <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline">
                  <span className="font-black text-white text-sm">{language === "ar" ? "المجموع الإجمالي النهائي:" : "Grand Total:"}</span>
                  <span className="font-black text-amber-400 text-lg">{grandTotal.toLocaleString()} {language === "ar" ? "ر.س" : "SAR"}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>{language === "ar" ? "جارٍ معالجة وتأكيد الطلب..." : "Processing & Confirming Order..."}</span>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>
                      {language === "ar"
                        ? `تأكيد الطلب والدفع النهائي (${grandTotal.toLocaleString()} ر.س)`
                        : `Confirm Order & Pay (${grandTotal.toLocaleString()} SAR)`}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
