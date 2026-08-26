import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, Package, ShoppingCart, Users, Store, Calculator, BarChart2, LogOut, Menu, X, Tag, Globe, Share2, DollarSign, CreditCard, Settings, TrendingUp } from "lucide-react";
import { useState } from "react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "لوحة التحكم" },
  { path: "/products", icon: Package, label: "المنتجات" },
  { path: "/categories", icon: Tag, label: "الفئات" },
  { path: "/orders", icon: ShoppingCart, label: "الطلبات" },
  { path: "/customers", icon: Users, label: "العملاء" },
  { path: "/vendors", icon: Store, label: "البائعون" },
  { path: "/dropshipping", icon: Globe, label: "دروبشيبينغ" },
  { path: "/affiliates", icon: Share2, label: "عمولات المسوقين" },
  { path: "/my-commission", icon: DollarSign, label: "عمولاتي" },
  { path: "/supplier-payments", icon: CreditCard, label: "مدفوعات الموردين" },
  { path: "/accounting", icon: Calculator, label: "المحاسبة" },
  { path: "/reports", icon: BarChart2, label: "التقارير" },
  { path: "/partner-ads", icon: TrendingUp, label: "إعلانات الشركاء" },
  { path: "/affiliate-settings", icon: Globe, label: "منصات العالمية" },
  { path: "/settings", icon: Settings, label: "الإعدادات" },
];

const sidebarStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #0a0a0a 0%, #110c00 50%, #0a0a0a 100%)",
  borderLeft: "1px solid rgba(245,158,11,0.15)",
};

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { logout, user } = useAuth();
  const [location] = useLocation();

  return (
    <aside className="h-full flex flex-col" style={sidebarStyle}>
      {/* Logo header */}
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(245,158,11,0.1)" }}>
        <img
          src="/logo.png"
          alt="Emad Express"
          style={{ height: "52px", objectFit: "contain", filter: "drop-shadow(0 0 8px rgba(245,158,11,0.4))" }}
        />
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-amber-400/60 hover:text-amber-400">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link key={path} href={path} onClick={onClose}>
              <a
                className="flex items-center gap-3 px-5 py-3 text-sm transition-all"
                style={{
                  color: active ? "#f59e0b" : "rgba(255,255,255,0.55)",
                  background: active
                    ? "linear-gradient(90deg, rgba(245,158,11,0.12) 0%, transparent 100%)"
                    : "transparent",
                  borderRight: active ? "2px solid #f59e0b" : "2px solid transparent",
                }}
              >
                <Icon size={17} />
                {label}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4" style={{ borderTop: "1px solid rgba(245,158,11,0.1)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-black"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
          >
            {user?.name?.charAt(0) || "م"}
          </div>
          <div>
            <p className="text-sm font-medium text-white/90">{user?.name}</p>
            <p className="text-xs text-white/40">{user?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-sm text-red-400/70 hover:text-red-400 w-full transition-colors">
          <LogOut size={15} /> تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const pageName = location === "/" ? "dashboard" : location.slice(1).split("/")[0] || "dashboard";

  return (
    <div className="admin-shell flex h-screen overflow-hidden" dir="rtl" style={{ background: "#0f0f0f" }}>
      <div className="hidden lg:flex flex-col w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="relative w-64 z-50">
            <Sidebar onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className="h-14 flex items-center px-4 lg:px-6 gap-4 flex-shrink-0"
          style={{
            background: "rgba(10,10,10,0.95)",
            borderBottom: "1px solid rgba(245,158,11,0.1)",
            backdropFilter: "blur(10px)",
          }}
        >
          <button onClick={() => setOpen(true)} className="lg:hidden text-amber-400/60 hover:text-amber-400">
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}
          >
            لوحة الإدارة
          </div>
        </header>

        <main
          className={`admin-main page-${pageName} flex-1 overflow-y-auto p-4 lg:p-6`}
          style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #120e00 50%, #0f0f0f 100%)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
