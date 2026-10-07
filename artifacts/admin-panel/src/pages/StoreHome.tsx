import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { StoreNavbar, StoreFooter } from "@/components/StoreNavbar";
import { useCart } from "@/context/CartContext";
import { api } from "@/lib/api";
import { 
  Sparkles, Flame, ShoppingBag, Eye, Star, Truck, ShieldCheck, 
  ChevronRight, ChevronLeft, ArrowRight, Layers, Tag, Check, Filter,
  Clock, X, Plus, Minus, MessageCircle, Heart, Share2, Award, Zap
} from "lucide-react";

const CATEGORIES_MENU = [
  { id: "", name: "جميع الأقسام", icon: "🌐" },
  { id: "200000345", name: "أزياء وملابس نسائية", icon: "👗" },
  { id: "200000343", name: "أزياء وملابس رجالية", icon: "👔" },
  { id: "44", name: "إلكترونيات وأجهزة ذكية", icon: "📱" },
  { id: "1511", name: "ساعات وإكسسوارات فاخرة", icon: "⌚" },
  { id: "15", name: "أجهزة منزلية ومطبخ", icon: "🏠" },
  { id: "1524", name: "حقائب ومحافظ وأمتعة", icon: "🎒" },
  { id: "322", name: "أحذية رياضية ورسمية", icon: "👟" },
  { id: "66", name: "جمال وعناية ومكياج", icon: "💄" },
  { id: "18", name: "رياضة ولياقة وترفيه", icon: "⚽" },
  { id: "1509", name: "مجوهرات وإكسسوارات", icon: "💍" },
  { id: "7", name: "كمبيوتر ومستلزمات مكتب", icon: "💻" },
];

const HERO_SLIDES = [
  {
    id: 1,
    badge: "🔥 أقوى عروض التخفيضات الكبرى العالمية",
    title: "تخفيضات علي إكسبرس الكبرى بخصومات تصل حتى 70%!",
    desc: "استيراد مباشر وفوري من المصانع العالمية مع ضمان الجودة، فحص المخزون الفوري وشحن سريع ومباشر لباب منزلك.",
    bg: "from-amber-600 via-amber-500 to-yellow-500",
    textColor: "text-black",
    tag: "صفقات سوبر حصرية",
  },
  {
    id: 2,
    badge: "⚡ شحن عالمي مباشر وسريع",
    title: "أحدث الإلكترونيات والهواتف الذكية بأسعار الجملة المباشرة!",
    desc: "سماعات بلوتوث، ساعات ذكية، ملحقات الهواتف وأجهزة المنزل الذكي مع ضمان الاستبدال والاسترجاع.",
    bg: "from-blue-700 via-indigo-600 to-amber-500",
    textColor: "text-white",
    tag: "تكنولوجيا وإلكترونيات",
  },
  {
    id: 3,
    badge: "✨ أحدث صيحات الموضة 2026",
    title: "أزياء نسائية ورجالية وإكسسوارات راقية بأسعار استثنائية!",
    desc: "تشكيلة واسعة من الملابس، الحقائب، والأحذية الرياضية المنتقاة بعناية وبأفضل جودة تصنيع عالمية.",
    bg: "from-purple-800 via-pink-700 to-amber-500",
    textColor: "text-white",
    tag: "موضة وأزياء فاخرة",
  },
  {
    id: 4,
    badge: "🚀 منصة الدروب شيبينغ الرسمية",
    title: "عماد إكسبرس - مزامنة لحظية لملايين المنتجات!",
    desc: "تسوق بكل ثقة وأمان عبر بوابتنا الرسمية مع دعم كامل لخيارات الدفع السريع وخدمة عملاء على مدار الساعة.",
    bg: "from-emerald-700 via-teal-600 to-amber-500",
    textColor: "text-white",
    tag: "خدمة موثوقة 100%",
  },
];

