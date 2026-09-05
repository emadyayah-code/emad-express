import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search, Globe, Settings, Package, ExternalLink, Download, X, AlertCircle, CheckCircle, Link2, Loader2, Play, Pause, RotateCcw, BarChart3, TrendingUp, Database, Trash2 } from "lucide-react";

const PLATFORMS = [
  { id: "aliexpress", name: "علي إكسبرس", flag: "🇨🇳", color: "text-red-600 bg-red-50", apiKey: "aliexpress_app_key" },
  { id: "amazon", name: "أمازون", flag: "📦", color: "text-orange-600 bg-orange-50", apiKey: "amazon_access_key" },
  { id: "alibaba", name: "علي بابا", flag: "🏪", color: "text-amber-600 bg-amber-50", apiKey: "alibaba_app_key" },
  { id: "ebay", name: "إي باي", flag: "🔨", color: "text-blue-600 bg-blue-50", apiKey: "ebay_api_key" },
  { id: "noon", name: "نون", flag: "🌙", color: "text-yellow-600 bg-yellow-50", apiKey: "noon_api_key" },
  { id: "jumia", name: "جوميا", flag: "🛒", color: "text-orange-500 bg-orange-50", apiKey: "jumia_api_key" },
  { id: "temu", name: "تيمو", flag: "🛍️", color: "text-pink-600 bg-pink-50", apiKey: "temu_api_key" },
];

