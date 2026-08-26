import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const tabs = [
  { key: "balance-sheet", label: "الميزانية العمومية" },
  { key: "income-statement", label: "قائمة الدخل" },
  { key: "cash-flow", label: "التدفقات النقدية" },
  { key: "trial-balance", label: "ميزان المراجعة" },
];

function Stat({ label, value, color = "text-gray-800" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function Accounting() {
  const [tab, setTab] = useState("balance-sheet");

  const { data, isLoading } = useQuery({
    queryKey: ["accounting", tab],
    queryFn: () => api.get(`/accounting/${tab}`),
  });

  const fmt = (n: number) => n ? `${n.toLocaleString("ar-SA")} ريال` : "0 ريال";

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">المحاسبة</h1>
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button
            key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? "bg-amber-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {tab === "balance-sheet" && data && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">الميزانية العمومية</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Stat label="إجمالي الأصول" value={fmt(data.assets)} color="text-blue-700" />
                <Stat label="إجمالي الالتزامات" value={fmt(data.liabilities)} color="text-red-600" />
                <Stat label="حقوق الملكية" value={fmt(data.equity)} color="text-green-600" />
              </div>
              <div className={`flex items-center gap-2 text-sm ${data.is_balanced ? "text-green-600" : "text-red-600"}`}>
                <span className={`w-2 h-2 rounded-full ${data.is_balanced ? "bg-green-500" : "bg-red-500"}`} />
                {data.is_balanced ? "الميزانية متوازنة" : "الميزانية غير متوازنة!"}
              </div>
            </div>
          )}
          {tab === "income-statement" && data && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">قائمة الدخل</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Stat label="إجمالي الإيرادات" value={fmt(data.revenues)} color="text-blue-700" />
                <Stat label="إجمالي المصروفات" value={fmt(data.expenses)} color="text-red-600" />
                <Stat label="صافي الدخل" value={fmt(data.net_income)} color={data.net_income >= 0 ? "text-green-600" : "text-red-600"} />
              </div>
              <div className="mt-4 bg-amber-50 rounded-lg p-4">
                <p className="text-sm text-amber-700">هامش الربح: <span className="font-bold">{data.profit_margin}%</span></p>
              </div>
            </div>
          )}
          {tab === "cash-flow" && data && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">التدفقات النقدية</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Stat label="الرصيد الافتتاحي" value={fmt(data.opening_balance)} />
                <Stat label="صافي التغيير" value={fmt(data.net_change)} color={data.net_change >= 0 ? "text-green-600" : "text-red-600"} />
                <Stat label="الرصيد الختامي" value={fmt(data.closing_balance)} color="text-blue-700" />
              </div>
            </div>
          )}
          {tab === "trial-balance" && data && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">ميزان المراجعة</h2>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">الكود</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">الحساب</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">مدين</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">دائن</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.accounts || []).map((a: any) => (
                      <tr key={a.code} className="border-t border-gray-50">
                        <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{a.code}</td>
                        <td className="px-4 py-2.5 text-gray-700">{a.name}</td>
                        <td className="px-4 py-2.5 text-gray-800">{a.debit > 0 ? a.debit.toLocaleString() : "-"}</td>
                        <td className="px-4 py-2.5 text-gray-800">{a.credit > 0 ? a.credit.toLocaleString() : "-"}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                      <td className="px-4 py-3" colSpan={2}>الإجمالي</td>
                      <td className="px-4 py-3">{data.total_debit?.toLocaleString()}</td>
                      <td className="px-4 py-3">{data.total_credit?.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={`flex items-center gap-2 text-sm ${data.is_balanced ? "text-green-600" : "text-red-600"}`}>
                <span className={`w-2 h-2 rounded-full ${data.is_balanced ? "bg-green-500" : "bg-red-500"}`} />
                {data.is_balanced ? "الميزان متوازن" : "الميزان غير متوازن!"}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
