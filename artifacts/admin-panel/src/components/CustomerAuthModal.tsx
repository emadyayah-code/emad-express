import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useI18n } from "@/lib/i18n";
import { X, User, Mail, Lock, Phone, CheckCircle2, AlertCircle, Sparkles, Smartphone } from "lucide-react";

import { ALL_COUNTRIES } from "@/lib/countries";

export function CustomerAuthModal() {
  const { language, dir } = useI18n();
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
      setSuccessMsg(language === "ar" ? "تم تسجيل الدخول بنجاح!" : "Logged in successfully!");
    } catch (err: any) {
      setErrorMsg(err.message || (language === "ar" ? "فشل تسجيل الدخول" : "Failed to log in"));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword) {
      setErrorMsg(language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg(language === "ar" ? "كلمة المرور يجب ألا تقل عن 6 أحرف" : "Password must be at least 6 characters");
      return;
    }

    const cleanPhone = regPhone.replace(/^0+/, "").trim();
    const fullPhone = `${regCountryCode}${cleanPhone}`;

    try {
      await register(regName, regEmail, fullPhone, regPassword);
      setSuccessMsg(
        language === "ar"
          ? "تم إنشاء حسابك بنجاح! يمكنك الآن تسجيل الدخول والمتابعة."
          : "Account created successfully! You can now log in and shop."
      );
    } catch (err: any) {
      setErrorMsg(err.message || (language === "ar" ? "فشل إنشاء الحساب" : "Failed to create account"));
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200" dir={dir}>
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={() => {
            setAuthModalOpen(false);
            setErrorMsg("");
            setSuccessMsg("");
          }}
          className={`absolute top-4 ${dir === "rtl" ? "left-4" : "right-4"} z-10 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer`}
        >
          <X size={18} />
        </button>

        {/* Modal Header with App Logo */}
        <div className="p-6 pb-4 text-center border-b border-slate-800 bg-gradient-to-b from-slate-800/50 to-transparent">
          <img
            src="/app-logo.png"
            alt={language === "ar" ? "عماد إكسبرس" : "Emad Express"}
            className="w-14 h-14 rounded-2xl mx-auto mb-2.5 object-cover ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20"
          />
          <h3 className="text-lg font-black text-white">
            {language === "ar" ? "متجر عماد إكسبرس العالمي" : "Emad Express Global Store"}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === "ar" ? "تسجيل الدخول وإدارة حسابك للتسوق بأمان" : "Sign in and manage your account securely"}
          </p>
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
            {language === "ar" ? "تسجيل الدخول" : "Sign In"}
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
            {language === "ar" ? "إنشاء حساب جديد" : "Create Account"}
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
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {language === "ar" ? "البريد الإلكتروني" : "Email Address"}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="example@gmail.com"
                    className={`w-full bg-slate-950 text-white text-xs py-3 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                      dir === "rtl" ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"
                    }`}
                  />
                  <Mail size={16} className={`absolute top-3.5 text-slate-500 ${dir === "rtl" ? "right-3.5" : "left-3.5"}`} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {language === "ar" ? "كلمة المرور" : "Password"}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className={`w-full bg-slate-950 text-white text-xs py-3 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                      dir === "rtl" ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"
                    }`}
                  />
                  <Lock size={16} className={`absolute top-3.5 text-slate-500 ${dir === "rtl" ? "right-3.5" : "left-3.5"}`} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                {loading
                  ? (language === "ar" ? "جارٍ تسجيل الدخول..." : "Signing in...")
                  : (language === "ar" ? "تسجيل الدخول للمتجر" : "Sign In to Store")}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">
                  {language === "ar" ? "ليس لديك حساب بعد؟ " : "Don't have an account yet? "}
                </span>
                <button
                  type="button"
                  onClick={() => setAuthModalTab("register")}
                  className="text-xs text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  {language === "ar" ? "أنشئ حسابك الآن مجاناً" : "Create your account now"}
                </button>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {language === "ar" ? "الاسم الكامل" : "Full Name"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    placeholder={language === "ar" ? "مثال: أحمد محمد" : "e.g. John Doe"}
                    className={`w-full bg-slate-950 text-white text-xs py-2.5 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                      dir === "rtl" ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"
                    }`}
                  />
                  <User size={16} className={`absolute top-3 text-slate-500 ${dir === "rtl" ? "right-3.5" : "left-3.5"}`} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {language === "ar" ? "البريد الإلكتروني" : "Email Address"}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="example@gmail.com"
                    className={`w-full bg-slate-950 text-white text-xs py-2.5 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                      dir === "rtl" ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"
                    }`}
                  />
                  <Mail size={16} className={`absolute top-3 text-slate-500 ${dir === "rtl" ? "right-3.5" : "left-3.5"}`} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {language === "ar" ? "رقم الهاتف" : "Phone Number"}
                </label>
                <div className="flex gap-2">
                  <select
                    value={regCountryCode}
                    onChange={(e) => setRegCountryCode(e.target.value)}
                    className="bg-slate-950 text-amber-400 font-bold text-xs px-2.5 py-2.5 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none max-w-[150px]"
                  >
                    {ALL_COUNTRIES.map((c) => (
                      <option key={`${c.code}-${c.dialCode}`} value={c.dialCode}>
                        {c.flag} {language === "ar" ? c.nameAr : c.nameEn} ({c.dialCode})
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      required
                      placeholder={language === "ar" ? "رقم الهاتف..." : "Phone number..."}
                      className={`w-full bg-slate-950 text-white text-xs py-2.5 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                        dir === "rtl" ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"
                      }`}
                    />
                    <Phone size={16} className={`absolute top-3 text-slate-500 ${dir === "rtl" ? "right-3.5" : "left-3.5"}`} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {language === "ar" ? "كلمة المرور (6 أحرف فأكثر)" : "Password (6+ characters)"}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className={`w-full bg-slate-950 text-white text-xs py-2.5 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                      dir === "rtl" ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"
                    }`}
                  />
                  <Lock size={16} className={`absolute top-3 text-slate-500 ${dir === "rtl" ? "right-3.5" : "left-3.5"}`} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading
                  ? (language === "ar" ? "جارٍ إنشاء الحساب..." : "Creating Account...")
                  : (language === "ar" ? "إنشاء الحساب ومتابعة التسوق" : "Create Account & Continue")}
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-slate-400">
                  {language === "ar" ? "لديك حساب بالفعل؟ " : "Already have an account? "}
                </span>
                <button
                  type="button"
                  onClick={() => setAuthModalTab("login")}
                  className="text-xs text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  {language === "ar" ? "تسجيل الدخول هنا" : "Log in here"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
