# 🚀 دليل النشر على Hostinger

## متطلبات الاستضافة

### الخيار 1: Hostinger Cloud Hosting (موصى به)
- **الخطة**: Cloud Startup أو أعلى
- **السعر**: يبدأ من ~$8.79/شهر
- **المميزات**: Node.js managed + PostgreSQL + SSL مجاني
- **الرابط**: https://www.hostinger.com/web-apps-hosting

### الخيار 2: Hostinger VPS (للمتقدمين)
- **الخطة**: KVM 2 أو أعلى (2 vCPU, 8GB RAM)
- **السعر**: يبدأ من ~$6.29/شهر
- **المميزات**: تحكم كامل + root access
- **يتطلب**: معرفة Linux + Nginx + PM2

---

## 📦 طريقة النشر (Cloud Hosting - الأسهل)

### الخطوة 1: إعداد قاعدة البيانات

1. ادخل إلى **hPanel** ← **Databases** ← **PostgreSQL**
2. أنشئ قاعدة بيانات جديدة
3. احفظ:
   - Database Name
   - Username
   - Password
   - Host (عادةً `localhost` أو عنوان السيرفر)

### الخطوة 2: رفع المشروع

**الطريقة أ: GitHub (موصى بها)**
1. ارفع المشروع على GitHub
2. في hPanel ← **Websites** ← **Add Website** ← **Deploy Web App**
3. اختر **Import Git Repository**
4. اربط حساب GitHub واختر المستودع
5. اضبط الإعدادات:
   - **Framework**: Express.js
   - **Node.js Version**: 20.x
   - **Build Command**: `cd artifacts/api-server && npm install`
   - **Entry File**: `artifacts/api-server/src/index.ts`
   - **Output Directory**: `artifacts/api-server/dist`

**الطريقة ب: ZIP File**
1. اضغط المشروع في ملف ZIP
2. في hPanel ← **Websites** ← **Add Website** ← **Deploy Web App**
3. اختر **Upload your website files**
4. ارفع ملف ZIP
5. اضبط نفس الإعدادات أعلاه

### الخطوة 3: متغيرات البيئة (Environment Variables)

في hPanel ← **Website Dashboard** ← **Environment Variables**:

```
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
SESSION_SECRET=your-super-secret-key-here
NODE_ENV=production
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

### الخطوة 4: تشغيل ترحيل قاعدة البيانات

1. في hPanel ← **Terminal** أو عبر SSH:
```bash
cd ~/domains/yourdomain.com/nodejs
npx drizzle-kit push
```

### الخطوة 5: إعداد Admin Panel

Admin Panel هو تطبيق React منفصل:
1. ابنِه محلياً:
```bash
cd artifacts/admin-panel
npm run build
```
2. ارفع مجلد `dist/` إلى `public_html/admin/`
3. أو انشره كموقع منفصل على نفس الاستضافة

---

## 🔧 طريقة النشر (VPS - للمتقدمين)

### الخطوة 1: الاتصال بالسيرفر
```bash
ssh root@your-vps-ip
```

### الخطوة 2: تثبيت المتطلبات
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# تثبيت PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# تثبيت Nginx
sudo apt install -y nginx

# تثبيت PM2
sudo npm install -g pm2
```

### الخطوة 3: إعداد قاعدة البيانات
```bash
sudo -u postgres psql
CREATE DATABASE emad_express;
CREATE USER emad_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE emad_express TO emad_user;
\q
```

### الخطوة 4: رفع المشروع
```bash
cd /var/www
git clone https://github.com/yourusername/emad-express.git
cd emad-express
npm install
cd artifacts/api-server && npm install
```

### الخطوة 5: إعداد PM2
```bash
cd /var/www/emad-express/artifacts/api-server
pm2 start src/index.ts --name "emad-api"
pm2 save
pm2 startup
```

### الخطوة 6: إعداد Nginx
```bash
sudo nano /etc/nginx/sites-available/emad-express
```

أضف:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/emad-express /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### الخطوة 7: SSL (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## ✅ قائمة التحقق قبل النشر

- [ ] قاعدة البيانات PostgreSQL مُنشأة
- [ ] متغيرات البيئة مُضبطة (DATABASE_URL, SESSION_SECRET)
- [ ] SMTP مُضبط (لإرسال أكواد التحقق)
- [ ] Stripe Connect مُفعل (للبائعين المحليين)
- [ ] Affiliate APIs مُضبطة (AliExpress, Amazon)
- [ ] Admin Panel مبني ومرفوع
- [ ] SSL Certificate مُفعل
- [ ] Domain موصول بالاستضافة

---

## 📞 الدعم

- **Hostinger Support**: https://www.hostinger.com/support
- **Node.js Docs**: https://nodejs.org/docs
- **Drizzle ORM**: https://orm.drizzle.team

---

**تم التحديث**: 2026-08-24
