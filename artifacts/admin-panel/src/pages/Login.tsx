import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

export default function Login() {
  const { user, login, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.role === "admin" && user.email === "ealakhly@gmail.com") {
      setLocation("/admin");
    }
  }, [user, setLocation]);

  // Ensure zero credentials remain in fields on mount and window blur
  useEffect(() => {
    setEmail("");
    setPassword("");
    const scrub = () => {
      setEmail("");
      setPassword("");
      const inputs = document.querySelectorAll("input");
      inputs.forEach(inp => {
        if (inp.name === "adm_acc_key" || inp.name === "adm_sec_pass") {
          inp.value = "";
        }
      });
    };
    scrub();
    const t1 = setTimeout(scrub, 50);
    const t2 = setTimeout(scrub, 250);
    const t3 = setTimeout(scrub, 600);

    const handleExit = () => {
      scrub();
      try {
        sessionStorage.clear();
        localStorage.removeItem("admin_token");
        localStorage.removeItem("user");
      } catch {}
    };

    window.addEventListener("beforeunload", handleExit);
    window.addEventListener("pagehide", handleExit);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("beforeunload", handleExit);
      window.removeEventListener("pagehide", handleExit);
      scrub();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      // Immediately wipe local state memory after successful login
      setEmail("");
      setPassword("");
      setLocation("/admin");
    } catch (err: any) {
      setPassword(""); // Clear password field immediately on failure
      setError(err.message || "بيانات الدخول غير صحيحة");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      dir="rtl"
      style={{
        background: "radial-gradient(circle at 50% 20%, rgba(245,158,11,0.15) 0%, transparent 60%), linear-gradient(135deg, #09090b 0%, #161106 50%, #09090b 100%)",
      }}
    >
      {/* Animated gold particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-30 animate-pulse"
            style={{
              width: `${Math.random() * 5 + 2}px`,
              height: `${Math.random() * 5 + 2}px`,
              backgroundColor: "#fbbf24",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: "0 0 10px #f59e0b",
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src="/app-logo.png"
            alt="Emad Express"
            className="mx-auto mb-3 w-20 h-20 rounded-2xl object-cover ring-2 ring-amber-500/50 shadow-2xl shadow-amber-500/40"
          />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
            لوحة تحكم عماد إكسبريس
          </h1>
          <p className="text-xs text-amber-200/60 mt-1">المنصة الشاملة لإدارة التجارة والتسويق</p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8 shadow-2xl"
          style={{
            background: "rgba(18, 15, 10, 0.85)",
            backdropFilter: "blur(25px)",
            border: "1px solid rgba(245,158,11,0.25)",
            boxShadow: "0 25px 60px -15px rgba(0,0,0,0.9), 0 0 30px rgba(245,158,11,0.15)",
          }}
        >
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-amber-300">تسجيل الدخول للمدير العام</h2>
            <p className="text-xs text-amber-200/60 mt-1">الوصول مقتصر على المدير العام المعتمد فقط</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            {/* Decoy hidden inputs to prevent Chrome / Edge password manager autofill */}
            <input type="text" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
            <input type="password" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

            <div>
              <label className="block text-sm font-medium text-amber-200/80 mb-2">بريد المدير العام</label>
              <input
                type="text"
                name="adm_acc_key"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="البريد الإلكتروني المعتمد"
                required
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(245,158,11,0.3)",
                }}
                onFocus={e => (e.target.style.borderColor = "#fbbf24")}
                onBlur={e => (e.target.style.borderColor = "rgba(245,158,11,0.3)")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-200/80 mb-2">كلمة المرور السرية</label>
              <input
                type="password"
                name="adm_sec_pass"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="كلمة المرور الخاصة بالمدير"
                required
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(245,158,11,0.3)",
                }}
                onFocus={e => (e.target.style.borderColor = "#fbbf24")}
                onBlur={e => (e.target.style.borderColor = "rgba(245,158,11,0.3)")}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-extrabold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 text-black cursor-pointer shadow-lg"
              style={{
                background: "linear-gradient(135deg, #fcd34d 0%, #fbbf24 40%, #f59e0b 80%, #d97706 100%)",
                boxShadow: "0 6px 25px rgba(245,158,11,0.45), inset 0 1px 1px rgba(255,255,255,0.6)",
              }}
            >
              {loading ? "جارٍ التحقق والدخول..." : "تسجيل الدخول الآمن"}
            </button>

            <div className="pt-2 text-center">
              <a
                href="/"
                className="text-xs text-slate-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 hover:underline"
              >
                <span>🏪 العودة إلى واجهة المتجر (Storefront)</span>
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
