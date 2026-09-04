import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  RotateCcw,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  PackageCheck,
  CreditCard,
  Building2,
  Eye,
  X,
  AlertCircle,
  ArrowRight,
  Filter,
} from "lucide-react";

const returnStatusConfig: Record<string, { label: string; cls: string; icon: any }> = {
  pending: { label: "قيد المراجعة", cls: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  approved: { label: "تمت الموافقة", cls: "bg-blue-100 text-blue-800 border-blue-200", icon: CheckCircle2 },
  items_received: { label: "تم استلام المرتجع", cls: "bg-purple-100 text-purple-800 border-purple-200", icon: PackageCheck },
  refunded: { label: "تم الاسترداد المالي", cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CreditCard },
  rejected: { label: "مرفوض", cls: "bg-rose-100 text-rose-800 border-rose-200", icon: XCircle },
};

const reasonMap: Record<string, string> = {
  damaged: "منتج تالف أو مكسور",
  wrong_item: "استلام منتج خاطئ أو مختلف",
  defective: "خلل مصنعي أو لا يعمل بشكل صحيح",
  not_as_described: "غير مطابق للصور والمواصفات",
  changed_mind: "لم أعد بحاجة للمنتج / تغيير الرأي",
  late_delivery: "تأخر موعد التوصيل",
  other: "سبب آخر",
};

const refundMethodMap: Record<string, string> = {
  original_payment: "نفس وسيلة الدفع الأصلية",
  bank_transfer: "تحويل بنكي مباشر",
  wallet: "المحفظة الإلكترونية",
};

export default function Returns() {
  const qc = useQueryClient();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [editStatus, setEditStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-returns", search, filterStatus],
    queryFn: () =>
      api.get(`/admin/returns?search=${encodeURIComponent(search)}&status=${filterStatus}&per_page=50`),
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status, admin_notes }: { id: number; status: string; admin_notes: string }) =>
      api.put(`/admin/returns/${id}/status`, { status, admin_notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-returns"] });
      setSelectedReturn(null);
    },
  });

  const returnsList = data?.data || [];
  const totalCount = data?.total || 0;

  const pendingCount = returnsList.filter((r: any) => r.status === "pending").length;
  const approvedCount = returnsList.filter((r: any) => r.status === "approved").length;
  const refundedCount = returnsList.filter((r: any) => r.status === "refunded").length;

  const openModal = (ret: any) => {
    setSelectedReturn(ret);
    setEditStatus(ret.status);
    setAdminNotes(ret.admin_notes || "");
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;
    updateStatusMut.mutate({
      id: selectedReturn.id,
      status: editStatus,
      admin_notes: adminNotes,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 inline-flex">
              <RotateCcw className="w-6 h-6" />
            </span>
            طلبات الإرجاع واسترداد الأموال
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            إدارة طلبات الاسترجاع ومراجعة أسباب العملاء وإتمام عمليات استرداد المبالغ المالية
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-slate-400">إجمالي الطلبات</span>
            <RotateCcw className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalCount}</p>
        </div>

        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-amber-400">قيد المراجعة</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{pendingCount}</p>
        </div>

        <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-blue-400">تمت الموافقة</span>
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-400 mt-2">{approvedCount}</p>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-emerald-400">تم الاسترداد</span>
            <CreditCard className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{refundedCount}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={18} className="absolute top-3 right-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث برقم الطلب، اسم العميل، أو الهاتف..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="">كل الحالات</option>
            {Object.entries(returnStatusConfig).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-amber-500" />
          </div>
        ) : returnsList.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
              <RotateCcw className="w-8 h-8" />
            </div>
            <p className="text-lg font-bold text-slate-200">لا توجد طلبات إرجاع حالياً</p>
            <p className="text-sm text-slate-400 mt-1">ستظهر هنا أي طلبات استرجاع أو استرداد يقدمها العملاء</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="px-5 py-4 whitespace-nowrap">رقم الطلب</th>
                  <th className="px-5 py-4 whitespace-nowrap">العميل</th>
                  <th className="px-5 py-4 whitespace-nowrap">السبب</th>
                  <th className="px-5 py-4 whitespace-nowrap">مبلغ الاسترداد</th>
                  <th className="px-5 py-4 whitespace-nowrap">طريقة الاسترداد</th>
                  <th className="px-5 py-4 whitespace-nowrap">الحالة</th>
                  <th className="px-5 py-4 whitespace-nowrap">التاريخ</th>
                  <th className="px-5 py-4 text-center whitespace-nowrap">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {returnsList.map((item: any) => {
                  const s = returnStatusConfig[item.status] || returnStatusConfig.pending;
                  const Icon = s.icon;
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-amber-400">
                        {item.order_number}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-100">{item.customer_name}</div>
                        <div className="text-xs text-slate-400 font-mono">{item.customer_phone || item.customer_email || "-"}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-200">
                        <span className="line-clamp-1">{reasonMap[item.reason] || item.reason}</span>
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-400">
                        {item.refund_amount} {item.currency || "SAR"}
                      </td>
                      <td className="px-5 py-4 text-slate-300 text-xs">
                        {refundMethodMap[item.refund_method] || item.refund_method}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${s.cls}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => openModal(item)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs transition-all"
                        >
                          <Eye size={14} />
                          معاينة وتحديث
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail & Update Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-amber-400" />
                  طلب إرجاع: {selectedReturn.order_number}
                </h3>
                <span className="text-xs text-slate-400">
                  تاريخ الطلب: {new Date(selectedReturn.created_at).toLocaleString("ar-EG")}
                </span>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer & Return Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 text-sm">
              <div>
                <span className="text-slate-400 text-xs">اسم العميل:</span>
                <p className="font-semibold text-white">{selectedReturn.customer_name}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">رقم الهاتف:</span>
                <p className="font-semibold text-white font-mono">{selectedReturn.customer_phone || "-"}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">مبلغ الاسترداد:</span>
                <p className="font-bold text-emerald-400 text-base">
                  {selectedReturn.refund_amount} {selectedReturn.currency}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">طريقة الاسترداد:</span>
                <p className="font-semibold text-white">
                  {refundMethodMap[selectedReturn.refund_method] || selectedReturn.refund_method}
                </p>
              </div>
            </div>

            {/* Bank details if Bank Transfer */}
            {selectedReturn.bank_iban && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Building2 size={16} />
                  بيانات الحساب البنكي لتحويل المبلغ:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedReturn.bank_name && (
                    <div>
                      <span className="text-slate-400">اسم البنك: </span>
                      <strong className="text-slate-200">{selectedReturn.bank_name}</strong>
                    </div>
                  )}
                  {selectedReturn.bank_account_name && (
                    <div>
                      <span className="text-slate-400">اسم المستفيد: </span>
                      <strong className="text-slate-200">{selectedReturn.bank_account_name}</strong>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <span className="text-slate-400">رقم الآيبان (IBAN): </span>
                    <strong className="text-amber-300 font-mono text-sm tracking-wider">
                      {selectedReturn.bank_iban}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Return Reason & Explanation */}
            <div className="space-y-2 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <AlertCircle size={15} className="text-amber-400" />
                سبب الإرجاع المحدد من العميل:
              </div>
              <p className="font-bold text-amber-300 text-sm">
                {reasonMap[selectedReturn.reason] || selectedReturn.reason}
              </p>
              {selectedReturn.details && (
                <div className="pt-2 border-t border-slate-800 text-slate-300 text-sm leading-relaxed">
                  <span className="text-slate-400 text-xs block mb-1">تفاصيل وملاحظات العميل:</span>
                  {selectedReturn.details}
                </div>
              )}
            </div>

            {/* Status Update Form */}
            <form onSubmit={handleSaveStatus} className="space-y-4 pt-2 border-t border-slate-800">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">تحديث حالة الطلب:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-semibold outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="pending">🟡 قيد المراجعة والتدقيق</option>
                  <option value="approved">🔵 تمت الموافقة على الإرجاع (بانتظار شحن/استلام المنتج)</option>
                  <option value="items_received">🟣 تم استلام المنتجات المرتجعة في المستودع</option>
                  <option value="refunded">🟢 تم إتمام الاسترداد المالي للعميل بنجاح</option>
                  <option value="rejected">🔴 رفض طلب الإرجاع</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  ملاحظات الإدارة (تظهر للعميل في التطبيق):
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="مثال: تم قبول الإرجاع وسيتم إرسال مندوب لاستلام المنتج، أو تم تحويل المبلغ لحسابكم البنكي..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReturn(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMut.isPending}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-extrabold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {updateStatusMut.isPending ? "جارٍ الحفظ..." : "حفظ وتحديث الحالة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
