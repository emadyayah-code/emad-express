# 🏗️ معمارية موزعة بأقل تكلفة ($15-20/سنة)

## ✅ نعم — ممكن! بس تحتاج تقسم المشروع على خدمات متعددة

---

## 💰 التكلفة المتوقعة

| الخدمة | الوظيفة | التكلفة/سنة |
|--------|---------|-------------|
| **Vercel** | Admin Panel (React) | **$0** ✅ مجاني |
| **Supabase** | قاعدة البيانات PostgreSQL | **$0** ✅ مجاني (500MB) |
| **Render** | Backend API (Node.js) | **$0** ✅ مجاني (ينام) |
| **Namecheap** | دومين .shop | **~$3** |
| **Google Play** | نشر التطبيق | **$25** مرة واحدة |
| **المجموع** | | **~$3-5/سنة** + $25 لمرة واحدة |

> 💡 **للتخلص من مشكلة "النوم" في Render**: استخدم Railway ($5/شهر = $60/سنة)
> أو ارفع الميزانية لـ **$40-50/سنة** مع VPS واحد

---

## 🏗️ المعمارية الموزعة

```
┌─────────────────────────────────────────────────────────────┐
│  🌐 المستخدم                                               │
│     يفتح: admin.yourstore.shop                             │
│     يفتح: yourstore.shop (API)                             │
│     يفتح: تطبيق الجوال (Google Play)                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  📊 Vercel     │   │  ⚙️ Render     │   │  🗄️ Supabase   │
│  Admin Panel   │   │  API Server    │   │  PostgreSQL    │
│  (React)       │   │  (Express)     │   │  + Storage     │
│                │   │                │   │                │
│  $0/سنة       │   │  $0/سنة       │   │  $0/سنة       │
│  CDN عالمي    │   │  ينام بعد 15د  │   │  500MB حد     │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  📱 Google Play │
                    │  Mobile App     │
                    │  (Expo/React)   │
                    │                 │
                    │  $25 مرة واحدة │
                    └─────────────────┘
```

---

## 📋 خطوات النشر

### الخطوة 1: قاعدة البيانات (Supabase — مجاني)

