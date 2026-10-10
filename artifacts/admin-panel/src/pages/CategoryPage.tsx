import React, { useState, useMemo } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Layers,
  ArrowRight,
  Filter,
  ArrowUpDown,
  Search,
  ShoppingCart,
  Eye,
  Star,
  Check,
  Truck,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ChevronLeft,
  X,
  Home,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { StoreNavbar, StoreFooter } from "@/components/StoreNavbar";
import { useCart } from "@/context/CartContext";
import { api } from "@/lib/api";

export default function CategoryPage() {
  const [, params] = useRoute("/category/:id");
  const [, setLocation] = useLocation();
  const categoryId = params?.id || "";

  const { addToCart } = useCart();
  const [searchInCat, setSearchInCat] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "discount">("default");
  const [addedNotice, setAddedNotice] = useState<number | null>(null);

  // Quick view modal
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [quickViewQty, setQuickViewQty] = useState(1);

  // Toast notification
  const [toastNotification, setToastNotification] = useState<{ title: string; image?: string } | null>(null);

  // Fetch all categories for header pills and name lookup
  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ["store-categories"],
    queryFn: () => api.get("/categories"),
  });

  const categoriesList: any[] = useMemo(() => {
    if (Array.isArray(categoriesData)) return categoriesData;
    return categoriesData?.categories || categoriesData?.data || [];
  }, [categoriesData]);

  // Find active category
  const currentCategory = useMemo(() => {
    return categoriesList.find((c: any) => String(c.id) === String(categoryId));
  }, [categoriesList, categoryId]);

  // Fetch products for this specific category
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["category-products", categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      return api.get(`/products?category_id=${categoryId}&limit=100`);
    },
    enabled: Boolean(categoryId),
  });

  const rawProducts: any[] = useMemo(() => {
    if (Array.isArray(productsData)) return productsData;
    return productsData?.data || productsData?.products || [];
  }, [productsData]);

  // Filter & sort products
  const products = useMemo(() => {
    let list = [...rawProducts];

    if (searchInCat.trim()) {
      const q = searchInCat.toLowerCase().trim();
      list = list.filter((p: any) => {
        const ar = (p.name_ar || "").toLowerCase();
        const en = (p.name_en || p.name || "").toLowerCase();
        return ar.includes(q) || en.includes(q);
      });
    }

    if (sortBy === "price-asc") {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "discount") {
      list.sort((a, b) => {
        const discA = a.cost ? ((a.cost * 5 - a.price) / (a.cost * 5)) : 0;
        const discB = b.cost ? ((b.cost * 5 - b.price) / (b.cost * 5)) : 0;
        return discB - discA;
      });
    }

    return list;
  }, [rawProducts, searchInCat, sortBy]);

  const handleAddToCart = (product: any, qty = 1) => {
    addToCart(product, qty);
    setAddedNotice(product.id);
    setTimeout(() => setAddedNotice(null), 1800);

    setToastNotification({
      title: `تمت إضافة "${product.name_ar || product.name}" إلى السلة بنجاح!`,
      image: product.image,
    });
    setTimeout(() => setToastNotification(null), 3500);
  };

  const catName = currentCategory?.name_ar || currentCategory?.name || currentCategory?.name_en || "القسم المختار";
  const catIcon = currentCategory?.icon || "📦";

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black" dir="rtl">
      {/* Top Navbar */}
      <StoreNavbar />

      {/* Floating Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-500/50 shadow-2xl shadow-amber-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 max-w-sm">
          {toastNotification.image ? (
            <img src={toastNotification.image} alt="product" className="w-11 h-11 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <ShoppingBag size={20} className="text-amber-400" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xs font-bold text-amber-300">سلة التسوق</span>
            <span className="text-[11px] text-slate-300 max-w-xs truncate">{toastNotification.title}</span>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-amber-400 transition-colors flex items-center gap-1">
              <Home size={14} />
              <span>الرئيسية</span>
            </Link>
            <ChevronLeft size={13} className="text-slate-600" />
            <span className="text-slate-500">الأقسام والفئات</span>
            <ChevronLeft size={13} className="text-slate-600" />
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <span>{catIcon}</span>
              <span>{catName}</span>
            </span>
          </div>

          <Link href="/" className="hover:text-amber-300 transition-colors flex items-center gap-1 text-[11px]">
            <ArrowRight size={13} />
            <span>العودة للرئيسية</span>
          </Link>
        </div>
      </div>

      {/* Category Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-transparent border-b border-slate-800/60 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold">
              <Sparkles size={13} />
              <span>قسم رسمي معتمد • عماد إكسبرس</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-black flex items-center justify-center text-3xl shadow-xl shadow-amber-500/20 shrink-0">
                {catIcon}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                  <span>{catName}</span>
                  <span className="text-xs bg-slate-800 text-slate-300 font-bold px-3 py-1 rounded-full border border-slate-700">
                    {rawProducts.length} منتج متوفر
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  تصفح تشكيلة منتجات قسم {catName} الحصرية مع فحص الجودة الفوري والشحن السريع لباب منزلك وبأفضل أسعار الجملة.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Info Badges */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 self-start md:self-auto">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-2.5 flex items-center gap-3">
              <Truck size={18} className="text-amber-400" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">التوصيل</span>
                <span className="text-xs font-bold text-slate-200">شحن دولي مباشر</span>
              </div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-2.5 flex items-center gap-3">
              <ShieldCheck size={18} className="text-emerald-400" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">الضمان</span>
                <span className="text-xs font-bold text-slate-200">حماية المشتري 100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Categories Fast Navigation Carousel Bar */}
      <section className="max-w-7xl mx-auto px-4 pt-6 pb-2 w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Layers size={14} className="text-amber-400" />
            <span>تنقل سريع بين كافة أقسام المتجر:</span>
          </span>
          <span className="text-[11px] text-slate-500 font-medium">({categoriesList.length} قسم)</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
          <Link
            href="/"
            className="px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white"
          >
            <span>🌐</span>
            <span>الرئيسية وكل الأقسام</span>
          </Link>

          {loadingCategories ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-24 bg-slate-800/40 rounded-2xl animate-pulse shrink-0" />
            ))
          ) : (
            categoriesList.map((cat: any) => {
              const isActive = String(cat.id) === String(categoryId);
              return (
                <button
                  key={`cat-pill-${cat.id}`}
                  onClick={() => setLocation(`/category/${cat.id}`)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/50 scale-105"
                      : "bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-amber-500/40 hover:text-white"
                  }`}
                >
                  <span className="text-sm">{cat.icon || "📦"}</span>
                  <span>{cat.name_ar || cat.name || cat.name_en}</span>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Main Content Area: Filter & Products Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1">
        {/* Controls Bar: In-Category Search + Sort Dropdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Live Search inside this Category */}
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={`ابحث داخل ${catName}...`}
              value={searchInCat}
              onChange={(e) => setSearchInCat(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl pr-10 pl-8 py-2 text-xs focus:outline-none focus:border-amber-500/60 placeholder:text-slate-500"
            />
            {searchInCat && (
              <button
                onClick={() => setSearchInCat("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Control */}
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
              <ArrowUpDown size={14} className="text-amber-400" />
              <span>ترتيب حسب:</span>
            </span>

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/60 cursor-pointer"
            >
              <option value="default">الافتراضي (الأحدث)</option>
              <option value="price-asc">الأقل سعراً أولاً</option>
              <option value="price-desc">الأعلى سعراً أولاً</option>
              <option value="discount">أعلى نسبة تخفيض</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-3 h-80 animate-pulse flex flex-col justify-between">
                <div className="aspect-square bg-slate-800/40 rounded-2xl mb-3" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-800/60 rounded" />
                  <div className="h-3 bg-slate-800/40 rounded w-2/3" />
                  <div className="h-4 bg-amber-500/20 rounded w-1/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 space-y-4">
            <div className="w-20 h-20 bg-slate-800/60 text-slate-400 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-inner">
              {catIcon}
            </div>
            <h3 className="text-lg font-bold text-white">
              {searchInCat ? `لا توجد نتائج مطابقة لـ "${searchInCat}" في هذا القسم` : `لا توجد منتجات مسجلة في هذا القسم حالياً`}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              يمكنك تجربة البحث بكلمات أخرى أو استعراض باقي أقسام المتجر المتوفرة.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              {searchInCat && (
                <button
                  onClick={() => setSearchInCat("")}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  مسح البحث
                </button>
              )}
              <Link
                href="/"
                className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <span>تصفح الصفحة الرئيسية</span>
                <ChevronLeft size={14} />
              </Link>
            </div>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((prod: any) => (
              <ProductCard
                key={`cat-prod-${prod.id}`}
                product={prod}
                onAddToCart={(p) => handleAddToCart(p, 1)}
                onQuickView={(p) => {
                  setQuickViewProduct(p);
                  setQuickViewQty(1);
                }}
                isAdded={addedNotice === prod.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Interactive Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative text-right flex flex-col md:flex-row">
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 left-4 z-10 bg-black/60 hover:bg-red-500 hover:text-white text-slate-300 p-2 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Modal Product Image Box */}
            <div className="md:w-1/2 aspect-square md:aspect-auto bg-slate-950 relative overflow-hidden flex items-center justify-center">
              {quickViewProduct.image ? (
                <img
                  src={quickViewProduct.image}
                  alt={quickViewProduct.name_ar || quickViewProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-slate-600 text-sm">صورة المنتج غير متوفرة</div>
              )}
              <div className="absolute top-4 right-4 bg-amber-500 text-black font-black text-xs px-2.5 py-1 rounded-lg shadow-lg">
                شحن مباشر سريع ⚡
              </div>
            </div>

            {/* Modal Product Details */}
            <div className="p-6 md:w-1/2 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <span className="text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 inline-block">
                  {catName}
                </span>

                <h2 className="text-base font-bold text-white leading-snug">
                  {quickViewProduct.name_ar || quickViewProduct.name || quickViewProduct.name_en}
                </h2>

                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-amber-400">
                    {Number(quickViewProduct.price).toLocaleString()} ر.س
                  </span>
                  {quickViewProduct.cost && (
                    <span className="text-xs text-slate-500 line-through">
                      {(Number(quickViewProduct.cost) * 5).toLocaleString()} ر.س
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed max-h-24 overflow-y-auto">
                  {quickViewProduct.description_ar || quickViewProduct.description || "منتج عالي الجودة مستورد وموثق من عماد اكسبرس مع فحص المخزون الفوري والضمان الشامل."}
                </p>

                {/* Stock Indicator */}
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/20 p-2.5 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>متوفر في المستودع الرئيسي - جاهز للشحن السريع</span>
                </div>
              </div>

              {/* Quantity Selector & Add to Cart Action */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">الكمية المطلوبة:</span>
                  <div className="flex items-center border border-slate-700 bg-slate-950 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuickViewQty(Math.max(1, quickViewQty - 1))}
                      className="px-3 py-1 hover:bg-slate-800 text-slate-300 text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 text-xs font-black text-amber-400">{quickViewQty}</span>
                    <button
                      onClick={() => setQuickViewQty(quickViewQty + 1)}
                      className="px-3 py-1 hover:bg-slate-800 text-slate-300 text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleAddToCart(quickViewProduct, quickViewQty);
                    setQuickViewProduct(null);
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs py-3.5 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <ShoppingCart size={16} />
                  <span>إضافة إلى سلة المشتريات ({Number(quickViewProduct.price * quickViewQty).toLocaleString()} ر.س)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
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
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-700 text-xs">
            صورة المنتج
          </div>
        )}

        {/* Discount Badge */}
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
                <ShoppingCart size={14} />
                <span>أضف للسلة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