export default function StoreHome() {
  const searchParams = new URLSearchParams(window.location.search);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "");
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("search") || "");
  const { addToCart } = useCart();
  const [addedItemNotice, setAddedItemNotice] = useState<number | null>(null);

  // Carousel interactive state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  // Flash deals live countdown clock state
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 42, seconds: 15 });

  // Quick view modal state
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [quickViewQty, setQuickViewQty] = useState(1);

  // Toast notification state
  const [toastNotification, setToastNotification] = useState<{ title: string; image?: string } | null>(null);

  // Live countdown timer ticking script
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hero carousel auto-play script
  useEffect(() => {
    if (isCarouselPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isCarouselPaused]);

  // Fetch store products dynamically
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["store-products", selectedCategory, searchQuery],
    queryFn: async () => {
      let url = `/products?limit=60`;
      if (selectedCategory) url += `&category_id=${selectedCategory}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      return api.get(url);
    },
  });

  // Fetch categorized feed for AliExpress multi-shelf display
  const { data: homeFeed } = useQuery({
    queryKey: ["store-home-feed"],
    queryFn: () => api.get("/home-feed?lang=ar"),
  });

  const productsList: any[] = Array.isArray(productsData)
    ? productsData
    : (productsData?.data || productsData?.products || []);

  const sections = homeFeed?.sections || [];

  const handleAddToCart = (product: any, qty = 1) => {
    for (let i = 0; i < qty; i++) {
      addToCart(product);
    }
    setAddedItemNotice(product.id);
    setToastNotification({
      title: product.name_ar || product.name || "منتج عماد إكسبرس",
      image: product.image,
    });
    setTimeout(() => setAddedItemNotice(null), 2500);
    setTimeout(() => setToastNotification(null), 3500);
  };

  const currentSlideData = HERO_SLIDES[currentSlide];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans relative selection:bg-amber-500 selection:text-black" dir="rtl">
      <StoreNavbar onSearch={(q) => setSearchQuery(q)} />

      {/* Floating Interactive Toast Notification */}
      {toastNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border-2 border-amber-500/80 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
          {toastNotification.image && (
            <img
              src={toastNotification.image}
              alt=""
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-amber-500/50"
            />
          )}
          <div className="flex flex-col text-right">
            <span className="text-xs font-black text-amber-300 flex items-center gap-1">
              <Check size={14} className="text-emerald-400" /> تمت الإضافة إلى السلة بنجاح!
            </span>
            <span className="text-[11px] text-slate-300 max-w-xs truncate">{toastNotification.title}</span>
          </div>
        </div>
      )}

      {/* Main hero & categories shelf (AliExpress style) */}
      <section className="max-w-7xl mx-auto px-4 pt-6 pb-4 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-3 bg-slate-900/85 border border-slate-800 rounded-3xl p-3.5 backdrop-blur-md shadow-xl hidden md:block">
            <div className="flex items-center gap-2 px-3 py-2 text-amber-400 font-black text-sm border-b border-slate-800 mb-2">
              <Layers size={18} />
              <span>أقسام وفئات علي إكسبرس</span>
            </div>
            <div className="space-y-1">
              {CATEGORIES_MENU.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSearchQuery("");
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black shadow-lg shadow-amber-500/20 translate-x-1"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </span>
                  <ChevronLeft size={14} className={selectedCategory === cat.id ? "text-black" : "text-slate-500"} />
                </button>
              ))}
            </div>
          </div>

          {/* Hero Banner with Interactive Auto-Rotating Carousel */}
          <div className="lg:col-span-9 flex flex-col gap-4">
            <div
              className={`relative rounded-3xl overflow-hidden bg-gradient-to-r ${currentSlideData.bg} p-8 sm:p-12 shadow-2xl flex flex-col justify-between min-h-[340px] transition-all duration-700`}
              onMouseEnter={() => setIsCarouselPaused(true)}
              onMouseLeave={() => setIsCarouselPaused(false)}
            >
              {/* Slide Background Subtle Patterns & Glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-black/20 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

              {/* Slide Top Badge & App Logo Showcase */}
              <div className="relative z-10 flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2 bg-black/85 text-amber-400 font-black text-xs px-4 py-1.5 rounded-full shadow-lg border border-amber-500/30">
                  <Sparkles size={14} /> {currentSlideData.badge}
                </span>

                {/* Official Luxury Logo Badge inside Banner */}
                <div className="hidden sm:flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20">
                  <img
                    src="/app-logo.png"
                    alt="عماد إكسبرس"
                    className="w-8 h-8 rounded-xl object-cover ring-2 ring-amber-400/60"
                  />
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-black text-white">عماد إكسبرس</span>
                    <span className="text-[9px] text-amber-300 font-bold">EMAD EXPRESS</span>
                  </div>
                </div>
              </div>

              {/* Slide Text Content */}
              <div className="relative z-10 max-w-xl space-y-3.5 my-4">
                <h1 className={`text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight ${currentSlideData.textColor}`}>
                  {currentSlideData.title}
                </h1>
                <p className={`text-xs sm:text-sm font-bold opacity-90 leading-relaxed ${currentSlideData.textColor}`}>
                  {currentSlideData.desc}
                </p>
              </div>

              {/* Slide Actions & Carousel Navigation */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedCategory("");
                      setSearchQuery("");
                      const catalogEl = document.getElementById("products-catalog");
                      catalogEl?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="bg-black hover:bg-slate-900 text-amber-400 font-black text-sm px-7 py-3.5 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <ShoppingBag size={18} />
                    <span>تصفح العروض الآن</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedCategory("44");
                      const catalogEl = document.getElementById("products-catalog");
                      catalogEl?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="bg-white/25 hover:bg-white text-black font-black text-xs sm:text-sm px-5 py-3.5 rounded-2xl backdrop-blur-md transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <span>عروض الأجهزة والتكنولوجيا</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                {/* Carousel Controls (Arrows & Dots) */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                    className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black text-white flex items-center justify-center transition-all cursor-pointer"
                    title="السابق"
                  >
                    <ChevronRight size={18} />
                  </button>

                  {/* Dots */}
                  <div className="flex items-center gap-1.5 px-2">
                    {HERO_SLIDES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`h-2.5 rounded-full transition-all cursor-pointer ${
                          currentSlide === i ? "w-7 bg-white shadow-md" : "w-2.5 bg-white/40 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                    className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black text-white flex items-center justify-center transition-all cursor-pointer"
                    title="التالي"
                  >
                    <ChevronLeft size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Highlights Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 hover:border-amber-500/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <Truck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">شحن وتوصيل فوري</h4>
                  <p className="text-[11px] text-slate-400">تتبع مباشر لكل شحنة</p>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 hover:border-amber-500/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">ضمان وأمان الدفع 100%</h4>
                  <p className="text-[11px] text-slate-400">حماية كاملة للمشتريات</p>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 hover:border-amber-500/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <Star size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">موردون موثوقون ومعتمدون</h4>
                  <p className="text-[11px] text-slate-400">تقييمات عالية وضمان الجودة</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AliExpress Live Flash Deals & Super Shelf with Real-Time Countdown Timer */}
      <section className="max-w-7xl mx-auto px-4 py-5 w-full">
        <div className="bg-gradient-to-r from-red-950/50 via-slate-900/90 to-amber-950/40 border border-red-500/30 rounded-3xl p-5 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/30 text-white animate-pulse">
                <Flame size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white">عروض الصفقات الخاطفة (Super Deals)</h2>
                  <span className="bg-red-500/20 text-red-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-red-500/30">
                    خصم حتى 70%
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">صفقات محدودة الوقت يتم تجديدها كل ساعة مباشرة من علي إكسبرس</p>
              </div>
            </div>

            {/* Live LCD Countdown Timer */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Clock size={14} className="text-amber-400" /> ينتهي العرض خلال:
              </span>
              <div className="flex items-center gap-1 font-mono text-sm font-black">
                <div className="bg-slate-950 text-amber-400 px-2.5 py-1 rounded-xl border border-amber-500/40 shadow-inner">
                  {String(timeLeft.hours).padStart(2, "0")}
                </div>
                <span className="text-amber-400 font-bold">:</span>
                <div className="bg-slate-950 text-amber-400 px-2.5 py-1 rounded-xl border border-amber-500/40 shadow-inner">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </div>
                <span className="text-amber-400 font-bold">:</span>
                <div className="bg-slate-950 text-red-400 px-2.5 py-1 rounded-xl border border-red-500/40 shadow-inner">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </div>
              </div>
            </div>
          </div>

          {/* Flash Deals Horizontal Carousel Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {productsList.slice(0, 5).map((prod) => (
              <ProductCard
                key={`flash-deal-${prod.id}`}
                product={prod}
                onAddToCart={(p) => handleAddToCart(p, 1)}
                onQuickView={(p) => {
                  setQuickViewProduct(p);
                  setQuickViewQty(1);
                }}
                isAdded={addedItemNotice === prod.id}
              />
            ))}
          </div>
        </div>
      </section>

      {/* AliExpress Multi-Category Showcase Shelves */}
      {!searchQuery && sections.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-4 w-full space-y-10">
          {sections.slice(0, 4).map((sec: any) => (
            <div key={`shelf-${sec.id}`} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{sec.icon || "📦"}</span>
                  <h2 className="text-xl font-black text-white">{sec.name_ar || sec.name}</h2>
                  <span className="text-xs font-bold text-amber-400/90 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                    رائج الآن
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCategory(String(sec.id))}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <span>عرض الكل ({sec.products?.length || 0})</span>
                  <ChevronLeft size={14} />
                </button>
              </div>

              {/* Horizontal Scroll Product Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {(sec.products || []).slice(0, 5).map((prod: any) => (
                  <ProductCard
                    key={`shelf-prod-${prod.id}`}
                    product={prod}
                    onAddToCart={(p) => handleAddToCart(p, 1)}
                    onQuickView={(p) => {
                      setQuickViewProduct(p);
                      setQuickViewQty(1);
                    }}
                    isAdded={addedItemNotice === prod.id}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Main Products Grid (Active Search or Selected Category) */}
      <section className="max-w-7xl mx-auto px-4 py-8 w-full flex-1" id="products-catalog">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-3">
          <div className="flex items-center gap-3">
            <Flame className="text-amber-500 animate-pulse" size={24} />
            <h2 className="text-2xl font-black text-white">
              {searchQuery
                ? `نتائج البحث عن: "${searchQuery}"`
                : selectedCategory
                ? `منتجات فئة: ${CATEGORIES_MENU.find((c) => c.id === selectedCategory)?.name || "المحددة"}`
                : "جميع المنتجات الأكثر طلباً في المتجر"}
            </h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-bold">
              {productsList.length} منتج
            </span>
          </div>

          {(selectedCategory || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory("");
                setSearchQuery("");
              }}
              className="text-xs font-bold text-amber-400 hover:underline cursor-pointer self-start sm:self-auto"
            >
              عرض كافة المنتجات
            </button>
          )}
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-12">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-slate-900/60 rounded-3xl h-72 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : productsList.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 max-w-md mx-auto">
            <ShoppingBag size={48} className="mx-auto text-amber-400/40 mb-3" />
            <h3 className="text-lg font-bold text-white">لم يتم العثور على منتجات مطابقة</h3>
            <p className="text-xs text-slate-400 mt-1">جرب البحث بكلمة أخرى أو اختر تصنيفاً مختلفاً من القائمة</p>
            <button
              onClick={() => {
                setSelectedCategory("");
                setSearchQuery("");
              }}
              className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
            >
              العودة لكافة المنتجات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {productsList.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(p) => handleAddToCart(p, 1)}
                onQuickView={(p) => {
                  setQuickViewProduct(p);
                  setQuickViewQty(1);
                }}
                isAdded={addedItemNotice === product.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Interactive Quick View Modal (AliExpress Style) */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative flex flex-col md:flex-row">
            {/* Close Button */}
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Product Image Box */}
            <div className="md:w-1/2 aspect-square bg-slate-950 relative overflow-hidden flex items-center justify-center">
              {quickViewProduct.image ? (
                <img
                  src={quickViewProduct.image}
                  alt={quickViewProduct.name_ar || quickViewProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-slate-600 text-sm">صورة المنتج</div>
              )}
              <span className="absolute top-3 right-3 bg-red-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-lg">
                خصم حصري
              </span>
            </div>

            {/* Product Details & Actions */}
            <div className="p-6 md:w-1/2 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-md border border-amber-400/20">
                  كود الصنف: #{quickViewProduct.id}
                </span>

                <h3 className="text-base font-black text-white leading-relaxed">
                  {quickViewProduct.name_ar || quickViewProduct.name}
                </h3>

                <div className="flex items-center gap-2">
                  <div className="flex items-center text-amber-400 text-xs">
                    <Star size={14} className="fill-amber-400" />
                    <Star size={14} className="fill-amber-400" />
                    <Star size={14} className="fill-amber-400" />
                    <Star size={14} className="fill-amber-400" />
                    <Star size={14} className="fill-amber-400" />
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">(4.9/5 • مورد موثوق)</span>
                </div>

                <div className="flex items-baseline gap-3 pt-1">
                  <span className="text-2xl font-black text-amber-400">
                    {(Number(quickViewProduct.price) || 0).toLocaleString()} ر.س
                  </span>
                  {quickViewProduct.cost && (
                    <span className="text-xs text-slate-500 line-through">
                      {(Number(quickViewProduct.cost) * 5).toLocaleString()} ر.س
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {quickViewProduct.description_ar || quickViewProduct.description || "منتج عالي الجودة مستورد مباشرة من أقوى مصانع علي إكسبرس مع فحص المخزون الفوري والضمان الشامل."}
                </p>

                {/* Stock Indicator */}
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/20 p-2.5 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>متوفر في المستودع الرئيسي - جاهز للشحن السريع</span>
                </div>
              </div>

              {/* Quantity Picker & Add to Cart */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">الكمية:</span>
                  <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-1">
                    <button
                      onClick={() => setQuickViewQty((q) => Math.max(1, q - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-xs font-black text-white px-2">{quickViewQty}</span>
                    <button
                      onClick={() => setQuickViewQty((q) => q + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleAddToCart(quickViewProduct, quickViewQty);
                      setQuickViewProduct(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag size={16} />
                    <span>أضف إلى السلة ({quickViewQty})</span>
                  </button>

                  <a
                    href={`https://wa.me/967772223645?text=${encodeURIComponent(
                      `مرحباً عماد إكسبرس، أود طلب المنتج: "${quickViewProduct.name_ar || quickViewProduct.name}" (كود: ${quickViewProduct.id}) بسعر: ${quickViewProduct.price} ر.س`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs p-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                    title="طلب فوري عبر واتساب"
                  >
                    <MessageCircle size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Customer Support WhatsApp Button with Glowing Pulse */}
      <aside aria-label="الدعم الفني السريع" className="fixed bottom-6 left-6 z-40 flex items-center gap-3">
        <a
          href="https://wa.me/967772223645?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%D8%B9%D9%85%D8%A7%D8%AF%20%D8%A5%D9%83%D8%B3%D8%A8%D8%B1%D8%B3%D8%8C%20%D9%84%D8%AF%D9%8A%20%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%B7%D9%84%D8%A8%D9%8A"
          target="_blank"
          rel="noreferrer"
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-3 rounded-full shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all duration-300 font-bold text-xs border border-emerald-400/50"
        >
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full animate-ping pointer-events-none" />
          <MessageCircle size={20} className="text-white" />
          <span className="hidden sm:inline font-black">مساعدة واتساب فوري</span>
        </a>
      </aside>

      <StoreFooter />
    </div>
  );
}

function ProductCard({
  product,
  onAddToCart,
  onQuickView,
  isAdded,
}: {
  product: any;
  onAddToCart: (p: any) => void;
  onQuickView: (p: any) => void;
  isAdded?: boolean;
}) {
  const price = Number(product.price) || 0;
  const originalPrice = product.cost ? Number((product.cost * 5).toFixed(2)) : price * 1.4;
  const discountPercent = Math.min(70, Math.max(15, Math.round(((originalPrice - price) / originalPrice) * 100)));

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/60 rounded-3xl overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/15 hover:-translate-y-1">
      {/* Product Image Box */}
      <div className="relative aspect-square overflow-hidden bg-slate-950">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name_ar || product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-700 text-xs">
            صورة المنتج
          </div>
        )}

        {/* Discount Badge (AliExpress Style) */}
        {discountPercent > 0 && (
          <span className="absolute top-2.5 right-2.5 bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-[10px] px-2 py-0.5 rounded-lg shadow-md">
            -{discountPercent}%
          </span>
        )}

        {/* Quick View Eye Button */}
        <button
          onClick={() => onQuickView(product)}
          className="absolute top-2.5 left-2.5 bg-black/70 hover:bg-amber-500 text-white hover:text-black p-2 rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer shadow-lg"
          title="معاينة سريعة"
        >
          <Eye size={15} />
        </button>

        <span className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-sm text-amber-300 font-bold text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-500/20">
          <Truck size={10} /> توصيل سريع
        </span>
      </div>

      {/* Info Body */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div>
          <h3
            className="text-xs font-semibold text-slate-200 line-clamp-2 leading-relaxed group-hover:text-amber-300 transition-colors"
            title={product.name_ar || product.name}
          >
            {product.name_ar || product.name || product.name_en}
          </h3>

          {/* AliExpress Rating Star */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex items-center text-amber-400 text-[10px]">
              <Star size={11} className="fill-amber-400" />
            </div>
            <span className="text-[10px] text-slate-400 font-bold">4.8 (850+ بيع)</span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-base font-black text-amber-400">{price.toLocaleString()} ر.س</span>
            {originalPrice > price && (
              <span className="text-[11px] text-slate-500 line-through">
                {originalPrice.toLocaleString()} ر.س
              </span>
            )}
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddToCart(product)}
            className={`flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isAdded
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-slate-800 hover:bg-gradient-to-r hover:from-amber-500 hover:to-amber-600 text-slate-200 hover:text-black border border-slate-700 hover:border-transparent shadow-md"
            }`}
          >
            {isAdded ? (
              <>
                <Check size={14} />
                <span>تمت الإضافة!</span>
              </>
            ) : (
              <>
                <ShoppingBag size={14} />
                <span>أضف للسلة</span>
              </>
            )}
          </button>

          <button
            onClick={() => onQuickView(product)}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700 transition-all cursor-pointer"
            title="معاينة الصنف"
          >
            <Eye size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
