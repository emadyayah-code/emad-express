import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, CreditCard, ArrowDownLeft, Wallet } from "lucide-react";

const PLATFORM_INFO: Record<string, { name: string; flag: string; color: string; bg: string }> = {
  aliexpress: { name: "علي إكسبرس", flag: "🇨🇳", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  amazon:     { name: "أمازون",      flag: "🛒", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  alibaba:    { name: "علي بابا",    flag: "🏪", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  other:      { name: "مباشر",       flag: "🏪", color: "text-blue-700",  bg: "bg-blue-50 border-blue-200" },
};

export default function SupplierPayments() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | "pending" | "paid">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["supplier-payments"],
    queryFn: () => api.get("/admin/supplier-payments"),
  });

  const markPaidMut = useMutation({
    mutationFn: (id: number) => api.put(`/admin/supplier-payments/${id}/mark-paid`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supplier-payments"] }),
  });

  const markAllMut = useMutation({
    mutationFn: () => api.put("/admin/supplier-payments/mark-all-paid", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supplier-payments"] }),
  });

  const d = data || {};
  const allRows: any[] = d.data || [];
  const rows = tab === "pending" ? allRows.filter(r => r.status === "pending")
    : tab === "paid" ? allRows.filter(r => r.status === "paid")
    : allRows;

  const pendingCount = allRows.filter(r => r.status === "pending").length;

  const statCards = [
    {
      label: "مستحق للموردين",
      value: `${(d.total_owed || 0).toLocaleString()} ر`,
      icon: AlertCircle,
      color: "bg-red-50 text-red-600",
      sub: `${pendingCount} طلب بانتظار الدفع`,
      urgent: true,
    },
    {
      label: "تم دفعه للموردين",
      value: `${(d.total_paid || 0).toLocaleString()} ر`,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
      sub: `${allRows.filter(r => r.status === "paid").length} طلب مسدّد`,
    },
    {
      label: "صافي ربحك",
      value: `${(d.total_profit || 0).toLocaleString()} ر`,
      icon: TrendingUp,
      color: "bg-amber-50 text-amber-600",
      sub: "إجمالي هامش الربح من جميع الطلبات",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">مدفوعات الموردين</h1>
          <p className="text-sm text-gray-400 mt-1">تتبع تلقائي لما يُدفع للمورد عند إرسال كل طلب</p>
        </div>
        {pendingCount > 0 && (
          <button
            onClick={() => markAllMut.mutate()}
            disabled={markAllMut.isPending}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
          >
            <CheckCircle size={15} />
            تسجيل كل المدفوعات ({pendingCount})
          </button>
        )}
      </div>

      {/* How it works banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
        <Wallet size={20} className="text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-amber-300 font-semibold text-sm">كيف يعمل النظام التلقائي؟</p>
          <p className="text-amber-200/70 text-xs mt-1 leading-relaxed">
            عند الضغط على "إرسال للمورد" في صفحة الطلبات، يحسب النظام تلقائياً تكلفة المورد (سعر المصدر) وربحك (ما دفعه العميل − تكلفة المورد) ويسجلها هنا. أدفع للمورد عبر منصته (علي إكسبرس / أمازون) ثم اضغط "سُدِّد" لتحديث السجل.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(s => (
          <div key={s.label} className={`rounded-xl p-4 border ${s.urgent ? "border-red-200 bg-red-50/10" : "border-white/10 bg-[#1a1a1a]"}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon size={18} />
              </div>
              <span className="text-xs text-gray-400">{s.label}</span>
            </div>
            <p className={`text-xl font-bold ${s.urgent ? "text-red-400" : "text-white"}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "paid"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-amber-500 text-black" : "bg-[#1a1a1a] text-gray-300 border border-white/10 hover:bg-white/5"}`}
          >
            {t === "all" ? `الكل (${allRows.length})` : t === "pending" ? `مستحق (${pendingCount})` : `مسدَّد (${allRows.filter(r => r.status === "paid").length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="text-center text-gray-400 py-12">جارٍ التحميل...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <CreditCard size={40} className="mx-auto text-gray-600" />
            <p className="text-gray-400 font-medium">لا توجد مدفوعات بعد</p>
            <p className="text-gray-500 text-sm">أرسل طلباً لمورد من صفحة الطلبات وسيُسجَّل هنا تلقائياً</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-right text-gray-400 font-medium px-4 py-3">رقم الطلب</th>
                  <th className="text-right text-gray-400 font-medium px-4 py-3">المنصة</th>
                  <th className="text-right text-gray-400 font-medium px-4 py-3">دفع العميل</th>
                  <th className="text-right text-gray-400 font-medium px-4 py-3">تكلفة المورد</th>
                  <th className="text-right text-gray-400 font-medium px-4 py-3">ربحك</th>
                  <th className="text-right text-gray-400 font-medium px-4 py-3">الحالة</th>
                  <th className="text-right text-gray-400 font-medium px-4 py-3">التاريخ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row: any) => {
                  const p = PLATFORM_INFO[row.platform] || PLATFORM_INFO.other;
                  const isPending = row.status === "pending";
                  return (
                    <tr key={row.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white font-semibold">{row.order_number}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${p.bg} ${p.color}`}>
                          {p.flag} {p.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white">{row.customer_paid?.toLocaleString()} ر</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${isPending ? "text-red-400" : "text-gray-300"}`}>
                          {row.supplier_cost?.toLocaleString()} ر
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${row.admin_profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {row.admin_profit?.toLocaleString()} ر
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isPending ? (
                          <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-1 rounded-lg w-fit">
                            <Clock size={11} /> مستحق
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2.5 py-1 rounded-lg w-fit">
                            <CheckCircle size={11} /> سُدِّد
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(row.created_at).toLocaleDateString("ar-SA")}
                      </td>
                      <td className="px-4 py-3">
                        {isPending && (
                          <button
                            onClick={() => markPaidMut.mutate(row.id)}
                            disabled={markPaidMut.isPending}
                            className="text-xs bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-600/30 px-3 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-60"
                          >
                            سُدِّد ✓
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
