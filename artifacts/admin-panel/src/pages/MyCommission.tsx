import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DollarSign, TrendingUp, ShoppingBag, BarChart2, Settings, CheckCircle, Package, ExternalLink } from "lucide-react";

const PLATFORM_INFO: Record<string, { name: string; flag: string; color: string; bg: string }> = {
  aliexpress: { name: "علي إكسبرس", flag: "🇨🇳", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  amazon: { name: "أمازون", flag: "🛒", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  alibaba: { name: "علي بابا", flag: "🏪", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  other: { name: "مبيعات مباشرة", flag: "🏪", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
};

export default function MyCommission() {
  const qc = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [newRate, setNewRate] = useState<string>("");
  const [tab, setTab] = useState<"overview" | "by_platform" | "orders">("overview");

  const { data, isLoading } = useQuery({
    queryKey: ["my-commission"],
    queryFn: () => api.get("/admin/my-commission"),
  });

  const saveMut = useMutation({
    mutationFn: (rate: number) => api.post("/admin/my-commission/settings", { commission_rate: rate }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-commission"] }); setShowSettings(false); },
  });

  const d = data || {};
  const rate = d.commission_rate ?? 15;

  const topStats = [
    { label: "إجمالي المبيعات", value: `${(d.total_revenue || 0).toLocaleString()}`, unit: "ر", icon: ShoppingBag, color: "bg-blue-50 text-blue-600", sub: `${d.orders_count || 0} طلب مدفوع` },
    { label: "ربح هامش السعر", value: `${(d.total_profit || 0).toLocaleString()}`, unit: "ر", icon: TrendingUp, color: "bg-green-50 text-green-600", sub: `${d.total_revenue > 0 ? ((d.total_profit / d.total_revenue) * 100).toFixed(1) : 0}% من المبيعات` },
    { label: "عمولة المنصات", value: `${(d.total_affiliate_commission || 0).toLocaleString()}`, unit: "ر", icon: ExternalLink, color: "bg-purple-50 text-purple-600", sub: "إحالات علي إكسبرس / أمازون / علي بابا" },
    { label: "إجمالي عمولتي", value: `${(d.total_my_commission || 0).toLocaleString()}`, unit: "ر", icon: DollarSign, color: "bg-amber-50 text-amber-600", sub: `${rate}% من المبيعات` },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">عمولاتي</h1>
          <p className="text-sm text-gray-500 mt-0.5">أرباحك من المتجر + عمولات المنصات</p>
        </div>
        <button
          onClick={() => { setNewRate(String(rate)); setShowSettings(!showSettings); }}
          className="flex items-center gap-2 border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Settings size={15} /> ضبط نسبة عمولتي
        </button>
      </div>

      {showSettings && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-1">نسبة عمولتي من كل بيع</h3>
          <p className="text-sm text-gray-500 mb-4">
            النسبة التي تأخذها من إجمالي كل طلب مدفوع (منفصلة عن عمولات المنصات).
          </p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input type="number" min="0" max="100" step="0.5" value={newRate} onChange={e => setNewRate(e.target.value)}
                className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 text-center text-lg font-bold" />
              <span className="absolute left-3 top-2 text-gray-400 text-sm">%</span>
            </div>
            <button onClick={() => saveMut.mutate(parseFloat(newRate))} disabled={saveMut.isPending}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
              {saveMut.isPending ? "جارٍ الحفظ..." : <><CheckCircle size={15} /> حفظ</>}
            </button>
            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 text-sm">إلغاء</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>
      ) : (
        <>
          {/* Top Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {topStats.map(({ label, value, unit, icon: Icon, color, sub }) => (
              <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}><Icon size={18} /></div>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
                <p className="text-xl font-bold text-gray-800">{value} <span className="text-sm font-normal text-gray-500">{unit}</span></p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Sub tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {[
              { id: "overview", label: "ملخص" },
              { id: "by_platform", label: "حسب المنصة" },
              { id: "orders", label: "تفاصيل الطلبات" },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-white shadow-sm text-amber-600" : "text-gray-500 hover:text-gray-700"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {tab === "overview" && (
            <div className="space-y-4">
              {/* Monthly Chart */}
              {(d.monthly || []).length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 size={18} className="text-amber-500" />
                    <h3 className="font-semibold text-gray-800">عمولاتي الشهرية</h3>
                    <span className="text-xs text-gray-400 mr-auto">عمولة المنصات + هامش السعر</span>
                  </div>
                  <div className="space-y-3">
                    {(d.monthly || []).map((m: any) => {
                      const maxVal = Math.max(...(d.monthly || []).map((x: any) => x.commission));
                      const pct = maxVal > 0 ? (m.commission / maxVal) * 100 : 0;
                      return (
                        <div key={m.month} className="flex items-center gap-3">
                          <span className="text-sm text-gray-500 w-28 text-left flex-shrink-0">{m.month}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                            <div className="h-full rounded-full flex items-center justify-end pl-2"
                              style={{ width: `${Math.max(pct, 8)}%`, background: "linear-gradient(90deg, #f59e0b, #d97706)" }}>
                              <span className="text-xs text-white font-medium">{m.commission.toLocaleString()}</span>
                            </div>
                          </div>
                          <span className="text-xs text-purple-500 w-16 text-right flex-shrink-0">+{(m.affiliate || 0).toLocaleString()} إحالة</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Earnings breakdown box */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-800 mb-4">تفصيل أرباحك</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-600">هامش السعر (سعر البيع − تكلفة المورد)</span>
                    <span className="font-bold text-green-700">+{(d.total_profit || 0).toLocaleString()} ر</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-600">عمولات الإحالة من المنصات</span>
                    <span className="font-bold text-purple-700">+{(d.total_affiliate_commission || 0).toLocaleString()} ر</span>
                  </div>
                  <div className="flex justify-between items-center py-2 bg-amber-50 rounded-lg px-3 mt-2">
                    <span className="font-semibold text-amber-800">عمولتي ({rate}% من المبيعات)</span>
                    <span className="text-xl font-bold text-amber-700">+{(d.total_my_commission || 0).toLocaleString()} ر</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* By Platform Tab */}
          {tab === "by_platform" && (
            <div className="space-y-3">
              {(d.by_platform || []).length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
                  <ExternalLink size={36} className="mx-auto mb-3 opacity-30" />
                  <p>لا توجد مبيعات من منصات خارجية بعد</p>
                  <p className="text-xs mt-1">استورد منتجات من علي إكسبرس أو أمازون لتظهر هنا</p>
                </div>
              ) : (
                (d.by_platform || []).map((p: any) => {
                  const info = PLATFORM_INFO[p.platform] || PLATFORM_INFO.other;
                  return (
                    <div key={p.platform} className={`bg-white rounded-xl border p-5 ${info.bg}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{info.flag}</span>
                          <div>
                            <p className="font-semibold text-gray-800">{info.name}</p>
                            <p className="text-xs text-gray-500">{p.orders_count} طلب · عمولة الإحالة: {p.commission_rate}%</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-gray-500">إجمالي أرباحي</p>
                          <p className={`text-xl font-bold ${info.color}`}>+{p.total_earnings.toLocaleString()} ر</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-white/60 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500 mb-1">المبيعات</p>
                          <p className="font-bold text-gray-800">{p.revenue.toLocaleString()} ر</p>
                        </div>
                        <div className="bg-white/60 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500 mb-1">هامش السعر</p>
                          <p className="font-bold text-green-700">+{p.markup.toLocaleString()} ر</p>
                        </div>
                        <div className="bg-white/60 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500 mb-1">عمولة إحالة</p>
                          <p className="font-bold text-purple-700">+{p.affiliate_commission.toLocaleString()} ر</p>
                        </div>
                      </div>
                      {p.commission_rate === 0 && (
                        <p className="text-xs text-amber-700 mt-3 bg-amber-50 rounded px-2 py-1">
                          💡 لم تحدد نسبة عمولة الإحالة لهذه المنصة — أضفها في إعدادات الدروبشيبينغ
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Orders Tab */}
          {tab === "orders" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <DollarSign size={16} className="text-amber-500" />
                <h3 className="font-semibold text-gray-800">عمولات الطلبات</h3>
              </div>
              {(d.orders || []).length === 0 ? (
                <div className="text-center py-12 text-gray-400"><DollarSign size={36} className="mx-auto mb-2 opacity-30" /><p>لا توجد طلبات مدفوعة</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["رقم الطلب", "العميل", "المنصة", "قيمة الطلب", "هامش الربح", "عمولة إحالة", "عمولتي"].map(h => (
                          <th key={h} className="text-right px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(d.orders || []).map((o: any) => (
                        <tr key={o.order_number} className="border-b border-gray-50 hover:bg-amber-50/30">
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">{o.order_number}</td>
                          <td className="px-4 py-3 text-gray-800">{o.customer_name}</td>
                          <td className="px-4 py-3">
                            {(o.platforms || []).map((plt: string) => {
                              const info = PLATFORM_INFO[plt] || PLATFORM_INFO.other;
                              return <span key={plt} className="text-xs">{info.flag} </span>;
                            })}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{o.total.toLocaleString()} ر</td>
                          <td className="px-4 py-3"><span className="text-green-700 font-semibold">+{(o.markup || o.profit || 0).toLocaleString()} ر</span></td>
                          <td className="px-4 py-3"><span className="text-purple-600 font-semibold">+{(o.affiliate_commission || 0).toLocaleString()} ر</span></td>
                          <td className="px-4 py-3">
                            <span className="bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded-lg text-sm">+{o.my_commission.toLocaleString()} ر</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-amber-50 border-t-2 border-amber-200">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 font-bold text-gray-700">الإجمالي</td>
                        <td className="px-4 py-3 font-bold text-green-700">+{(d.total_profit || 0).toLocaleString()} ر</td>
                        <td className="px-4 py-3 font-bold text-purple-700">+{(d.total_affiliate_commission || 0).toLocaleString()} ر</td>
                        <td className="px-4 py-3 font-bold text-amber-700 text-base">+{(d.total_my_commission || 0).toLocaleString()} ر</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
