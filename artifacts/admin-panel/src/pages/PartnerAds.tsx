import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, Trash2, Edit2, X, Check, ExternalLink, Globe, TrendingUp, Smartphone, Save, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

const PLATFORMS = [
  { id: "google_admob", name: "إعلانات جوجل موبايل (Google AdMob)", icon: "📱", color: "#10b981", baseUrl: "https://admob.google.com/" },
  { id: "google_adsense", name: "إعلانات جوجل ويب (AdSense)", icon: "🌐", color: "#4285F4", baseUrl: "https://adsense.google.com/" },
  { id: "aliexpress", name: "علي إكسبرس", icon: "🇨🇳", color: "#FF4747", baseUrl: "https://s.click.aliexpress.com/" },
  { id: "amazon", name: "أمازون", icon: "📦", color: "#FF9900", baseUrl: "https://www.amazon.com/?tag=YOUR_TAG" },
  { id: "noon", name: "نون", icon: "🌙", color: "#FEEE00", baseUrl: "https://www.noon.com/" },
  { id: "jumia", name: "جوميا", icon: "🛒", color: "#F68C1E", baseUrl: "https://www.jumia.com/" },
  { id: "ebay", name: "إي باي", icon: "🔨", color: "#E53238", baseUrl: "https://www.ebay.com/" },
  { id: "shein", name: "شي إن", icon: "👗", color: "#000000", baseUrl: "https://www.shein.com/" },
  { id: "temu", name: "تيمو", icon: "🛍️", color: "#FB5C22", baseUrl: "https://www.temu.com/" },
  { id: "other", name: "أخرى", icon: "🌐", color: "#6b7280", baseUrl: "" },
];

const empty = { title: "", subtitle: "", url: "", badge: "", color: "#10b981", platform: "google_admob", is_active: true };

