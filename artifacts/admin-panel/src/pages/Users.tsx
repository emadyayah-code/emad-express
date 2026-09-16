import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  Eye,
  Edit2,
  KeyRound,
  Trash2,
  X,
  UserPlus,
  Shield,
  UserCheck,
  Users as UsersIcon,
  CheckCircle2,
  XCircle,
  Download,
  RefreshCw,
  ShoppingBag,
  MapPin,
  Calendar,
  Phone,
  Mail,
} from "lucide-react";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Modals state
  const [viewUser, setViewUser] = useState<any>(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [resetPwdUser, setResetPwdUser] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    role: "customer",
    email_verified: true,
    address: "",
    city: "",
  });

  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "customer",
    address: "",
  });

  const [newPassword, setNewPassword] = useState("");
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch users list
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin_users", search, roleFilter, page],
    queryFn: () =>
      api.get(`/admin/users?search=${encodeURIComponent(search)}&role=${roleFilter}&page=${page}&per_page=30`),
  });

  const users = data?.data || [];
  const stats = data?.stats || { total: 0, customers: 0, admins: 0, staff: 0, verified: 0 };
  const totalCount = data?.total || 0;

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      setEditUser(null);
      showMessage("success", "تم تحديث بيانات المستخدم بنجاح");
    },
    onError: (err: any) => {
      showMessage("error", err?.response?.data?.message || err?.message || "فشل تحديث المستخدم");
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => api.post("/admin/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      setShowCreateModal(false);
      setCreateForm({ name: "", email: "", password: "", phone: "", role: "customer", address: "" });
      showMessage("success", "تم إنشاء الحساب بنجاح");
    },
    onError: (err: any) => {
      showMessage("error", err?.response?.data?.message || err?.message || "فشل إنشاء الحساب");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      api.post(`/admin/users/${id}/reset-password`, { password }),
    onSuccess: () => {
      setResetPwdUser(null);
      setNewPassword("");
      showMessage("success", "تم تغيير كلمة المرور بنجاح");
    },
    onError: (err: any) => {
      showMessage("error", err?.response?.data?.message || err?.message || "فشل تغيير كلمة المرور");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      showMessage("success", "تم حذف المستخدم بنجاح");
    },
    onError: (err: any) => {
      showMessage("error", err?.response?.data?.message || err?.message || "فشل حذف المستخدم");
    },
  });

  function showMessage(type: "success" | "error", text: string) {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  }

  function handleOpenEdit(u: any) {
    setEditUser(u);
    setEditForm({
      name: u.name || "",
      phone: u.phone || "",
      role: u.role || "customer",
      email_verified: Boolean(u.email_verified),
      address: u.address || "",
      city: u.city || "",
    });
  }

  function exportCSV() {
    if (!users.length) return;
    const headers = ["المعرف", "الاسم", "البريد الإلكتروني", "رقم الهاتف", "الصلاحية", "حالة التفعيل", "العنوان", "تاريخ التسجيل"];
    const rows = users.map((u: any) => [
      u.id,
      `"${u.name}"`,
      u.email,
      `"${u.phone || ""}"`,
      u.role,
      u.email_verified ? "مفعل" : "غير مفعل",
      `"${u.address || ""}"`,
      new Date(u.created_at).toLocaleDateString("ar-SA"),
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case "admin":
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">👑 مدير النظام</span>;
      case "manager":
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-semibold">مدير متجر</span>;
      case "sales":
      case "support":
      case "accountant":
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-semibold">فريق العمل ({role})</span>;
      case "vendor":
        return <span className="bg-cyan-100 text-cyan-800 text-xs px-2.5 py-1 rounded-full font-semibold">بائع / تاجر</span>;
      default:
        return <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold">عميل</span>;
    }
  }

  return (
    <div className="space-y-6">
      {/* Alert banner */}
      {actionMsg && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm transition-all ${
          actionMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)}><X size={16} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">بيانات المستخدمين والعملاء</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة شاملة لجميع حسابات المستخدمين، العملاء، والصلاحيات في النظام</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <Download size={15} /> تصدير CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-black shadow-sm transition-all"
          >
            <UserPlus size={16} /> إضافة مستخدم جديد
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <UsersIcon size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">إجمالي المستخدمين</p>
            <p className="text-xl font-bold text-gray-800">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">العملاء المسجلين</p>
            <p className="text-xl font-bold text-gray-800">{stats.customers}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Shield size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">المدراء وفريق العمل</p>
            <p className="text-xl font-bold text-gray-800">{stats.admins + stats.staff}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">الحسابات المفعلة</p>
            <p className="text-xl font-bold text-gray-800">{stats.verified}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute top-3 right-3 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="بحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
              className="w-full border border-gray-200 rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              title="تحديث البيانات"
            >
              <RefreshCw size={16} />
            </button>
            <span className="text-xs text-gray-500 font-medium">عرض {users.length} من أصل {totalCount}</span>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm border-t border-gray-100 pt-3">
          {[
            { id: "all", label: "الكل" },
            { id: "customer", label: "العملاء" },
            { id: "admin", label: "المدراء" },
            { id: "manager", label: "مدراء المتاجر" },
            { id: "sales", label: "المبيعات" },
            { id: "support", label: "الدعم الفني" },
            { id: "vendor", label: "البائعون" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setRoleFilter(tab.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                roleFilter === tab.id
                  ? "bg-amber-500 text-black shadow-sm font-bold"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <UsersIcon size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="font-semibold text-gray-700">لا يوجد مستخدمون مطابقون للبحث</p>
            <p className="text-xs text-gray-400 mt-1">جرّب تغيير كلمات البحث أو الفلاتر</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">المستخدم</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">الهاتف</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">الصلاحية</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">حالة التفعيل</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">الطلبات / الإنفاق</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">تاريخ التسجيل</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                          {u.name?.charAt(0) || "ع"}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {u.phone ? (
                        <a href={`tel:${u.phone}`} className="hover:text-amber-600 font-semibold">{u.phone}</a>
                      ) : (
                        <span className="text-gray-300">غير مسجل</span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {getRoleBadge(u.role)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {u.email_verified ? (
                        <span className="text-emerald-600 text-xs font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 size={14} /> مفعل
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium inline-flex items-center gap-1">
                          <XCircle size={14} /> قيد التأكيد
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs">
                        <span className="font-bold text-gray-800">{u.total_orders || 0} طلب</span>
                        <span className="text-gray-400 mx-1">•</span>
                        <span className="text-amber-600 font-bold">{(u.total_spent || 0).toLocaleString()} ر.س</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewUser(u)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                          title="تعديل البيانات"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => { setResetPwdUser(u); setNewPassword(""); }}
                          className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                          title="إعادة تعيين كلمة المرور"
                        >
                          <KeyRound size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف حساب المستخدم "${u.name}"؟`)) {
                              deleteUserMutation.mutate(u.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="حذف المستخدم"
                        >
                          <Trash2 size={16} />
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

      {/* VIEW USER DETAILS MODAL */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg">تفاصيل المستخدم</h3>
              <button onClick={() => setViewUser(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Card */}
              <div className="flex items-center gap-4 bg-gradient-to-r from-amber-500/10 to-amber-500/5 p-4 rounded-2xl border border-amber-500/20">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center text-2xl font-bold shadow-md">
                  {viewUser.name?.charAt(0) || "ع"}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-800">{viewUser.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(viewUser.role)}
                    {viewUser.email_verified && (
                      <span className="text-emerald-700 bg-emerald-100 text-xs px-2 py-0.5 rounded-full font-semibold">مفعل</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-3 bg-gray-50 rounded-xl p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5"><Mail size={15} /> البريد الإلكتروني:</span>
                  <span className="font-semibold text-gray-800 font-mono">{viewUser.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5"><Phone size={15} /> رقم الهاتف:</span>
                  <span className="font-semibold text-gray-800 font-mono">{viewUser.phone || "غير مسجل"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5"><MapPin size={15} /> العنوان المسجل:</span>
                  <span className="font-semibold text-gray-800">{viewUser.address || "لا يوجد عنوان"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5"><Calendar size={15} /> تاريخ الانضمام:</span>
                  <span className="font-semibold text-gray-800">{new Date(viewUser.created_at).toLocaleString("ar-SA")}</span>
                </div>
              </div>

              {/* Commerce stats */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-xl font-bold text-amber-700">{viewUser.total_orders || 0}</p>
                  <p className="text-xs text-amber-900/70 font-medium">عدد الطلبات</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <p className="text-xl font-bold text-emerald-700">{(viewUser.total_spent || 0).toLocaleString()}</p>
                  <p className="text-xs text-emerald-900/70 font-medium">إجمالي المشتريات (ر.س)</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-xl font-bold text-blue-700">{viewUser.loyalty_points || 0}</p>
                  <p className="text-xs text-blue-900/70 font-medium">نقاط الولاء</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    const u = viewUser;
                    setViewUser(null);
                    handleOpenEdit(u);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-bold"
                >
                  تعديل بيانات المستخدم
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg">تعديل بيانات المستخدم</h3>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateUserMutation.mutate({ id: editUser.id, data: editForm });
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">الاسم الكامل</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">رقم الهاتف</label>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="+966xxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">الصلاحية / الدور</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                  <option value="customer">عميل (Customer)</option>
                  <option value="admin">مدير النظام (Admin)</option>
                  <option value="manager">مدير متجر (Manager)</option>
                  <option value="sales">فريق المبيعات (Sales)</option>
                  <option value="support">فريق الدعم (Support)</option>
                  <option value="accountant">محاسب (Accountant)</option>
                  <option value="vendor">بائع / تاجر (Vendor)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">العنوان</label>
                <input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="المدينة، الحي، الشارع"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="email_verified"
                  checked={editForm.email_verified}
                  onChange={(e) => setEditForm({ ...editForm, email_verified: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-400 h-4 w-4"
                />
                <label htmlFor="email_verified" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  تأكيد وتفعيل البريد الإلكتروني والحساب
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-bold shadow-sm"
                >
                  {updateUserMutation.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg">إضافة مستخدم جديد</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createUserMutation.mutate(createForm);
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">الاسم الكامل *</label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="مثال: محمد أحمد"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">البريد الإلكتروني *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">كلمة المرور * (6 خانات على الأقل)</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">رقم الهاتف</label>
                <input
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="+966xxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">الصلاحية / الدور</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                  <option value="customer">عميل (Customer)</option>
                  <option value="admin">مدير النظام (Admin)</option>
                  <option value="manager">مدير متجر (Manager)</option>
                  <option value="sales">فريق المبيعات (Sales)</option>
                  <option value="support">فريق الدعم (Support)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">العنوان (اختياري)</label>
                <input
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="المدينة، العنوان"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-bold shadow-sm"
                >
                  {createUserMutation.isPending ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPwdUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg">تغيير كلمة المرور</h3>
              <button onClick={() => setResetPwdUser(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                resetPasswordMutation.mutate({ id: resetPwdUser.id, password: newPassword });
              }}
              className="p-5 space-y-4"
            >
              <div className="text-xs text-gray-500">
                أنت تقوم بتعيين كلمة مرور جديدة للمستخدم: <span className="font-bold text-gray-800">{resetPwdUser.name}</span> ({resetPwdUser.email})
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">كلمة المرور الجديدة *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="6 أحرف على الأقل"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setResetPwdUser(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-sm"
                >
                  {resetPasswordMutation.isPending ? "جارٍ التحديث..." : "تحديث كلمة المرور"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