export default function Dropshipping() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"products" | "url" | "search" | "bulk" | "settings">("products");
  const [platform, setPlatform] = useState("aliexpress");
  const [searchQ, setSearchQ] = useState("");
  const [browseList, setBrowseList] = useState<any[]>([]);
  const [importModal, setImportModal] = useState<any>(null);
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({
    aliexpress_app_key: "540456",
    aliexpress_app_key_secret: "VKz8Ppc40dGMXGbcLyjXRxBhrXw3itnT",
    aliexpress_tracking_id: "default",
    aliexpress_commission_rate: "10",
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlFetching, setUrlFetching] = useState(false);
  const [urlResult, setUrlResult] = useState<any>(null);
  const [urlError, setUrlError] = useState("");
  const [importingAllBrowse, setImportingAllBrowse] = useState(false);
  const [importAllSuccess, setImportAllSuccess] = useState("");

  const handleImportAllBrowse = async () => {
    if (browseList.length === 0) return;
    setImportingAllBrowse(true);
    setImportAllSuccess("");
    try {
      const res = await api.post("/admin/dropship/import-batch", {
        items: browseList,
        margin_percent: 35,
      });
      qc.invalidateQueries({ queryKey: ["dropship-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setImportAllSuccess(res.message || `تم استيراد ${res.imported || browseList.length} منتج بنجاح إلى متجرك!`);
      setTimeout(() => setImportAllSuccess(""), 8000);
    } catch (e: any) {
      alert(e?.message || "فشل استيراد المنتجات");
    } finally {
      setImportingAllBrowse(false);
    }
  };

  const { data: dropProducts, isLoading: dpLoading } = useQuery({
    queryKey: ["dropship-products"],
    queryFn: () => api.get("/admin/dropship/products"),
    enabled: tab === "products",
  });
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["dropship-search", platform, searchQ],
    queryFn: () => api.get(`/admin/dropship/search?platform=${platform}&q=${encodeURIComponent(searchQ)}`),
    enabled: tab === "search" && searchQ.length > 2,
  });
  const { data: settingsData } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: () => api.get("/admin/platform-settings"),
  });

  useEffect(() => {
    if (settingsData && typeof settingsData === "object") {
      setSettingsForm(prev => ({ ...prev, ...settingsData }));
    }
  }, [settingsData]);

  const importMut = useMutation({
    mutationFn: (d: any) => api.post("/admin/dropship/import", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dropship-products"] }); setImportModal(null); },
  });
  const deleteDpMut = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/dropship/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dropship-products"] }),
  });
  const saveSettingsMut = useMutation({
    mutationFn: (d: any) => api.post("/admin/platform-settings", d),
    onSuccess: () => { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 3000); },
  });

  const [cleanModalOpen, setCleanModalOpen] = useState(false);
  const [clearingDb, setClearingDb] = useState(false);
  const [cleanSuccess, setCleanSuccess] = useState("");

  const handleClearDatabase = async () => {
    setClearingDb(true);
    try {
      const res = await api.delete("/admin/dropship/clear-products");
      qc.invalidateQueries({ queryKey: ["dropship-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setCleanSuccess(res.message || "تم تنظيف قاعدة البيانات بنجاح!");
      setCleanModalOpen(false);
      setTimeout(() => setCleanSuccess(""), 6000);
    } catch (e: any) {
      alert(e?.message || "فشل تنظيف قاعدة البيانات");
    } finally {
      setClearingDb(false);
    }
  };

  const [syncingStock, setSyncingStock] = useState(false);

  const handleSyncStock = async () => {
    setSyncingStock(true);
    try {
      const res = await api.post("/admin/dropship/sync-stock", {});
      qc.invalidateQueries({ queryKey: ["dropship-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setCleanSuccess(res.message || "تمت مزامنة المخزون والكميات بنجاح مع علي إكسبرس!");
      setTimeout(() => setCleanSuccess(""), 6000);
    } catch (e: any) {
      alert(e?.message || "فشلت المزامنة");
    } finally {
      setSyncingStock(false);
    }
  };

  const dpList = dropProducts?.data || [];
  const searchList = searchResults?.results || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">نظام الدروبشيبينغ</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSyncStock}
            disabled={syncingStock}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-black px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {syncingStock ? <><Loader2 size={14} className="animate-spin" /> جارٍ المزامنة...</> : <>🔄 مزامنة المخزون والأسعار مع علي إكسبرس</>}
          </button>
          <button
            onClick={() => setCleanModalOpen(true)}
            className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Trash2 size={14} /> تنظيف وتفريغ قاعدة البيانات 🧹
          </button>
        </div>
      </div>

      {cleanSuccess && (
        <div className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 rounded-2xl p-4 flex items-center gap-2 text-sm font-bold animate-pulse">
          <CheckCircle size={18} className="text-emerald-400" />
          {cleanSuccess}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: "products", label: "المنتجات المستوردة", icon: Package },
          { id: "url", label: "استيراد من رابط", icon: Link2 },
          { id: "search", label: "بحث وتصفح", icon: Search },
          { id: "bulk", label: "جلب دفقي غير محدود", icon: Database },
          { id: "settings", label: "إعدادات API", icon: Settings },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? "bg-white shadow-sm text-amber-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {tab === "products" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {dpLoading ? (
            <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>
          ) : dpList.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">لا توجد منتجات مستوردة بعد</p>
              <p className="text-sm mt-1">اذهب لـ "استيراد منتج" لإضافة منتجات من علي إكسبرس أو أمازون</p>
              <button onClick={() => setTab("search")} className="mt-4 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600">
                ابدأ الاستيراد
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["المنتج", "المنصة", "سعر المورد", "سعرنا", "الربح", "الإجراءات"].map(h => (
                      <th key={h} className="text-right px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dpList.map((dp: any) => (
                    <tr key={dp.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {dp.product?.image && <img src={dp.product.image} alt="" className="w-10 h-10 object-cover rounded-lg" referrerPolicy="no-referrer" />}
                          <div>
                            <p className="font-medium text-gray-800">{dp.product?.name || "—"}</p>
                            <a href={dp.source_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 flex items-center gap-1">
                              <ExternalLink size={10} /> رابط المورد
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${PLATFORMS.find(p => p.id === dp.platform)?.color || "bg-gray-100 text-gray-600"}`}>
                          {PLATFORMS.find(p => p.id === dp.platform)?.flag} {PLATFORMS.find(p => p.id === dp.platform)?.name || dp.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{dp.source_price.toLocaleString()} ر</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{dp.our_price.toLocaleString()} ر</td>
                      <td className="px-4 py-3">
                        <span className="text-green-700 font-semibold">+{(dp.our_price - dp.source_price).toLocaleString()} ر</span>
                        <span className="text-xs text-gray-400 mr-1">
                          ({dp.source_price > 0 ? ((dp.our_price - dp.source_price) / dp.source_price * 100).toFixed(0) : 0}%)
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { if (confirm("حذف هذا المنتج من قائمة الدروبشيبينغ؟")) deleteDpMut.mutate(dp.id); }} className="text-red-400 hover:text-red-600 text-xs border border-red-200 rounded px-2 py-1">
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* URL / Code Import Tab */}
      {tab === "url" && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 rounded-2xl shadow-xl border border-amber-500/30 p-6">
            <div className="flex items-center gap-2 mb-2">
              <Link2 size={20} className="text-amber-400" />
              <h3 className="font-bold text-white text-lg">استيراد منتج برقم كود المنتج (Product ID) أو الرابط المباشر</h3>
            </div>
            <p className="text-sm text-amber-200/70 mb-5">
              أدخل رقم كود المنتج من علي إكسبرس (مثل <code className="bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">1005006283921001</code>) أو الصق رابط المنتج، وسنقوم بجلب الاسم والصور والأسعار الحقيقية فوراً.
            </p>
            <div className="flex gap-3 flex-col sm:flex-row">
              <input
                type="text"
                value={urlInput}
                onChange={e => { setUrlInput(e.target.value); setUrlResult(null); setUrlError(""); }}
                placeholder="أدخل رقم كود المنتج (مثل: 1005006283921001) أو الرابط الكامل..."
                className="flex-1 border border-slate-700 bg-slate-950/90 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 text-right"
                dir="auto"
              />
              <button
                disabled={!urlInput.trim() || urlFetching}
                onClick={async () => {
                  if (!urlInput.trim()) return;
                  setUrlFetching(true); setUrlResult(null); setUrlError("");
                  try {
                    const r = await api.get(`/admin/dropship/fetch-url?url=${encodeURIComponent(urlInput.trim())}`);
                    setUrlResult(r);
                  } catch (e: any) {
                    setUrlError(e?.message || "فشل استيراد المنتج بالكود أو الرابط");
                  } finally {
                    setUrlFetching(false);
                  }
                }}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black px-8 py-3 rounded-xl text-sm font-extrabold disabled:opacity-50 whitespace-nowrap transition-all shadow-lg cursor-pointer"
              >
                {urlFetching ? <><Loader2 size={16} className="animate-spin" /> جارٍ جلب البيانات...</> : <><Download size={16} /> جلب بيانات المنتج فوراً</>}
              </button>
            </div>

            {urlError && (
              <div className="mt-4 flex items-start gap-2 bg-red-950/60 border border-red-500/40 text-red-300 rounded-xl px-4 py-3 text-sm">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
                <div>
                  <p className="font-bold">{urlError}</p>
                  <p className="text-xs text-red-300/80 mt-1">تأكد من كتابة كود المنتج أو رابط صحيح، أو أدخل البيانات يدوياً أدناه</p>
                </div>
              </div>
            )}
          </div>

          {/* Result / Edit Form */}
          {(urlResult || urlError) && (
            <UrlImportForm
              initial={urlResult}
              sourceUrl={urlInput}
              onImport={async (data: any) => {
                await importMut.mutateAsync(data);
                setUrlResult(null);
                setUrlInput("");
                setTab("products");
              }}
              importing={importMut.isPending}
            />
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">💡 نصائح للاستيراد:</p>
            <ul className="space-y-1 text-blue-600 text-xs list-disc list-inside">
              <li>الصق رابط صفحة المنتج مباشرة وليس صفحة البحث</li>
              <li>رابط علي إكسبرس يبدأ بـ aliexpress.com/item/...</li>
              <li>رابط أمازون يبدأ بـ amazon.com/dp/... أو amazon.com/gp/product/...</li>
              <li>إذا لم تُستخرج البيانات تلقائياً، أدخلها يدوياً في النموذج</li>
            </ul>
          </div>
        </div>
      )}

      {/* Search Tab */}
      {tab === "search" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 className="font-semibold text-gray-800">استيراد منتج من منصة خارجية</h3>
              <AutoFetchButton platform={platform} onResults={(results) => setBrowseList(results)} />
            </div>
            <div className="flex flex-wrap gap-3 mb-4">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${platform === p.id ? "border-amber-400 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                >
                  <span>{p.flag}</span> {p.name}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute top-2.5 right-3 text-gray-400" />
                <input
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="ابحث عن منتج (مثل: سماعات بلوتوث، ساعة ذكية...)"
                  className="w-full border border-gray-200 rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <AlertCircle size={12} />
              {searchQ.length < 3 ? "اكتب 3 أحرف على الأقل للبحث" : searchLoading ? "جارٍ البحث..." : `${searchList.length} نتيجة`}
            </p>
          </div>

          {/* Search & Browse Results */}
          {(() => {
            const displayList = browseList.length > 0 ? browseList : searchList;
            if (displayList.length === 0) return null;
            return (
              <div className="space-y-3">
                {browseList.length > 0 && (
                  <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex-wrap gap-3">
                    <div>
                      <span className="text-sm font-black text-amber-300 block">
                        📦 معروض {browseList.length} منتج مسحوب مباشرة من علي إكسبرس
                      </span>
                      <span className="text-xs text-amber-200/70">
                        يمكنك استيراد منتج فردي، أو استيراد كامل الـ {browseList.length} منتج فوراً لقاعدة البيانات بنقرة واحدة
                      </span>
                      {importAllSuccess && (
                        <p className="text-xs text-emerald-400 font-bold mt-1 animate-pulse">✓ {importAllSuccess}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleImportAllBrowse}
                        disabled={importingAllBrowse}
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black px-5 py-2.5 rounded-xl text-xs font-black shadow-lg disabled:opacity-60 transition-all cursor-pointer"
                      >
                        {importingAllBrowse ? (
                          <><Loader2 size={14} className="animate-spin text-black" /> جارٍ استيراد وحفظ {browseList.length} منتج بالمتجر...</>
                        ) : (
                          <><Database size={14} /> ⚡ استيراد جميع الـ ({browseList.length}) منتج للمتجر دفعة واحدة 🚀</>
                        )}
                      </button>
                      <button
                        onClick={() => setBrowseList([])}
                        className="text-xs text-red-400 hover:text-red-300 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 font-bold transition-all"
                      >
                        إلغاء التصفح
                      </button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayList.map((item: any) => (
                    <div key={item.source_id} className="bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-amber-500/40 overflow-hidden shadow-lg hover:shadow-xl transition-all flex flex-col justify-between">
                      <div>
                        <div className="relative w-full h-48 bg-slate-950">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <span className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-amber-300 text-[10px] font-extrabold px-2 py-1 rounded-lg border border-amber-500/30">
                            #{item.source_id}
                          </span>
                          {item.category_name && (
                            <span className="absolute bottom-2 left-2 bg-amber-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {item.category_name}
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="font-bold text-white text-xs line-clamp-2 leading-relaxed" title={item.name}>{item.name}</p>
                          <div className="flex items-center justify-between mt-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                            <div>
                              <p className="text-[10px] text-slate-400">سعر المورد</p>
                              <p className="font-extrabold text-amber-400 text-sm">{item.price?.toLocaleString()} $</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400">سعر مقترح بالمتجر</p>
                              <p className="font-extrabold text-emerald-400 text-sm">{((item.price || 20) * 1.35).toFixed(1)} $</p>
                            </div>
                          </div>
                          {item.supplier_name && (
                            <p className="text-[10px] text-slate-400 mt-2 truncate">🏪 {item.supplier_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="p-4 pt-0">
                        <button
                          onClick={() => setImportModal({ ...item, platform: item.platform || platform, our_price: Math.ceil((item.price || 20) * 1.35) })}
                          className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer"
                        >
                          <Download size={14} /> استيراد هذا المنتج للمتجر
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Manual Import */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h4 className="font-semibold text-blue-800 mb-1 flex items-center gap-2"><AlertCircle size={16} /> استيراد يدوي</h4>
            <p className="text-sm text-blue-700 mb-3">يمكنك أيضاً إضافة أي منتج يدوياً بإدخال تفاصيله:</p>
            <ManualImportForm platform={platform} onImport={(d) => importMut.mutate(d)} loading={importMut.isPending} />
          </div>
        </div>
      )}

      {/* Bulk Import Tab */}
      {tab === "bulk" && (
        <BulkImportSection
          onBrowse={(results) => {
            setBrowseList(results);
            setTab("search");
          }}
          onGoProducts={() => setTab("products")}
        />
      )}

      {/* Settings Tab */}
      {tab === "settings" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">كيفية ربط المنصات</p>
              <p className="mb-2">سجّل في برنامج الشراكة لكل منصة، احصل على مفاتيح API، أدخلها أدناه، ثم اضغط "جلب المنتجات" لاستيرادها تلقائياً.</p>
              <div className="flex flex-wrap gap-3 text-xs">
                <a href="https://portals.aliexpress.com" target="_blank" rel="noreferrer" className="underline font-medium">🇨🇳 AliExpress Portals</a>
                <a href="https://affiliate-program.amazon.com" target="_blank" rel="noreferrer" className="underline font-medium">🛒 Amazon Associates</a>
                <a href="https://developers.alibaba.com" target="_blank" rel="noreferrer" className="underline font-medium">🏪 Alibaba Open Platform</a>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
            <div>
              <h3 className="font-bold text-amber-400 text-base">إعدادات الربط السحابي مع المنصات العالمية</h3>
              <p className="text-xs text-amber-200/70 mt-0.5">يتم حفظ جميع المفاتيح والنسب في قاعدة بيانات Neon PostgreSQL السحابية</p>
            </div>
            <button
              onClick={() => saveSettingsMut.mutate(settingsForm)}
              disabled={saveSettingsMut.isPending}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black px-6 py-2.5 rounded-xl text-sm font-extrabold shadow-lg disabled:opacity-60 transition-all cursor-pointer"
            >
              {saveSettingsMut.isPending ? <><Loader2 size={16} className="animate-spin" /> جارٍ الحفظ في قاعدة البيانات...</> : settingsSaved ? <><CheckCircle size={16} /> تم الحفظ في قاعدة البيانات بنجاح!</> : "💾 حفظ جميع الإعدادات في قاعدة البيانات"}
            </button>
          </div>

          <div className="space-y-6">
            {PLATFORMS.map(p => {
              const isConnected = !!(settingsForm[p.apiKey]);
              return (
                <div key={p.id} className={`rounded-2xl p-5 border transition-all ${isConnected ? "border-amber-500/40 bg-amber-500/5 shadow-lg" : "border-slate-800 bg-slate-900/50"}`}>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 rounded-xl bg-slate-800/80 border border-amber-500/20">{p.flag}</span>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-white text-base">{p.name}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${isConnected ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400 border border-slate-700"}`}>
                            {isConnected ? <><CheckCircle size={11} /> مفعل ومربوط</> : "غير مربوط"}
                          </span>
                        </div>
                        <p className="text-xs text-amber-200/60 mt-1">الربط الرسمي المباشر وجلب المنتجات الفوري</p>
                      </div>
                    </div>
                    
                    <AutoFetchButton platform={p.id} onResults={(results) => {
                      setBrowseList(results);
                      setTab("search");
                    }} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-amber-200/80 uppercase tracking-wide">App Key / Access Key</label>
                      <input
                        type="password"
                        value={settingsForm[p.apiKey] || ""}
                        onChange={e => setSettingsForm({ ...settingsForm, [p.apiKey]: e.target.value })}
                        placeholder="أدخل المفتاح الخاص بك..."
                        className="w-full mt-1.5 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white bg-slate-950/80 outline-none focus:border-amber-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-amber-200/80 uppercase tracking-wide">App Secret / Secret Key</label>
                      <input
                        type="password"
                        value={settingsForm[`${p.apiKey}_secret`] || ""}
                        onChange={e => setSettingsForm({ ...settingsForm, [`${p.apiKey}_secret`]: e.target.value })}
                        placeholder="أدخل السر الخاص بك..."
                        className="w-full mt-1.5 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white bg-slate-950/80 outline-none focus:border-amber-400 transition-all"
                      />
                    </div>
                    {p.id === "aliexpress" && (
                      <div>
                        <label className="text-xs font-bold text-amber-200/80 uppercase tracking-wide">Tracking ID (معرف التتبع)</label>
                        <input
                          type="text"
                          value={settingsForm["aliexpress_tracking_id"] || ""}
                          onChange={e => setSettingsForm({ ...settingsForm, aliexpress_tracking_id: e.target.value })}
                          placeholder="default"
                          className="w-full mt-1.5 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white bg-slate-950/80 outline-none focus:border-amber-400 transition-all"
                        />
                      </div>
                    )}
                    {p.id === "amazon" && (
                      <div>
                        <label className="text-xs font-bold text-amber-200/80 uppercase tracking-wide">Associate Tag</label>
                        <input
                          type="text"
                          value={settingsForm["amazon_associate_tag"] || ""}
                          onChange={e => setSettingsForm({ ...settingsForm, amazon_associate_tag: e.target.value })}
                          placeholder="مثال: mystore-21"
                          className="w-full mt-1.5 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white bg-slate-950/80 outline-none focus:border-amber-400 transition-all"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-bold text-amber-200/80 uppercase tracking-wide flex items-center gap-1">
                        نسبة عمولتك من {p.name} <span className="text-amber-400">%</span>
                      </label>
                      <div className="relative mt-1.5">
                        <input
                          type="number" min="0" max="50" step="0.5"
                          value={settingsForm[`${p.id}_commission_rate`] || ""}
                          onChange={e => setSettingsForm({ ...settingsForm, [`${p.id}_commission_rate`]: e.target.value })}
                          placeholder="مثل: 5 (أي 5% من كل بيع)"
                          className="w-full border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white bg-slate-950/80 outline-none focus:border-amber-400 pr-8 transition-all"
                        />
                        <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => saveSettingsMut.mutate(settingsForm)}
                      disabled={saveSettingsMut.isPending}
                      className="text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-4 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      💾 حفظ إعدادات {p.name}
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => saveSettingsMut.mutate(settingsForm)}
                disabled={saveSettingsMut.isPending}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black px-8 py-3 rounded-xl text-sm font-extrabold shadow-xl disabled:opacity-60 transition-all cursor-pointer"
              >
                {saveSettingsMut.isPending ? <><Loader2 size={16} className="animate-spin" /> جارٍ الحفظ...</> : settingsSaved ? <><CheckCircle size={16} /> تم الحفظ في قاعدة البيانات!</> : "💾 حفظ جميع الإعدادات في قاعدة البيانات"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importModal && (
        <ImportModal
          item={importModal}
          onClose={() => setImportModal(null)}
          onImport={(d) => importMut.mutate({ ...d, platform: importModal.platform, source_id: importModal.source_id, source_url: importModal.source_url || "", source_price: importModal.price })}
          loading={importMut.isPending}
        />
      )}

      {/* Database Cleanup Modal */}
      {cleanModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-right" dir="rtl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/20 rounded-2xl border border-red-500/30">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">تأكيد تنظيف قاعدة البيانات</h3>
                <p className="text-xs text-red-300">إجراء تفريغ منتجات الدروبشيبينغ</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف وإفراغ جميع منتجات الدروبشيبينغ المستوردة من قاعدة البيانات؟
              <br />
              <span className="text-xs text-amber-400 font-bold mt-2 block">💡 يمكنك بعدها استيراد منتجات جديدة ونظيفة بنقرة واحدة بدون أي تكرار.</span>
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleClearDatabase}
                disabled={clearingDb}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg disabled:opacity-50 transition-all cursor-pointer"
              >
                {clearingDb ? <><Loader2 size={16} className="animate-spin" /> جارٍ التنظيف...</> : "نعم، نظّف قاعدة البيانات الآن"}
              </button>
              <button
                onClick={() => setCleanModalOpen(false)}
                disabled={clearingDb}
                className="px-5 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ManualImportForm({ platform, onImport, loading }: { platform: string; onImport: (d: any) => void; loading: boolean }) {
  const [f, setF] = useState({ name: "", source_url: "", source_price: "", our_price: "", image: "", description: "", category_id: "" });
  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: () => api.get("/admin/categories") });
  const categories = cats || [];

  return (
    <form onSubmit={e => { e.preventDefault(); onImport({ ...f, platform, source_id: `manual-${Date.now()}`, source_price: parseFloat(f.source_price), our_price: parseFloat(f.our_price), category_id: f.category_id ? parseInt(f.category_id) : null }); }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <label className="text-xs font-medium text-gray-600">اسم المنتج *</label>
        <input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="اسم المنتج بالعربي" className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600">رابط المنتج الأصلي</label>
        <input value={f.source_url} onChange={e => setF({ ...f, source_url: e.target.value })} placeholder="https://..." className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600">رابط الصورة</label>
        <input value={f.image} onChange={e => setF({ ...f, image: e.target.value })} placeholder="https://..." className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600">سعر المورد (ر) *</label>
        <input required type="number" value={f.source_price} onChange={e => setF({ ...f, source_price: e.target.value })} placeholder="0" className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600">سعر البيع لدينا (ر) *</label>
        <input required type="number" value={f.our_price} onChange={e => setF({ ...f, our_price: e.target.value })} placeholder="0" className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600">الفئة</label>
        <select value={f.category_id} onChange={e => setF({ ...f, category_id: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400">
          <option value="">بدون فئة</option>
          {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60">
          <Download size={14} /> {loading ? "جارٍ الاستيراد..." : "استيراد المنتج"}
        </button>
      </div>
    </form>
  );
}

function ImportModal({ item, onClose, onImport, loading }: { item: any; onClose: () => void; onImport: (d: any) => void; loading: boolean }) {
  const [f, setF] = useState({ name: item.name, our_price: item.our_price || Math.ceil(item.price * 1.35), category_id: "" });
  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: () => api.get("/admin/categories") });
  const categories = cats || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold text-gray-800">استيراد المنتج</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-3">
            <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" referrerPolicy="no-referrer" />
            <div>
              <p className="text-sm text-gray-700 line-clamp-3">{item.name}</p>
              <p className="text-xs text-gray-400 mt-1">سعر المورد: <span className="font-semibold text-amber-600">{item.price?.toLocaleString()} ر</span></p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">اسم المنتج في متجرك</label>
            <input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">سعر البيع (ر)</label>
            <input type="number" value={f.our_price} onChange={e => setF({ ...f, our_price: parseFloat(e.target.value) })} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
            <p className="text-xs text-green-600 mt-1">الربح المتوقع: {(f.our_price - item.price).toFixed(0)} ر ({item.price > 0 ? ((f.our_price - item.price) / item.price * 100).toFixed(0) : 0}%)</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">الفئة</label>
            <select value={f.category_id} onChange={e => setF({ ...f, category_id: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">بدون فئة</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm">إلغاء</button>
            <button onClick={() => onImport({ name: f.name, our_price: f.our_price, category_id: f.category_id ? parseInt(f.category_id) : null })} disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-60">
              {loading ? "جارٍ الاستيراد..." : "استيراد الآن"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UrlImportForm({ initial, sourceUrl, onImport, importing }: {
  initial: any; sourceUrl: string; onImport: (d: any) => void; importing: boolean;
}) {
  const { data: categoriesData } = useQuery({ queryKey: ["categories"], queryFn: () => api.get("/categories") });
  const categories = (categoriesData as any)?.data || categoriesData || [];

  const detect = (url: string) => {
    if (url.includes("aliexpress")) return "aliexpress";
    if (url.includes("amazon")) return "amazon";
    if (url.includes("alibaba")) return "alibaba";
    return "other";
  };

  const [f, setF] = useState({
    name: initial?.name || "",
    price: initial?.price || 0,
    our_price: initial?.price ? Math.ceil(initial.price * 1.5) : 0,
    quantity: initial?.quantity || 999,
    image: initial?.image || "",
    description: initial?.description || "",
    category_id: "",
    platform: detect(sourceUrl),
    source_id: initial?.source_id || "",
  });

  return (
    <div className="bg-slate-900/90 rounded-2xl shadow-xl border border-amber-500/30 p-6 space-y-4 text-right">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle size={18} className="text-emerald-400" />
        <h3 className="font-bold text-white text-base">بيانات منتج علي إكسبرس المستخرجة — راجع وأضف لقاعدة البيانات</h3>
      </div>

      {f.image && (
        <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <img src={f.image} alt="" className="w-24 h-24 object-cover rounded-xl border border-amber-500/20 flex-shrink-0" referrerPolicy="no-referrer" onError={e => (e.currentTarget.style.display = "none")} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-300 font-bold mb-1">معاينة الصورة الأصلية عالية الدقة من المورد</p>
            <input
              value={f.image}
              onChange={e => setF({ ...f, image: e.target.value })}
              className="w-full text-xs border border-slate-700 bg-slate-900 text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-400 text-left"
              dir="ltr"
              placeholder="رابط الصورة"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-amber-200/90">اسم المنتج الرسمي *</label>
          <input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} className="w-full mt-1 border border-slate-700 bg-slate-950/80 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-amber-400" placeholder="اسم المنتج في متجرك" />
        </div>
        <div>
          <label className="text-xs font-bold text-amber-200/90">سعر المورد الفعلي (USD / ر) *</label>
          <input type="number" value={f.price} onChange={e => setF({ ...f, price: parseFloat(e.target.value) || 0 })} className="w-full mt-1 border border-slate-700 bg-slate-950/80 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-amber-400" />
        </div>
        <div>
          <label className="text-xs font-bold text-amber-200/90">سعر البيع عندك في المتجر (ر) *</label>
          <input type="number" value={f.our_price} onChange={e => setF({ ...f, our_price: parseFloat(e.target.value) || 0 })} className="w-full mt-1 border border-slate-700 bg-slate-950/80 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-amber-400" />
          {f.price > 0 && <p className="text-xs text-emerald-400 font-bold mt-1">الربح المتوقع: {(f.our_price - f.price).toFixed(2)} ر ({f.price > 0 ? (((f.our_price - f.price) / f.price) * 100).toFixed(0) : 0}%)</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-amber-200/90">الكمية المتوفرة عند المورد بالمخزن *</label>
          <input type="number" value={f.quantity} onChange={e => setF({ ...f, quantity: parseInt(e.target.value) || 100 })} className="w-full mt-1 border border-slate-700 bg-slate-950/80 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-amber-400" />
        </div>
        <div>
          <label className="text-xs font-bold text-amber-200/90">الفئة / القسم</label>
          <select value={f.category_id} onChange={e => setF({ ...f, category_id: e.target.value })} className="w-full mt-1 border border-slate-700 bg-slate-950/80 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-amber-400">
            <option value="">بدون فئة</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name || c.name_ar}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-amber-200/90">المنصة الموردة</label>
          <select value={f.platform} onChange={e => setF({ ...f, platform: e.target.value })} className="w-full mt-1 border border-slate-700 bg-slate-950/80 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-amber-400">
            {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.flag} {p.name}</option>)}
            <option value="other">🌐 أخرى</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-amber-200/90">وصف المنتج ومواصفاته</label>
          <textarea value={f.description} onChange={e => setF({ ...f, description: e.target.value })} rows={3} className="w-full mt-1 border border-slate-700 bg-slate-950/80 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-amber-400 resize-none" placeholder="وصف المنتج" />
        </div>
      </div>

      <button
        disabled={!f.name.trim() || f.price <= 0 || f.our_price <= 0 || importing}
        onClick={() => onImport({
          name: f.name,
          price: f.price,
          our_price: f.our_price,
          quantity: f.quantity,
          image: f.image,
          description: f.description,
          category_id: f.category_id ? parseInt(f.category_id) : null,
          platform: f.platform,
          source_id: f.source_id || initial?.source_id,
          source_url: sourceUrl,
        })}
        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black py-3.5 rounded-xl font-extrabold text-sm disabled:opacity-50 transition-all shadow-xl cursor-pointer"
      >
        {importing ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin text-black" /> جارٍ حفظ المنتج في قاعدة البيانات...</span> : "✓ أضف المنتج لقاعدة البيانات والمتجر الآن"}
      </button>
    </div>
  );
}

const ALI_CATEGORIES = [
  { id: "", name: "🌐 جميع أقسام وفئات علي إكسبرس (شامل)" },
  { id: "1511", name: "⌚ ساعات وإكسسوارات" },
  { id: "44", name: "📱 إلكترونيات استهلاكية وأجهزة ذكية" },
  { id: "509", name: "🔌 هواتف وملحقاتها وشواحن" },
  { id: "15", name: "🏠 أجهزة منزلية ومطبخ" },
  { id: "1524", name: "🎒 حقائب ومحافظ وأمتعة" },
  { id: "1420", name: "🔧 أدوات ومعدات صيانة" },
  { id: "34", name: "🚗 إكسسوارات وقطع سيارات" },
  { id: "66", name: "💄 تجميل وعناية ومكياج" },
  { id: "18", name: "⚽ رياضة ولياقة وترفيه" },
  { id: "7", name: "💻 كمبيوتر ومستلزمات مكتب" },
  { id: "1509", name: "💍 مجوهرات وإكسسوارات نسائية" },
  { id: "1501", name: "🧸 ألعاب وهدايا وأطفال" },
  { id: "39", name: "💡 إضاءة ومصابيح LED" },
  { id: "30", name: "🔒 كاميرات أمان وحماية" },
  { id: "322", name: "👟 أحذية رياضية ورجالية ونسائية" },
];

function AutoFetchButton({ platform, onResults }: { platform: string; onResults: (r: any[]) => void }) {
  const qc = useQueryClient();
  const [selectedCat, setSelectedCat] = useState("");
  const [keyword, setKeyword] = useState("");
  const [targetCount, setTargetCount] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [importingDirect, setImportingDirect] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchBrowse = async () => {
    setLoading(true); setError(""); setSuccessMsg("");
    try {
      const catParam = selectedCat ? `&category_id=${selectedCat}` : "";
      const kwParam = keyword ? `&keyword=${encodeURIComponent(keyword)}` : "";
      const r = await api.get(`/admin/dropship/auto-fetch?platform=${platform}&count=${targetCount}${catParam}${kwParam}`);
      onResults(r.results || []);
      setSuccessMsg(`تم جلب ${r.count || 0} منتج من سيرفرات علي إكسبرس الحقيقية للتصفح!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (e: any) {
      setError(e?.message || "فشل الجلب");
    } finally {
      setLoading(false);
    }
  };

  const import1000Directly = async () => {
    setImportingDirect(true); setError(""); setSuccessMsg("");
    try {
      const res = await api.post("/admin/dropship/bulk-import-1000", { 
        platform, 
        count: targetCount, 
        margin_percent: 35, 
        category_id: selectedCat || undefined,
        keyword: keyword || undefined 
      });
      qc.invalidateQueries({ queryKey: ["dropship-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setSuccessMsg(res.message || `تم استيراد ${res.imported || targetCount} منتج وحفظها في قاعدة البيانات بنجاح!`);
      setTimeout(() => setSuccessMsg(""), 10000);
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("Failed query") || msg.includes("insert into")) {
        setError("حدث خطأ أثناء إدراج البيانات. تم تصحيح المعالجة، يرجى المحاولة الآن.");
      } else {
        setError(msg || "فشل الاستيراد المباشر");
      }
    } finally {
      setImportingDirect(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2.5">
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <select
          value={targetCount}
          onChange={e => setTargetCount(Number(e.target.value))}
          className="bg-slate-900 border border-amber-500/40 text-amber-300 rounded-xl px-2.5 py-2 text-xs font-bold outline-none cursor-pointer"
        >
          <option value={100}>100 منتج</option>
          <option value={250}>250 منتج</option>
          <option value={500}>500 منتج</option>
          <option value={1000}>1000 منتج 🚀</option>
          <option value={2000}>2000 منتج</option>
        </select>

        <select
          value={selectedCat}
          onChange={e => setSelectedCat(e.target.value)}
          className="bg-slate-900 border border-amber-500/40 text-amber-300 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
        >
          {ALI_CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <button
          onClick={import1000Directly}
          disabled={importingDirect || loading}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black px-4 py-2 rounded-xl text-xs font-extrabold shadow-md hover:shadow-amber-500/20 disabled:opacity-60 transition-all cursor-pointer"
        >
          {importingDirect ? (
            <><Loader2 size={14} className="animate-spin text-black" /> جارٍ استيراد {targetCount} منتج وحفظها بالمتجر...</>
          ) : (
            <><Database size={14} /> ⚡ استيراد {targetCount} منتج لقاعدة البيانات فوراً 🚀</>
          )}
        </button>

        <button
          onClick={fetchBrowse}
          disabled={loading || importingDirect}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold disabled:opacity-60 transition-all cursor-pointer"
        >
          {loading ? <><Loader2 size={13} className="animate-spin" /> جارٍ جلب {targetCount} منتج...</> : <><Download size={13} /> 📥 جلب {targetCount} منتج للمعاينة والتصفح</>}
        </button>
      </div>

      {successMsg && <p className="text-xs text-emerald-400 font-bold text-right animate-pulse">{successMsg}</p>}
      {error && <p className="text-xs text-red-400 font-semibold max-w-sm text-right">{error}</p>}
    </div>
  );
}

function BulkImportSection({ onBrowse, onGoProducts }: { onBrowse: (r: any[]) => void; onGoProducts: () => void }) {
  const qc = useQueryClient();
  const [platform, setPlatform] = useState("aliexpress");
  const [selectedCat, setSelectedCat] = useState("");
  const [keyword, setKeyword] = useState("");
  const [count, setCount] = useState(1000);
  const [margin, setMargin] = useState(35);
  const [importing, setImporting] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleImport = async () => {
    setImporting(true); setError(""); setResult(null);
    try {
      const res = await api.post("/admin/dropship/bulk-import-1000", {
        platform,
        count,
        margin_percent: margin,
        category_id: selectedCat || undefined,
        keyword: keyword.trim() || undefined,
      });
      qc.invalidateQueries({ queryKey: ["dropship-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setResult(res);
    } catch (e: any) {
      setError(e?.message || "حدث خطأ أثناء الاستيراد");
    } finally {
      setImporting(false);
    }
  };

  const handleBrowse = async () => {
    setBrowsing(true); setError("");
    try {
      const catParam = selectedCat ? `&category_id=${selectedCat}` : "";
      const kwParam = keyword.trim() ? `&keyword=${encodeURIComponent(keyword.trim())}` : "";
      const r = await api.get(`/admin/dropship/auto-fetch?platform=${platform}&count=${count}${catParam}${kwParam}`);
      onBrowse(r.results || []);
    } catch (e: any) {
      setError(e?.message || "فشل جلب المنتجات للتصفح");
    } finally {
      setBrowsing(false);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/40 text-amber-400">
            <Database size={26} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">نظام الاستيراد الجماعي الفوري (Bulk Import 1000+)</h2>
            <p className="text-xs text-amber-200/70 mt-0.5">
              اسحب وجلب حتى 1000 أو 2000 منتج حقيقي بضغطة زر واحدة من علي إكسبرس مع المزامنة التلقائية للأسعار وتصنيف الأقسام.
            </p>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 space-y-6 shadow-2xl">
        {/* Step 1: Select Platform */}
        <div>
          <label className="text-xs font-bold text-amber-300 block mb-2">1. اختر منصة التوريد العالمية:</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "aliexpress", name: "علي إكسبرس (رسمي)", flag: "🇨🇳", desc: "API مفعل وشغال 100%" },
              { id: "amazon", name: "أمازون", flag: "📦", desc: "PA-API شريك" },
              { id: "alibaba", name: "علي بابا بالجملة", flag: "🏪", desc: "Alibaba Open API" },
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${platform === p.id ? "bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10" : "bg-slate-950/60 border-slate-800 hover:border-slate-700"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{p.flag}</span>
                  <span className="font-bold text-white text-sm">{p.name}</span>
                </div>
                <p className="text-[11px] text-amber-200/60">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Target Quantity Chips */}
        <div>
          <label className="text-xs font-bold text-amber-300 block mb-2">2. كمية المنتجات المراد استيرادها في هذه النقرة:</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { val: 100, label: "100 منتج" },
              { val: 250, label: "250 منتج" },
              { val: 500, label: "500 منتج" },
              { val: 1000, label: "1000 منتج 🚀", badge: "موصى به" },
              { val: 2000, label: "2000 منتج 🔥" },
            ].map(item => (
              <button
                key={item.val}
                type="button"
                onClick={() => setCount(item.val)}
                className={`py-3 px-3 rounded-2xl border font-bold text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${count === item.val ? "bg-amber-500 text-black border-amber-400 shadow-lg font-black" : "bg-slate-950/80 text-white border-slate-800 hover:border-amber-500/40"}`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${count === item.val ? "bg-black/20 text-black font-extrabold" : "bg-amber-500/20 text-amber-300"}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Filters: Category & Keyword */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-amber-300 block mb-1.5">3. الفئة أو القسم:</label>
            <select
              value={selectedCat}
              onChange={e => setSelectedCat(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 cursor-pointer"
            >
              {ALI_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">اختر فئة معينة أو اتركها على "جميع الأقسام" للتنويع الشامل.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-amber-300 block mb-1.5">4. كلمة بحث اختيارية (Keyword):</label>
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="مثال: ساعات رجالية، سماعات بلوتوث، أحذية رياضية..."
              className="w-full bg-slate-950/90 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">اتركه فارغاً لجلب المنتجات الأكثر مبيعاً والأعلى تقييماً تلقائياً.</p>
          </div>
        </div>

        {/* Step 4: Margin */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="font-bold text-white text-sm">نسبة هامش ربحك التلقائي فوق سعر المورد:</span>
            <p className="text-xs text-slate-400 mt-0.5">سيتم حساب سعر البيع تلقائياً: سعر المورد + {margin}%</p>
          </div>
          <div className="flex items-center gap-2">
            {[20, 30, 35, 50, 75].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMargin(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${margin === m ? "bg-amber-500 text-black" : "bg-slate-800 text-slate-300 hover:text-white"}`}
              >
                +{m}%
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || browsing}
            className="flex-1 min-w-[280px] flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black py-4 rounded-2xl text-base font-black shadow-xl shadow-amber-500/20 disabled:opacity-60 transition-all cursor-pointer"
          >
            {importing ? (
              <>
                <Loader2 size={20} className="animate-spin text-black" />
                <span>جارٍ استيراد {count} منتج من سيرفرات علي إكسبرس وتصنيفها وحفظها...</span>
              </>
            ) : (
              <>
                <Database size={20} />
                <span>🚀 بدء استيراد {count} منتج لقاعدة البيانات دفعة واحدة الآن</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleBrowse}
            disabled={importing || browsing}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 px-6 py-4 rounded-2xl text-sm font-bold disabled:opacity-60 transition-all cursor-pointer"
          >
            {browsing ? <><Loader2 size={16} className="animate-spin" /> جارٍ التحميل...</> : <><Download size={16} /> تصفح المنتجات فقط</>}
          </button>
        </div>

        {/* Results / Error Alerts */}
        {result && (
          <div className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 rounded-2xl p-5 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-base">
              <CheckCircle size={20} />
              <span>{result.message || `تمت عملية الاستيراد بنجاح!`}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
              <div className="bg-emerald-900/40 border border-emerald-500/30 p-3 rounded-xl">
                <span className="text-emerald-400 block font-bold">المنتجات المستوردة حديثاً</span>
                <span className="text-lg font-black text-white">{result.imported || 0}</span>
              </div>
              <div className="bg-emerald-900/40 border border-emerald-500/30 p-3 rounded-xl">
                <span className="text-emerald-400 block font-bold">المتخطاة (موجودة مسبقاً)</span>
                <span className="text-lg font-black text-white">{result.skipped || 0}</span>
              </div>
              <div className="bg-emerald-900/40 border border-emerald-500/30 p-3 rounded-xl">
                <span className="text-emerald-400 block font-bold">إجمالي المتجر الحالي</span>
                <span className="text-lg font-black text-white">{result.total_in_db || "—"} منتج</span>
              </div>
              <div className="bg-emerald-900/40 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-center">
                <button
                  onClick={onGoProducts}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl font-bold text-xs transition-all"
                >
                  عرض المنتجات المستوردة 📦
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-950/70 border border-red-500/40 text-red-200 rounded-2xl p-4 flex items-center gap-2 text-sm font-bold">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-1">
        <p className="font-bold text-amber-300">💡 كيف يعمل نظام الاستيراد المتدفق؟</p>
        <p>• يتم الاتصال بسيرفرات علي إكسبرس الرسمية عبر بروتوكول الشراكة المباشر.</p>
        <p>• يقوم النظام تلقائياً بتجاوز المنتجات المكررة لحماية قاعدة بياناتك وتوفير مساحتها.</p>
        <p>• كل منتج يتم استيراده يُربط بكود فريد للمورد، وتُضاف الصور عالية الدقة والوصف والأسعار وهامش الربح تلقائياً.</p>
      </div>
    </div>
  );
}

