import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, Trash2, Edit2, X, Check, ExternalLink, Globe, TrendingUp } from "lucide-react";

const PLATFORMS = [
  { id: "aliexpress", name: "علي إكسبرس", icon: "🇨🇳", color: "#FF4747", baseUrl: "https://s.click.aliexpress.com/" },
  { id: "amazon", name: "أمازون", icon: "📦", color: "#FF9900", baseUrl: "https://www.amazon.com/?tag=YOUR_TAG" },
  { id: "noon", name: "نون", icon: "🌙", color: "#FEEE00", baseUrl: "https://www.noon.com/" },
  { id: "jumia", name: "جوميا", icon: "🛒", color: "#F68C1E", baseUrl: "https://www.jumia.com/" },
  { id: "ebay", name: "إي باي", icon: "🔨", color: "#E53238", baseUrl: "https://www.ebay.com/" },
  { id: "shein", name: "شي إن", icon: "👗", color: "#000000", baseUrl: "https://www.shein.com/" },
  { id: "temu", name: "تيمو", icon: "🛍️", color: "#FB5C22", baseUrl: "https://www.temu.com/" },
  { id: "other", name: "أخرى", icon: "🌐", color: "#6b7280", baseUrl: "" },
];

const empty = { title: "", subtitle: "", url: "", badge: "", color: "#f59e0b", platform: "aliexpress", is_active: true };

export default function PartnerAds() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery<any[]>({ queryKey: ["partner-products"], queryFn: () => api.get("/admin/partner-products") });

  const saveMut = useMutation({
    mutationFn: (data: any[]) => api.post("/admin/partner-products", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partner-products"] }),
  });

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

  const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400";
  const card = "bg-white rounded-xl shadow-sm border border-gray-100 p-5";

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp size={22} className="text-amber-500" /> إعلانات الشركاء والعمولة
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">أضف روابط الأفيلييت من المواقع العالمية — تظهر في التطبيق كبانرات قابلة للنقر</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
          <Plus size={16} /> إضافة إعلان شريك
        </button>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
        <p className="font-semibold text-amber-800 mb-2 flex items-center gap-2"><Globe size={16} /> كيف يعمل نظام العمولة؟</p>
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
            const plat = PLATFORMS.find(p => p.id === item.platform) || PLATFORMS[7];
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
                    {/* Color dot */}
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
                      <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 flex items-center gap-1 mt-1 hover:underline truncate max-w-xs">
                        <ExternalLink size={10} /> {item.url}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => toggleActive(idx)} className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${item.is_active ? "border-gray-200 text-gray-500" : "border-green-200 text-green-600"}`}>
                        {item.is_active ? "إخفاء" : "إظهار"}
                      </button>
                      <button onClick={() => setEditIdx(idx)} className="text-amber-400 hover:text-amber-600"><Edit2 size={15} /></button>
                      <button onClick={() => { if (confirm("حذف هذا الإعلان؟")) deleteItem(idx); }} className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FormFields({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400";
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div><label className="text-xs font-medium text-gray-500 mb-1 block">عنوان الإعلان *</label><input className={inp} placeholder="مثل: أفضل صفقات علي إكسبرس" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
      <div><label className="text-xs font-medium text-gray-500 mb-1 block">وصف مختصر</label><input className={inp} placeholder="مثل: إلكترونيات بأسعار الجملة" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} /></div>
      <div className="sm:col-span-2"><label className="text-xs font-medium text-gray-500 mb-1 block">رابط الأفيلييت *</label><input className={inp} placeholder="https://s.click.aliexpress.com/e/..." value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} dir="ltr" /></div>
      <div><label className="text-xs font-medium text-gray-500 mb-1 block">بادج/نص مميز</label><input className={inp} placeholder="مثل: حتى 70%" value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} /></div>
      <div><label className="text-xs font-medium text-gray-500 mb-1 block">المنصة</label>
        <select className={inp} value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
          {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
        </select>
      </div>
      <div><label className="text-xs font-medium text-gray-500 mb-1 block">لون البانر</label>
        <div className="flex gap-2 flex-wrap mt-1">
          {["#f59e0b", "#FF4747", "#FF9900", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#000000"].map(c => (
            <button key={c} onClick={() => setForm({ ...form, color: c })} className="w-7 h-7 rounded-lg border-2 transition-all" style={{ backgroundColor: c, borderColor: form.color === c ? "#000" : "transparent" }} />
          ))}
          <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-7 h-7 rounded-lg cursor-pointer border border-gray-200" />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-amber-500" />
        <label htmlFor="is_active" className="text-sm text-gray-600">نشط (ظاهر في التطبيق)</label>
      </div>
    </div>
  );
}

function AddEditForm({ form, setForm, onSave, onCancel, saving }: any) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="font-bold text-amber-800">إعلان شريك جديد</p>
        <button onClick={onCancel}><X size={18} className="text-gray-400" /></button>
      </div>
      <FormFields form={form} setForm={setForm} />
      <div className="flex gap-2 mt-4">
        <button onClick={onSave} disabled={saving || !form.title || !form.url} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          <Check size={14} /> {saving ? "جارٍ الحفظ..." : "إضافة"}
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-500 text-sm">إلغاء</button>
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
        <button onClick={() => onSave(form)} disabled={saving} className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          <Check size={14} /> حفظ
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-500 text-sm">إلغاء</button>
      </div>
    </div>
  );
}
