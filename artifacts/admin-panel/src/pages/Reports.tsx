import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";

export default function Reports() {
  const { data: sales, isLoading: loadSales } = useQuery({ queryKey: ["reports-sales"], queryFn: () => api.get("/reports/sales") });
  const { data: inventory, isLoading: loadInv } = useQuery({ queryKey: ["reports-inventory"], queryFn: () => api.get("/reports/inventory") });
  const { data: custs, isLoading: loadCusts } = useQuery({ queryKey: ["reports-customers"], queryFn: () => api.get("/reports/customers") });

  const chartData = (sales?.daily_sales || []).map((d: any) => ({
    date: d.date.slice(5),
    amount: d.amount,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">التقارير</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "إجمالي المبيعات", value: `${sales?.total_sales?.toLocaleString() || 0} ريال` },
          { label: "متوسط قيمة الطلب", value: `${sales?.average_order_value?.toFixed(0) || 0} ريال` },
          { label: "هامش الربح", value: `${sales?.profit_margin || 0}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">المبيعات اليومية</h2>
        {loadSales ? <div className="flex justify-center h-40 items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v.toLocaleString()} ريال`, "المبيعات"]} />
              <Line type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 4 }} name="المبيعات" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">المنتجات منخفضة المخزون</h2>
          {loadInv ? <div className="flex justify-center h-20 items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div> : (
            <div className="space-y-2">
              {(inventory?.low_stock || []).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">لا يوجد منتجات بمخزون منخفض</p>
              ) : (
                (inventory?.low_stock || []).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between bg-red-50 rounded-lg px-4 py-2.5">
                    <span className="text-sm font-medium text-gray-700">{p.name}</span>
                    <span className="text-sm text-red-600 font-bold">{p.quantity} قطعة</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">أفضل العملاء</h2>
          {loadCusts ? <div className="flex justify-center h-20 items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div> : (
            <div className="space-y-2">
              {(custs?.top_customers || []).slice(0, 5).map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.total_orders} طلبات</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{c.total_spent.toLocaleString()} ر</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
