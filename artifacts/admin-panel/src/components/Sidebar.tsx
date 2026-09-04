import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { LayoutDashboard, Package, ShoppingCart, RotateCcw, Users, Store, Calculator, BarChart2, LogOut, Menu, X, Tag, Globe, Share2, DollarSign, CreditCard, Settings, TrendingUp, Languages, Shield } from "lucide-react";
import { useState } from "react";

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { logout, user } = useAuth();
  const [location] = useLocation();
  const { t, language, dir } = useI18n();

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: t.dashboard },
    { path: "/products", icon: Package, label: t.products },
    { path: "/categories", icon: Tag, label: t.categories },
    { path: "/orders", icon: ShoppingCart, label: t.orders },
    { path: "/returns", icon: RotateCcw, label: t.returns },
    { path: "/customers", icon: Users, label: t.customers },
    { path: "/vendors", icon: Store, label: t.vendors },
    { path: "/dropshipping", icon: Globe, label: t.dropshipping },
    { path: "/affiliates", icon: Share2, label: t.affiliates },
    { path: "/my-commission", icon: DollarSign, label: t.my_commission },
    { path: "/supplier-payments", icon: CreditCard, label: t.supplier_payments },
    { path: "/accounting", icon: Calculator, label: t.accounting },
    { path: "/reports", icon: BarChart2, label: t.reports },
    { path: "/partner-ads", icon: TrendingUp, label: t.partner_ads },
    { path: "/affiliate-settings", icon: Globe, label: t.affiliate_settings },
    { path: "/settings", icon: Settings, label: t.settings },
    { path: "/privacy-policy", icon: Shield, label: t.privacy_policy },
  ];

  return (
    <aside
      className="h-full flex flex-col"
      style={{
        background: "linear-gradient(180deg, #09090b 0%, #140e02 50%, #09090b 100%)",
        borderInlineEnd: "1px solid rgba(245,158,11,0.18)",
      }}
    >
      {/* Logo header */}
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(245,158,11,0.12)" }}>
        <img
          src="/logo.png"
          alt="Emad Express"
          style={{ height: "48px", objectFit: "contain", filter: "drop-shadow(0 0 12px rgba(245,158,11,0.5))" }}
        />
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-amber-400/60 hover:text-amber-400">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link
              key={path}
              href={path}
              onClick={onClose}
              className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all"
              style={{
                color: active ? "#fbbf24" : "rgba(255,255,255,0.6)",
                background: active
                  ? "linear-gradient(90deg, rgba(245,158,11,0.15) 0%, transparent 100%)"
                  : "transparent",
                borderInlineStart: active ? "3px solid #f59e0b" : "3px solid transparent",
              }}
            >
              <Icon size={18} className={active ? "text-amber-400" : "text-white/40"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4" style={{ borderTop: "1px solid rgba(245,158,11,0.12)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-black flex-shrink-0 shadow-md"
            style={{ background: "linear-gradient(135deg, #fbbf24, #d97706)" }}
          >
            {user?.name?.charAt(0) || "ع"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white/95 truncate">{user?.name || "عماد الأكحلي"}</p>
            <p className="text-xs text-amber-200/50 truncate">{user?.email || "ealakhly@gmail.com"}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-300 w-full py-2 rounded-lg bg-red-950/30 border border-red-500/20 transition-all font-medium"
        >
          <LogOut size={15} /> {t.logout}
        </button>
      </div>
    </aside>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { t, language, toggleLanguage, dir } = useI18n();
  const rawLoc = typeof location === "string" ? location : window.location.pathname || "/";
  const pageName = rawLoc === "/" ? "dashboard" : (rawLoc.slice(1).split("/")[0] || "dashboard");

  return (
    <div className="admin-shell flex h-screen overflow-hidden" dir={dir} style={{ background: "#09090b", fontFamily: "'Cairo', 'Inter', sans-serif" }}>
      <div className="hidden lg:flex flex-col w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-64 z-50">
            <Sidebar onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className="h-16 flex items-center px-4 lg:px-6 gap-4 flex-shrink-0"
          style={{
            background: "rgba(12, 10, 6, 0.92)",
            borderBottom: "1px solid rgba(245,158,11,0.15)",
            backdropFilter: "blur(16px)",
          }}
        >
          <button onClick={() => setOpen(true)} className="lg:hidden text-amber-400 hover:text-amber-300">
            <Menu size={22} />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
            <span className="text-xs font-semibold text-emerald-400/90 hidden sm:inline-block">متصل (Online)</span>
          </div>

          <div className="flex-1" />

          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all border shadow-sm cursor-pointer"
            style={{
              background: "rgba(245,158,11,0.12)",
              color: "#fbbf24",
              borderColor: "rgba(245,158,11,0.3)",
            }}
          >
            <Languages size={15} />
            {language === "ar" ? "🇬🇧 English" : "🇸🇦 العربية"}
          </button>

          <div
            className="text-xs px-3.5 py-1.5 rounded-xl font-bold shadow-sm"
            style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.1) 100%)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)" }}
          >
            {t.admin_panel}
          </div>
        </header>

        <main
          className={`admin-main page-${pageName} flex-1 overflow-y-auto p-4 lg:p-6`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
