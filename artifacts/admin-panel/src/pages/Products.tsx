import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiBase } from "@/lib/api";
import { useI18n, getProductLocalizedName, getProductLocalizedDesc } from "@/lib/i18n";
import { Plus, Search, Edit, Trash2, X, Upload, Image as ImageIcon } from "lucide-react";

interface Product {
  id: number; name: string; sku: string; price: number; cost: number;
  quantity: number; min_quantity: number; category_id: number;
  description: string; is_active: boolean; image?: string;
  name_ar?: string; name_en?: string; description_ar?: string; description_en?: string;
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

function PaginationControls({
  page,
  totalPages,
  totalCount,
  perPage,
  setPage,
  setPerPage,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  setPerPage: (n: number) => void;
}) {
  const [jumpPage, setJumpPage] = useState("");

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPage);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setPage(p);
      setJumpPage("");
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className="flex flex-col lg:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl shadow-md"
      style={{
        background: "rgba(22, 17, 6, 0.75)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(245, 158, 11, 0.25)",
      }}
    >
      {/* Items count & Per-page selector */}
      <div className="flex items-center gap-3 text-xs text-amber-200/80 flex-wrap justify-center sm:justify-start">
        <span>
          عرض <strong className="text-amber-400 font-bold">{((page - 1) * perPage + 1).toLocaleString()}</strong> إلى{" "}
          <strong className="text-amber-400 font-bold">{Math.min(page * perPage, totalCount).toLocaleString()}</strong> من إجمالي{" "}
          <strong className="text-amber-400 font-bold">{totalCount.toLocaleString()}</strong> منتج
        </span>
        <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-amber-500/20">
          <span className="text-amber-200/60">عرض:</span>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="bg-transparent text-amber-300 font-bold text-xs outline-none cursor-pointer"
          >
            {[10, 25, 50, 100, 250].map((n) => (
              <option key={n} value={n} className="bg-slate-900 text-white">
                {n} في الصفحة
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Page Numbers & Navigation Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center" dir="rtl">
        <button
          type="button"
          onClick={() => setPage(1)}
          disabled={page <= 1}
          title="الصفحة الأولى"
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: page <= 1 ? "rgba(255,255,255,0.03)" : "rgba(245,158,11,0.1)",
            borderColor: "rgba(245,158,11,0.2)",
            color: "#fbbf24",
          }}
        >
          « الأولى
        </button>
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: page <= 1 ? "rgba(255,255,255,0.03)" : "rgba(245,158,11,0.15)",
            borderColor: "rgba(245,158,11,0.3)",
            color: "#fbbf24",
          }}
        >
          ‹ السابق
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) =>
            typeof p === "number" ? (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className="min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                style={{
                  background:
                    page === p
                      ? "linear-gradient(135deg, #f59e0b, #d97706)"
                      : "rgba(255, 255, 255, 0.05)",
                  border:
                    page === p
                      ? "1px solid #fbbf24"
                      : "1px solid rgba(245, 158, 11, 0.15)",
                  color: page === p ? "#000" : "#fde68a",
                  boxShadow: page === p ? "0 0 12px rgba(245,158,11,0.4)" : "none",
                }}
              >
                {p}
              </button>
            ) : (
              <span key={`dots-${idx}`} className="px-1 text-amber-400/50 text-xs">
                ...
              </span>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: page >= totalPages ? "rgba(255,255,255,0.03)" : "rgba(245,158,11,0.15)",
            borderColor: "rgba(245,158,11,0.3)",
            color: "#fbbf24",
          }}
        >
          التالي ›
        </button>
        <button
          type="button"
          onClick={() => setPage(totalPages)}
          disabled={page >= totalPages}
          title="الصفحة الأخيرة"
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: page >= totalPages ? "rgba(255,255,255,0.03)" : "rgba(245,158,11,0.1)",
            borderColor: "rgba(245,158,11,0.2)",
            color: "#fbbf24",
          }}
        >
          الأخيرة »
        </button>
      </div>

      {/* Direct Jump to page */}
      <form onSubmit={handleJump} className="flex items-center gap-1.5">
        <span className="text-xs text-amber-200/60">صفحة:</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={jumpPage}
          onChange={(e) => setJumpPage(e.target.value)}
          placeholder={String(page)}
          className="w-14 bg-black/40 border border-amber-500/30 rounded-lg px-2 py-1 text-xs text-center text-amber-300 font-bold outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          disabled={!jumpPage}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-black px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
        >
          انتقال
        </button>
      </form>
    </div>
  );
}

export default function Products() {
  const qc = useQueryClient();
  const { t, language } = useI18n();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
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
  const totalPages: number = data?.total_pages ?? Math.max(1, Math.ceil(totalCount / perPage));

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
          <p className="text-xs text-amber-200/60 mt-1">إجمالي المنتجات: {totalCount.toLocaleString()} منتج (صفحة {page} من {totalPages})</p>
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

      {/* Top Pagination Controls */}
      {totalCount > 0 && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          perPage={perPage}
          setPage={setPage}
          setPerPage={setPerPage}
        />
      )}

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
                      <div className="flex items-center gap-3 max-w-lg">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" style={{ border: "1px solid rgba(245,158,11,0.2)" }} referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                            <ImageIcon size={18} className="text-amber-500/50" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-white/90 line-clamp-2 leading-relaxed text-xs sm:text-sm">
                            {getProductLocalizedName(p, language)}
                          </p>
                          <p className="text-xs text-white/40 line-clamp-1 mt-0.5">
                            {getProductLocalizedDesc(p, language)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.5)" }}>{p.sku}</td>
                    <td className="px-4 py-3 font-bold text-amber-400 whitespace-nowrap">{p.price.toLocaleString()} ر</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "rgba(255,255,255,0.6)" }}>{p.cost.toLocaleString()} ر</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2.5 py-1 font-bold rounded-full ${p.quantity <= p.min_quantity ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30"}`}>{p.quantity}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2.5 py-1 font-bold rounded-full ${p.is_active ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-gray-500/20 text-gray-400 border border-gray-500/30"}`}>{p.is_active ? "نشط" : "غير نشط"}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <button onClick={() => openEdit(p)} title="تعديل" className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-colors cursor-pointer"><Edit size={14} /></button>
                        <button onClick={() => confirm("حذف هذا المنتج بالكامل؟") && deleteMut.mutate(p.id)} title="حذف" className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Pagination Controls */}
      {totalCount > 0 && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          perPage={perPage}
          setPage={setPage}
          setPerPage={setPerPage}
        />
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
