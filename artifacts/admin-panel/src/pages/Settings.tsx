import { useState, type ReactElement } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { User, Lock, Plus, Trash2, Edit2, X, Check, Shield, Smartphone, Phone, Facebook, Twitter, MapPin, Info } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "مدير عام",
  manager: "مدير",
  sales: "مبيعات",
  support: "دعم فني",
  accountant: "محاسب",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "#f59e0b",
  manager: "#6366f1",
  sales: "#22c55e",
  support: "#3b82f6",
  accountant: "#a855f7",
};

function ProfileTab() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function save() {
    setMsg(null);
    try {
      const body: any = { name, email };
      if (newPw) { body.password = newPw; body.current_password = currentPw; }
      await api.put("/admin/my-profile", body);
      setMsg({ type: "ok", text: "تم حفظ التغييرات بنجاح ✓" });
      setCurrentPw(""); setNewPw("");
    } catch (e: any) {
      setMsg({ type: "err", text: e.message || "حدث خطأ" });
    }
  }

  const inp = "w-full px-4 py-3 rounded-xl text-white text-sm outline-none border transition-all";
  const inpStyle = { background: "rgba(255,255,255,0.05)", borderColor: "rgba(245,158,11,0.2)" };

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-black" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-white font-bold text-lg">{user?.name}</p>
          <p className="text-white/40 text-sm">{user?.email}</p>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === "ok" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {msg.text}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-white/60 text-xs mb-1 block">الاسم</label>
          <input className={inp} style={inpStyle} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-white/60 text-xs mb-1 block">البريد الإلكتروني</label>
          <input className={inp} style={inpStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} dir="ltr" />
        </div>
        <div style={{ borderTop: "1px solid rgba(245,158,11,0.1)", paddingTop: 16, marginTop: 8 }}>
          <p className="text-white/60 text-xs mb-3 flex items-center gap-1"><Lock size={12} /> تغيير كلمة المرور (اختياري)</p>
          <div className="space-y-3">
            <input className={inp} style={inpStyle} type="password" placeholder="كلمة المرور الحالية" value={currentPw} onChange={e => setCurrentPw(e.target.value)} dir="ltr" />
            <input className={inp} style={inpStyle} type="password" placeholder="كلمة المرور الجديدة" value={newPw} onChange={e => setNewPw(e.target.value)} dir="ltr" />
          </div>
        </div>
        <button
          onClick={save}
          className="w-full py-3 rounded-xl font-bold text-black transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
        >
          حفظ التغييرات
        </button>
      </div>
    </div>
  );
}

