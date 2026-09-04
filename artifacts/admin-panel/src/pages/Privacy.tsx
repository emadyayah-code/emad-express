import React, { useState } from "react";
import {
  Shield,
  Database,
  Activity,
  Share2,
  Lock,
  UserCheck,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  FileCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Privacy() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/privacy-policy`
    : "https://emadexpress.ayadicmed.com/privacy-policy";

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-amber-500 selection:text-black" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Admin Quick Info & Action Bar (if logged-in admin) */}
        {user && (
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                  رابط سياسة الخصوصية المعتمد لمتجر التطبيقات
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    منشور ونشط ✓
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5 break-all">
                  {publicUrl}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleCopy}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>تم النسخ بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>نسخ الرابط لـ Google Play</span>
                  </>
                )}
              </button>

              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                title="فتح في نافذة مستقلة"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>معاينة</span>
              </a>
            </div>
          </div>
        )}

        {/* Top Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative flex flex-col items-center text-center space-y-4">
            
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10 mb-2">
              <Shield className="w-8 h-8" />
            </div>

            <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
              وثيقة رسمية معتمدة
            </span>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              سياسة الخصوصية لتطبيق عماد إكسبريس
            </h1>

            <p className="text-amber-500 font-semibold text-lg">
              Emad Express Privacy Policy
            </p>

            <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-400 bg-slate-900/80 px-4 py-1.5 rounded-xl border border-slate-800">
              <span>آخر تحديث:</span>
              <strong className="text-slate-200">2026</strong>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl pt-2">
              نحن في <span className="text-amber-400 font-bold">"عماد إكسبريس"</span> نلتزم بحماية خصوصية مستخدمينا. توضح هذه السياسة كيفية جمع واستخدام وحماية بياناتك عند استخدام تطبيقنا وخدماتنا.
            </p>
          </div>
        </div>

        {/* Section 1: Data We Collect */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-6 sm:p-8 space-y-4 shadow-xl hover:border-slate-700 transition-all">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">1. البيانات التي نجمعها:</h2>
          </div>
          <ul className="space-y-3 text-slate-300 text-sm sm:text-base leading-relaxed pr-2">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-white">معلومات الحساب:</strong> الاسم، رقم الهاتف، عنوان البريد الإلكتروني.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-white">معلومات الطلبات والشحن:</strong> عنوان التوصيل، تفاصيل الطلبات، وسيلة الدفع المختارة.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-white">معلومات الجهاز والأداء:</strong> نوع الجهاز، نظام التشغيل، لتقديم أفضل أداء وتحسين تجربة الاستخدام واستقرار التطبيق.
              </div>
            </li>
          </ul>
        </div>

        {/* Section 2: How We Use Data */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-6 sm:p-8 space-y-4 shadow-xl hover:border-slate-700 transition-all">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">2. كيف نستخدم بياناتك:</h2>
          </div>
          <ul className="space-y-3 text-slate-300 text-sm sm:text-base leading-relaxed pr-2">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
              <span>لمعالجة وتوصيل طلبات الشراء إلى عنوانك بأسرع وقت.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
              <span>لإرسال إشعارات بحالة الطلب وتحديثات الشحن وخدمة العملاء.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
              <span>لتحسين وتطوير خدماتنا وعروضنا بما يتناسب مع تفضيلاتك.</span>
            </li>
          </ul>
        </div>

        {/* Section 3: Data Protection */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-6 sm:p-8 space-y-4 shadow-xl hover:border-slate-700 transition-all">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">3. حماية البيانات:</h2>
          </div>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed pr-2">
            نطبق أعلى معايير الأمان التقنية والتنظيمية لحماية بياناتك من الوصول غير المصرح به أو التعديل أو الإفصاح أو الإتلاف، ونستخدم بروتوكولات تشفير آمنة لنقل وتخزين البيانات.
          </p>
        </div>

        {/* Section 4: Third Parties */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-6 sm:p-8 space-y-4 shadow-xl hover:border-slate-700 transition-all">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">4. مشاركة البيانات مع أطراف ثالثة:</h2>
          </div>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed pr-2">
            نحن <strong className="text-white">لا نبيع ولا نؤجر</strong> بياناتك الشخصية لأي طرف ثالث مطلقاً. قد نشارك بعض البيانات الضرورية فقط مع شركاء التوصيل وبوابات الدفع لإتمام طلباتك.
          </p>
        </div>

        {/* Section 5: User Rights */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-6 sm:p-8 space-y-4 shadow-xl hover:border-slate-700 transition-all">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">5. حقوق المستخدم:</h2>
          </div>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed pr-2">
            يحق لك في أي وقت تعديل بياناتك أو طلب حذف حسابك وبياناتك بشكل كامل ونهائي عبر التواصل معنا داخل التطبيق أو عبر البريد الإلكتروني.
          </p>
        </div>

        {/* Section 6: Contact Us */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 p-6 sm:p-8 space-y-4 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-amber-500/20 pb-4">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">6. للتواصل معنا:</h2>
          </div>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            إذا كانت لديك أي استفسارات أو أسئلة بخصوص سياسة الخصوصية وحماية بياناتك، يرجى التواصل معنا عبر:
          </p>
          <div className="pt-2">
            <a
              href="mailto:support@emadexpress.com?subject=Emad%20Express%20Privacy%20Inquiry"
              className="inline-flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 text-sm sm:text-base"
            >
              <Mail className="w-5 h-5" />
              <span>support@emadexpress.com</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-slate-800/80 text-xs sm:text-sm text-slate-400 space-y-2">
          <p>© 2026 جميع الحقوق محفوظة لدى <strong className="text-amber-400">عماد إكسبريس (Emad Express)</strong></p>
          <p className="text-slate-400">تطبيق التسوق الإلكتروني والتوصيل السريع</p>
        </div>

      </div>
    </div>
  );
}
