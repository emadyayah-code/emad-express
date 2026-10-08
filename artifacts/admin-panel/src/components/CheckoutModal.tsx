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

export function CheckoutModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { items, subtotal, clearCart } = useCart();
  const { customer, customerToken, register, openLoginModal } = useCustomerAuth();

  // Address & contact fields
  const [recipientName, setRecipientName] = useState(customer?.name || "");
  const [recipientPhone, setRecipientPhone] = useState(customer?.phone || "");
  const [recipientEmail, setRecipientEmail] = useState(customer?.email || "");
  const [country, setCountry] = useState<"YE" | "SA" | "GLOBAL">("YE");
  const [city, setCity] = useState("صنعاء");
  const [addressDetails, setAddressDetails] = useState("");
  const [quickPassword, setQuickPassword] = useState("");

  // Shipping & Payment selection (Matches mobile app 100%)
  const [shippingMethod, setShippingMethod] = useState<string>("dhl");
  const [paymentMethod, setPaymentMethod] = useState<string>("paypal");
  const [transferRef, setTransferRef] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

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

  // AliExpress Shipping Options: 529 SAR DHL Express ONLY for Yemen, Choice/Standard for Saudi & Global
  const yemenShippingOptions = [
    {
      id: "dhl",
      title: "دي إتش إل إكسبريس لليمن (DHL Express)",
      badge: "شحن سريع جوي لليمن ✈️",
      desc: "شحن جوي سريع ومباشر إلى كافة المحافظات اليمنية مطابق لـ AliExpress • تسليم 7-15 يوم عمل (خاص باليمن فقط)",
      fee: 529,
    },
  ];

  const globalShippingOptions = [
    {
      id: "standard",
      title: subtotal >= 100 ? "شحن مجاني علي إكسبرس (AliExpress Choice)" : "شحن قياسي علي إكسبرس (AliExpress Standard)",
      badge: subtotal >= 100 ? "Choice مجاني 🎉" : "توصيل قياسي",
      desc: subtotal >= 100
        ? "شحن مجاني رسمي لطلبك بقيمة 100+ ر.س • تسليم 10-18 يوم عمل"
        : "شحن قياسي دولي موثوق مع رقم تتبع • تسليم 10-18 يوم عمل (مجاني عند الشراء بـ 100 ر.س)",
      fee: subtotal >= 100 ? 0 : 15,
    },
    {
      id: "premium",
      title: "شحن سريع بريميوم (AliExpress Premium)",
      badge: "أولوية فائقة ⚡",
      desc: "شحن جوي سريع بأعلى أولوية وتسليم للباب • تسليم 5-9 أيام عمل",
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
      setErrorMsg("يرجى إكمال بيانات المستلم والعنوان بالتفصيل");
      return;
    }

    if (items.length === 0) {
      setErrorMsg("سلة المشتريات فارغة");
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

      const fullShippingAddress = `${recipientName} (${recipientPhone}) - ${country === "YE" ? "اليمن" : country === "SA" ? "السعودية" : "دولي"}، ${city}، ${addressDetails}`;

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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">إتمام الطلب والدفع الآمن</h3>
              <p className="text-xs text-amber-300/80">مطابق لخيارات الدفع والشحن في تطبيق عماد إكسبرس</p>
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
                <h4 className="text-xl font-black text-white">تم تأكيد طلبك بنجاح!</h4>
                <p className="text-xs text-slate-300">
                  رقم الطلب الرسمي: <span className="text-amber-400 font-mono font-black text-sm">#{orderSuccess.orderId}</span>
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  شكراً لتسوقك من متجر عماد إكسبرس. يتم الآن مراجعة الطلب والمزامنة مع الموردين لبدء الشحن الفوري.
                </p>
              </div>

              {/* Order Summary Receipt Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-right max-w-md mx-auto space-y-2">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">المستلم:</span>
                  <span className="text-white font-bold">{orderSuccess.recipientName} ({orderSuccess.recipientPhone})</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">طريقة الشحن:</span>
                  <span className="text-white font-bold">{orderSuccess.shippingTitle}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">المبلغ الإجمالي:</span>
                  <span className="text-amber-400 font-black text-sm">{orderSuccess.grandTotal.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">حالة الدفع:</span>
                  <span className="text-emerald-400 font-bold">بانتظار المعالجة / تأكيد التحويل</span>
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
                        ? "فتح وإتمام الدفع على موقع علي إكسبرس فوراً"
                        : "فتح بوابة الدفع عبر PayPal والبطاقات المعتمدة"}
                    </span>
                    <ExternalLink size={16} />
                  </a>
                </div>
              )}

              {/* WhatsApp direct instant notification */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <a
                  href={`https://wa.me/967772223645?text=${encodeURIComponent(
                    `مرحباً عماد إكسبرس، تم تأكيد طلبي برقم: #${orderSuccess.orderId} بمبلغ: ${orderSuccess.grandTotal} ر.س. أرجو المتابعة.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  <MessageCircle size={16} />
                  <span>متابعة الطلب عبر واتساب فوراً</span>
                </a>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-6 py-3 rounded-xl transition-all"
                >
                  العودة للمتجر
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
                  <span>1. بيانات المستلم وعنوان التوصيل</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">اسم المستلم الكامل</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      required
                      placeholder="الاسم الثلاثي"
                      className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">رقم الهاتف للتواصل</label>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      required
                      placeholder="+967 772223645"
                      className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">دولة الشحن</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value as any)}
                      className="w-full bg-slate-950 text-amber-400 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none"
                    >
                      <option value="YE">🇾🇪 اليمن (Yemen)</option>
                      <option value="SA">🇸🇦 السعودية (Saudi Arabia)</option>
                      <option value="GLOBAL">🌐 دولة أخرى (International)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">المدينة / المحافظة</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      placeholder="صنعاء / عدن / تعز / الرياض / جدة..."
                      className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">العنوان التفصيلي (الشارع، الحي، أقرب معلم)</label>
                  <input
                    type="text"
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    required
                    placeholder="مثال: شارع الستين، بجوار مجمع النصر، عمارة 4"
                    className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Optional Auto-Register account for guest */}
                {!customer && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">البريد الإلكتروني (لحفظ الحساب)</label>
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">كلمة مرور لإنشاء حساب موحد في التطبيق والموقع</label>
                      <input
                        type="password"
                        value={quickPassword}
                        onChange={(e) => setQuickPassword(e.target.value)}
                        placeholder="•••••••• (اختياري لحفظ الحساب)"
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
                  <span>2. طريقة الشحن المعتمدة (AliExpress Shipping)</span>
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
                        {opt.fee === 0 ? "مجاني" : `${opt.fee} ر.س`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Step 3: Payment Method (Matches App 100%) */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <CreditCard size={15} />
                  <span>3. طريقة الدفع المعتمدة (PayPal / AliExpress Direct)</span>
                </h4>

                <div className="space-y-2">
                  {/* PayPal & Accepted Cards */}
                  <label
                    className={`flex items-start justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      paymentMethod === "paypal"
                        ? "bg-amber-500/10 border-amber-500/80 ring-1 ring-amber-500/40"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="payment_opt"
                        checked={paymentMethod === "paypal"}
                        onChange={() => setPaymentMethod("paypal")}
                        className="mt-1 accent-amber-500 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">الدفع الإلكتروني عبر PayPal والبطاقات المعتمدة</span>
                          <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md font-bold">
                            PayPal Live 💳
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          دفع فوري وآمن بضمان وحماية المشتري الكاملة عبر PayPal بالبطاقات البنكية المعتمدة (Visa، MasterCard، مدى)
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* AliExpress Direct Checkout */}
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
                          <span className="font-bold text-xs text-white">الدفع والشراء المباشر عبر علي إكسبرس (AliExpress Direct)</span>
                          <span className="text-[10px] bg-red-950/60 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-md font-bold">
                            AliExpress Direct 🛍️
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          يفتح لك موقع علي إكسبرس الرسمي مباشرة لتسديد القيمة والشراء من مورد علي إكسبرس فوراً وبشكل مباشر
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Order Total Breakdown */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>إجمالي المنتجات ({items.length} صنف):</span>
                  <span className="text-white font-bold">{subtotal.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>تكلفة الشحن ({currentShipping.title}):</span>
                  <span className="text-white font-bold">{shippingFee === 0 ? "مجاني" : `${shippingFee} ر.س`}</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>ضريبة القيمة المضافة (15%):</span>
                    <span className="text-white font-bold">{tax.toLocaleString()} ر.س</span>
                  </div>
                )}
                <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline">
                  <span className="font-black text-white text-sm">المجموع الإجمالي النهائي:</span>
                  <span className="font-black text-amber-400 text-lg">{grandTotal.toLocaleString()} ر.س</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>جارٍ معالجة وتأكيد الطلب...</span>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>تأكيد الطلب والدفع النهائي ({grandTotal.toLocaleString()} ر.س)</span>
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
