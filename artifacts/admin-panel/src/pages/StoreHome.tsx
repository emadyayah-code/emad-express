import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { StoreNavbar, StoreFooter } from "@/components/StoreNavbar";
import { useCart } from "@/context/CartContext";
import { api } from "@/lib/api";
import { 
  Sparkles, Flame, ShoppingBag, Eye, Star, Truck, ShieldCheck, 
  ChevronRight, ChevronLeft, ArrowRight, Layers, Tag, Check, Filter 
} from "lucide-react";

const CATEGORIES_MENU = [
  { id: "", name: "جميع الأقسام", icon: "🌐" },
  { id: "200000345", name: "أزياء وملابس نسائية", icon: "👗" },
  { id: "200000343", name: "أزياء وملابس رجالية", icon: "👔" },
  { id: "44", name: "إلكترونيات وأجهزة ذكية", icon: "📱" },
  { id: "1511", name: "ساعات وإكسسوارات", icon: "⌚" },
  { id: "15", name: "أجهزة منزلية ومطبخ", icon: "🏠" },
  { id: "1524", name: "حقائب ومحافظ وأمتعة", icon: "🎒" },
  { id: "322", name: "أحذية رياضية ورسمية", icon: "👟" },
  { id: "66", name: "جمال وعناية ومكياج", icon: "💄" },
  { id: "18", name: "رياضة ولياقة وترفيه", icon: "⚽" },
  { id: "1509", name: "مجوهرات وإكسسوارات", icon: "💍" },
  { id: "7", name: "كمبيوتر ومستلزمات مكتب", icon: "💻" },
];

export default function StoreHome() {
  const searchParams = new URLSearchParams(window.location.search);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "");
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("search") || "");
  const { addToCart } = useCart();
  const [addedItemNotice, setAddedItemNotice] = useState<number | null>(null);

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

  const handleAddToCart = (product: any) => {
    addToCart(product);
    setAddedItemNotice(product.id);
    setTimeout(() => setAddedItemNotice(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans" dir="rtl">
      <StoreNavbar onSearch={(q) => setSearchQuery(q)} />

      {/* Main hero & categories shelf (AliExpress style) */}
      <section className="max-w-7xl mx-auto px-4 pt-6 pb-4 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 backdrop-blur-md shadow-xl hidden md:block">
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-amber-500 text-black font-black shadow-md"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </span>
                  <ChevronLeft size={14} className={selectedCategory === cat.id ? "text-black" : "text-slate-500"} />
                </button>
              ))}
            </div>
          </div>

          {/* Hero Banner Carousel Display */}
          <div className="lg:col-span-9 flex flex-col gap-4">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-8 sm:p-12 text-black shadow-2xl flex flex-col justify-between min-h-[300px]">
              <div className="max-w-xl space-y-4">
                <span className="inline-flex items-center gap-1.5 bg-black/85 text-amber-400 font-black text-xs px-3.5 py-1.5 rounded-full shadow-md">
                  <Sparkles size={14} /> أقوى عروض التخفيضات الكبرى العالمية
                </span>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                  تسوق ملايين المنتجات بأسعار المورد المباشرة!
                </h1>
                <p className="text-sm font-bold text-black/85 leading-relaxed">
                  استيراد مباشر وفوري من علي إكسبرس مع ضمان الجودة، فحص المخزون الفوري، وخدمة عملاء على مدار الساعة.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-6">
                <button
                  onClick={() => {
                    setSelectedCategory("");
                    setSearchQuery("");
                    window.scrollTo({ top: 550, behavior: "smooth" });
                  }}
                  className="bg-black hover:bg-slate-900 text-amber-400 font-black text-sm px-7 py-3 rounded-2xl shadow-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <ShoppingBag size={17} />
                  <span>تصفح المنتجات الآن</span>
                </button>

                <Link
                  href="/admin"
                  className="bg-white/30 hover:bg-white text-black font-bold text-sm px-6 py-3 rounded-2xl backdrop-blur-md transition-all shadow-md flex items-center gap-2"
                >
                  <span>لوحة إدارة المتجر</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Quick Highlights Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Truck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">شحن وتوصيل فوري</h4>
                  <p className="text-[11px] text-slate-400">تتبع مباشر لكل طلب</p>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">ضمان وأمان الدفع</h4>
                  <p className="text-[11px] text-slate-400">حماية كاملة للمشتريات</p>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Star size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">موردون موثوقون</h4>
                  <p className="text-[11px] text-slate-400">تقييمات عالية وجودة 100%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AliExpress Multi-Category Showcase Shelves */}
      {!searchQuery && sections.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-6 w-full space-y-10">
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
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>عرض الكل</span>
                  <ChevronLeft size={14} />
                </button>
              </div>

              {/* Horizontal Scroll Product Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {(sec.products || []).slice(0, 5).map((prod: any) => (
                  <ProductCard
                    key={`shelf-prod-${prod.id}`}
                    product={prod}
                    onAddToCart={handleAddToCart}
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
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Flame className="text-amber-500 animate-pulse" size={24} />
            <h2 className="text-2xl font-black text-white">
              {searchQuery
                ? `نتائج البحث عن: "${searchQuery}"`
                : selectedCategory
                ? `منتجات فئة: ${CATEGORIES_MENU.find((c) => c.id === selectedCategory)?.name || "المحددة"}`
                : "جميع المنتجات الأكثر طلباً في المتجر"}
            </h2>
          </div>

          {(selectedCategory || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory("");
                setSearchQuery("");
              }}
              className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
            >
              عرض كافة المنتجات
            </button>
          )}
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-12">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-slate-900/60 rounded-2xl h-72 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : productsList.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
            <ShoppingBag size={48} className="mx-auto text-amber-400/40 mb-3" />
            <h3 className="text-lg font-bold text-white">لم يتم العثور على منتجات مطابقة</h3>
            <p className="text-xs text-slate-400 mt-1">جرب البحث بكلمة أخرى أو اختر تصنيفاً مختلفاً</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {productsList.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                isAdded={addedItemNotice === product.id}
              />
            ))}
          </div>
        )}
      </section>

      <StoreFooter />
    </div>
  );
}

function ProductCard({
  product,
  onAddToCart,
  isAdded,
}: {
  product: any;
  onAddToCart: (p: any) => void;
  isAdded?: boolean;
}) {
  const price = Number(product.price) || 0;
  const originalPrice = product.cost ? Number((product.cost * 5).toFixed(2)) : price * 1.4;
  const discountPercent = Math.min(65, Math.round(((originalPrice - price) / originalPrice) * 100));

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
      {/* Product Image Box */}
      <div className="relative aspect-square overflow-hidden bg-slate-950">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name_ar || product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
          <span className="absolute top-2 right-2 bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-[10px] px-2 py-0.5 rounded-lg shadow-md">
            -{discountPercent}%
          </span>
        )}

        <span className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-sm text-amber-300 font-bold text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1">
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

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-base font-black text-amber-400">{price.toLocaleString()} ر.س</span>
            {originalPrice > price && (
              <span className="text-[11px] text-slate-500 line-through">
                {originalPrice.toLocaleString()} ر.س
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Action */}
        <button
          onClick={() => onAddToCart(product)}
          className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            isAdded
              ? "bg-emerald-500 text-white"
              : "bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-black border border-slate-700 hover:border-amber-500"
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
      </div>
    </div>
  );
}
