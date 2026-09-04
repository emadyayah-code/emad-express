import { Router, Request, Response } from "express";

const privacyRouter: Router = Router();

const PRIVACY_HTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>سياسة الخصوصية - تطبيق عماد إكسبريس (Emad Express)</title>
  <meta name="description" content="سياسة الخصوصية لتطبيق عماد إكسبريس (Emad Express) - حماية بيانات المستخدمين ومعلومات الحساب والطلبات والأمان.">
  <meta property="og:title" content="سياسة الخصوصية - عماد إكسبريس">
  <meta property="og:description" content="سياسة الخصوصية وحماية البيانات لتطبيق عماد إكسبريس للتسوق والتوصيل.">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f293d;
      --primary: #f59e0b;
      --primary-hover: #d97706;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --accent-blue: #3b82f6;
      --accent-green: #10b981;
      --accent-purple: #8b5cf6;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Cairo', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    body {
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.8;
      padding: 2rem 1rem;
      min-height: 100vh;
      display: flex;
      justify-content: center;
    }
    .container {
      max-width: 860px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    .header-card {
      background: linear-gradient(180deg, #161e2e 0%, #0f172a 100%);
      border: 1px solid #283548;
      border-radius: 1.5rem;
      padding: 2.5rem 1.5rem;
      text-align: center;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .header-card::before {
      content: '';
      position: absolute;
      top: -50px;
      right: -50px;
      width: 200px;
      height: 200px;
      background: rgba(245, 158, 11, 0.15);
      border-radius: 50%;
      filter: blur(50px);
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 68px;
      height: 68px;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 1.25rem;
      color: var(--primary);
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    .official-badge {
      display: inline-block;
      padding: 0.35rem 1rem;
      background: rgba(245, 158, 11, 0.12);
      color: var(--primary);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 2rem;
      font-size: 0.8rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    h1 {
      font-size: 1.85rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 0.35rem;
    }
    .sub-brand {
      color: var(--primary);
      font-weight: 700;
      font-size: 1.15rem;
      margin-bottom: 0.75rem;
    }
    .update-date {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #1e293b;
      padding: 0.4rem 1rem;
      border-radius: 0.75rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
      border: 1px solid #334155;
    }
    .update-date strong {
      color: #e2e8f0;
    }
    .intro-text {
      color: #cbd5e1;
      font-size: 1.05rem;
      max-width: 680px;
      margin: 0 auto;
      line-height: 1.9;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 1.25rem;
      padding: 1.75rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
      transition: border-color 0.2s ease;
    }
    .card:hover {
      border-color: #334155;
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #1e293b;
    }
    .icon-box {
      width: 40px;
      height: 40px;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .card-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: #ffffff;
    }
    .list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .list-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      color: #d1d5db;
      font-size: 0.98rem;
    }
    .list-item .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 0.6rem;
      flex-shrink: 0;
    }
    .highlight-box {
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 0.85rem;
      padding: 1rem;
      color: #fde68a;
      font-weight: 600;
      margin-bottom: 0.85rem;
      font-size: 0.95rem;
    }
    .contact-card {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, #111827 100%);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 1.5rem;
      padding: 2rem 1.5rem;
      text-align: center;
    }
    .email-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      background: var(--primary);
      color: #000;
      font-weight: 800;
      text-decoration: none;
      padding: 0.85rem 1.75rem;
      border-radius: 0.85rem;
      margin-top: 1rem;
      font-size: 1rem;
      transition: all 0.2s ease;
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
    }
    .email-btn:hover {
      background: var(--primary-hover);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
    }
    .footer {
      text-align: center;
      padding: 1.5rem 0;
      border-top: 1px solid #1f293d;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    .footer strong {
      color: var(--primary);
    }
    @media (max-width: 640px) {
      h1 { font-size: 1.45rem; }
      .header-card { padding: 1.75rem 1rem; }
      .card { padding: 1.25rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    
    <!-- Top Header -->
    <div class="header-card">
      <div class="logo-badge">🛡️</div>
      <br>
      <span class="official-badge">وثيقة رسمية معتمدة</span>
      <h1>سياسة الخصوصية لتطبيق عماد إكسبريس</h1>
      <p class="sub-brand">Emad Express</p>
      
      <div class="update-date">
        <span>📅 آخر تحديث:</span>
        <strong>2026</strong>
      </div>

      <p class="intro-text">
        نحن في <strong>"عماد إكسبريس"</strong> نلتزم بحماية خصوصية مستخدمينا. توضح هذه السياسة كيفية جمع واستخدام وحماية بياناتك عند استخدام تطبيقنا.
      </p>
    </div>

    <!-- Section 1 -->
    <div class="card">
      <div class="card-header">
        <div class="icon-box" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6;">📋</div>
        <h2 class="card-title">1. البيانات التي نجمعها:</h2>
      </div>
      <ul class="list">
        <li class="list-item">
          <span class="dot" style="background: #3b82f6;"></span>
          <div><strong>معلومات الحساب:</strong> الاسم، رقم الهاتف، عنوان البريد الإلكتروني.</div>
        </li>
        <li class="list-item">
          <span class="dot" style="background: #3b82f6;"></span>
          <div><strong>معلومات الطلبات والشحن:</strong> عنوان التوصيل، تفاصيل الطلبات، وسيلة الدفع المختارة.</div>
        </li>
        <li class="list-item">
          <span class="dot" style="background: #3b82f6;"></span>
          <div><strong>معلومات الجهاز:</strong> نوع الجهاز، نظام التشغيل، لتقديم أفضل أداء وتحسين تجربة الاستخدام.</div>
        </li>
      </ul>
    </div>

    <!-- Section 2 -->
    <div class="card">
      <div class="card-header">
        <div class="icon-box" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">⚙️</div>
        <h2 class="card-title">2. كيف نستخدم بياناتك:</h2>
      </div>
      <ul class="list">
        <li class="list-item">
          <span class="dot" style="background: #10b981;"></span>
          <div>لمعالجة وتوصيل طلبات الشراء إلى عنوانك.</div>
        </li>
        <li class="list-item">
          <span class="dot" style="background: #10b981;"></span>
          <div>لإرسال إشعارات بحالة الطلب وتحديثات الخدمة.</div>
        </li>
        <li class="list-item">
          <span class="dot" style="background: #10b981;"></span>
          <div>لتحسين جودة وأداء التطبيق وخدمة العملاء.</div>
        </li>
      </ul>
    </div>

    <!-- Section 3 -->
    <div class="card">
      <div class="card-header">
        <div class="icon-box" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">🤝</div>
        <h2 class="card-title">3. مشاركة البيانات:</h2>
      </div>
      <div class="highlight-box">
        🔒 لا نقوم ببيع أو تأجير بياناتك الشخصية لأي طرف ثالث نهائياً.
      </div>
      <p style="color: #cbd5e1; font-size: 0.98rem; padding-right: 0.5rem;">
        تتم مشاركة بيانات التوصيل (الاسم، العنوان، الهاتف) فقط مع مناديب الشحن لغرض إيصال الطلبات.
      </p>
    </div>

    <!-- Section 4 -->
    <div class="card">
      <div class="card-header">
        <div class="icon-box" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6;">🔐</div>
        <h2 class="card-title">4. أمان البيانات:</h2>
      </div>
      <p style="color: #cbd5e1; font-size: 0.98rem; padding-right: 0.5rem; line-height: 1.9;">
        نستخدم تقنيات تشفير ومعايير أمان متقدمة لحماية بياناتك من الوصول غير المصرح به.
      </p>
    </div>

    <!-- Section 5 -->
    <div class="card">
      <div class="card-header">
        <div class="icon-box" style="background: rgba(236, 72, 153, 0.15); color: #ec4899;">👤</div>
        <h2 class="card-title">5. حقوق المستخدم:</h2>
      </div>
      <p style="color: #cbd5e1; font-size: 0.98rem; padding-right: 0.5rem; line-height: 1.9;">
        يحق لك في أي وقت تعديل بياناتك أو طلب حذف حسابك وبياناتك عبر التواصل معنا داخل التطبيق أو عبر البريد الإلكتروني.
      </p>
    </div>

    <!-- Section 6 -->
    <div class="contact-card">
      <h2 style="font-size: 1.3rem; margin-bottom: 0.5rem; color: #fff;">6. للتواصل معنا</h2>
      <p style="color: #9ca3af; font-size: 0.95rem;">
        إذا كانت لديك أي استفسارات بخصوص سياسة الخصوصية، يرجى التواصل معنا عبر:
      </p>
      <a href="mailto:support@emadexpress.com?subject=Emad%20Express%20Privacy%20Policy" class="email-btn">
        ✉️ support@emadexpress.com
      </a>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>© 2026 جميع الحقوق محفوظة لدى <strong>عماد إكسبريس (Emad Express)</strong></p>
    </div>

  </div>
</body>
</html>`;

export function handlePrivacyPolicyRequest(_req: Request, res: Response) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.status(200).send(PRIVACY_HTML);
}

privacyRouter.get("/privacy-policy", handlePrivacyPolicyRequest);
privacyRouter.get("/privacy", handlePrivacyPolicyRequest);

export default privacyRouter;