export default function PartnerAds() {
  const qc = useQueryClient();
  const [mainTab, setMainTab] = useState<"google_admob" | "banners">("google_admob");
  const [googleSaved, setGoogleSaved] = useState(false);

  // Partner Banners query & mutation
  const { data: items = [], isLoading } = useQuery<any[]>({ queryKey: ["partner-products"], queryFn: () => api.get("/admin/partner-products") });
  const saveMut = useMutation({
    mutationFn: (data: any[]) => api.post("/admin/partner-products", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partner-products"] }),
  });

  // Google AdMob & Platform Settings query & mutation
  const { data: settingsData } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: () => api.get("/admin/settings"),
  });

  const saveSettingsMut = useMutation({
    mutationFn: (data: any) => api.put("/admin/settings", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-settings"] });
      setGoogleSaved(true);
      setTimeout(() => setGoogleSaved(false), 3000);
    },
  });

  const settings = settingsData?.data?.data || [];
  const getValue = (key: string) => settings.find((s: any) => s.key === key)?.value || "";

  const [googleForm, setGoogleForm] = useState({
    google_ads_enabled: "true",
    google_ads_test_mode: "false",
    admob_app_id_android: "",
    admob_app_id_ios: "",
    admob_banner_unit_id: "",
    admob_interstitial_unit_id: "",
    admob_rewarded_unit_id: "",
    admob_native_unit_id: "",
    google_adsense_pub_id: "",
    google_adsense_slot_id: "",
  });

  useEffect(() => {
    if (settings && settings.length > 0) {
      setGoogleForm({
        google_ads_enabled: getValue("google_ads_enabled") || "true",
        google_ads_test_mode: getValue("google_ads_test_mode") || "false",
        admob_app_id_android: getValue("admob_app_id_android"),
        admob_app_id_ios: getValue("admob_app_id_ios"),
        admob_banner_unit_id: getValue("admob_banner_unit_id"),
        admob_interstitial_unit_id: getValue("admob_interstitial_unit_id"),
        admob_rewarded_unit_id: getValue("admob_rewarded_unit_id"),
        admob_native_unit_id: getValue("admob_native_unit_id"),
        google_adsense_pub_id: getValue("google_adsense_pub_id"),
        google_adsense_slot_id: getValue("google_adsense_slot_id"),
      });
    }
  }, [settings]);

  const handleSaveGoogle = () => {
    const updates = Object.entries(googleForm).map(([key, value]) => ({ key, value }));
    saveSettingsMut.mutate(updates);
  };

  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [addForm, setAddForm] = useState({ ...empty });
  const [showAdd, setShowAdd] = useState(false);

  function save(newItems: any[]) { saveMut.mutate(newItems); }

  function deleteItem(idx: number) {
    const n = [...items]; n.splice(idx, 1); save(n);
  }

  function addItem() {
    if (!addForm.title || !addForm.url) return;
    save([...items, { ...addForm, id: Date.now().toString() }]);
    setAddForm({ ...empty }); setShowAdd(false);
  }

  function updateItem(idx: number, upd: any) {
    const n = items.map((it, i) => i === idx ? { ...it, ...upd } : it);
    save(n); setEditIdx(null);
  }

  function toggleActive(idx: number) {
    const n = items.map((it, i) => i === idx ? { ...it, is_active: !it.is_active } : it);
    save(n);
  }

  const card = "bg-white rounded-xl shadow-sm border border-gray-100 p-5";

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp size={22} className="text-amber-500" /> إعلانات الشركاء وجوجل موبايل (ADV)
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">إدارة إعلانات Google AdMob للتطبيقات وروابط الأفيلييت من المواقع العالمية</p>
        </div>
        {mainTab === "banners" && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md cursor-pointer transition-all">
            <Plus size={16} /> إضافة إعلان شريك
          </button>
        )}
      </div>

      {/* Main Mode Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setMainTab("google_admob")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${mainTab === "google_admob" ? "bg-emerald-600 text-white shadow-md" : "text-gray-600 hover:text-gray-900"}`}
        >
          <Smartphone size={16} /> 📱 إعدادات إعلانات جوجل موبايل (Google AdMob / ADV)
        </button>
        <button
          onClick={() => setMainTab("banners")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${mainTab === "banners" ? "bg-amber-500 text-white shadow-md" : "text-gray-600 hover:text-gray-900"}`}
        >
          <Globe size={16} /> 🏷️ إعلانات وروابط الشركاء (Affiliate Banners)
        </button>
      </div>

      {/* Google Mobile Ads / AdMob Management */}
      {mainTab === "google_admob" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200">
                <Smartphone size={28} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">إعلانات جوجل موبايل والويب (Google Mobile Ads / AdMob / ADV)</h3>
                <p className="text-xs text-gray-500 mt-0.5">الربط الرسمي لإعلانات Google AdMob لتطبيقات Android و iOS وموقع الويب</p>
              </div>
            </div>
            <a
              href="https://admob.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <span>لوحة تحكم Google AdMob</span>
              <ExternalLink size={13} />
            </a>
          </div>

          {/* General Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div>
                <p className="font-bold text-sm text-gray-800">حالة تشغيل الإعلانات</p>
                <p className="text-xs text-gray-500 mt-0.5">تفعيل أو إيقاف ظهور إعلانات جوجل في التطبيق والمتجر</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={googleForm.google_ads_enabled === "true"}
                  onChange={(e) => setGoogleForm({ ...googleForm, google_ads_enabled: e.target.checked ? "true" : "false" })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div>
                <p className="font-bold text-sm text-gray-800">وضع الاختبار التجريبي (Test Ads)</p>
                <p className="text-xs text-gray-500 mt-0.5">إظهار إعلانات تجريبية أثناء الفحص لتفادي مخالفات جوجل</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={googleForm.google_ads_test_mode === "true"}
                  onChange={(e) => setGoogleForm({ ...googleForm, google_ads_test_mode: e.target.checked ? "true" : "false" })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>

          {/* Mobile App IDs */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
              <span>📱</span> معرفات تطبيق الموبايل (Google AdMob App IDs)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700">AdMob App ID (Android)</label>
                <input
                  type="text"
                  value={googleForm.admob_app_id_android}
                  onChange={(e) => setGoogleForm({ ...googleForm, admob_app_id_android: e.target.value })}
                  placeholder="ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy"
                  className="w-full mt-1.5 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">AdMob App ID (iOS / iPhone)</label>
                <input
                  type="text"
                  value={googleForm.admob_app_id_ios}
                  onChange={(e) => setGoogleForm({ ...googleForm, admob_app_id_ios: e.target.value })}
                  placeholder="ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy"
                  className="w-full mt-1.5 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Ad Unit IDs */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
              <span>🎯</span> معرفات الوحدات الإعلانية بالموبايل (Ad Units / ADV Slots)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700">Banner Ad Unit (إعلان البانر الثابت أسفل الشاشة)</label>
                <input
                  type="text"
                  value={googleForm.admob_banner_unit_id}
                  onChange={(e) => setGoogleForm({ ...googleForm, admob_banner_unit_id: e.target.value })}
                  placeholder="ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz"
                  className="w-full mt-1.5 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Interstitial Ad Unit (إعلان الشاشة الكاملة / البيني)</label>
                <input
                  type="text"
                  value={googleForm.admob_interstitial_unit_id}
                  onChange={(e) => setGoogleForm({ ...googleForm, admob_interstitial_unit_id: e.target.value })}
                  placeholder="ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz"
                  className="w-full mt-1.5 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Rewarded Video Ad Unit (إعلان الفيديو بمكافأة للعملاء)</label>
                <input
                  type="text"
                  value={googleForm.admob_rewarded_unit_id}
                  onChange={(e) => setGoogleForm({ ...googleForm, admob_rewarded_unit_id: e.target.value })}
                  placeholder="ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz"
                  className="w-full mt-1.5 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Native Advanced Unit (إعلان أصلي مدمج في قوائم المنتجات)</label>
                <input
                  type="text"
                  value={googleForm.admob_native_unit_id}
                  onChange={(e) => setGoogleForm({ ...googleForm, admob_native_unit_id: e.target.value })}
                  placeholder="ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz"
                  className="w-full mt-1.5 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Web AdSense */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
              <span>🌐</span> إعلانات جوجل لموقع الويب (Google AdSense Web)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700">Google AdSense Publisher ID</label>
                <input
                  type="text"
                  value={googleForm.google_adsense_pub_id}
                  onChange={(e) => setGoogleForm({ ...googleForm, google_adsense_pub_id: e.target.value })}
                  placeholder="pub-xxxxxxxxxxxxxxxx"
                  className="w-full mt-1.5 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Google AdSense Slot ID</label>
                <input
                  type="text"
                  value={googleForm.google_adsense_slot_id}
                  onChange={(e) => setGoogleForm({ ...googleForm, google_adsense_slot_id: e.target.value })}
                  placeholder="1234567890"
                  className="w-full mt-1.5 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 flex-wrap gap-3">
            {googleSaved ? (
              <span className="text-emerald-600 text-sm font-bold flex items-center gap-1.5">
                <CheckCircle size={18} /> تم حفظ إعدادات إعلانات جوجل في قاعدة البيانات بنجاح!
              </span>
            ) : <div />}
            <button
              onClick={handleSaveGoogle}
              disabled={saveSettingsMut.isPending}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl text-sm font-extrabold shadow-lg disabled:opacity-50 transition-all cursor-pointer"
            >
              {saveSettingsMut.isPending ? <><Loader2 size={16} className="animate-spin" /> جاري الحفظ...</> : <><Save size={16} /> حفظ إعدادات إعلانات جوجل (Google AdMob / ADV)</>}
            </button>
          </div>
        </div>
      )}

      {/* Partner Affiliate Banners */}
      {mainTab === "banners" && (
        <div className="space-y-4">
          {/* How it works */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
            <p className="font-semibold text-amber-800 mb-2 flex items-center gap-2"><Globe size={16} /> كيف يعمل نظام العمولة والأفيلييت؟</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-amber-700">
              <div className="flex items-start gap-2"><span className="bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span><span>سجّل في برنامج الأفيلييت (مثل AliExpress Portals أو Amazon Associates)</span></div>
              <div className="flex items-start gap-2"><span className="bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span><span>احصل على رابط التتبع الخاص بك من لوحة تحكم البرنامج</span></div>
              <div className="flex items-start gap-2"><span className="bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span><span>أضف الرابط هنا — عند شراء العميل ستحصل على عمولة من 3% إلى 50%</span></div>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-xs">
              <a href="https://portals.aliexpress.com" target="_blank" rel="noreferrer" className="text-red-600 underline font-medium">🇨🇳 AliExpress Portals</a>
              <a href="https://affiliate-program.amazon.com" target="_blank" rel="noreferrer" className="text-orange-600 underline font-medium">📦 Amazon Associates</a>
              <a href="https://partners.noon.com" target="_blank" rel="noreferrer" className="text-yellow-600 underline font-medium">🌙 Noon Partners</a>
              <a href="https://marketplace.jumia.com" target="_blank" rel="noreferrer" className="text-orange-500 underline font-medium">🛒 Jumia Affiliate</a>
              <a href="https://partner.temu.com" target="_blank" rel="noreferrer" className="text-orange-500 underline font-medium">🛍️ Temu Partners</a>
            </div>
          </div>

          {/* Add form */}
          {showAdd && <AddEditForm form={addForm} setForm={setAddForm} onSave={addItem} onCancel={() => setShowAdd(false)} saving={saveMut.isPending} />}

          {/* Items list */}
          {isLoading ? <div className="text-center py-10 text-gray-400">جارٍ التحميل...</div> : (
            <div className="space-y-3">
              {(items as any[]).length === 0 && !showAdd && (
                <div className={`${card} text-center py-12 text-gray-400`}>
                  <Globe size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">لا توجد إعلانات شركاء بعد</p>
                  <p className="text-sm mt-1">أضف رابط أفيلييت من المواقع العالمية لكسب العمولة</p>
                </div>
              )}
              {(items as any[]).map((item: any, idx: number) => {
                const plat = PLATFORMS.find(p => p.id === item.platform) || PLATFORMS[9];
                return (
                  <div key={item.id || idx} className={card}>
                    {editIdx === idx ? (
                      <EditInlineForm
                        initial={item}
                        onSave={(upd: any) => updateItem(idx, upd)}
                        onCancel={() => setEditIdx(null)}
                        saving={saveMut.isPending}
                      />
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: (item.color || plat.color) + "22", border: `1px solid ${item.color || plat.color}44` }}>
                          {plat.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-800">{item.title}</span>
                            {item.badge && <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: item.color || plat.color }}>{item.badge}</span>}
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{plat.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                              {item.is_active ? "نشط" : "مخفي"}
                            </span>
                          </div>
                          {item.subtitle && <p className="text-sm text-gray-500 mt-0.5">{item.subtitle}</p>}
                          <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 flex items-center gap-1 mt-1 hover:underline truncate max-w-xs" dir="ltr">
                            <ExternalLink size={10} /> {item.url}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => toggleActive(idx)} className={`text-xs px-3 py-1.5 rounded-lg border font-medium cursor-pointer ${item.is_active ? "border-gray-200 text-gray-500" : "border-green-200 text-green-600"}`}>
                            {item.is_active ? "إخفاء" : "إظهار"}
                          </button>
                          <button onClick={() => setEditIdx(idx)} className="text-amber-400 hover:text-amber-600 cursor-pointer p-1"><Edit2 size={15} /></button>
                          <button onClick={() => { if (confirm("حذف هذا الإعلان؟")) deleteItem(idx); }} className="text-red-400 hover:text-red-600 cursor-pointer p-1"><Trash2 size={15} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FormFields({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const inp = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400 transition-all";
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div><label className="text-xs font-bold text-gray-700 mb-1 block">عنوان الإعلان *</label><input className={inp} placeholder="مثل: أفضل صفقات علي إكسبرس" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
      <div><label className="text-xs font-bold text-gray-700 mb-1 block">وصف مختصر</label><input className={inp} placeholder="مثل: إلكترونيات بأسعار الجملة" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} /></div>
      <div className="sm:col-span-2"><label className="text-xs font-bold text-gray-700 mb-1 block">رابط الإعلان / الأفيلييت *</label><input className={inp} placeholder="https://s.click.aliexpress.com/e/..." value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} dir="ltr" /></div>
      <div><label className="text-xs font-bold text-gray-700 mb-1 block">بادج/نص مميز</label><input className={inp} placeholder="مثل: حتى 70%" value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} /></div>
      <div><label className="text-xs font-bold text-gray-700 mb-1 block">المنصة</label>
        <select className={inp} value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
          {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
        </select>
      </div>
      <div><label className="text-xs font-bold text-gray-700 mb-1 block">لون البانر</label>
        <div className="flex gap-2 flex-wrap mt-1">
          {["#10b981", "#f59e0b", "#FF4747", "#FF9900", "#3b82f6", "#8b5cf6", "#ec4899", "#000000"].map(c => (
            <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className="w-7 h-7 rounded-lg border-2 transition-all cursor-pointer" style={{ backgroundColor: c, borderColor: form.color === c ? "#000" : "transparent" }} />
          ))}
          <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-7 h-7 rounded-lg cursor-pointer border border-gray-200" />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-amber-500 cursor-pointer" />
        <label htmlFor="is_active" className="text-sm font-bold text-gray-700 cursor-pointer">نشط (ظاهر في التطبيق)</label>
      </div>
    </div>
  );
}

function AddEditForm({ form, setForm, onSave, onCancel, saving }: any) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="font-bold text-amber-900">إعلان شريك جديد</p>
        <button onClick={onCancel} className="cursor-pointer text-gray-400 hover:text-gray-600"><X size={18} /></button>
      </div>
      <FormFields form={form} setForm={setForm} />
      <div className="flex gap-2 mt-4">
        <button onClick={onSave} disabled={saving || !form.title || !form.url} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md cursor-pointer disabled:opacity-50">
          <Check size={14} /> {saving ? "جارٍ الحفظ..." : "إضافة الإعلان"}
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm font-medium cursor-pointer">إلغاء</button>
      </div>
    </div>
  );
}

function EditInlineForm({ initial, onSave, onCancel, saving }: any) {
  const [form, setForm] = useState({ ...initial });
  return (
    <div>
      <FormFields form={form} setForm={setForm} />
      <div className="flex gap-2 mt-4">
        <button onClick={() => onSave(form)} disabled={saving} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md cursor-pointer disabled:opacity-50">
          <Check size={14} /> حفظ التعديل
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm font-medium cursor-pointer">إلغاء</button>
      </div>
    </div>
  );
}

