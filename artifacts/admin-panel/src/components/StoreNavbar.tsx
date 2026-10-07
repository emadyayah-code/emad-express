import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingCart, Shield, Globe, Menu, X, Trash2, ArrowLeft, ArrowRight, Zap, Award, User, LogOut, CheckCircle2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { CheckoutModal } from "@/components/CheckoutModal";
import { CustomerAuthModal } from "@/components/CustomerAuthModal";

export function StoreNavbar({ onSearch }: { onSearch?: (q: string) => void }) {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const { totalItems, items, subtotal, removeFromCart, updateQuantity } = useCart();
  const { customer, logout, openLoginModal, openRegisterModal } = useCustomerAuth();
  
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
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

          <div className="flex items-center gap-3">
            {customer ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-300">مرحباً، <strong className="text-amber-300">{customer.name}</strong></span>
                <button
                  onClick={logout}
                  className="text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  title="تسجيل الخروج"
                >
                  <LogOut size={12} />
                  <span>خروج</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={openLoginModal}
                  className="text-amber-300 hover:text-amber-200 font-bold transition-colors cursor-pointer"
                >
                  تسجيل الدخول
                </button>
                <span className="text-slate-600">|</span>
                <button
                  onClick={openRegisterModal}
                  className="text-amber-300 hover:text-amber-200 font-bold transition-colors cursor-pointer"
                >
                  إنشاء حساب جديد
                </button>
              </div>
            )}
            <span className="text-slate-600">|</span>
            <Link href="/privacy-policy" className="hover:text-amber-200 transition-colors">
              سياسة الخصوصية
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation container */}
      <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
        {/* Official Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative">
            <img
              src="/app-logo.png"
              alt="عماد إكسبرس - الشعار الرسمي"
              className="h-11 w-11 rounded-2xl object-cover ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/30 group-hover:scale-105 group-hover:ring-amber-400 transition-all duration-300 bg-slate-900"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-sm" title="المتجر يعمل بنجاح" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1 group-hover:text-amber-300 transition-colors">
              عماد <span className="text-amber-400">إكسبرس</span>
            </span>
            <span className="text-[10px] text-amber-200/70 font-semibold tracking-wider">
              EMAD EXPRESS • GLOBAL STORE
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
          {/* Customer Auth Account Pill Button */}
          {customer ? (
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-2xl">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black font-black text-xs flex items-center justify-center">
                {customer.name.charAt(0)}
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-white max-w-[100px] truncate">{customer.name}</span>
                <span className="text-[9px] text-emerald-400 font-semibold">حساب موحد</span>
              </div>
              <button
                onClick={logout}
                className="text-red-400 hover:text-red-300 pr-1 text-xs"
                title="تسجيل الخروج"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer hover:border-amber-500/40"
            >
              <User size={16} className="text-amber-400" />
              <span>تسجيل الدخول / حساب</span>
            </button>
          )}

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

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 p-4 space-y-3">
          {customer ? (
            <div className="bg-slate-900 p-3 rounded-xl flex items-center justify-between border border-slate-800">
              <div className="flex items-center gap-2">
                <User size={16} className="text-amber-400" />
                <span className="text-xs font-bold text-white">{customer.name}</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-red-400 font-bold"
              >
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  openLoginModal();
                  setMobileMenuOpen(false);
                }}
                className="bg-amber-500 text-black font-bold text-xs py-2.5 rounded-xl text-center"
              >
                تسجيل الدخول
              </button>
              <button
                onClick={() => {
                  openRegisterModal();
                  setMobileMenuOpen(false);
                }}
                className="bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl text-center border border-slate-700"
              >
                حساب جديد
              </button>
            </div>
          )}

          <div className="border-t border-slate-800/80 pt-2 space-y-2">
            <Link
              href="/privacy-policy"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs text-slate-300 py-1.5"
            >
              سياسة الخصوصية
            </Link>
          </div>
        </div>
      )}

      {/* Slide-out Cart Drawer */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
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
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
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
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold px-1.5">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400/80 hover:text-red-400 p-1.5 cursor-pointer"
                        title="حذف الصنف"
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
                      setShowCartDrawer(false);
                      setShowCheckoutModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black py-3.5 rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>متابعة إتمام الشراء والدفع 🚀</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <CustomerAuthModal />
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
      />
    </header>
  );
}

