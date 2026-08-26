import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("ealakhly@gmail.com");
  const [password, setPassword] = useState("772223645");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "فشل تسجيل الدخول");
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
            src="/logo.png"
            alt="Emad Express"
            className="mx-auto mb-3"
            style={{ height: "90px", objectFit: "contain", filter: "drop-shadow(0 0 25px rgba(245,158,11,0.6))" }}
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
          <h2 className="text-center text-lg font-semibold text-amber-300 mb-6">تسجيل الدخول للمدير</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-amber-200/80 mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ealakhly@gmail.com"
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
              <label className="block text-sm font-medium text-amber-200/80 mb-2">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
              {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
