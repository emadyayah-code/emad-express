import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Globe, Link, Settings, Save, ExternalLink, AlertCircle, Mail, Server, Lock, User, AtSign } from "lucide-react";

const PLATFORMS = [
  { key: "google_ads", name: "إعلانات جوجل وموبايل (Google AdMob / ADV)", color: "text-emerald-600", bg: "bg-emerald-50", icon: "📱" },
  { key: "email", name: "إعدادات البريد", color: "text-blue-600", bg: "bg-blue-50", icon: "📧" },
  { key: "aliexpress", name: "علي إكسبرس", color: "text-red-600", bg: "bg-red-50", icon: "🌐" },
  { key: "amazon", name: "أمازون", color: "text-orange-600", bg: "bg-orange-50", icon: "🛒" },
  { key: "alibaba", name: "علي بابا", color: "text-amber-600", bg: "bg-amber-50", icon: "🏪" },
];

export default function AffiliateSettings() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("google_ads");
  const [saved, setSaved] = useState(false);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: () => api.get("/admin/settings"),
  });

  const updateMut = useMutation({
    mutationFn: (data: any) => api.put("/admin/settings", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const settings = settingsData?.data?.data || [];
  const getValue = (key: string) => settings.find((s: any) => s.key === key)?.value || "";

  const [form, setForm] = useState({
    google_ads_enabled: "true",
    google_ads_test_mode: "false",
    admob_app_id_android: "",
    admob_app_id_ios: "",
    admob_banner_unit_id: "",
    admob_interstitial_unit_id: "",
    admob_rewarded_unit_id: "",
    admob_native_unit_id: "",
    google_adsense_pub_id: "",
    google_adsense_slot_id: "",
    smtp_host: "",
    smtp_port: "",
    smtp_user: "",
    smtp_pass: "",
    smtp_from: "",
    aliexpress_app_key: "",
    aliexpress_app_key_secret: "",
    aliexpress_tracking_id: "",
    amazon_access_key: "",
    amazon_secret_key: "",
    amazon_partner_tag: "",
    alibaba_app_key: "",
    alibaba_app_key_secret: "",
  });

  // Update form when settings load
  useEffect(() => {
    if (settings && settings.length > 0) {
      setForm({
        google_ads_enabled: getValue("google_ads_enabled") || "true",
        google_ads_test_mode: getValue("google_ads_test_mode") || "false",
        admob_app_id_android: getValue("admob_app_id_android"),
        admob_app_id_ios: getValue("admob_app_id_ios"),
        admob_banner_unit_id: getValue("admob_banner_unit_id"),
        admob_interstitial_unit_id: getValue("admob_interstitial_unit_id"),
        admob_rewarded_unit_id: getValue("admob_rewarded_unit_id"),
        admob_native_unit_id: getValue("admob_native_unit_id"),
        google_adsense_pub_id: getValue("google_adsense_pub_id"),
        google_adsense_slot_id: getValue("google_adsense_slot_id"),
        smtp_host: getValue("smtp_host"),
        smtp_port: getValue("smtp_port"),
        smtp_user: getValue("smtp_user"),
        smtp_pass: getValue("smtp_pass"),
        smtp_from: getValue("smtp_from"),
        aliexpress_app_key: getValue("aliexpress_app_key") || "540456",
        aliexpress_app_key_secret: getValue("aliexpress_app_key_secret") || "VKz8Ppc40dGMXGbcLyjXRxBhrXw3itnT",
        aliexpress_tracking_id: getValue("aliexpress_tracking_id") || "default",
        amazon_access_key: getValue("amazon_access_key"),
        amazon_secret_key: getValue("amazon_secret_key"),
        amazon_partner_tag: getValue("amazon_partner_tag"),
        alibaba_app_key: getValue("alibaba_app_key"),
        alibaba_app_key_secret: getValue("alibaba_app_key_secret"),
      });
    }
  }, [settings]);

  const handleSave = () => {
    const updates = Object.entries(form).map(([key, value]) => ({ key, value }));
    updateMut.mutate(updates);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إعدادات المنصات العالمية</h1>
          <p className="text-sm text-gray-500 mt-1">إعدادات Affiliate و API للدروبشيبنج</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">نموذج Hybrid للدفع</h3>
            <p className="text-sm text-blue-800 mt-1">
              • <strong>المنتجات المحلية:</strong> الدفع عبر Stripe Connect مباشرةً للبائع. الشحن على البائع.<br/>
              • <strong>المنتجات العالمية:</strong> الدفع عبر WebView Affiliate للمنصة مباشرةً. الشحن على المنصة.
            </p>
          </div>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="flex gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            onClick={() => setActiveTab(p.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === p.key 
                ? `${p.bg} ${p.color} border border-current` 
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>{p.icon}</span>
            {p.name}
          </button>
        ))}
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {activeTab === "google_ads" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                  <Globe size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">إعلانات جوجل موبايل والويب (Google Mobile Ads / AdMob / ADV)</h3>
                  <p className="text-xs text-gray-500 mt-0.5">إدارة ظهور وإيرادات الإعلانات في تطبيقات الموبايل (Android / iOS) والمتجر الإلكتروني</p>
                </div>
              </div>
              <a
                href="https://admob.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <span>لوحة تحكم Google AdMob</span>
                <ExternalLink size={13} />
              </a>
            </div>

            {/* General Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div>
                  <p className="font-bold text-sm text-gray-800">حالة تشغيل الإعلانات</p>
                  <p className="text-xs text-gray-500">تفعيل أو إيقاف ظهور إعلانات جوجل في التطبيق والمتجر</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.google_ads_enabled === "true"}
                    onChange={(e) => setForm({ ...form, google_ads_enabled: e.target.checked ? "true" : "false" })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div>
                  <p className="font-bold text-sm text-gray-800">وضع الاختبار (Test Ads Mode)</p>
                  <p className="text-xs text-gray-500">إظهار إعلانات تجريبية أثناء الفحص لتفادي مخالفات جوجل</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.google_ads_test_mode === "true"}
                    onChange={(e) => setForm({ ...form, google_ads_test_mode: e.target.checked ? "true" : "false" })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>

            {/* Mobile App IDs */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <span>📱</span> معرفات تطبيق الموبايل (Google AdMob App IDs)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700">AdMob App ID (Android)</label>
                  <input
                    type="text"
                    value={form.admob_app_id_android}
                    onChange={(e) => setForm({ ...form, admob_app_id_android: e.target.value })}
                    placeholder="ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy"
                    className="w-full mt-1.5 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">AdMob App ID (iOS / iPhone)</label>
                  <input
                    type="text"
                    value={form.admob_app_id_ios}
                    onChange={(e) => setForm({ ...form, admob_app_id_ios: e.target.value })}
                    placeholder="ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy"
                    className="w-full mt-1.5 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Ad Unit IDs */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <span>🎯</span> معرفات الوحدات الإعلانية بالموبايل (Ad Units / ADV Slots)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700">Banner Ad Unit (إعلان البانر الثابت)</label>
                  <input
                    type="text"
                    value={form.admob_banner_unit_id}
                    onChange={(e) => setForm({ ...form, admob_banner_unit_id: e.target.value })}
                    placeholder="ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz"
                    className="w-full mt-1.5 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">Interstitial Ad Unit (إعلان الشاشة الكاملة / البيني)</label>
                  <input
                    type="text"
                    value={form.admob_interstitial_unit_id}
                    onChange={(e) => setForm({ ...form, admob_interstitial_unit_id: e.target.value })}
                    placeholder="ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz"
                    className="w-full mt-1.5 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">Rewarded Video Ad Unit (إعلان الفيديو بمكافأة)</label>
                  <input
                    type="text"
                    value={form.admob_rewarded_unit_id}
                    onChange={(e) => setForm({ ...form, admob_rewarded_unit_id: e.target.value })}
                    placeholder="ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz"
                    className="w-full mt-1.5 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">Native Advanced Unit (إعلان أصلي مدمج في قوائم المنتجات)</label>
                  <input
                    type="text"
                    value={form.admob_native_unit_id}
                    onChange={(e) => setForm({ ...form, admob_native_unit_id: e.target.value })}
                    placeholder="ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz"
                    className="w-full mt-1.5 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Web AdSense */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <span>🌐</span> إعلانات جوجل لموقع الويب (Google AdSense Web)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700">Google AdSense Publisher ID</label>
                  <input
                    type="text"
                    value={form.google_adsense_pub_id}
                    onChange={(e) => setForm({ ...form, google_adsense_pub_id: e.target.value })}
                    placeholder="pub-xxxxxxxxxxxxxxxx"
                    className="w-full mt-1.5 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">Google AdSense Slot ID</label>
                  <input
                    type="text"
                    value={form.google_adsense_slot_id}
                    onChange={(e) => setForm({ ...form, google_adsense_slot_id: e.target.value })}
                    placeholder="1234567890"
                    className="w-full mt-1.5 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "email" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-4">
              <Mail size={24} className="text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-800">إعدادات البريد الإلكتروني (SMTP)</h3>
                <p className="text-sm text-gray-500">إعدادات إرسال أكواد التحقق والإشعارات</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800">
                    الإيميل المرسل (<strong>From</strong>) هو العنوان الذي يظهر للمستخدمين عند استلام كود التحقق.
                    يُفضل استخدام نفس الإيميل المُسجل في مزود SMTP.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <AtSign size={14} className="text-gray-400" />
                  الإيميل المرسل (From Address)
                </label>
                <input
                  type="email"
                  value={form.smtp_from}
                  onChange={(e) => setForm({ ...form, smtp_from: e.target.value })}
                  placeholder="noreply@emadexpress.com"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
                <p className="text-xs text-gray-500 mt-1">هذا العنوان يظهر للمستخدمين في رسائل التحقق</p>
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Server size={14} className="text-gray-400" />
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={form.smtp_host}
                  onChange={(e) => setForm({ ...form, smtp_host: e.target.value })}
                  placeholder="smtp.gmail.com"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">SMTP Port</label>
                <input
                  type="text"
                  value={form.smtp_port}
                  onChange={(e) => setForm({ ...form, smtp_port: e.target.value })}
                  placeholder="587"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User size={14} className="text-gray-400" />
                  SMTP Username
                </label>
                <input
                  type="text"
                  value={form.smtp_user}
                  onChange={(e) => setForm({ ...form, smtp_user: e.target.value })}
                  placeholder="your-email@gmail.com"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock size={14} className="text-gray-400" />
                  SMTP Password
                </label>
                <input
                  type="password"
                  value={form.smtp_pass}
                  onChange={(e) => setForm({ ...form, smtp_pass: e.target.value })}
                  placeholder="••••••••"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
                <p className="text-xs text-gray-500 mt-1">لـ Gmail استخدم App Password وليس كلمة المرور العادية</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">أمثلة على مزودي SMTP:</h4>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Gmail:</span> Host=smtp.gmail.com, Port=587, Pass=App Password
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">SendGrid:</span> Host=smtp.sendgrid.net, Port=587, User=apikey
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Outlook:</span> Host=smtp.office365.com, Port=587
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "aliexpress" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-4">
              <Globe size={24} className="text-red-600" />
              <div>
                <h3 className="font-semibold text-gray-800">إعدادات AliExpress Affiliate</h3>
                <a href="https://portals.aliexpress.com/" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  فتح بوابة AliExpress <ExternalLink size={12} />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">App Key</label>
                <input
                  type="text"
                  value={form.aliexpress_app_key}
                  onChange={(e) => setForm({ ...form, aliexpress_app_key: e.target.value })}
                  placeholder="مثال: 12345678"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">App Secret</label>
                <input
                  type="password"
                  value={form.aliexpress_app_key_secret}
                  onChange={(e) => setForm({ ...form, aliexpress_app_key_secret: e.target.value })}
                  placeholder="••••••••"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">Tracking ID (Affiliate)</label>
                <input
                  type="text"
                  value={form.aliexpress_tracking_id}
                  onChange={(e) => setForm({ ...form, aliexpress_tracking_id: e.target.value })}
                  placeholder="مثال: emad2024"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400"
                />
                <p className="text-xs text-gray-500 mt-1">لتتبع العمولات من AliExpress Affiliate Portal</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "amazon" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-4">
              <Globe size={24} className="text-orange-600" />
              <div>
                <h3 className="font-semibold text-gray-800">إعدادات Amazon Associates</h3>
                <a href="https://affiliate-program.amazon.com/" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  فتح Amazon Associates <ExternalLink size={12} />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Access Key</label>
                <input
                  type="text"
                  value={form.amazon_access_key}
                  onChange={(e) => setForm({ ...form, amazon_access_key: e.target.value })}
                  placeholder="PA-API Access Key"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Secret Key</label>
                <input
                  type="password"
                  value={form.amazon_secret_key}
                  onChange={(e) => setForm({ ...form, amazon_secret_key: e.target.value })}
                  placeholder="••••••••"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">Partner Tag (Associate ID)</label>
                <input
                  type="text"
                  value={form.amazon_partner_tag}
                  onChange={(e) => setForm({ ...form, amazon_partner_tag: e.target.value })}
                  placeholder="مثال: emadexpress-20"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "alibaba" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-4">
              <Globe size={24} className="text-amber-600" />
              <div>
                <h3 className="font-semibold text-gray-800">إعدادات Alibaba API</h3>
                <a href="https://open.alibaba.com/" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  فتح Alibaba Open Platform <ExternalLink size={12} />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">App Key</label>
                <input
                  type="text"
                  value={form.alibaba_app_key}
                  onChange={(e) => setForm({ ...form, alibaba_app_key: e.target.value })}
                  placeholder="Alibaba App Key"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">App Secret</label>
                <input
                  type="password"
                  value={form.alibaba_app_key_secret}
                  onChange={(e) => setForm({ ...form, alibaba_app_key_secret: e.target.value })}
                  placeholder="••••••••"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          {saved && (
            <span className="text-green-600 text-sm font-medium">✓ تم الحفظ بنجاح</span>
          )}
          <div className="flex-1" />
          <button
            onClick={handleSave}
            disabled={updateMut.isPending}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {updateMut.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
        </div>
      </div>
    </div>
  );
}
