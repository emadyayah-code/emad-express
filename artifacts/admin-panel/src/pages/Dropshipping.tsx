import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search, Globe, Settings, Package, ExternalLink, Download, X, AlertCircle, CheckCircle, Link2, Loader2, Play, Pause, RotateCcw, BarChart3, TrendingUp, Database } from "lucide-react";

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
  const [importModal, setImportModal] = useState<any>(null);
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlFetching, setUrlFetching] = useState(false);
  const [urlResult, setUrlResult] = useState<any>(null);
  const [urlError, setUrlError] = useState("");

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
    enabled: tab === "settings",
    onSuccess: (d: any) => setSettingsForm(d || {}),
  } as any);

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

  const dpList = dropProducts?.data || [];
  const searchList = searchResults?.results || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">نظام الدروبشيبينغ</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Globe size={16} />
          <span>استيراد منتجات من المنصات العالمية</span>
        </div>
      </div>

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
                          {dp.product?.image && <img src={dp.product.image} alt="" className="w-10 h-10 object-cover rounded-lg" />}
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

      {/* URL Import Tab */}
      {tab === "url" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-2">
              <Link2 size={18} className="text-amber-500" />
              <h3 className="font-semibold text-gray-800">استيراد منتج برابط مباشر</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              الصق رابط أي منتج من علي إكسبرس، أمازون، أو أي متجر، وسنستخرج بياناته تلقائياً
            </p>
            <div className="flex gap-3 flex-col sm:flex-row">
              <input
                type="url"
                value={urlInput}
                onChange={e => { setUrlInput(e.target.value); setUrlResult(null); setUrlError(""); }}
                placeholder="https://www.aliexpress.com/item/... أو https://www.amazon.com/dp/..."
                className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-400 text-left"
                dir="ltr"
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
                    setUrlError(e?.message || "فشل استيراد المنتج من الرابط");
                  } finally {
                    setUrlFetching(false);
                  }
                }}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap transition-colors"
              >
                {urlFetching ? <><Loader2 size={15} className="animate-spin" /> جارٍ الاستيراد...</> : <><Download size={15} /> استيراد</>}
              </button>
            </div>

            {urlError && (
              <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">{urlError}</p>
                  <p className="text-xs text-red-500 mt-1">يمكنك إدخال البيانات يدوياً أدناه</p>
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
            <h3 className="font-semibold text-gray-800 mb-4">استيراد منتج من منصة خارجية</h3>
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

          {/* Search Results */}
          {searchList.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchList.map((item: any) => (
                <div key={item.source_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <img src={item.image} alt={item.name} className="w-full h-44 object-cover" />
                  <div className="p-4">
                    <p className="font-medium text-gray-800 text-sm line-clamp-2">{item.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <p className="text-xs text-gray-400">سعر المورد</p>
                        <p className="font-bold text-amber-600">{item.price.toLocaleString()} ر</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">سعر مقترح</p>
                        <p className="font-bold text-green-600">{(item.price * 1.35).toFixed(0)} ر</p>
                      </div>
                    </div>
                    {item.rating && (
                      <p className="text-xs text-gray-400 mt-1">⭐ {item.rating} · {item.orders_count?.toLocaleString()} طلب</p>
                    )}
                    <button
                      onClick={() => setImportModal({ ...item, platform, our_price: Math.ceil(item.price * 1.35) })}
                      className="w-full mt-3 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-sm font-medium"
                    >
                      <Download size={14} /> استيراد للمتجر
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Manual Import */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h4 className="font-semibold text-blue-800 mb-1 flex items-center gap-2"><AlertCircle size={16} /> استيراد يدوي</h4>
            <p className="text-sm text-blue-700 mb-3">يمكنك أيضاً إضافة أي منتج يدوياً بإدخال تفاصيله:</p>
            <ManualImportForm platform={platform} onImport={(d) => importMut.mutate(d)} loading={importMut.isPending} />
          </div>
        </div>
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-6">
            {PLATFORMS.map(p => {
              const isConnected = !!(settingsForm[p.apiKey]);
              return (
                <div key={p.id} className={`rounded-xl p-4 border ${isConnected ? "border-green-200 bg-green-50/30" : "border-gray-100"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{p.flag}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{p.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${isConnected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {isConnected ? <><CheckCircle size={10} /> مربوط</> : "غير مربوط"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">عمولة المنصة = سعر التكلفة × نسبة العمولة</p>
                      </div>
                    </div>
                    {isConnected && (
                      <AutoFetchButton platform={p.id} onResults={(results) => {
                        setTab("search");
                        // store results temporarily
                        (window as any).__autoFetchResults = { platform: p.id, results };
                      }} />
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">App Key / Access Key</label>
                      <input
                        type="password"
                        value={settingsForm[p.apiKey] || ""}
                        onChange={e => setSettingsForm({ ...settingsForm, [p.apiKey]: e.target.value })}
                        placeholder="أدخل المفتاح..."
                        className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">App Secret / Secret Key</label>
                      <input
                        type="password"
                        value={settingsForm[`${p.apiKey}_secret`] || ""}
                        onChange={e => setSettingsForm({ ...settingsForm, [`${p.apiKey}_secret`]: e.target.value })}
                        placeholder="أدخل السر..."
                        className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    {p.id === "aliexpress" && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tracking ID</label>
                        <input type="text" value={settingsForm["aliexpress_tracking_id"] || ""} onChange={e => setSettingsForm({ ...settingsForm, aliexpress_tracking_id: e.target.value })} placeholder="معرّف التتبع (اختياري)" className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
                      </div>
                    )}
                    {p.id === "amazon" && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Associate Tag</label>
                        <input type="text" value={settingsForm["amazon_associate_tag"] || ""} onChange={e => setSettingsForm({ ...settingsForm, amazon_associate_tag: e.target.value })} placeholder="مثل: mystore-21" className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        نسبة عمولتك من {p.name} <span className="text-amber-500">%</span>
                      </label>
                      <div className="relative mt-1">
                        <input
                          type="number" min="0" max="50" step="0.5"
                          value={settingsForm[`${p.id}_commission_rate`] || ""}
                          onChange={e => setSettingsForm({ ...settingsForm, [`${p.id}_commission_rate`]: e.target.value })}
                          placeholder="مثل: 5 (أي 5% من كل بيع)"
                          className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 pr-8"
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">%</span>
                      </div>
                      <p className="text-xs text-amber-600 mt-1">النسبة التي تدفعها لك المنصة كعمولة إحالة</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => saveSettingsMut.mutate(settingsForm)}
              disabled={saveSettingsMut.isPending}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {saveSettingsMut.isPending ? "جارٍ الحفظ..." : settingsSaved ? <><CheckCircle size={15} /> تم الحفظ!</> : "حفظ جميع الإعدادات"}
            </button>
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
            <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
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
    image: initial?.image || "",
    description: initial?.description || "",
    category_id: "",
    platform: detect(sourceUrl),
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle size={16} className="text-green-500" />
        <h3 className="font-semibold text-gray-800">بيانات المنتج — راجع وأكمل قبل الاستيراد</h3>
      </div>

      {f.image && (
        <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
          <img src={f.image} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0" onError={e => (e.currentTarget.style.display = "none")} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-1">معاينة الصورة المُستخرجة</p>
            <input
              value={f.image}
              onChange={e => setF({ ...f, image: e.target.value })}
              className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none text-left"
              dir="ltr"
              placeholder="رابط الصورة"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-gray-700">اسم المنتج *</label>
          <input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400" placeholder="اسم المنتج في متجرك" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">سعر المورد (ر) *</label>
          <input type="number" value={f.price} onChange={e => setF({ ...f, price: parseFloat(e.target.value) || 0 })} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">سعر البيع عندك (ر) *</label>
          <input type="number" value={f.our_price} onChange={e => setF({ ...f, our_price: parseFloat(e.target.value) || 0 })} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
          {f.price > 0 && <p className="text-xs text-green-600 mt-1">ربح: {(f.our_price - f.price).toFixed(0)} ر ({f.price > 0 ? ((f.our_price - f.price) / f.price * 100).toFixed(0) : 0}%)</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">الفئة</label>
          <select value={f.category_id} onChange={e => setF({ ...f, category_id: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400">
            <option value="">بدون فئة</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">المنصة</label>
          <select value={f.platform} onChange={e => setF({ ...f, platform: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400">
            {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.flag} {p.name}</option>)}
            <option value="other">🌐 أخرى</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-gray-700">وصف المنتج</label>
          <textarea value={f.description} onChange={e => setF({ ...f, description: e.target.value })} rows={3} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 resize-none" placeholder="وصف قصير للمنتج" />
        </div>
      </div>

      <button
        disabled={!f.name.trim() || f.price <= 0 || f.our_price <= 0 || importing}
        onClick={() => onImport({
          name: f.name,
          price: f.price,
          our_price: f.our_price,
          image: f.image,
          description: f.description,
          category_id: f.category_id ? parseInt(f.category_id) : null,
          platform: f.platform,
          source_url: sourceUrl,
        })}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors"
      >
        {importing ? <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" /> جارٍ الإضافة للمتجر...</span> : "✓ أضف المنتج للمتجر"}
      </button>
    </div>
  );
}

function AutoFetchButton({ platform, onResults }: { platform: string; onResults: (r: any[]) => void }) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [importingDirect, setImportingDirect] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchBrowse = async () => {
    setLoading(true); setError(""); setSuccessMsg("");
    try {
      const r = await api.get(`/admin/dropship/auto-fetch?platform=${platform}&count=1000`);
      onResults(r.results || []);
      setSuccessMsg("تم جلب 1000 منتج للتصفح!");
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
      const res = await api.post("/admin/dropship/bulk-import-1000", { platform, count: 1000, margin_percent: 35 });
      qc.invalidateQueries({ queryKey: ["dropship-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setSuccessMsg(res.message || "تم استيراد 1000 منتج وحفظهم في قاعدة البيانات بنجاح!");
      setTimeout(() => setSuccessMsg(""), 6000);
    } catch (e: any) {
      setError(e?.message || "فشل الاستيراد المباشر");
    } finally {
      setImportingDirect(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <button
          onClick={import1000Directly}
          disabled={importingDirect || loading}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black px-4 py-2 rounded-xl text-xs font-extrabold shadow-md hover:shadow-amber-500/20 disabled:opacity-60 transition-all cursor-pointer"
        >
          {importingDirect ? (
            <><Loader2 size={14} className="animate-spin text-black" /> جارٍ استيراد 1000 منتج لقاعدة البيانات...</>
          ) : (
            <><Database size={14} /> استيراد 1000 منتج لقاعدة البيانات فوراً 🚀</>
          )}
        </button>

        <button
          onClick={fetchBrowse}
          disabled={loading || importingDirect}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold disabled:opacity-60 transition-all cursor-pointer"
        >
          {loading ? <><Loader2 size={13} className="animate-spin" /> جارٍ التحميل...</> : <><Download size={13} /> تصفح 1000 منتج</>}
        </button>
      </div>

      {successMsg && <p className="text-xs text-emerald-400 font-bold text-right animate-pulse">{successMsg}</p>}
      {error && <p className="text-xs text-red-400 font-semibold max-w-sm text-right">{error}</p>}
    </div>
  );
}
