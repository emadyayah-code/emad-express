import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ShoppingBag, Users, Package, TrendingUp } from "lucide-react";

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "قيد الانتظار", cls: "bg-yellow-100 text-yellow-700" },
  processing: { label: "قيد المعالجة", cls: "bg-blue-100 text-blue-700" },
  shipped: { label: "تم الشحن", cls: "bg-purple-100 text-purple-700" },
  delivered: { label: "تم التسليم", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "ملغي", cls: "bg-red-100 text-red-700" },
};

function formatMoney(n: number) {
  return n.toLocaleString("ar-SA") + " ريال";
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => api.get("/admin/dashboard") });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
    </div>
  );

  const stats = [
    { icon: TrendingUp, label: "إجمالي المبيعات", value: formatMoney(data?.total_sales || 0), color: "text-green-600 bg-green-50" },
    { icon: ShoppingBag, label: "عدد الطلبات", value: data?.total_orders || 0, color: "text-blue-600 bg-blue-50" },
    { icon: Users, label: "عدد العملاء", value: data?.total_customers || 0, color: "text-purple-600 bg-purple-50" },
    { icon: Package, label: "عدد المنتجات", value: data?.total_products || 0, color: "text-amber-600 bg-amber-50" },
  ];

  const chartData = (data?.top_products || []).map((p: any) => ({ name: p.name.split(" ").slice(0, 2).join(" "), sold: p.sold_count }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className={`inline-flex p-2.5 rounded-lg ${color} mb-3`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">أعلى المنتجات مبيعاً</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="sold" fill="#f59e0b" radius={4} name="المبيعات" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">آخر الطلبات</h2>
          <div className="space-y-3">
            {(data?.recent_orders || []).map((order: any) => {
              const s = statusMap[order.status] || { label: order.status, cls: "bg-gray-100 text-gray-600" };
              return (
                <div key={order.order_number} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{order.order_number}</p>
                    <p className="text-xs text-gray-500">{order.customer_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.cls}`}>{s.label}</span>
                    <span className="text-sm font-semibold text-gray-700">{order.total.toLocaleString()} ر</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