function EmployeesTab() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const { data: rawEmployees, isLoading } = useQuery({ 
    queryKey: ["employees"], 
    queryFn: () => api.get("/admin/employees") 
  });
  const employees: any[] = Array.isArray(rawEmployees) ? rawEmployees : (rawEmployees?.data || []);

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "sales" });
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", role: "", password: "" });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/employees/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      setMsg({ type: "ok", text: "تم حذف الموظف بنجاح ✓" });
      setTimeout(() => setMsg(null), 3000);
    },
    onError: (e: any) => setMsg({ type: "err", text: e.message || "حدث خطأ أثناء الحذف" }),
  });

  const addMut = useMutation({
    mutationFn: () => api.post("/admin/employees", form),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["employees"] }); 
      setShowAdd(false); 
      setForm({ name: "", email: "", password: "", phone: "", role: "sales" });
      setMsg({ type: "ok", text: "تمت إضافة الموظف الجديد بنجاح ✓" });
      setTimeout(() => setMsg(null), 3000);
    },
    onError: (e: any) => setMsg({ type: "err", text: e.message || "حدث خطأ أثناء إضافة الموظف" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/admin/employees/${id}`, data),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["employees"] }); 
      setEditId(null);
      setMsg({ type: "ok", text: "تم تحديث بيانات الموظف بنجاح ✓" });
      setTimeout(() => setMsg(null), 3000);
    },
    onError: (e: any) => setMsg({ type: "err", text: e.message || "حدث خطأ أثناء التحديث" }),
  });

  const inp = "w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none border transition-all";
  const inpStyle = { background: "rgba(255,255,255,0.05)", borderColor: "rgba(245,158,11,0.2)" };

  const ROLES = [
    { value: "manager", label: "مدير" },
    { value: "sales", label: "مبيعات" },
    { value: "support", label: "دعم فني" },
    { value: "accountant", label: "محاسب" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-bold text-lg">إدارة الموظفين والصلاحيات</h3>
          <p className="text-white/40 text-xs mt-0.5">إضافة وتعيين صلاحيات المدراء وفريق العمل</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black cursor-pointer shadow-md" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
          <Plus size={16} /> إضافة موظف جديد
        </button>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === "ok" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {msg.text}
        </div>
      )}

      {showAdd && (
        <div className="mb-6 p-5 rounded-2xl" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-bold">إضافة موظف وصلاحية جديدة</p>
            <button onClick={() => setShowAdd(false)} className="text-white/40 hover:text-white cursor-pointer"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-xs mb-1 block">اسم الموظف *</label>
              <input className={inp} style={inpStyle} placeholder="الاسم الكامل" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">البريد الإلكتروني *</label>
              <input className={inp} style={inpStyle} placeholder="example@mail.com" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} dir="ltr" />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">كلمة المرور *</label>
              <input className={inp} style={inpStyle} placeholder="••••••••" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} dir="ltr" />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">رقم الهاتف</label>
              <input className={inp} style={inpStyle} placeholder="+966..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} dir="ltr" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-white/60 text-xs mb-1 block">الصلاحية / الدور *</label>
              <select className={inp} style={inpStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <option key={r.value} value={r.value} style={{ background: "#1a1000", color: "#fff" }}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <button 
            onClick={() => addMut.mutate()} 
            disabled={addMut.isPending || !form.name || !form.email || !form.password} 
            className="mt-4 w-full py-3 rounded-xl text-black font-bold cursor-pointer disabled:opacity-50 transition-all" 
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
          >
            {addMut.isPending ? "جارٍ إضافة الموظف..." : "حفظ الموظف الجديد"}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-white/40 text-center py-10">جارٍ التحميل...</div>
      ) : (
        <div className="space-y-3">
          {employees.length === 0 && (
            <div className="text-center py-10 text-white/40 border border-white/5 rounded-2xl">
              لا يوجد موظفون مضافون حالياً
            </div>
          )}
          {employees.map((emp: any) => (
            <div key={emp.id} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,158,11,0.12)" }}>
              {editId === emp.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">الاسم</label>
                      <input className={inp} style={inpStyle} placeholder="الاسم" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">البريد الإلكتروني</label>
                      <input className={inp} style={inpStyle} placeholder="البريد" type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} dir="ltr" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">كلمة مرور جديدة (اختياري)</label>
                      <input className={inp} style={inpStyle} placeholder="اتركها فارغة لعدم التغيير" type="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} dir="ltr" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">الهاتف</label>
                      <input className={inp} style={inpStyle} placeholder="الهاتف" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} dir="ltr" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-white/60 text-xs mb-1 block">الصلاحية</label>
                      <select className={inp} style={inpStyle} value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                        {ROLES.map(r => <option key={r.value} value={r.value} style={{ background: "#1a1000", color: "#fff" }}>{r.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => updateMut.mutate({ id: emp.id, data: { name: editForm.name, email: editForm.email, phone: editForm.phone, role: editForm.role, ...(editForm.password && { password: editForm.password }) } })} 
                      disabled={updateMut.isPending}
                      className="flex-1 py-2.5 rounded-xl text-black font-bold cursor-pointer disabled:opacity-50" 
                      style={{ background: "#f59e0b" }}
                    >
                      <Check size={16} className="inline me-1" /> {updateMut.isPending ? "جارٍ الحفظ..." : "حفظ التعديلات"}
                    </button>
                    <button onClick={() => setEditId(null)} className="px-5 py-2.5 rounded-xl text-white/60 hover:text-white cursor-pointer" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <X size={16} /> إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-black shrink-0" style={{ background: ROLE_COLORS[emp.role] || "#6b7280" }}>
                      {(emp.name || "م").charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{emp.name}</p>
                      <p className="text-white/40 text-xs" dir="ltr">{emp.email}</p>
                      {emp.phone && <p className="text-white/30 text-xs" dir="ltr">{emp.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-3 py-1.5 rounded-xl font-bold" style={{ background: (ROLE_COLORS[emp.role] || "#6b7280") + "22", color: ROLE_COLORS[emp.role] || "#6b7280", border: `1px solid ${ROLE_COLORS[emp.role] || "#6b7280"}44` }}>
                      {ROLE_LABELS[emp.role] || emp.role}
                    </span>
                    {emp.role !== "admin" && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditId(emp.id); setEditForm({ name: emp.name, email: emp.email, phone: emp.phone || "", role: emp.role, password: "" }); }} className="text-amber-400/80 hover:text-amber-400 cursor-pointer p-1.5 rounded-lg hover:bg-white/5"><Edit2 size={16} /></button>
                        <button onClick={() => { if (confirm(`هل أنت متأكد من حذف الموظف "${emp.name}"؟`)) deleteMut.mutate(emp.id); }} className="text-red-400/80 hover:text-red-400 cursor-pointer p-1.5 rounded-lg hover:bg-white/5"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AppSettingsTab() {
  const qc = useQueryClient();
  const { data: stored = {}, isLoading } = useQuery({
    queryKey: ["app-settings"],
    queryFn: () => api.get("/admin/platform-settings"),
  });

  const FIELDS = [
    { key: "whatsapp_number", label: "رقم الواتساب", icon: <Phone size={15} />, placeholder: "772223645", dir: "ltr" },
    { key: "facebook_url",   label: "رابط فيسبوك",  icon: <Facebook size={15} />, placeholder: "https://www.facebook.com/...", dir: "ltr" },
    { key: "twitter_url",    label: "رابط تويتر/X",  icon: <Twitter size={15} />, placeholder: "https://twitter.com/...", dir: "ltr" },
    { key: "address_ar",     label: "العنوان (عربي)", icon: <MapPin size={15} />, placeholder: "اليمن، تعز، شارع جمال", dir: "rtl" },
    { key: "address_en",     label: "العنوان (إنجليزي)", icon: <MapPin size={15} />, placeholder: "Yemen, Taiz, Jamal Street", dir: "ltr" },
    { key: "about_ar",       label: "عن التطبيق (عربي)", icon: <Info size={15} />, placeholder: "وصف التطبيق بالعربية...", dir: "rtl", multiline: true },
    { key: "about_en",       label: "عن التطبيق (إنجليزي)", icon: <Info size={15} />, placeholder: "App description in English...", dir: "ltr", multiline: true },
  ];

  const defaults: Record<string, string> = {
    whatsapp_number: "772223645",
    facebook_url: "https://www.facebook.com",
    twitter_url: "https://twitter.com",
    address_ar: "اليمن، تعز، شارع جمال",
    address_en: "Yemen, Taiz, Jamal Street",
    about_ar: "منصة تسوق إلكتروني متخصصة في توفير أحدث الأجهزة الإلكترونية والهواتف الذكية بأفضل الأسعار.",
    about_en: "An e-commerce platform specializing in the latest electronic devices at the best prices.",
  };

  const [form, setForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // initialise form from fetched data
  const mergedData: Record<string, string> = { ...defaults, ...(stored as any) };

  const saveMut = useMutation({
    mutationFn: () => api.post("/admin/platform-settings", { ...mergedData, ...form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app-settings"] });
      setMsg({ type: "ok", text: "تم حفظ إعدادات التطبيق بنجاح ✓" });
      setTimeout(() => setMsg(null), 3000);
    },
    onError: (e: any) => setMsg({ type: "err", text: e.message || "حدث خطأ" }),
  });

  const inp = "w-full px-4 py-3 rounded-xl text-white text-sm outline-none border transition-all";
  const inpStyle = { background: "rgba(255,255,255,0.05)", borderColor: "rgba(245,158,11,0.2)" };

  if (isLoading) return <div className="text-white/40 text-center py-10">جارٍ التحميل...</div>;

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <Smartphone size={18} className="text-amber-400" />
        <p className="text-white font-bold">إعدادات التطبيق المحمول</p>
        <span className="text-white/30 text-xs">تُحفظ في قاعدة البيانات وتظهر للمستخدمين فوراً</span>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.type === "ok" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {msg.text}
        </div>
      )}

      {FIELDS.map(({ key, label, icon, placeholder, dir, multiline }) => (
        <div key={key}>
          <label className="text-white/60 text-xs mb-1 flex items-center gap-1">
            <span className="text-amber-400">{icon}</span> {label}
          </label>
          {multiline ? (
            <textarea
              rows={3}
              className={inp + " resize-none"}
              style={{ ...inpStyle, fontFamily: "inherit" } as any}
              dir={dir}
              placeholder={placeholder}
              value={form[key] ?? mergedData[key] ?? ""}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            />
          ) : (
            <input
              className={inp}
              style={inpStyle}
              dir={dir}
              placeholder={placeholder}
              value={form[key] ?? mergedData[key] ?? ""}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            />
          )}
        </div>
      ))}

      <button
        onClick={() => saveMut.mutate()}
        disabled={saveMut.isPending}
        className="w-full py-3 rounded-xl font-bold text-black transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
      >
        {saveMut.isPending ? "جارٍ الحفظ..." : <><Check size={16} /> حفظ إعدادات التطبيق</>}
      </button>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState<"profile" | "app" | "employees">("profile");

  const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 20 };

  const TABS: [string, ReactElement, string][] = [
    ["profile",   <User size={15} />,       "الملف الشخصي"],
    ["app",       <Smartphone size={15} />,  "إعدادات التطبيق"],
    ["employees", <Shield size={15} />,      "الموظفون والصلاحيات"],
  ];

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Shield size={22} className="text-amber-400" /> الإعدادات
      </h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: tab === key ? "linear-gradient(135deg,#f59e0b,#d97706)" : "rgba(255,255,255,0.05)",
              color: tab === key ? "#000" : "rgba(255,255,255,0.5)",
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      <div className="p-6" style={card}>
        {tab === "profile"   && <ProfileTab />}
        {tab === "app"       && <AppSettingsTab />}
        {tab === "employees" && <EmployeesTab />}
      </div>
    </div>
  );
}
