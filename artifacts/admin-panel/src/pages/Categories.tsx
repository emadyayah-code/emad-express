import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiBase } from "@/lib/api";
import { Plus, Edit, Trash2, X, Upload, Image as ImageIcon } from "lucide-react";

interface Category {
  id: number; name: string; icon: string; image: string;
  description: string; is_active: boolean;
}

const emptyForm = { name: "", icon: "📦", image: "", description: "", is_active: true };

function ImageUploader({ value, onChange, endpoint }: { value: string; onChange: (url: string) => void; endpoint: string }) {
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
      const res = await fetch(`${getApiBase()}${endpoint}`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) onChange(data.url);
      else setError("فشل رفع الصورة");
    } catch {
      setError("حدث خطأ أثناء الرفع");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="text-sm font-medium text-amber-200/70 block mb-1">صورة الفئة</label>
      {value ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden group" style={{ border: "1px solid rgba(245,158,11,0.2)" }}>
          <img src={value} alt="cat" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} className="bg-white text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium">تغيير</button>
            <button type="button" onClick={() => onChange("")} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium">حذف</button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); }}
          onClick={() => inputRef.current?.click()}
          className="w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
          style={{ borderColor: dragging ? "#f59e0b" : "rgba(245,158,11,0.3)", background: dragging ? "rgba(245,158,11,0.05)" : "transparent" }}
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-amber-500" />
          ) : (
            <>
              <Upload size={20} className="text-amber-500" />
              <p className="text-sm text-amber-200/70">اسحب الصورة أو اضغط للاختيار</p>
            </>
          )}
        </div>
      )}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
    </div>
  );
}

export default function Categories() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: rawCategories, isLoading } = useQuery<any>({
    queryKey: ["categories-admin"],
    queryFn: () => api.get("/admin/categories"),
  });
  const categories: Category[] = Array.isArray(rawCategories)
    ? rawCategories
    : rawCategories?.data && Array.isArray(rawCategories.data)
    ? rawCategories.data
    : [];

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/admin/categories", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories-admin"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      setModal(null);
    },
  });
  const updateMut = useMutation({
    mutationFn: (d: any) => api.put(`/admin/categories/${editing?.id}`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories-admin"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      setModal(null);
    },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories-admin"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: any) => alert(e.message || "فشل الحذف"),
  });

  function openAdd() { setForm(emptyForm); setEditing(null); setModal("add"); }
  function openEdit(c: Category) {
    setEditing(c);
    setForm({ name: c.name, icon: c.icon || "📦", image: c.image || "", description: c.description || "", is_active: c.is_active });
    setModal("edit");
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (modal === "add") createMut.mutate(form);
    else updateMut.mutate(form);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-400">الفئات</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
          <Plus size={16} /> إضافة فئة
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map(c => (
            <div key={c.id} className="rounded-xl overflow-hidden group" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <div className="relative h-40">
                {c.image ? (
                  <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(245,158,11,0.06)" }}>
                    <ImageIcon size={36} className="text-amber-500/40" />
                  </div>
                )}
                <div className="absolute top-2 left-2 text-2xl">{c.icon}</div>
                {!c.is_active && (
                  <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full bg-gray-700/80 text-gray-300">غير نشط</div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white/90 mb-1">{c.name}</h3>
                <p className="text-xs text-white/50 line-clamp-2 h-8">{c.description}</p>
                <div className="flex items-center justify-end gap-3 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <button onClick={() => openEdit(c)} className="text-blue-400 hover:text-blue-300 transition-colors"><Edit size={15} /></button>
                  <button onClick={() => confirm("حذف هذه الفئة؟") && deleteMut.mutate(c.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: "#161208", border: "1px solid rgba(245,158,11,0.25)" }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(245,158,11,0.15)" }}>
              <h3 className="font-semibold text-amber-400">{modal === "add" ? "إضافة فئة جديدة" : "تعديل الفئة"}</h3>
              <button onClick={() => setModal(null)} className="text-white/40 hover:text-white/80"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <ImageUploader value={form.image} onChange={url => setForm({ ...form, image: url })} endpoint="/admin/upload-category-image" />
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-amber-200/70 block mb-1">اسم الفئة</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none text-white"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(245,158,11,0.2)" }} />
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-200/70 block mb-1">الإيموجي</label>
                  <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} maxLength={2}
                    className="w-full rounded-lg px-3 py-2 text-2xl outline-none text-center"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(245,158,11,0.2)" }} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-amber-200/70 block mb-1">الوصف</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none text-white resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(245,158,11,0.2)" }} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="cat-active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded accent-amber-500" />
                <label htmlFor="cat-active" className="text-sm text-white/70">فئة نشطة</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white/90" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  إلغاء
                </button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold text-black"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
                  {createMut.isPending || updateMut.isPending ? "جارٍ الحفظ..." : modal === "add" ? "إضافة" : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