1. سجل في [supabase.com](https://supabase.com)
2. أنشئ مشروع جديد
3. احفظ:
   - **Project URL**: `https://xxxx.supabase.co`
   - **API Key**: `eyJ...` (anon public)
   - **Database Password**: اللي حطيته
4. اذهب إلى **SQL Editor** ← **New Query** ← الصق:

```sql
-- تشغيل ترحيل قاعدة البيانات
-- أنسخ محتوى ملف lib/db/src/schema/index.ts
-- أو استخدم Drizzle Kit للترحيل
```

5. **Connection String** (للـ Backend):
```
postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
```

---

### الخطوة 2: Backend API (Render — مجاني)

1. سجل في [render.com](https://render.com)
2. **New** → **Web Service**
3. اربط **GitHub** واختر المستودع
4. اضبط:
   - **Name**: `emad-api`
   - **Runtime**: `Node`
   - **Build Command**: `cd artifacts/api-server && npm install && npm run build`
   - **Start Command**: `cd artifacts/api-server && node dist/index.js`
   - **Plan**: `Free`

5. أضف **Environment Variables**:
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
SESSION_SECRET=your-super-secret-key-here-change-this
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

6. انقر **Create Web Service**

> ⚠️ **ملاحظة**: Render Free ينام بعد 15 دقيقة. أول طلب بعد النوم يستغرق 30-60 ثانية.
> لمنع النوم: استخدم [UptimeRobot](https://uptimerobot.com) (مجاني) يرسل ping كل 5 دقائق.

---

### الخطوة 3: Admin Panel (Vercel — مجاني)

1. سجل في [vercel.com](https://vercel.com)
2. **Add New Project** → استورد من GitHub
3. اختر مجلد `artifacts/admin-panel`
4. اضبط:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Root Directory**: `artifacts/admin-panel`

5. أضف **Environment Variables**:
```
VITE_API_URL=https://emad-api.onrender.com
```

6. انقر **Deploy**

7. (اختياري) اربط دومين .shop:
   - في Vercel ← **Domains** ← أضف `admin.yourstore.shop`
   - في Namecheap ← DNS ← CNAME → `cname.vercel-dns.com`

---

### الخطوة 4: دومين .shop (Namecheap — ~$3/سنة)

1. سجل في [namecheap.com](https://namecheap.com)
2. ابحث عن دومين `.shop`
3. عادةً يكون ~$0.98-2.98 سنة أولى
4. اضبط DNS:
   - `admin` → CNAME → `cname.vercel-dns.com` (لـ Vercel)
   - `api` → CNAME → `emad-api.onrender.com` (لـ Render)
   - `@` → URL Redirect → `https://admin.yourstore.shop`

---

### الخطوة 5: تطبيق الجوال (Google Play — $25 مرة)

1. سجل في [Google Play Console](https://play.google.com/console) — $25 مرة واحدة
2. ابنِ التطبيق:
```bash
cd artifacts/emad-express
npx expo prebuild
npx expo build:android
# أو استخدم EAS Build
```
3. ارفع ملف APK/AAB على Google Play
4. أضف **API URL** في كود التطبيق:
```typescript
const API_URL = "https://emad-api.onrender.com";
// أو إذا استخدمت دومين: "https://api.yourstore.shop"
```

---

## ⚠️ قيود الخطة المجانية

| الخدمة | القيد | الحل |
|--------|-------|------|
| **Render Free** | ينام بعد 15 دقيقة | UptimeRobot (ping كل 5 دقائق) |
| **Supabase Free** | 500MB قاعدة | تكفي لـ ~1000 منتج + 500 عميل |
| **Vercel Free** | 100GB bandwidth | تكفي لـ ~10,000 زيارة/شهر |
| **Render Free** | 512MB RAM | يكفي للمشروع |

---

## 🚀 الخطة المدفوعة الأرخص (إذا تريد استقرار)

إذا تريد **بدون قيود** بأقل تكلفة:

| الخدمة | الخطة | السعر/سنة |
|--------|-------|-----------|
| **Railway** | Hobby ($5/شهر) | **$60** |
| **Namecheap** | دومين .shop | **$3** |
| **Google Play** | مرة واحدة | **$25** |
| **المجموع** | | **$88/سنة** (~$7.3/شهر) |

**أو VPS واحد (أرخص):**

| الخدمة | الخطة | السعر/سنة |
|--------|-------|-----------|
| **Hetzner CX11** | 1 vCPU, 2GB RAM | **~$50/سنة** |
| **Namecheap** | دومين .shop | **$3** |
| **Google Play** | مرة واحدة | **$25** |
| **المجموع** | | **$78/سنة** |

---

## ✅ قائمة التحقق قبل النشر

- [ ] Supabase مشروع مُنشأ وقاعدة بيانات جاهزة
- [ ] Render Web Service يعمل ويرد على الطلبات
- [ ] Vercel Admin Panel مبني ويعرض بيانات من API
- [ ] Namecheap دومين مُربط بـ Vercel و Render
- [ ] Mobile App يتصل بـ API URL الصحيح
- [ ] SMTP مُضبط لإرسال أكواد التحقق
- [ ] Stripe Connect مُضبط (للبائعين المحليين)
- [ ] Affiliate APIs مُضبطة (AliExpress, Amazon)

---

## 📞 روابط الخدمات

| الخدمة | الرابط | السعر |
|--------|--------|-------|
| Supabase | https://supabase.com | مجاني |
| Render | https://render.com | مجاني |
| Vercel | https://vercel.com | مجاني |
| Namecheap | https://namecheap.com | ~$3/سنة |
| Google Play | https://play.google.com/console | $25 مرة |
| UptimeRobot | https://uptimerobot.com | مجاني |

---

**هل تريد دليل نشر مفصل لخدمة معينة؟**
