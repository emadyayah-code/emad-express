import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("admin@emadexpress.com");
  const [password, setPassword] = useState("admin123");
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
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1200 30%, #0d0d0d 60%, #1a0f00 100%)",
      }}
    >
      {/* Animated gold particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              backgroundColor: "#f59e0b",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `pulse ${Math.random() * 3 + 2}s infinite`,
            }}
          />
        ))}
        {/* Gold radial glow */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, rgba(245,158,11,0.08) 0%, transparent 70%)",
          }}
        />
        {/* Gold lines decoration */}
        <div
          className="absolute top-0 left-0 w-full h-full opacity-5"
          style={{
            backgroundImage: "repeating-linear-gradient(90deg, #f59e0b 0px, transparent 1px, transparent 60px)",
          }}
        />
      </div>

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Emad Express"
            className="mx-auto mb-4"
            style={{ height: "100px", objectFit: "contain", filter: "drop-shadow(0 0 20px rgba(245,158,11,0.5))" }}
          />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(245,158,11,0.2)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(245,158,11,0.1)",
          }}
        >
          <h2 className="text-center text-xl font-bold text-amber-400 mb-6">تسجيل الدخول</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-amber-200/70 mb-1">البريد الإلكتروني</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(245,158,11,0.25)",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(245,158,11,0.7)")}
                onBlur={e => (e.target.style.borderColor = "rgba(245,158,11,0.25)")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-200/70 mb-1">كلمة المرور</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(245,158,11,0.25)",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(245,158,11,0.7)")}
                onBlur={e => (e.target.style.borderColor = "rgba(245,158,11,0.25)")}
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full font-bold py-3 rounded-lg transition-all disabled:opacity-60 text-black"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%)",
                boxShadow: "0 4px 20px rgba(245,158,11,0.4)",
              }}
            >
              {loading ? "جارٍ تسجيل الدخول..." : "دخول"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
