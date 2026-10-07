import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingCart, Shield, Globe, Menu, X, Trash2, ArrowLeft, ArrowRight, Zap, Award } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function StoreNavbar({ onSearch }: { onSearch?: (q: string) => void }) {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const { totalItems, items, subtotal, removeFromCart, updateQuantity } = useCart();
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    } else {
      setLocation(`/?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0b0f19]/95 backdrop-blur-md border-b border-amber-500/20 text-white shadow-xl" dir="rtl">
      {/* Top micro bar */}
      <div className="bg-gradient-to-r from-amber-600/30 via-slate-900 to-amber-600/30 text-amber-300 text-xs py-1.5 px-4 border-b border-amber-500/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Zap size={13} className="text-amber-400" />
              <span>شحن سريع ومباشر | استيراد رسمي وضمان الجودة 100%</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-amber-200 transition-colors">
              سياسة الخصوصية
            </Link>
            <span className="text-slate-600">|</span>
            {/* Direct Admin Panel Portal Link */}
            <Link
              href="/admin"
              className="flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold transition-all"
            >
              <Shield size={12} />
              <span>لوحة الإدارة</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation container */}
      <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <span className="text-black font-black text-xl tracking-tighter">E</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
              عماد <span className="text-amber-400">إكسبرس</span>
            </span>
            <span className="text-[10px] text-amber-200/60 font-semibold tracking-wider">
              EMADEXPRESS • GLOBAL STORE
            </span>
          </div>
        </Link>

        {/* Global Search Bar (AliExpress style) */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl relative hidden md:block">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن أكثر من 10,000 منتج، ملابس، إلكترونيات، ساعات، أجهزة منزلية..."
              className="w-full bg-slate-900/90 text-white text-sm pr-11 pl-28 py-2.5 rounded-2xl border-2 border-amber-500/40 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 placeholder-slate-400 transition-all"
            />
            <Search className="absolute right-3.5 text-amber-400 pointer-events-none" size={18} />
            <button
              type="submit"
              className="absolute left-1.5 top-1.5 bottom-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs px-5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1"
            >
              بحث
            </button>
          </div>
        </form>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Cart Icon & Trigger */}
          <button
            onClick={() => setShowCartDrawer(true)}
            className="relative flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 px-3.5 py-2 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="relative">
              <ShoppingCart size={20} className="text-amber-400 group-hover:scale-110 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {totalItems}
                </span>
              )}
            </div>
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[10px] text-slate-400">السلة</span>
              <span className="text-xs font-bold text-amber-300">{subtotal.toLocaleString()} ر.س</span>
            </div>
          </button>

          {/* Direct Admin Login Pill */}
          <Link
            href="/admin"
            className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-amber-600/20 hover:from-amber-500 hover:to-amber-600 text-amber-300 hover:text-black border border-amber-500/30 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm"
          >
            <Shield size={15} />
            <span>لوحة الإدارة</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="p-3 md:hidden border-t border-slate-800">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في آلاف المنتجات..."
            className="w-full bg-slate-900 text-white text-xs pr-10 pl-20 py-2.5 rounded-xl border border-amber-500/30 focus:border-amber-400 focus:outline-none"
          />
          <Search className="absolute right-3 top-3 text-amber-400" size={16} />
          <button
            type="submit"
            className="absolute left-1.5 top-1.5 bottom-1.5 bg-amber-500 text-black font-bold text-xs px-3.5 rounded-lg"
          >
            بحث
          </button>
        </form>
      </div>

      {/* Shopping Cart Drawer */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowCartDrawer(false)}
          />
          <div className="absolute inset-y-0 left-0 max-w-full flex">
            <div className="w-screen max-w-md bg-slate-950 border-r border-slate-800 p-6 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-amber-400" size={20} />
                  <h3 className="text-lg font-bold text-white">سلة المشتريات ({totalItems})</h3>
                </div>
                <button
                  onClick={() => setShowCartDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>

              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <ShoppingCart size={48} className="opacity-20 mb-3 text-amber-400" />
                  <p className="font-bold text-white text-base">السلة فارغة حالياً</p>
                  <p className="text-xs text-slate-400 mt-1">تصفح المنتجات وأضف ما يعجبك إلى السلة فوراً</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800 py-4 space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="pt-3 flex gap-3 items-center">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="w-16 h-16 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-900 flex items-center justify-center text-xs text-slate-600 shrink-0">
                          لا صورة
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                        <p className="text-xs font-bold text-amber-400 mt-1">{item.price.toLocaleString()} ر.س</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold px-1.5">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400/80 hover:text-red-400 p-1.5"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {items.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">الإجمالي الفرعي:</span>
                    <span className="font-black text-amber-400 text-lg">{subtotal.toLocaleString()} ر.س</span>
                  </div>
                  <button
                    onClick={() => {
                      alert("جاري تحويلك لبوابة الدفع لإتمام طلبك...");
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black py-3 rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all"
                  >
                    متابعة الدفع والشحن 🚀
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function StoreFooter() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-xs py-12 px-4" dir="rtl">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-black font-black text-lg">
              E
            </div>
            <span className="font-bold text-white text-base">عماد إكسبرس</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-xs">
            متجرك العالمي المباشر لاستيراد أفضل المنتجات العالمية من علي إكسبرس بأفضل الأسعار وأسرع خيارات الشحن المباشر.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm mb-3">أقسام المتجر</h4>
          <ul className="space-y-2">
            <li><Link href="/?category=200000345" className="hover:text-amber-400">👗 أزياء نسائية</Link></li>
            <li><Link href="/?category=200000343" className="hover:text-amber-400">👔 أزياء رجالية</Link></li>
            <li><Link href="/?category=44" className="hover:text-amber-400">📱 إلكترونيات وأجهزة ذكية</Link></li>
            <li><Link href="/?category=1511" className="hover:text-amber-400">⌚ ساعات وإكسسوارات</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm mb-3">خدمة العملاء</h4>
          <ul className="space-y-2">
            <li><Link href="/privacy-policy" className="hover:text-amber-400">سياسة الخصوصية والشروط</Link></li>
            <li><span>الدعم الفني عبر واتساب: 772223645</span></li>
            <li><span>ضمان الاسترجاع والتوصيل</span></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm mb-3">الإدارة والمشرفين</h4>
          <p className="text-slate-400 mb-3 text-xs">
            بوابة الإدارة المركزية لإدارة المنتجات والطلبات والدروب شيبينغ:
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-amber-500 hover:text-black border border-amber-500/30 text-amber-300 font-bold px-4 py-2 rounded-xl transition-all"
          >
            <Shield size={14} />
            <span>الدخول إلى لوحة التحكم</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-900 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-400 gap-4">
        <p>© جميع الحقوق محفوظة لدى متجر عماد إكسبرس (Emad Express) 2026.</p>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-amber-400/80 hover:text-amber-300 font-semibold">
            لوحة الإدارة (Admin Panel)
          </Link>
        </div>
      </div>
    </footer>
  );
}
