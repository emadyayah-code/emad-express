import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search, Eye, X, Truck, CheckCircle, Package, ExternalLink } from "lucide-react";

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "قيد الانتظار", cls: "bg-yellow-100 text-yellow-700" },
  processing: { label: "قيد المعالجة", cls: "bg-blue-100 text-blue-700" },
  shipped: { label: "تم الشحن", cls: "bg-purple-100 text-purple-700" },
  delivered: { label: "تم التسليم", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "ملغي", cls: "bg-red-100 text-red-700" },
};

const fulfillMap: Record<string, { label: string; cls: string; icon: string }> = {
  unfulfilled: { label: "لم يُشحن", cls: "bg-gray-100 text-gray-600", icon: "📦" },
  processing: { label: "عند المورد", cls: "bg-blue-100 text-blue-700", icon: "🏭" },
  shipped: { label: "في الطريق", cls: "bg-purple-100 text-purple-700", icon: "🚚" },
  delivered: { label: "تم التسليم", cls: "bg-green-100 text-green-700", icon: "✅" },
};

const payMap: Record<string, string> = {
  paid: "مدفوع", pending: "غير مدفوع", refunded: "مسترجع",
};

const PLATFORM_NAMES: Record<string, string> = {
  aliexpress: "علي إكسبرس 🇨🇳",
  amazon: "أمازون 🛒",
  alibaba: "علي بابا 🏪",
};

