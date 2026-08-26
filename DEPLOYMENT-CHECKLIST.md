# قائمة التجهيز النهائية

## متغيرات البيئة المطلوبة

أضف هذه المتغيرات في لوحة متغيرات البيئة في الاستضافة:

```env
NODE_ENV=production
PORT=3000
SESSION_SECRET=ضع_قيمة_عشوائية_طويلة_32_حرف_على_الأقل
UPLOADS_DIR=./assets/uploads
ADMIN_PANEL_DIR=./artifacts/admin-panel/dist/public
DB_HOST=localhost
DB_PORT=5432
DB_NAME=u27752730_emad_db
DB_USER=u27752730
DB_PASSWORD=ضع_كلمة_مرور_قاعدة_البيانات_هنا
DATABASE_URL=postgresql://u27752730:ضع_كلمة_المرور_بعد_ترميزها@localhost:5432/u27752730_emad_db
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
BCRYPT_ROUNDS=12
JWT_EXPIRY_HOURS=24
MAX_FILE_SIZE_MB=5
TRUST_PROXY=true
LOG_LEVEL=info
```

## إعداد AliExpress API (الدروبشيبنج)

1. سجل دخولك في لوحة التحكم `/admin`
2. اذهب إلى **الإعدادات > إعدادات المنصات**
3. أضف المفاتيح التالية:
   - `aliexpress_app_key` ← App Key من https://openservice.aliexpress.com/
   - `aliexpress_app_key_secret` ← App Secret
   - `aliexpress_tracking_id` ← Tracking ID (اختياري)
4. بعد الحفظ، يمكنك:
   - البحث عن منتجات بالاسم عبر `/api/v1/admin/dropship/aliexpress-search?q=iphone`
   - جلب منتج برقم المنتج عبر `/api/v1/admin/dropship/aliexpress/{product_id}`
   - استيراد منتج مباشرة عبر `/api/v1/admin/dropship/aliexpress-import`
   - المزامنة التلقائية للأسعار كل 30 دقيقة

## أوامر التشغيل

```bash
corepack enable
corepack prepare pnpm@10.26.1 --activate
bash deploy.sh
node server.js
```

## فحص سريع

افتح `/api/healthz` للتحقق من صحة السيرفر وقاعدة البيانات.

## شرط قاعدة البيانات

الكود يستخدم PostgreSQL عبر `drizzle-orm/node-postgres`.
