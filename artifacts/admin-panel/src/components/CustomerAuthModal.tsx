import React, { useState } from "react";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { X, User, Mail, Lock, Phone, CheckCircle2, AlertCircle, Sparkles, Smartphone } from "lucide-react";

const COUNTRY_CODES = [
  { code: "+967", name: "اليمن", flag: "🇾🇪" },
  { code: "+966", name: "السعودية", flag: "🇸🇦" },
  { code: "+971", name: "الإمارات", flag: "🇦🇪" },
  { code: "+968", name: "عمان", flag: "🇴🇲" },
  { code: "+965", name: "الكويت", flag: "🇰🇼" },
  { code: "+974", name: "قطر", flag: "🇶🇦" },
  { code: "+973", name: "البحرين", flag: "🇧🇭" },
  { code: "+20", name: "مصر", flag: "🇪🇬" },
  { code: "+962", name: "الأردن", flag: "🇯🇴" },
];

export function CustomerAuthModal() {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    login,
    register,
    loading,
  } = useCustomerAuth();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCountryCode, setRegCountryCode] = useState("+967");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!authModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await login(loginEmail, loginPassword);
      setSuccessMsg("تم تسجيل الدخول بنجاح!");
    } catch (err: any) {
      setErrorMsg(err.message || "فشل تسجيل الدخول");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword) {
      setErrorMsg("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg("كلمة المرور يجب ألا تقل عن 6 أحرف");
      return;
    }

    const cleanPhone = regPhone.replace(/^0+/, "").trim();
    const fullPhone = `${regCountryCode}${cleanPhone}`;

    try {
      await register(regName, regEmail, fullPhone, regPassword);
      setSuccessMsg("تم إنشاء حسابك الموحد بنجاح! يمكنك الآن تسجيل الدخول في الموقع والتطبيق.");
    } catch (err: any) {
      setErrorMsg(err.message || "فشل إنشاء الحساب");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={() => {
            setAuthModalOpen(false);
            setErrorMsg("");
            setSuccessMsg("");
          }}
          className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header with App Logo */}
        <div className="p-6 pb-4 text-center border-b border-slate-800 bg-gradient-to-b from-slate-800/50 to-transparent">
          <img
            src="/app-logo.png"
            alt="عماد إكسبرس"
            className="w-14 h-14 rounded-2xl mx-auto mb-2.5 object-cover ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20"
          />
          <h3 className="text-lg font-black text-white">متجر عماد إكسبرس العالمي</h3>
          <p className="text-xs text-amber-300/80 mt-0.5">حساب موحد للتسوق عبر الموقع وتطبيق الهاتف</p>

          {/* Unified Account Banner */}
          <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-center gap-2 text-[11px] text-amber-300 font-bold">
            <Smartphone size={14} className="text-amber-400 shrink-0" />
            <span>تسجيلك هنا يتيح لك الدخول في تطبيق الهاتف والموقع بنفس الحساب</span>
          </div>
        </div>

        {/* Tabs Switcher */}
        <div className="flex border-b border-slate-800 px-6 pt-3 gap-2">
          <button
            onClick={() => {
              setAuthModalTab("login");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
              authModalTab === "login"
                ? "bg-amber-500 text-black shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => {
              setAuthModalTab("register");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
              authModalTab === "register"
                ? "bg-amber-500 text-black shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            إنشاء حساب جديد
          </button>
        </div>

        {/* Feedback Alerts */}
        <div className="px-6 pt-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Tab Forms */}
        <div className="p-6 pt-3">
          {authModalTab === "login" ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">البريد الإلكتروني</label>
                <div className="relative">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="example@gmail.com"
                    className="w-full bg-slate-950 text-white text-xs pr-10 pl-4 py-3 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <Mail size={16} className="absolute right-3.5 top-3.5 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">كلمة المرور</label>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-950 text-white text-xs pr-10 pl-4 py-3 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <Lock size={16} className="absolute right-3.5 top-3.5 text-slate-500" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول للمتجر"}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">ليس لديك حساب بعد؟ </span>
                <button
                  type="button"
                  onClick={() => setAuthModalTab("register")}
                  className="text-xs text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  أنشئ حسابك الآن مجاناً
                </button>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الاسم الكامل</label>
                <div className="relative">
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    placeholder="مثال: أحمد محمد"
                    className="w-full bg-slate-950 text-white text-xs pr-10 pl-4 py-2.5 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <User size={16} className="absolute right-3.5 top-3 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">البريد الإلكتروني</label>
                <div className="relative">
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="example@gmail.com"
                    className="w-full bg-slate-950 text-white text-xs pr-10 pl-4 py-2.5 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <Mail size={16} className="absolute right-3.5 top-3 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف</label>
                <div className="flex gap-2">
                  <select
                    value={regCountryCode}
                    onChange={(e) => setRegCountryCode(e.target.value)}
                    className="bg-slate-950 text-amber-400 font-bold text-xs px-2.5 py-2.5 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      required
                      placeholder="772223645"
                      className="w-full bg-slate-950 text-white text-xs pr-10 pl-4 py-2.5 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <Phone size={16} className="absolute right-3.5 top-3 text-slate-500" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كلمة المرور (6 أحرف فأكثر)</label>
                <div className="relative">
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-950 text-white text-xs pr-10 pl-4 py-2.5 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <Lock size={16} className="absolute right-3.5 top-3 text-slate-500" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب ومتابعة التسوق"}
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-slate-400">لديك حساب بالفعل؟ </span>
                <button
                  type="button"
                  onClick={() => setAuthModalTab("login")}
                  className="text-xs text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  تسجيل الدخول هنا
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