export default function Orders() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewOrder, setViewOrder] = useState<any>(null);
  const [fulfillModal, setFulfillModal] = useState<any>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingModal, setTrackingModal] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", search, filterStatus],
    queryFn: () => api.get(`/admin/orders?order_number=${encodeURIComponent(search)}&status=${filterStatus}&per_page=50`),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.put(`/admin/orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });

  const fulfillMut = useMutation({
    mutationFn: ({ id, platform }: { id: number; platform: string }) =>
      api.post(`/admin/orders/${id}/fulfill`, { fulfillment_platform: platform }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      setFulfillModal(null);
      if (data?.supplier_links?.length > 0) {
        alert(`✅ تم تحويل الطلب للمورد!\n\nفتح روابط المنتجات عند المورد:\n${data.supplier_links.map((l: any) => `• ${l.item}: ${l.url}`).join("\n")}\n\nعنوان الشحن: ${data.customer_name} - ${data.customer_address}`);
      }
    },
  });

  const trackingMut = useMutation({
    mutationFn: ({ id, tracking }: { id: number; tracking: string }) =>
      api.put(`/admin/orders/${id}/tracking`, { supplier_tracking: tracking }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orders"] }); setTrackingModal(null); setTrackingInput(""); },
  });

  const orders = data?.data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">الطلبات</h1>
        <span className="text-sm text-gray-500">{data?.total || 0} طلب</span>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3">
        <div className="relative">
          <Search size={16} className="absolute top-2.5 right-3 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث برقم الطلب..." className="border border-gray-200 rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 w-48" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400">
          <option value="">كل الحالات</option>
          {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["رقم الطلب", "العميل", "التاريخ", "الإجمالي", "الدفع", "الحالة", "الشحن", "تحديث", ""].map(h => (
                    <th key={h} className="text-right px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => {
                  const s = statusMap[o.status] || { label: o.status, cls: "bg-gray-100 text-gray-600" };
                  const f = fulfillMap[o.fulfillment_status || "unfulfilled"] || fulfillMap.unfulfilled;
                  return (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-800 font-medium">{o.order_number}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{o.customer_name}</p>
                        <p className="text-xs text-gray-400">{o.customer_phone}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(o.order_date).toLocaleDateString("ar-SA")}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{o.total.toLocaleString()} ر</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{payMap[o.payment_status] || o.payment_status}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${s.cls}`}>{s.label}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium w-fit ${f.cls}`}>
                            {f.icon} {f.label}
                          </span>
                          {o.supplier_tracking && (
                            <span className="text-xs text-purple-600 font-mono">{o.supplier_tracking}</span>
                          )}
                          {(o.fulfillment_status === "unfulfilled" || !o.fulfillment_status) ? (
                            <button
                              onClick={() => setFulfillModal(o)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded w-fit transition-colors"
                            >
                              <Truck size={11} /> إرسال للمورد
                            </button>
                          ) : o.fulfillment_status === "processing" ? (
                            <button
                              onClick={() => { setTrackingModal(o); setTrackingInput(o.supplier_tracking || ""); }}
                              className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded w-fit transition-colors"
                            >
                              <Package size={11} /> أدخل رقم التتبع
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={o.status}
                          onChange={e => statusMut.mutate({ id: o.id, status: e.target.value })}
                          className="border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-amber-400"
                        >
                          {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setViewOrder(o)} className="text-blue-500 hover:text-blue-700"><Eye size={15} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-800">تفاصيل الطلب #{viewOrder.order_number}</h3>
              <button onClick={() => setViewOrder(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-500">العميل</p><p className="font-medium">{viewOrder.customer_name}</p></div>
                <div><p className="text-gray-500">الهاتف</p><p className="font-medium">{viewOrder.customer_phone}</p></div>
                <div className="col-span-2"><p className="text-gray-500">العنوان</p><p className="font-medium">{viewOrder.shipping_address}</p></div>
                <div><p className="text-gray-500">طريقة الدفع</p><p className="font-medium">{viewOrder.payment_method}</p></div>
                <div><p className="text-gray-500">حالة الدفع</p><p className="font-medium">{payMap[viewOrder.payment_status]}</p></div>
                {viewOrder.fulfillment_platform && <div><p className="text-gray-500">منصة الشحن</p><p className="font-medium">{PLATFORM_NAMES[viewOrder.fulfillment_platform] || viewOrder.fulfillment_platform}</p></div>}
                {viewOrder.supplier_tracking && <div><p className="text-gray-500">رقم التتبع</p><p className="font-mono font-medium text-purple-700">{viewOrder.supplier_tracking}</p></div>}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">المنتجات</p>
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>
                      <th className="text-right p-3 font-medium text-gray-600">المنتج</th>
                      <th className="text-right p-3 font-medium text-gray-600">الكمية</th>
                      <th className="text-right p-3 font-medium text-gray-600">الإجمالي</th>
                    </tr></thead>
                    <tbody>
                      {(viewOrder.items || []).map((item: any, i: number) => (
                        <tr key={i} className="border-t border-gray-50">
                          <td className="p-3">{item.product_name}</td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3">{item.total.toLocaleString()} ر</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="border-t pt-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">المجموع الفرعي</span><span>{viewOrder.subtotal.toLocaleString()} ر</span></div>
                {viewOrder.discount > 0 && <div className="flex justify-between text-green-600"><span>الخصم</span><span>- {viewOrder.discount.toLocaleString()} ر</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">الضريبة (15%)</span><span>{viewOrder.tax.toLocaleString()} ر</span></div>
                <div className="flex justify-between"><span className="text-gray-500">الشحن</span><span>{viewOrder.shipping.toLocaleString()} ر</span></div>
                <div className="flex justify-between font-bold text-gray-900 pt-1 border-t"><span>الإجمالي</span><span>{viewOrder.total.toLocaleString()} ر</span></div>
              </div>
              {(!viewOrder.fulfillment_status || viewOrder.fulfillment_status === "unfulfilled") && (
                <button
                  onClick={() => { setViewOrder(null); setFulfillModal(viewOrder); }}
                  className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium"
                >
                  <Truck size={15} /> إرسال للمورد (شحن دروبشيبينغ)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fulfill Modal */}
      {fulfillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Truck size={16} className="text-blue-500" /> إرسال للمورد</h3>
              <button onClick={() => setFulfillModal(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-800 mb-1">طلب: {fulfillModal.order_number}</p>
                <p className="text-gray-600">العميل: {fulfillModal.customer_name}</p>
                <p className="text-gray-600">📍 {fulfillModal.shipping_address}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">اختر منصة الشحن</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "aliexpress", name: "علي إكسبرس", flag: "🇨🇳" },
                    { id: "amazon", name: "أمازون", flag: "🛒" },
                    { id: "alibaba", name: "علي بابا", flag: "🏪" },
                  ].map(plt => (
                    <button
                      key={plt.id}
                      onClick={() => fulfillMut.mutate({ id: fulfillModal.id, platform: plt.id })}
                      disabled={fulfillMut.isPending}
                      className="flex flex-col items-center gap-1 p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
                    >
                      <span className="text-2xl">{plt.flag}</span>
                      <span className="text-xs font-medium text-gray-700">{plt.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">
                سيتم تحديث حالة الطلب وستظهر روابط المنتجات عند المورد لتتمكن من إكمال الطلب يدوياً
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {trackingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Package size={16} className="text-purple-500" /> رقم تتبع الشحنة</h3>
              <button onClick={() => setTrackingModal(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-gray-600">طلب: {trackingModal.order_number} — {trackingModal.customer_name}</p>
              <input
                value={trackingInput}
                onChange={e => setTrackingInput(e.target.value)}
                placeholder="أدخل رقم التتبع من المورد..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400"
                dir="ltr"
              />
              <div className="flex gap-2">
                <button onClick={() => setTrackingModal(null)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">إلغاء</button>
                <button
                  disabled={!trackingInput.trim() || trackingMut.isPending}
                  onClick={() => trackingMut.mutate({ id: trackingModal.id, tracking: trackingInput })}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {trackingMut.isPending ? "جارٍ الحفظ..." : <><CheckCircle size={14} /> حفظ</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
