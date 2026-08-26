import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search, Plus, X, Copy, TrendingUp, Users, DollarSign, MousePointer, CheckCircle, Trash2 } from "lucide-react";

export default function Affiliates() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [statsModal, setStatsModal] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", commission_rate: 5 });
  const [copied, setCopied] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["affiliates", search],
    queryFn: () => api.get(`/admin/affiliates?search=${encodeURIComponent(search)}`),
  });
  const { data: statsData } = useQuery({
    queryKey: ["affiliates-stats"],
    queryFn: () => api.get("/admin/affiliates/stats"),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/admin/affiliates", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["affiliates"] }); qc.invalidateQueries({ queryKey: ["affiliates-stats"] }); setAddModal(false); setForm({ name: "", email: "", phone: "", commission_rate: 5 }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/affiliates/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["affiliates"] }); qc.invalidateQueries({ queryKey: ["affiliates-stats"] }); },
  });
  const approveMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.put(`/admin/affiliates/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["affiliates"] }); },
  });

  const affiliatesList = data?.data || [];
  const stats = statsData || {};
  const BASE = window.location.origin;

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${BASE}?ref=${code}`);
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">نظام العمولات والمسوقين</h1>
        <button onClick={() => setAddModal(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> إضافة مسوّق
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي المسوقين", value: stats.total_affiliates || 0, icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "إجمالي النقرات", value: (stats.total_clicks || 0).toLocaleString(), icon: MousePointer, color: "bg-purple-50 text-purple-600" },
          { label: "الطلبات المحوّلة", value: stats.total_conversions || 0, icon: TrendingUp, color: "bg-green-50 text-green-600" },
          { label: "العمولات المستحقة", value: `${(stats.total_pending || 0).toLocaleString()} ر`, icon: DollarSign, color: "bg-amber-50 text-amber-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-lg font-bold text-gray-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative max-w-xs">
          <Search size={16} className="absolute top-2.5 right-3 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث عن مسوّق..." className="border border-gray-200 rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 w-full" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>
        ) : affiliatesList.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>لا يوجد مسوقون بعد</p>
            <p className="text-sm mt-1">أضف أول مسوّق للبدء</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["المسوّق", "الكود", "رابط الإحالة", "النقرات", "التحويلات", "العمولة", "الرصيد", ""].map(h => (
                    <th key={h} className="text-right px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {affiliatesList.map((a: any) => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{a.name}</p>
                      <p className="text-xs text-gray-400">{a.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded font-mono text-xs">{a.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copyLink(a.code)}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50 transition-colors"
                      >
                        {copied === a.code ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} />}
                        {copied === a.code ? "تم النسخ!" : "نسخ الرابط"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{(a.total_clicks || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-700">{a.total_conversions || 0}</td>
                    <td className="px-4 py-3 text-gray-700">{a.commission_rate}%</td>
                    <td className="px-4 py-3 font-semibold text-green-700">{(a.balance || 0).toLocaleString()} ر</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setStatsModal(a)}
                          title="التفاصيل"
                          className="text-blue-400 hover:text-blue-600 text-xs border border-blue-200 rounded px-2 py-1"
                        >
                          التفاصيل
                        </button>
                        <button onClick={() => { if (confirm("حذف هذا المسوق؟")) deleteMut.mutate(a.id); }} title="حذف" className="text-red-400 hover:text-red-600">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-800">إضافة مسوّق جديد</h3>
              <button onClick={() => setAddModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createMut.mutate(form); }} className="p-5 space-y-4">
              {[
                { label: "الاسم الكامل", key: "name" },
                { label: "البريد الإلكتروني", key: "email", type: "email" },
                { label: "الهاتف", key: "phone" },
                { label: "نسبة العمولة %", key: "commission_rate", type: "number" },
              ].map(({ label, key, type = "text" }) => (
                <div key={key}>
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  <input
                    type={type}
                    step={type === "number" ? "0.1" : undefined}
                    value={(form as any)[key]}
                    onChange={e => setForm({ ...form, [key]: type === "number" ? parseFloat(e.target.value) : e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                    required={key !== "phone"}
                  />
                </div>
              ))}
              <p className="text-xs text-gray-400 bg-amber-50 p-2 rounded-lg">
                سيُنشأ كود إحالة فريد تلقائياً. كل طلب يأتي عبر رابط المسوّق يُحتسب له عمولة.
              </p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAddModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">إلغاء</button>
                <button type="submit" disabled={createMut.isPending} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-60">
                  {createMut.isPending ? "جارٍ الإضافة..." : "إضافة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {statsModal && (
        <AffiliateStatsModal affiliate={statsModal} onClose={() => setStatsModal(null)} />
      )}
    </div>
  );
}

function AffiliateStatsModal({ affiliate, onClose }: { affiliate: any; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ["affiliate-conversions", affiliate.id],
    queryFn: () => api.get(`/admin/affiliates/${affiliate.id}/conversions`),
  });
  const conversions = data?.data || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="font-semibold text-gray-800">{affiliate.name}</h3>
            <p className="text-xs text-gray-400">{affiliate.email} · كود: {affiliate.code}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="grid grid-cols-3 gap-3 p-5 border-b">
          <div className="text-center bg-blue-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-blue-700">{affiliate.total_clicks || 0}</p>
            <p className="text-xs text-gray-500 mt-1">نقرة</p>
          </div>
          <div className="text-center bg-green-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-green-700">{affiliate.total_conversions || 0}</p>
            <p className="text-xs text-gray-500 mt-1">تحويل</p>
          </div>
          <div className="text-center bg-amber-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-amber-700">{(affiliate.total_earned || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">ر. مكتسبة</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">سجل العمولات</h4>
          {conversions.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">لا توجد عمولات بعد</p>
          ) : (
            <div className="space-y-2">
              {conversions.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{c.order_number}</p>
                    <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString("ar-SA")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-700">+{c.commission_amount.toLocaleString()} ر</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "paid" ? "bg-green-100 text-green-700" : c.status === "approved" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {c.status === "paid" ? "مدفوع" : c.status === "approved" ? "موافق عليه" : "قيد المراجعة"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
