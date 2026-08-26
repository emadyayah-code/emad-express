import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search, Eye, X } from "lucide-react";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [viewCustomer, setViewCustomer] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: () => api.get(`/admin/customers?search=${encodeURIComponent(search)}&per_page=50`),
  });

  const customers = data?.data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">العملاء</h1>
        <span className="text-sm text-gray-500">{data?.total || 0} عميل</span>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative max-w-xs">
          <Search size={16} className="absolute top-2.5 right-3 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد..." className="w-full border border-gray-200 rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["العميل", "الهاتف", "عدد الطلبات", "إجمالي الإنفاق", "نقاط الولاء", ""].map(h => (
                    <th key={h} className="text-right px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c: any) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                    <td className="px-4 py-3 text-center font-medium text-gray-800">{c.total_orders}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{c.total_spent.toLocaleString()} ر</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">{c.loyalty_points} نقطة</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setViewCustomer(c)} className="text-blue-500 hover:text-blue-700"><Eye size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {viewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-800">تفاصيل العميل</h3>
              <button onClick={() => setViewCustomer(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-2xl font-bold">
                  {viewCustomer.name.charAt(0)}
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">{viewCustomer.name}</p>
                  <p className="text-sm text-gray-500">{viewCustomer.email}</p>
                  <p className="text-sm text-gray-500">{viewCustomer.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-gray-800">{viewCustomer.total_orders}</p>
                  <p className="text-xs text-gray-500">طلب</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-gray-800">{viewCustomer.total_spent.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">ريال</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-gray-800">{viewCustomer.loyalty_points}</p>
                  <p className="text-xs text-gray-500">نقطة</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">العنوان</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{viewCustomer.address}</p>
              </div>
              {viewCustomer.recent_orders?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">آخر الطلبات</p>
                  <div className="space-y-2">
                    {viewCustomer.recent_orders.map((o: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg p-3 text-sm">
                        <span className="font-mono text-xs text-gray-600">{o.order_number}</span>
                        <span className="font-medium">{o.total?.toLocaleString()} ر</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
