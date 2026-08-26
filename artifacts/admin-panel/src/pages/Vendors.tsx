import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search, Plus, CheckCircle, X, CreditCard, ExternalLink, RefreshCw } from "lucide-react";

export default function Vendors() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ store_name: "", name: "", email: "", phone: "", address: "", commission_rate: 10 });
  const [stripeModal, setStripeModal] = useState<{ open: boolean; vendorId: number | null; vendorName: string }>({ open: false, vendorId: null, vendorName: "" });
  const [stripeData, setStripeData] = useState<any>(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["vendors", search, filterStatus],
    queryFn: () => api.get(`/admin/vendors?search=${encodeURIComponent(search)}&status=${filterStatus}&per_page=50`),
  });

  const approveMut = useMutation({
    mutationFn: (id: number) => api.post(`/admin/vendors/${id}/approve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors"] }),
  });
  const stripeConnectMut = useMutation({
    mutationFn: (id: number) => api.post(`/admin/vendors/${id}/stripe-connect`, {}),
    onSuccess: (res) => { setStripeData(res.data?.data); setStripeLoading(false); },
    onError: () => setStripeLoading(false),
  });
  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/admin/vendors", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vendors"] }); setAddModal(false); },
  });

  const vendors = data?.data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">البائعون</h1>
        <button onClick={() => setAddModal(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> إضافة بائع
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3">
        <div className="relative">
          <Search size={16} className="absolute top-2.5 right-3 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث عن بائع..." className="border border-gray-200 rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 w-48" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400">
          <option value="">الكل</option>
          <option value="approved">موافق عليهم</option>
          <option value="pending">قيد المراجعة</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["المتجر", "جهة الاتصال", "العمولة", "الرصيد", "الحالة", ""].map(h => (
                    <th key={h} className="text-right px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendors.map((v: any) => (
                  <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{v.store_name}</p>
                      <p className="text-xs text-gray-400">{v.address}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{v.name}</p>
                      <p className="text-xs text-gray-400">{v.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{v.commission_rate}%</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{v.balance.toLocaleString()} ر</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${v.is_approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {v.is_approved ? "موافق عليه" : "قيد المراجعة"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!v.is_approved && (
                          <button onClick={() => approveMut.mutate(v.id)} title="الموافقة" className="text-green-500 hover:text-green-700">
                            <CheckCircle size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => { setStripeModal({ open: true, vendorId: v.id, vendorName: v.store_name }); setStripeData(null); setStripeLoading(true); stripeConnectMut.mutate(v.id); }}
                          title="ربط Stripe Connect"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <CreditCard size={18} />
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
      {stripeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-800">ربط Stripe Connect - {stripeModal.vendorName}</h3>
              <button onClick={() => setStripeModal({ open: false, vendorId: null, vendorName: "" })}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              {stripeLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : stripeData ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${stripeData.charges_enabled ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${stripeData.charges_enabled ? "bg-green-500" : "bg-yellow-500"}`} />
                      <span className="font-semibold">{stripeData.charges_enabled ? "حساب نشط" : "بانتظار التفعيل"}</span>
                    </div>
                    <p className="text-sm text-gray-600">{stripeData.charges_enabled ? "يمكن لهذا البائع استلام الدفع المباشر" : "البائع يحتاج لإكمال إعداد Stripe"}</p>
                  </div>

                  {!stripeData.charges_enabled && stripeData.onboarding_url && (
                    <a 
                      href={stripeData.onboarding_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
                    >
                      <ExternalLink size={16} />
                      إكمال إعداد Stripe Connect
                    </a>
                  )}

                  {stripeData.dashboard_url && (
                    <a 
                      href={stripeData.dashboard_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      <ExternalLink size={16} />
                      لوحة تحكم البائع
                    </a>
                  )}

                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                    <p><strong>معرف الحساب:</strong> {stripeData.id}</p>
                    <p><strong>حالة التحويلات:</strong> {stripeData.payouts_enabled ? "مفعل" : "غير مفعل"}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>حدث خطأ في إنشاء حساب Stripe Connect</p>
                  <button 
                    onClick={() => { setStripeLoading(true); stripeConnectMut.mutate(stripeModal.vendorId!); }}
                    className="mt-3 flex items-center gap-2 mx-auto text-blue-600 hover:text-blue-700"
                  >
                    <RefreshCw size={16} />
                    إعادة المحاولة
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-800">إضافة بائع جديد</h3>
              <button onClick={() => setAddModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createMut.mutate(form); }} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "اسم المتجر", key: "store_name", span: 2 },
                  { label: "اسم المسؤول", key: "name" },
                  { label: "البريد الإلكتروني", key: "email", type: "email" },
                  { label: "الهاتف", key: "phone" },
                  { label: "نسبة العمولة %", key: "commission_rate", type: "number" },
                  { label: "العنوان", key: "address", span: 2 },
                ].map(({ label, key, type = "text", span }) => (
                  <div key={key} className={span === 2 ? "col-span-2" : ""}>
                    <label className="text-sm font-medium text-gray-700">{label}</label>
                    <input
                      type={type}
                      value={(form as any)[key]}
                      onChange={e => setForm({ ...form, [key]: type === "number" ? parseFloat(e.target.value) : e.target.value })}
                      className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                      required
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAddModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">إلغاء</button>
                <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-lg text-sm font-medium">إضافة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