export function StoreFooter() {
  const { openRegisterModal } = useCustomerAuth();

  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-xs py-14 px-4" dir="rtl">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img
              src="/app-logo.png"
              alt="عماد إكسبرس"
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/20"
            />
            <div>
              <span className="font-black text-white text-base block">عماد إكسبرس</span>
              <span className="text-[10px] text-amber-400/80 font-bold tracking-wider">EMAD EXPRESS GLOBAL</span>
            </div>
          </div>
          <p className="text-slate-400 leading-relaxed text-xs">
            منصتك العالمية الأولى للتسوق والدروب شيبينغ المباشر من علي إكسبرس، بأفضل الأسعار المصنعية، مع فحص آلي للمخزون وشحن مباشر وسريع.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-[11px] font-bold">
              ⭐️ ضمان الجودة والاسترجاع 100%
            </span>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm mb-3.5 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-amber-500 rounded-full" />
            <span>أقسام المتجر الرئيسية</span>
          </h4>
          <ul className="space-y-2.5">
            <li><Link href="/?category=6" className="hover:text-amber-400 transition-colors">📱 هواتف ذكية وملحقاتها</Link></li>
            <li><Link href="/?category=7" className="hover:text-amber-400 transition-colors">🎧 إلكترونيات وسماعات</Link></li>
            <li><Link href="/?category=9" className="hover:text-amber-400 transition-colors">👗 أزياء وملابس نسائية</Link></li>
            <li><Link href="/?category=10" className="hover:text-amber-400 transition-colors">👔 أزياء وملابس رجالية</Link></li>
            <li><Link href="/?category=11" className="hover:text-amber-400 transition-colors">⌚ ساعات ومجوهرات فاخرة</Link></li>
            <li><Link href="/?category=12" className="hover:text-amber-400 transition-colors">👟 حقائب وأحذية رياضية</Link></li>
            <li><Link href="/?category=13" className="hover:text-amber-400 transition-colors">🏠 المنزل والمطبخ والحديقة</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm mb-3.5 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-amber-500 rounded-full" />
            <span>خدمة العملاء والدعم</span>
          </h4>
          <ul className="space-y-2.5">
            <li>
              <a
                href="https://wa.me/967772223645?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%D8%B9%D9%85%D8%A7%D8%AF%20%D8%A5%D9%83%D8%B3%D8%A8%D8%B1%D8%B3%D8%8C%20%D9%84%D8%AF%D9%8A%20%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%B7%D9%84%D8%A8%D9%8A"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <span>💬 خدمة العملاء عبر واتساب: 772223645</span>
              </a>
            </li>
            <li><Link href="/privacy-policy" className="hover:text-amber-400 transition-colors">🔒 سياسة الخصوصية والشروط</Link></li>
            <li><span className="text-slate-400">⚡ شحن وتوصيل فوري مع تتبع لحظي</span></li>
            <li><span className="text-slate-400">🛡️ حماية المشتريات والدفع الآمن</span></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm mb-3.5 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-amber-500 rounded-full" />
            <span>شحن وضمان 100%</span>
          </h4>
          <p className="text-slate-400 mb-3.5 text-xs leading-relaxed">
            نوفر شحن دولي ومحلي سريع ومباشر، مع خيارات استبدال واسترجاع مضمونة وسياسة دفع آمنة تحمي حقوق المشتري بالكامل.
          </p>
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center gap-2.5">
            <span className="text-xl">🚀</span>
            <div className="flex flex-col">
              <span className="text-white font-bold text-xs">توصيل إلى باب البيت</span>
              <span className="text-[10px] text-slate-400">تتبع الشحنة برقم التتبع فور الشحن</span>
            </div>
          </div>

          <button
            onClick={openRegisterModal}
            className="mt-3 w-full bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 font-bold text-xs py-2 rounded-xl transition-all cursor-pointer"
          >
            📱 حساب موحد للموقع وتطبيق الهاتف
          </button>
        </div>
      </div>

      {/* Trust & Payment Badges Ribbon */}
      <div className="max-w-7xl mx-auto border-t border-slate-900 mt-10 pt-6 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-400 font-semibold">وسائل الدفع والشحن المعتمدة:</span>
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300 font-bold">💳 مدى Mada</span>
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300 font-bold">💳 Visa / MasterCard</span>
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300 font-bold">🍏 Apple Pay</span>
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 text-amber-300 font-bold">✈️ DHL & FedEx Direct</span>
        </div>

        <div className="flex items-center gap-4">
          <span>© 2026 جميع الحقوق محفوظة لمتجر <strong>عماد إكسبرس (Emad Express)</strong>.</span>
        </div>
      </div>
    </footer>
  );
}
