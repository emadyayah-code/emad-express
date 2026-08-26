import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiBase } from "@/lib/api";
import { Plus, Search, Edit, Trash2, X, Upload, Image as ImageIcon } from "lucide-react";

interface Product {
  id: number; name: string; sku: string; price: number; cost: number;
  quantity: number; min_quantity: number; category_id: number;
  description: string; is_active: boolean; image?: string;
}

const emptyForm = { name: "", sku: "", price: 0, cost: 0, quantity: 0, min_quantity: 5, category_id: 1, description: "", is_active: true, image: "" };

function ImageUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) { setError("يجب أن يكون الملف صورة"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("حجم الصورة يجب أن يكون أقل من 5MB"); return; }
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${getApiBase()}/admin/upload-image`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) onChange(data.url);
      else setError("فشل رفع الصورة");
    } catch {
      setError("حدث خطأ أثناء الرفع");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="col-span-2">
      <label className="text-sm font-medium text-gray-700 block mb-1">صورة المنتج</label>
      {value ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 group">
          <img src={value} alt="product" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-100"
            >
              تغيير الصورة
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-600"
            >
              حذف
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
            dragging ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/50"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
              <p className="text-sm text-gray-500">جارٍ الرفع...</p>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Upload size={18} className="text-amber-500" />
              </div>
              <p className="text-sm font-medium text-gray-600">اسحب الصورة هنا أو اضغط للاختيار</p>
              <p className="text-xs text-gray-400">PNG, JPG, WEBP — حتى 5MB</p>
            </>
          )}
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {!value && (
        <div className="mt-2">
          <p className="text-xs text-gray-400 mb-1">أو أدخل رابط صورة مباشرة:</p>
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
            onChange={e => onChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

export default function Products() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["products", search, page, perPage, selectedCategory, statusFilter],
    queryFn: () => api.get(`/admin/products?page=${page}&per_page=${perPage}&search=${encodeURIComponent(search)}&category_id=${selectedCategory}&status=${statusFilter}`),
  });
  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: () => api.get("/admin/categories") });

  const createMut = useMutation({ mutationFn: (d: any) => api.post("/admin/products", d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setModal(null); } });
  const updateMut = useMutation({ mutationFn: (d: any) => api.put(`/admin/products/${editing?.id}`, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setModal(null); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => api.delete(`/admin/products/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }) });

  function openAdd() { setForm(emptyForm); setEditing(null); setModal("add"); }
  function openEdit(p: Product) { setEditing(p); setForm({ ...p, image: p.image || "" }); setModal("edit"); }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (modal === "add") createMut.mutate(form);
    else updateMut.mutate(form);
  }

  const products: Product[] = Array.isArray(data) ? data : data?.data || [];
  const categoriesList = Array.isArray(cats) ? cats : cats?.data || [];
  const totalCount: number = data?.total ?? products.length;
  const totalPages: number = data?.total_pages ?? Math.ceil(totalCount / perPage) ?? 1;

  const [clearing, setClearing] = useState(false);
  const handleClearAll = async () => {
    if (!confirm("هل أنت متأكد من حذف وتفريغ جميع المنتجات بالكامل من قاعدة البيانات؟")) return;
    setClearing(true);
    try {
      await api.delete("/admin/dropship/clear-products");
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dropship-products"] });
    } catch (e: any) {
      alert(e?.message || "فشل تفريغ المنتجات");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f59e0b" }}>المنتجات</h1>
          <p className="text-xs text-amber-200/60 mt-1">إجمالي المنتجات: {totalCount.toLocaleString()} منتج</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {totalCount > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={14} /> {clearing ? "جارٍ الحذف..." : "تفريغ وحذف جميع المنتجات 🧹"}
            </button>
          )}
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-black transition-all cursor-pointer shadow-lg" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
            <Plus size={16} /> إضافة منتج
          </button>
        </div>
      </div>

      <div className="rounded-xl p-4 flex flex-wrap items-center justify-between gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} className="absolute top-2.5 right-3 text-amber-400/60" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="بحث عن منتج..."
            className="w-full rounded-lg pr-9 pl-3 py-2 text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(245,158,11,0.2)", color: "#fff" }}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedCategory}
            onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
          >
            <option value="">جميع الفئات</option>
            {categoriesList.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name || c.name_ar}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط فقط</option>
            <option value="inactive">غير نشط</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-base font-bold">لا توجد منتجات مطابقة</p>
            <p className="text-xs mt-1 text-slate-500">يمكنك استيراد منتجات جديدة من صفحة الدروبشيبينغ أو الضغط على "إضافة منتج"</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "rgba(245,158,11,0.08)", borderBottom: "1px solid rgba(245,158,11,0.15)" }}>
                <tr>
                  {["المنتج", "SKU", "السعر", "التكلفة", "الكمية", "الحالة", ""].map(h => (
                    <th key={h} className="text-right px-4 py-3 font-medium" style={{ color: "rgba(245,158,11,0.8)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" style={{ border: "1px solid rgba(245,158,11,0.2)" }} referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                            <ImageIcon size={16} className="text-amber-500/50" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-white/90">{(p as any).name_ar || p.name || (p as any).name_en || "منتج"}</p>
                          <p className="text-xs text-white/40">{((p as any).description_ar || p.description || (p as any).description_en || "")?.slice(0, 45)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{p.sku}</td>
                    <td className="px-4 py-3 font-semibold text-amber-400">{p.price.toLocaleString()} ر</td>
                    <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.6)" }}>{p.cost.toLocaleString()} ر</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${p.quantity <= p.min_quantity ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>{p.quantity}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${p.is_active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>{p.is_active ? "نشط" : "غير نشط"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"><Edit size={15} /></button>
                        <button onClick={() => confirm("حذف هذا المنتج بالكامل؟") && deleteMut.mutate(p.id)} className="text-red-400 hover:text-red-300 transition-colors cursor-pointer"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <div className="flex items-center gap-3 text-xs text-amber-200/80 flex-wrap">
            <span>
              عرض <strong className="text-amber-400">{((page - 1) * perPage + 1).toLocaleString()}</strong> إلى <strong className="text-amber-400">{Math.min(page * perPage, totalCount).toLocaleString()}</strong> من إجمالي <strong className="text-amber-400">{totalCount.toLocaleString()}</strong> منتج
            </span>
            <div className="flex items-center gap-1.5 mr-2">
              <span>عرض في الصفحة:</span>
              <select
                value={perPage}
                onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-400 outline-none cursor-pointer"
              >
                {[25, 50, 100, 250, 500, 1000].map(n => (
                  <option key={n} value={n}>{n} منتج</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pagination Navigation */}
          <div className="flex items-center gap-1.5" dir="ltr">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-700 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              « الأولى
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-700 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              ‹ السابق
            </button>

            <span className="text-xs font-bold px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg">
              صفحة {page} من {totalPages}
            </span>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-700 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              التالي ›
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-700 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              الأخيرة »
            </button>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: "#161208", border: "1px solid rgba(245,158,11,0.25)" }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(245,158,11,0.15)" }}>
              <h3 className="font-semibold text-amber-400">{modal === "add" ? "إضافة منتج جديد" : "تعديل المنتج"}</h3>
              <button onClick={() => setModal(null)} className="text-white/40 hover:text-white/80 transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">

                <ImageUploader value={form.image} onChange={url => setForm({ ...form, image: url })} />

                <div className="col-span-2">
                  <label className="text-sm font-medium text-amber-200/70 block mb-1">اسم المنتج</label>
                  <input
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none text-white"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-200/70 block mb-1">SKU</label>
                  <input
                    value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none text-white"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-200/70 block mb-1">الفئة</label>
                  <select
                    value={form.category_id} onChange={e => setForm({ ...form, category_id: parseInt(e.target.value) })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none text-white"
                    style={{ background: "#1a1200", border: "1px solid rgba(245,158,11,0.2)" }}
                  >
                    {(cats || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-200/70 block mb-1">السعر (ريال)</label>
                  <input
                    type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none text-white"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-200/70 block mb-1">التكلفة (ريال)</label>
                  <input
                    type="number" value={form.cost} onChange={e => setForm({ ...form, cost: parseFloat(e.target.value) })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none text-white"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-200/70 block mb-1">الكمية</label>
                  <input
                    type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none text-white"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-200/70 block mb-1">الحد الأدنى</label>
                  <input
                    type="number" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: parseInt(e.target.value) })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none text-white"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-amber-200/70 block mb-1">الوصف</label>
                  <textarea
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none text-white resize-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded accent-amber-500" />
                  <label htmlFor="active" className="text-sm text-white/70">منتج نشط</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => setModal(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white/90 transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold text-black transition-all"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
                  disabled={createMut.isPending || updateMut.isPending}
                >
                  {createMut.isPending || updateMut.isPending ? "جارٍ الحفظ..." : modal === "add" ? "إضافة" : "حفظ التغييرات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
