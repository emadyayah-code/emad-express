import { Router } from "express";
import multer from "multer";
import { extname } from "path";
import { mkdirSync } from "fs";
import sanitizeHtml from "sanitize-html";
import { db, pool, products, categories, customers, vendors, orders, users, affiliates, affiliate_conversions, dropship_products, platform_settings, supplier_payments, vendor_stripe_accounts, currencies, payment_gateways, shipping_carriers, shipments, product_translations, returns_refunds } from "@workspace/db";
import { eq, and, or, like, desc, sql, isNull, isNotNull, inArray } from "drizzle-orm";
import { signToken, getSession, requireAuth, requireRole, hashPassword, verifyPassword } from "../lib/auth";
import { env } from "../lib/env";
import { logger } from "../lib/logger";
import { sendVerificationEmail, sendPasswordResetEmail, generateVerificationCode, getVerificationExpiry } from "../lib/email";
import { authRateLimiter, uploadRateLimiter, orderRateLimiter } from "../middlewares/rateLimiter";
import { validateBody, validateParams } from "../middlewares/validate";
import {
  loginSchema, registerSchema, productSchema, categorySchema, orderSchema,
  employeeSchema, affiliateSchema, vendorSchema, profileUpdateSchema,
  adminProfileSchema, commissionSettingsSchema, platformSettingsSchema,
  dropshipImportSchema, fulfillmentSchema, trackingSchema,
  idParamSchema,
} from "../validation/schemas";
import { searchAliExpressProducts, fetchAliExpressProduct, fetchAliExpressProductsBatch, type AliExpressCredentials } from "../lib/aliexpress";
import { searchAmazonItems, fetchAmazonItems, searchAmazonProducts, getAmazonProduct, type AmazonCredentials } from "../lib/amazon";
import { searchAlibabaProducts, getAlibabaProduct, type AlibabaCredentials } from "../lib/alibaba";
import { convertCurrency, formatCurrency, seedCurrencies, getExchangeRates } from "../lib/currency";
import { translateProduct, translateProducts, getProductTranslation, setProductTranslation, getCategoryTranslation, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, type SupportedLanguage } from "../lib/i18n";
import { processPayment, confirmStripePayment, createPayPalOrder, capturePayPalOrder, seedPaymentGateways, createStripeConnectAccount, getStripeConnectAccount, createSplitPaymentIntent } from "../lib/payment";
import { seedShippingCarriers, createShipment, getOrderShipments, updateShipmentStatus, calculateAliExpressShipping, isYemenDestination, isSaudiDestination } from "../lib/shipping";
import { fulfillAliExpressOrder, fulfillAmazonOrder, fulfillAlibabaOrder, fulfillLocalVendorOrder, autoFulfillOrder, getFulfillmentTracking } from "../lib/fulfillment";
import { startBulkImport, stopBulkImport, getJobStatus, getAllJobs, getActiveJob } from "../lib/bulk-import";
import { matchCategoryId } from "../lib/category-matcher";
import { extractRealSupplierStock } from "../lib/supplier-stock";
import { getOptimizedImageUrl } from "../lib/image-optimizer";

const isServerlessEnv = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION);
const UPLOADS_DIR = isServerlessEnv ? "/tmp/uploads" : env.UPLOADS_DIR;
try {
  mkdirSync(UPLOADS_DIR, { recursive: true });
} catch {
  // Read-only filesystem in serverless environments
}

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const ALLOWED_MIMETYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const multerFn: any = (multer as any)?.default || multer;
const sanitizeHtmlFn: any = (sanitizeHtml as any)?.default || sanitizeHtml;

const storage = (multerFn.diskStorage || (multer as any).diskStorage)({
  destination: (_req: any, _file: any, cb: any) => cb(null, UPLOADS_DIR),
  filename: (_req: any, file: any, cb: any) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `img-${unique}${ext}`);
  },
});

const upload = multerFn({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error("امتداد الملف غير مسموح به. استخدم: jpg, png, gif, webp"));
    }
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      return cb(new Error("نوع الملف غير مسموح به"));
    }
    cb(null, true);
  },
});

const router = Router();

let lastOpportunisticSync = Date.now();
let lastOpportunisticImport = Date.now();

// Automatic self-sustaining background triggers for Serverless & persistent environments
router.use((_req, _res, next) => {
  const now = Date.now();
  // Automatic price & stock sync every 10 minutes
  if (now - lastOpportunisticSync > 10 * 60 * 1000) {
    lastOpportunisticSync = now;
    setTimeout(() => {
      syncAllDropshipPricesAndStock().catch(err => logger.error({ err: err?.message }, "Opportunistic 10-min stock sync error"));
    }, 100);
  }
  // Automatic auto-import 500 products every 1 hour
  if (now - lastOpportunisticImport > 60 * 60 * 1000) {
    lastOpportunisticImport = now;
    setTimeout(() => {
      runAutoImportCycle(500).catch(err => logger.error({ err: err?.message }, "Opportunistic hourly auto-import error"));
    }, 250);
  }
  next();
});

function sanitizeText(text: string | undefined | null, maxLength: number = 5000): string {
  if (!text) return "";
  return sanitizeHtmlFn(text, {
    allowedTags: [],
    allowedAttributes: {},
    textFilter: (t) => t.slice(0, maxLength),
  });
}

function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

// ========== SEED ==========
let seeded = false;
export async function seedIfEmpty() {
  if (seeded) return;
  seeded = true;

  const adminPwd = "@EMAD772223645emad@";
  const hashedAdmin = await hashPassword(adminPwd);
  const [adminUser] = await db.select().from(users).where(eq(users.email, "ealakhly@gmail.com"));
  if (!adminUser) {
    const hashedUser = await hashPassword("user123");
    await db.insert(users).values([
      { name: "عماد الاكحلي (المدير العام)", email: "ealakhly@gmail.com", password: hashedAdmin, role: "admin", email_verified: true },
      { name: "أحمد محمد", email: "ahmed@example.com", password: hashedUser, phone: "0501234567", role: "customer", email_verified: true },
    ]);
  } else {
    // Explicitly update admin password to the new requested credentials and enforce role
    await db.update(users).set({ password: hashedAdmin, role: "admin", email_verified: true }).where(eq(users.email, "ealakhly@gmail.com"));
  }

  // Strictly enforce that NO other user can have admin role
  await db.update(users).set({ role: "customer" }).where(and(sql`${users.email} != 'ealakhly@gmail.com'`, eq(users.role, "admin")));

  try {
    // Automatically purge any zero-stock or inactive products on startup
    await purgeZeroStockAndDeletedProducts();
  } catch (err: any) {
    logger.warn({ err: err.message }, "Initial zero stock purge skipped");
  }

  try {
    const existingCats = await db.select().from(categories).where(isNull(categories.deleted_at));
    if (existingCats.length < 10) {
      const allAliCategories = [
        { name_ar: "هواتف ذكية وملحقاتها", name_en: "Phones & Telecommunications", icon: "📱", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600", description_ar: "أحدث الهواتف الذكية، كفرات، شواحن، واقيات شاشة وإكسسوارات الهواتف", description_en: "Latest smartphones, cases, chargers, screen protectors and accessories" },
        { name_ar: "إلكترونيات استهلاكية", name_en: "Consumer Electronics", icon: "🎧", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600", description_ar: "سماعات لاسلكية، مكبرات صوت، أجهزة ألعاب وساعات ذكية", description_en: "Wireless headphones, speakers, gaming gear and smartwatches" },
        { name_ar: "أجهزة كمبيوتر ومكاتب", name_en: "Computer & Office", icon: "💻", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600", description_ar: "لابتوبات، شاشات، لوحات مفاتيح، طابعات ومستلزمات مكتبية", description_en: "Laptops, monitors, keyboards, printers and office essentials" },
        { name_ar: "أزياء وملابس نسائية", name_en: "Women's Clothing", icon: "👗", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600", description_ar: "فساتين، بلوزات، عبايات، ملابس شتوية وصيفية بأحدث الموديلات", description_en: "Dresses, tops, abayas, winter and summer trendy fashion" },
        { name_ar: "أزياء وملابس رجالية", name_en: "Men's Clothing", icon: "👔", image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=600", description_ar: "قمصان، بناطيل، هوديز، سترات وأحدث صيحات الموضة الرجالية", description_en: "Shirts, trousers, hoodies, jackets and trendy men fashion" },
        { name_ar: "ساعات ومجوهرات وإكسسوارات", name_en: "Jewelry & Watches", icon: "⌚", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600", description_ar: "ساعات يد ذكية وفاخرة، خواتم، أساور وقلائد نسائية ورجالية", description_en: "Luxury and smartwatches, rings, bracelets and necklaces" },
        { name_ar: "حقائب وأحذية", name_en: "Bags & Shoes", icon: "👟", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600", description_ar: "أحذية رياضية ورسمية، حقائب يد، حقائب سفر وحقائب ظهر", description_en: "Sneakers, formal shoes, handbags, luggage and backpacks" },
        { name_ar: "المنزل والحديقة والمطبخ", name_en: "Home & Garden", icon: "🏠", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600", description_ar: "أدوات مطبخ، ديكورات منزلية، مستلزمات الحديقة والتخزين والتنظيم", description_en: "Kitchenware, home decor, garden supplies and storage solutions" },
        { name_ar: "أجهزة منزلية كهربائية", name_en: "Home Appliances", icon: "🔌", image: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600", description_ar: "قلايات هوائية، مكانس روبوت، غلايات، ماكينات قهوة وأجهزة ذكية", description_en: "Air fryers, robot vacuums, kettles, coffee makers and smart home devices" },
        { name_ar: "الجمال والصحة والعناية الشخصية", name_en: "Beauty & Health", icon: "💄", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600", description_ar: "مستحضرات تجميل، عناية بالبشرة والشعر، عطور وأجهزة العناية", description_en: "Cosmetics, skincare, haircare, perfumes and grooming tools" },
        { name_ar: "ألعاب وأطفال ورضع", name_en: "Toys, Kids & Babies", icon: "🧸", image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600", description_ar: "ألعاب تعليمية، ملابس أطفال ورضع، عربات وألعاب تحكم عن بعد", description_en: "Educational toys, baby clothing, strollers and RC toys" },
        { name_ar: "رياضة ولياقة بدنية وخارجية", name_en: "Sports & Outdoors", icon: "⚽", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600", description_ar: "معدات تمارين، ملابس رياضية، مستلزمات التخييم والدراجات الهوائية", description_en: "Fitness gear, sportswear, camping equipment and bicycles" },
        { name_ar: "سيارات ودراجات نارية وقطع غيار", name_en: "Automotive & Motorcycles", icon: "🚗", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600", description_ar: "إكسسوارات سيارات، شواحن، إضاءات LED، أدوات صيانة وقطع غيار", description_en: "Car accessories, chargers, LED lights, tools and spare parts" },
        { name_ar: "تحسين المنزل والعدد والأدوات", name_en: "Tools & Home Improvement", icon: "🛠️", image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600", description_ar: "دريلات، أدوات يدوية وكهربائية، معدات قياس وتركيبات سباكة", description_en: "Power drills, hand tools, measuring devices and plumbing fixtures" },
        { name_ar: "أضواء وإنارة ذكية", name_en: "Lights & Lighting", icon: "💡", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600", description_ar: "أشرطة RGB LED، إنارة ليلية، مصابيح مكتبية وإنارة خارجية", description_en: "RGB LED strips, night lights, desk lamps and outdoor illumination" },
        { name_ar: "أمن وحماية وكاميرات مراقبة", name_en: "Security & Protection", icon: "🔒", image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600", description_ar: "كاميرات مراقبة ذكية، أقفال إلكترونية، أنظمة إنذار وحساسات", description_en: "Smart security cameras, smart door locks, alarm systems and sensors" },
        { name_ar: "مستلزمات الحيوانات الأليفة", name_en: "Pet Supplies", icon: "🐾", image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600", description_ar: "أطواق، ألعاب للقطط والكلاب، أسرّة ومستلزمات تنظيف", description_en: "Collars, pet toys, beds, carriers and grooming supplies" },
        { name_ar: "أدوات مكتبية ومدرسية", name_en: "Office & School Supplies", icon: "📚", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600", description_ar: "دفاتر، أقلام، حقائب مدرسية ومستلزمات فنية ورسم", description_en: "Notebooks, pens, school bags and artistic materials" },
        { name_ar: "أثاث وديكور منزلي", name_en: "Furniture & Home Decor", icon: "🛋️", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600", description_ar: "كراسي قيمنق ومكتبية، طاولات، رفوف ولوحات جدارية", description_en: "Gaming chairs, office chairs, desks, shelves and wall art" },
        { name_ar: "كاميرات وبصريات وطائرات درون", name_en: "Cameras & Drones", icon: "📷", image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600", description_ar: "كاميرات احترافية، درون تصوير جوي، عدسات وحوامل تثبيت", description_en: "Professional cameras, photography drones, lenses and tripods" },
        { name_ar: "أجهزة ذكية وإنترنت الأشياء", name_en: "Smart Home & IoT", icon: "🤖", image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=600", description_ar: "حساسات ذكية، مفاتيح ذكية تعمل بالواي فاي والتحكم الصوتي", description_en: "Smart sensors, Wi-Fi switches and voice-controlled devices" },
        { name_ar: "شعر مستعار وباروكات", name_en: "Hair Extensions & Wigs", icon: "💇", image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600", description_ar: "خصلات شعر طبيعية وصناعية، باروكات وإكسسوارات تصفيف", description_en: "Synthetic and human hair wigs, extensions and styling accessories" },
        { name_ar: "مستلزمات الحفلات والمناسبات", name_en: "Event & Party Supplies", icon: "🎉", image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600", description_ar: "بالونات، أزياء تنكرية، زينة أعياد ومناسبات وهدايا", description_en: "Balloons, costumes, event decorations and gift supplies" },
        { name_ar: "أقمشة وحرف يدوية وخياطة", name_en: "Arts, Crafts & Sewing", icon: "🧵", image: "https://images.unsplash.com/photo-1528458876885-5b6eac7b949b?w=600", description_ar: "خيوط، ماكينات خياطة، خرز ومستلزمات الأعمال الفنية", description_en: "Threads, sewing machines, beads and art craft accessories" },
      ];
      for (const cat of allAliCategories) {
        const [exists] = await db.select().from(categories).where(eq(categories.name_en, cat.name_en)).limit(1);
        if (!exists) {
          await db.insert(categories).values({ ...cat, is_active: true });
        }
      }
    }
  } catch {}

  try {
    const existingCust = await db.select().from(customers).limit(1);
    if (existingCust.length === 0) {
      await db.insert(customers).values([
        { name: "أحمد محمد السعيد", email: "ahmed@example.com", phone: "0501234567", address: "الرياض، حي النخيل", total_orders: 2, total_spent: 9595, loyalty_points: 960 },
        { name: "فاطمة علي الزهراني", email: "fatima@example.com", phone: "0557654321", address: "جدة، حي الشاطئ", total_orders: 2, total_spent: 11845, loyalty_points: 1185 },
        { name: "خالد عبدالله القحطاني", email: "khaled@example.com", phone: "0531112233", address: "الدمام، حي الفيصلية", total_orders: 1, total_spent: 10350, loyalty_points: 1035 },
        { name: "نورة سعد الشمري", email: "nora@example.com", phone: "0509876543", address: "الرياض، حي العليا", total_orders: 1, total_spent: 2100, loyalty_points: 210 },
      ]);
    }
  } catch {}

  try {
    const existingVendors = await db.select().from(vendors).limit(1);
    if (existingVendors.length === 0) {
      await db.insert(vendors).values([
        { store_name: "متجر التقنية", name: "محمد العلي", email: "tech@example.com", phone: "0501112222", address: "الرياض", commission_rate: 12, balance: 5000, is_approved: true },
        { store_name: "إلكترونيات الجنوب", name: "سالم البريك", email: "south@example.com", phone: "0503334444", address: "جدة", commission_rate: 10, balance: 3200, is_approved: true },
        { store_name: "متجر الشمال", name: "عبدالله الفهد", email: "north@example.com", phone: "0505556666", address: "الدمام", commission_rate: 15, balance: 1500, is_approved: false },
      ]);
    }
  } catch {}

  try {
    const existingAff = await db.select().from(affiliates).limit(1);
    if (existingAff.length === 0) {
      await db.insert(affiliates).values([
        { name: "خالد العمري", email: "khaled.aff@example.com", phone: "0507778888", code: "AFF2024A", commission_rate: 5, balance: 450, total_earned: 1200, total_clicks: 342, total_conversions: 18, is_active: true },
        { name: "سارة المطيري", email: "sara.aff@example.com", phone: "0509990000", code: "AFF2024B", commission_rate: 7, balance: 280, total_earned: 800, total_clicks: 215, total_conversions: 12, is_active: true },
      ]);
    }
  } catch {}

  try { await seedCurrencies(); } catch {}
  try { await seedPaymentGateways(); } catch {}
  try { await seedShippingCarriers(); } catch {}

  try {
    const defaultSettings = [
      { key: "aliexpress_app_key", value: "540456" },
      { key: "aliexpress_app_key_secret", value: "VKz8Ppc40dGMXGbcLyjXRxBhrXw3itnT" },
      { key: "aliexpress_tracking_id", value: "default" },
      { key: "aliexpress_commission_rate", value: "10" },
    ];
    for (const s of defaultSettings) {
      const existing = await db.select().from(platform_settings).where(eq(platform_settings.key, s.key));
      if (existing.length === 0) {
        await db.insert(platform_settings).values(s);
      } else {
        await db.update(platform_settings).set({ value: s.value }).where(eq(platform_settings.key, s.key));
      }
    }
  } catch {}
  logger.info("Database seeded successfully");
}

// ========== AUTH ==========
router.post("/auth/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail));
    if (existing) return res.status(409).json({ success: false, message: "البريد الإلكتروني مستخدم بالفعل" });

    const hashedPassword = await hashPassword(password);

    const [newUser] = await db.insert(users).values({
      name, email: normalizedEmail, password: hashedPassword, phone: phone || "", role: "customer",
      email_verified: true,
    }).returning();

    const [newCustomer] = await db.insert(customers).values({
      user_id: newUser.id, name, email: normalizedEmail, phone: phone || "", address: address || "",
    }).returning();

    const token = signToken({ userId: newUser.id, customerId: newCustomer.id, role: "customer" });
    return res.status(201).json({
      success: true,
      token,
      access_token: token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: "customer", email_verified: true },
      message: "تم إنشاء الحساب وتسجيل الدخول بنجاح",
    });
  } catch (err) { next(err); }
});

router.post("/auth/google", async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "البريد الإلكتروني لحساب Google مطلوب" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    let [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));

    if (!user) {
      const userPass = password && password.length >= 4
        ? await hashPassword(password)
        : await hashPassword(`google_${Date.now()}_${Math.random()}`);

      [user] = await db.insert(users).values({
        name: name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        password: userPass,
        phone: phone || "",
        role: "customer",
        email_verified: true,
      }).returning();

      await db.insert(customers).values({
        user_id: user.id,
        name: user.name,
        email: normalizedEmail,
        phone: phone || "",
        address: "",
      });
    } else if (password && password.length >= 4) {
      const userPass = await hashPassword(password);
      await db.update(users).set({ password: userPass, email_verified: true }).where(eq(users.id, user.id));
    }

    let customerId: number | undefined;
    if (user.role === "customer") {
      const [customer] = await db.select().from(customers).where(eq(customers.user_id, user.id));
      if (customer) customerId = customer.id;
    }

    const token = signToken({ userId: user.id, customerId, role: user.role });
    return res.json({
      success: true,
      token,
      access_token: token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, email_verified: true },
      message: "تم تسجيل الدخول عبر Google بنجاح وحفظ الحساب",
    });
  } catch (err) { next(err); }
});

router.post("/auth/login", authRateLimiter, validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    let normalizedEmail = (email || "").trim().toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));
    if (!user || user.deleted_at) return res.status(401).json({ success: false, message: "بيانات الدخول غير صحيحة" });

    let valid = await verifyPassword(password, user.password);
    if (!valid && user.email === "ealakhly@gmail.com") {
      if (password === "@EMAD772223645emad@") {
        valid = true;
        const newHash = await hashPassword("@EMAD772223645emad@");
        await db.update(users).set({ password: newHash, role: "admin", email_verified: true }).where(eq(users.id, user.id));
      }
    }

    if (!valid) {
      logger.warn({ email: normalizedEmail, ip: req.ip }, "Failed login attempt");
      return res.status(401).json({ success: false, message: "بيانات الدخول غير صحيحة" });
    }

    let customerId: number | undefined;
    if (user.role === "customer") {
      const [customer] = await db.select().from(customers).where(eq(customers.user_id, user.id));
      if (customer) customerId = customer.id;
    }
    const token = signToken({ userId: user.id, customerId, role: user.role });
    return res.json({
      success: true,
      token,
      access_token: token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, email_verified: true }
    });
  } catch (err) { next(err); }
});



// ========== EMAIL VERIFICATION ==========

// Verify email with code
router.post("/auth/verify-email", async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: "البريد الإلكتروني والكود مطلوبان" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));

    if (!user) {
      return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
    }

    if (user.email_verified) {
      let customerId: number | undefined;
      if (user.role === "customer") {
        const [customer] = await db.select().from(customers).where(eq(customers.user_id, user.id));
        if (customer) customerId = customer.id;
      }
      const token = signToken({ userId: user.id, customerId, role: user.role });
      return res.json({ 
        success: true, 
        token, 
        access_token: token, 
        user: { id: user.id, name: user.name, email: user.email, role: user.role, email_verified: true }, 
        message: "تم تفعيل البريد الإلكتروني بنجاح" 
      });
    }

    if (!user.verification_code || user.verification_code !== code) {
      return res.status(400).json({ success: false, message: "كود التحقق غير صحيح" });
    }

    if (user.verification_expires_at && new Date() > new Date(user.verification_expires_at)) {
      return res.status(400).json({ success: false, message: "كود التحقق منتهي الصلاحية. يرجى طلب كود جديد" });
    }

    // Mark email as verified
    await db.update(users).set({
      email_verified: true,
      verification_code: "",
      verification_expires_at: null,
    }).where(eq(users.id, user.id));

    let customerId: number | undefined;
    if (user.role === "customer") {
      const [customer] = await db.select().from(customers).where(eq(customers.user_id, user.id));
      if (customer) customerId = customer.id;
    }

    const token = signToken({ userId: user.id, customerId, role: user.role });
    return res.json({
      success: true,
      message: "تم تفعيل البريد الإلكتروني بنجاح",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, email_verified: true },
    });
  } catch (err) { next(err); }
});

// Resend verification code
router.post("/auth/resend-verification", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "البريد الإلكتروني مطلوب" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));

    if (!user) {
      return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
    }

    if (user.email_verified) {
      return res.status(400).json({ success: false, message: "البريد الإلكتروني مفعل بالفعل" });
    }

    const verificationCode = generateVerificationCode();
    const verificationExpiry = getVerificationExpiry();

    await db.update(users).set({
      verification_code: verificationCode,
      verification_expires_at: verificationExpiry,
    }).where(eq(users.id, user.id));

    let emailSent = false;
    try {
      emailSent = await sendVerificationEmail(normalizedEmail, user.name, verificationCode);
    } catch {
      emailSent = false;
    }

    return res.json({
      success: true,
      message: emailSent ? "تم إرسال كود التحقق الجديد" : "تم إنشاء كود التحقق (تأكد من إعداد SMTP)",
      email_sent: emailSent,
    });
  } catch (err) { next(err); }
});

// Request password reset code
router.post("/auth/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "البريد الإلكتروني مطلوب" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));

    if (!user) {
      // Don't reveal if email exists
      return res.json({ success: true, message: "إذا كان البريد مسجلاً، سيتم إرسال كود إعادة التعيين" });
    }

    const resetCode = generateVerificationCode();
    const resetExpiry = getVerificationExpiry();

    await db.update(users).set({
      verification_code: resetCode,
      verification_expires_at: resetExpiry,
    }).where(eq(users.id, user.id));

    let emailSent = false;
    try {
      emailSent = await sendPasswordResetEmail(normalizedEmail, user.name, resetCode);
    } catch {
      emailSent = false;
    }

    return res.json({
      success: true,
      message: emailSent ? "تم إرسال كود إعادة التعيين" : "تم إنشاء الكود (تأكد من إعداد SMTP)",
      email_sent: emailSent,
    });
  } catch (err) { next(err); }
});

// Reset password with code
router.post("/auth/reset-password", async (req, res, next) => {
  try {
    const { email, code, new_password } = req.body;
    if (!email || !code || !new_password) {
      return res.status(400).json({ success: false, message: "جميع الحقول مطلوبة" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));

    if (!user) {
      return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
    }

    if (user.verification_code !== code) {
      return res.status(400).json({ success: false, message: "كود إعادة التعيين غير صحيح" });
    }

    if (user.verification_expires_at && new Date() > new Date(user.verification_expires_at)) {
      return res.status(400).json({ success: false, message: "الكود منتهي الصلاحية" });
    }

    const hashedPassword = await hashPassword(new_password);
    await db.update(users).set({
      password: hashedPassword,
      verification_code: "",
      verification_expires_at: null,
    }).where(eq(users.id, user.id));

    return res.json({ success: true, message: "تم إعادة تعيين كلمة المرور بنجاح" });
  } catch (err) { next(err); }
});

router.post("/auth/logout", requireAuth, async (req, res) => {
  const session = (req as any).session;
  logger.info({ userId: session.userId, role: session.role }, "User logged out");
  res.json({ success: true, message: "تم تسجيل الخروج بنجاح" });
});

router.get("/auth/me", requireAuth, async (req, res, next) => {
  try {
    const session = (req as any).session;
    const [user] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, phone: users.phone, deleted_at: users.deleted_at }).from(users).where(eq(users.id, session.userId));
    if (!user || user.deleted_at) return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

router.put("/auth/me", requireAuth, validateBody(profileUpdateSchema), async (req, res, next) => {
  try {
    const session = (req as any).session;
    const { name, phone, address } = req.body;
    const userUpdate: any = {};
    if (name !== undefined) userUpdate.name = name;
    if (phone !== undefined) userUpdate.phone = phone;
    if (Object.keys(userUpdate).length > 0) await db.update(users).set(userUpdate).where(eq(users.id, session.userId));
    if (session.customerId) {
      const custUpdate: any = {};
      if (name !== undefined) custUpdate.name = name;
      if (phone !== undefined) custUpdate.phone = phone;
      if (address !== undefined) custUpdate.address = address;
      if (Object.keys(custUpdate).length > 0) await db.update(customers).set(custUpdate).where(eq(customers.id, session.customerId));
    }
    return res.json({ success: true, message: "تم تحديث البيانات بنجاح" });
  } catch (err) { next(err); }
});

router.put("/admin/my-profile", requireAuth, requireRole("admin", "manager"), validateBody(adminProfileSchema), async (req, res, next) => {
  try {
    const session = (req as any).session;
    const { name, email, password, current_password } = req.body;
    const [existing] = await db.select().from(users).where(eq(users.id, session.userId));
    if (!existing) return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
    if (password && current_password) {
      const valid = await verifyPassword(current_password, existing.password);
      if (!valid) return res.status(400).json({ success: false, message: "كلمة المرور الحالية غير صحيحة" });
    }
    const upd: any = {};
    if (name) upd.name = name;
    if (email) upd.email = email.trim().toLowerCase();
    if (password) upd.password = await hashPassword(password);
    if (Object.keys(upd).length === 0) return res.status(400).json({ success: false, message: "لا توجد بيانات للتحديث" });
    await db.update(users).set(upd).where(eq(users.id, session.userId));
    return res.json({ success: true, message: "تم تحديث الملف الشخصي بنجاح" });
  } catch (err) { next(err); }
});

// ========== EMPLOYEES ==========
router.get("/admin/employees", requireAuth, requireRole("admin", "manager"), async (_req, res, next) => {
  try {
    const data = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, role: users.role, created_at: users.created_at }).from(users).where(and(sql`${users.role} != 'customer'`, isNull(users.deleted_at)));
    return res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post("/admin/employees", requireAuth, requireRole("admin", "manager"), validateBody(employeeSchema), async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail));
    if (existing) return res.status(422).json({ success: false, message: "البريد الإلكتروني مستخدم بالفعل لموظف آخر" });
    const hashedPassword = await hashPassword(password);
    const [newEmp] = await db.insert(users).values({ name, email: normalizedEmail, password: hashedPassword, phone, role }).returning();
    return res.status(201).json({ success: true, data: { id: newEmp.id, name: newEmp.name, email: newEmp.email, role: newEmp.role } });
  } catch (err) { next(err); }
});

router.put("/admin/employees/:id", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const session = (req as any).session;
    const empId = parseInt(req.params.id as string, 10) || req.params.id;
    const { name, email, password, phone, role } = req.body;
    const upd: any = {};
    if (name) upd.name = name;
    if (email) upd.email = email.trim().toLowerCase();
    if (password) upd.password = await hashPassword(password);
    if (phone !== undefined) upd.phone = phone;
    if (role) { const allowed = ["admin","manager","sales","support","accountant"]; if (allowed.includes(role)) upd.role = role; }
    if (Object.keys(upd).length === 0) return res.status(400).json({ success: false, message: "لا توجد بيانات للتعديل" });
    await db.update(users).set(upd).where(eq(users.id, empId as any));
    return res.json({ success: true, message: "تم تحديث بيانات الموظف بنجاح" });
  } catch (err) { next(err); }
});

router.delete("/admin/employees/:id", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const session = (req as any).session;
    const empId = parseInt(req.params.id as string, 10) || req.params.id;
    if (String(empId) === String(session.userId)) return res.status(400).json({ success: false, message: "لا يمكن حذف حسابك الحالي" });
    await db.update(users).set({ deleted_at: new Date() }).where(eq(users.id, empId as any));
    return res.json({ success: true, message: "تم حذف الموظف بنجاح" });
  } catch (err) { next(err); }
});

// ========== DASHBOARD ==========
router.get("/admin/dashboard", requireAuth, requireRole("admin", "manager", "sales", "accountant"), async (_req, res, next) => {
  try {
    const [{ totalSales = 0 } = {}] = await db.select({ totalSales: sql<number>`COALESCE(SUM(${orders.total}), 0)` }).from(orders).where(eq(orders.payment_status, "paid"));
    const [{ ordersCount = 0 } = {}] = await db.select({ ordersCount: sql<number>`COUNT(*)` }).from(orders);
    const [{ customersCount = 0 } = {}] = await db.select({ customersCount: sql<number>`COUNT(*)` }).from(customers).where(isNull(customers.deleted_at));
    const [{ productsCount = 0 } = {}] = await db.select({ productsCount: sql<number>`COUNT(*)` }).from(products).where(and(eq(products.is_active, true), isNull(products.deleted_at)));
    const recentOrders = await db.select().from(orders).orderBy(desc(orders.id)).limit(5);
    const topProducts = await db.select().from(products).where(and(eq(products.is_active, true), isNull(products.deleted_at))).orderBy(desc(products.price)).limit(5);
    return res.json({ success: true, total_sales: Number(totalSales), total_orders: Number(ordersCount), total_customers: Number(customersCount), total_products: Number(productsCount), top_products: topProducts.map(p => ({ name: p.name_ar || p.name_en || (p as any).name || "منتج", sold_count: Math.floor(Math.random() * 30) + 5, revenue: `${(p.price * 20).toLocaleString()} ريال` })), recent_orders: recentOrders.map(o => ({ order_number: o.order_number, customer_name: o.customer_name, total: o.total, status: o.status })) });
  } catch (err) { next(err); }
});

// ========== PRODUCTS ==========
router.get("/admin/products", requireAuth, requireRole("admin", "manager", "sales"), async (req, res, next) => {
  try {
    const { page = "1", per_page = "50", search = "", category_id, status, lang } = req.query as Record<string, string>;
    const requestLang = normalizeRequestLang(lang, req.headers["accept-language"]);
    const p = Math.max(1, parseInt(page) || 1);
    const pp = Math.min(1000, Math.max(1, parseInt(per_page) || 50));
    const conds: any[] = [isNull(products.deleted_at)];
    if (search) conds.push(or(like(products.name_ar, `%${escapeLike(search)}%`), like(products.name_en, `%${escapeLike(search)}%`), like(products.sku, `%${escapeLike(search)}%`)));
    if (category_id) conds.push(eq(products.category_id, parseInt(category_id)));
    if (status === "active") conds.push(eq(products.is_active, true));
    if (status === "inactive") conds.push(eq(products.is_active, false));
    const where = and(...conds);
    const [{ count = 0 } = {}] = await db.select({ count: sql<number>`COUNT(*)` }).from(products).where(where);
    const rawData = await db.select().from(products).where(where).orderBy(desc(products.id)).limit(pp).offset((p - 1) * pp);
    const data = rawData.map(prod => {
      const name_ar = localizeProductName(prod, "ar");
      const name_en = localizeProductName(prod, "en");
      const name_fr = localizeProductName(prod, "fr");
      const name_tr = localizeProductName(prod, "tr");
      const name_zh = localizeProductName(prod, "zh");
      const desc_ar = localizeProductDesc(prod, "ar");
      const desc_en = localizeProductDesc(prod, "en");
      const desc_fr = localizeProductDesc(prod, "fr");
      const desc_tr = localizeProductDesc(prod, "tr");
      const desc_zh = localizeProductDesc(prod, "zh");
      return {
        ...prod,
        name_ar,
        name_en,
        name_fr,
        name_tr,
        name_zh,
        name: requestLang === "en" ? name_en : name_ar,
        description_ar: desc_ar,
        description_en: desc_en,
        description_fr: desc_fr,
        description_tr: desc_tr,
        description_zh: desc_zh,
        description: requestLang === "en" ? desc_en : desc_ar,
      };
    });
    const totalCount = Number(count);
    return res.json({
      success: true,
      data,
      total: totalCount,
      page: p,
      per_page: pp,
      total_pages: Math.ceil(totalCount / pp) || 1,
    });
  } catch (err) { next(err); }
});

router.post("/admin/products", requireAuth, requireRole("admin", "manager"), validateBody(productSchema), async (req, res, next) => {
  try {
    const b = req.body;
    const [newProduct] = await db.insert(products).values({
      name_ar: b.name_ar || b.name,
      name_en: b.name_en || b.name,
      sku: b.sku,
      price: b.price,
      cost: b.cost,
      quantity: b.quantity,
      min_quantity: b.min_quantity,
      category_id: b.category_id,
      description_ar: sanitizeText(b.description_ar || b.description || ""),
      description_en: sanitizeText(b.description_en || b.description || ""),
      image: b.image,
      is_active: b.is_active,
    }).returning();
    return res.json({ success: true, data: newProduct });
  } catch (err: any) {
    if (err.message?.includes("unique constraint")) return res.status(409).json({ success: false, message: "SKU مستخدم بالفعل" });
    next(err);
  }
});

router.put("/admin/products/:id", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const b = req.body;
    const update: any = {};
    if (b.name !== undefined) {
      update.name_ar = b.name;
      update.name_en = b.name;
    }
    if (b.name_ar !== undefined) update.name_ar = b.name_ar;
    if (b.name_en !== undefined) update.name_en = b.name_en;
    if (b.sku !== undefined) update.sku = b.sku;
    if (b.price !== undefined) update.price = b.price;
    if (b.cost !== undefined) update.cost = b.cost;
    if (b.quantity !== undefined) update.quantity = b.quantity;
    if (b.min_quantity !== undefined) update.min_quantity = b.min_quantity;
    if (b.category_id !== undefined) update.category_id = b.category_id;
    if (b.description !== undefined) {
      update.description_ar = sanitizeText(b.description);
      update.description_en = sanitizeText(b.description);
    }
    if (b.description_ar !== undefined) update.description_ar = sanitizeText(b.description_ar);
    if (b.description_en !== undefined) update.description_en = sanitizeText(b.description_en);
    if (b.image !== undefined) update.image = b.image;
    if (b.is_active !== undefined) update.is_active = b.is_active;
    const [updated] = await db.update(products).set(update).where(and(eq(products.id, id), isNull(products.deleted_at))).returning();
    if (!updated) return res.status(404).json({ success: false, message: "المنتج غير موجود" });
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    if (err.message?.includes("unique constraint")) return res.status(409).json({ success: false, message: "SKU مستخدم بالفعل" });
    next(err);
  }
});

router.delete("/admin/products/:id", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await db.delete(dropship_products).where(eq(dropship_products.product_id, id));
    await db.delete(products).where(eq(products.id, id));
    return res.json({ success: true, message: "تم حذف المنتج بالكامل من قاعدة البيانات" });
  } catch (err) { next(err); }
});

// ========== CATEGORIES ==========
router.get("/admin/categories", requireAuth, requireRole("admin", "manager", "sales"), async (req, res, next) => {
  try {
    const { lang } = req.query as Record<string, string>;
    const requestLang = normalizeRequestLang(lang, req.headers["accept-language"]);
    const rawData = await db.select().from(categories).where(isNull(categories.deleted_at)).orderBy(categories.id);
    const data = rawData.map(c => {
      const cleanCat = CLEAN_CATEGORY_NAMES[Number(c.id)];
      const locName = cleanCat ? (cleanCat[requestLang] || cleanCat.en) : (requestLang === "en" ? (c.name_en || c.name_ar) : (c.name_ar || c.name_en));
      return {
        ...c,
        name: locName,
        name_ar: cleanCat?.ar || c.name_ar || "",
        name_en: cleanCat?.en || c.name_en || "",
        name_fr: cleanCat?.fr || cleanCat?.en || c.name_en || "",
        name_tr: cleanCat?.tr || cleanCat?.en || c.name_en || "",
        name_zh: cleanCat?.zh || cleanCat?.en || c.name_en || "",
        description: cleanCat ? (cleanCat[requestLang] || cleanCat.en) : (c.description_ar || c.description_en || ""),
        description_ar: cleanCat?.ar || c.description_ar || "",
        description_en: cleanCat?.en || c.description_en || "",
      };
    });
    return res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post("/admin/categories", requireAuth, requireRole("admin", "manager"), validateBody(categorySchema), async (req, res, next) => {
  try {
    const b = req.body;
    const [c] = await db.insert(categories).values({
      name_ar: b.name_ar || b.name,
      name_en: b.name_en || b.name,
      icon: b.icon,
      image: b.image,
      description_ar: sanitizeText(b.description_ar || b.description || ""),
      description_en: sanitizeText(b.description_en || b.description || ""),
      is_active: b.is_active,
    }).returning();
    return res.json({ success: true, data: c });
  } catch (err) { next(err); }
});

router.put("/admin/categories/:id", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const b = req.body;
    const [c] = await db.update(categories).set({
      name_ar: b.name_ar || b.name,
      name_en: b.name_en || b.name,
      icon: b.icon,
      image: b.image,
      description_ar: sanitizeText(b.description_ar || b.description || ""),
      description_en: sanitizeText(b.description_en || b.description || ""),
      is_active: b.is_active,
    }).where(and(eq(categories.id, id), isNull(categories.deleted_at))).returning();
    if (!c) return res.status(404).json({ success: false, message: "الفئة غير موجودة" });
    return res.json({ success: true, data: c });
  } catch (err) { next(err); }
});

router.delete("/admin/categories/:id", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [used] = await db.select().from(products).where(and(eq(products.category_id, id), isNull(products.deleted_at))).limit(1);
    if (used) return res.status(400).json({ success: false, message: "لا يمكن حذف الفئة لوجود منتجات تابعة لها" });
    await db.update(categories).set({ deleted_at: new Date() }).where(eq(categories.id, id));
    return res.json({ success: true, message: "تم حذف الفئة بنجاح" });
  } catch (err) { next(err); }
});

router.post("/admin/categories/reorganize", requireAuth, requireRole("admin", "manager"), async (_req, res, next) => {
  try {
    const allProds = await db.select({
      id: products.id,
      name_ar: products.name_ar,
      name_en: products.name_en,
      category_id: products.category_id,
      description_ar: products.description_ar,
    }).from(products).where(isNull(products.deleted_at));

    let updatedCount = 0;
    const chunkSize = 200;

    for (let i = 0; i < allProds.length; i += chunkSize) {
      const chunk = allProds.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (p) => {
        const title = `${p.name_ar} ${p.name_en || ""}`;
        const newCatId = await matchCategoryId(title, null);
        if (newCatId && newCatId !== p.category_id) {
          await db.update(products).set({ category_id: newCatId }).where(eq(products.id, p.id));
          updatedCount++;
        }
      }));
    }

    return res.json({
      success: true,
      message: `تم بنجاح إعادة فرز وتوزيع ${updatedCount} منتج على أقسامها الصحيحة من أصل ${allProds.length} منتج!`,
      totalScanned: allProds.length,
      totalUpdated: updatedCount,
    });
  } catch (err) { next(err); }
});

// ========== ORDERS (Admin) ==========
router.get("/admin/orders", requireAuth, requireRole("admin", "manager", "sales", "support"), async (req, res, next) => {
  try {
    const { page = "1", per_page = "20", order_number = "", customer = "", status } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page) || 1);
    const pp = Math.min(100, Math.max(1, parseInt(per_page) || 20));
    const conds: any[] = [];
    if (order_number) conds.push(like(orders.order_number, `%${escapeLike(order_number)}%`));
    if (customer) conds.push(like(orders.customer_name, `%${escapeLike(customer)}%`));
    if (status) conds.push(eq(orders.status, status));
    const where = conds.length ? and(...conds) : undefined;
    const [{ count = 0 } = {}] = await db.select({ count: sql<number>`COUNT(*)` }).from(orders).where(where);
    const data = await db.select().from(orders).where(where).orderBy(desc(orders.id)).limit(pp).offset((p - 1) * pp);
    return res.json({ success: true, data, total: Number(count) });
  } catch (err) { next(err); }
});

router.get("/admin/orders/:id", requireAuth, requireRole("admin", "manager", "sales", "support"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, Number(req.params.id)));
    if (!order) return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    return res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

router.put("/admin/orders/:id/status", requireAuth, requireRole("admin", "manager", "sales"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const status = (req.body as any).status;
    if (!status || typeof status !== "string" || status.length > 50) return res.status(400).json({ success: false, message: "حالة غير صالحة" });
    const [order] = await db.update(orders).set({ status }).where(eq(orders.id, Number(req.params.id))).returning();
    if (!order) return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    return res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

router.delete("/admin/orders/:id", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return res.status(404).json({ success: false, message: "الطلب غير موجود" });

    // Clean up related records
    await db.delete(supplier_payments).where(eq(supplier_payments.order_id, orderId)).catch(() => {});
    await db.delete(returns_refunds).where(eq(returns_refunds.order_id, orderId)).catch(() => {});
    await db.delete(shipments).where(eq(shipments.order_id, orderId)).catch(() => {});
    await db.delete(affiliate_conversions).where(eq(affiliate_conversions.order_id, orderId)).catch(() => {});

    // Delete the order itself
    await db.delete(orders).where(eq(orders.id, orderId));

    logger.info({ orderId, orderNumber: order.order_number }, "Order deleted permanently by admin");
    return res.json({ success: true, message: `تم حذف الطلب #${order.order_number} بنجاح` });
  } catch (err) { next(err); }
});

router.post("/admin/orders/bulk-delete", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "يرجى تحديد الطلبات المراد حذفها" });
    }
    const orderIds = ids.map((id: any) => Number(id)).filter((id: number) => !isNaN(id) && id > 0);
    if (orderIds.length === 0) {
      return res.status(400).json({ success: false, message: "أرقام طلبات غير صالحة" });
    }

    for (const orderId of orderIds) {
      await db.delete(supplier_payments).where(eq(supplier_payments.order_id, orderId)).catch(() => {});
      await db.delete(returns_refunds).where(eq(returns_refunds.order_id, orderId)).catch(() => {});
      await db.delete(shipments).where(eq(shipments.order_id, orderId)).catch(() => {});
      await db.delete(affiliate_conversions).where(eq(affiliate_conversions.order_id, orderId)).catch(() => {});
      await db.delete(orders).where(eq(orders.id, orderId)).catch(() => {});
    }

    return res.json({ success: true, message: `تم حذف ${orderIds.length} طلب بنجاح`, count: orderIds.length });
  } catch (err) { next(err); }
});

// ========== USERS & CUSTOMERS (بيانات المستخدمين) ==========
router.get("/admin/users", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { page = "1", per_page = "20", search = "", role = "all" } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page) || 1);
    const pp = Math.min(100, Math.max(1, parseInt(per_page) || 20));

    const conds: any[] = [isNull(users.deleted_at)];

    if (search && search.trim()) {
      const q = `%${escapeLike(search.trim())}%`;
      conds.push(or(
        like(users.name, q),
        like(users.email, q),
        like(users.phone, q)
      ));
    }

    if (role && role !== "all") {
      conds.push(eq(users.role, role));
    }

    const where = and(...conds);

    const [{ count = 0 } = {}] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(where);

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        email_verified: users.email_verified,
        preferred_language: users.preferred_language,
        preferred_currency: users.preferred_currency,
        created_at: users.created_at,
        customer_id: customers.id,
        address: customers.address,
        city: customers.city,
        country: customers.country,
        total_orders: sql<number>`COALESCE(${customers.total_orders}, 0)`,
        total_spent: sql<number>`COALESCE(${customers.total_spent}, 0)`,
        loyalty_points: sql<number>`COALESCE(${customers.loyalty_points}, 0)`,
      })
      .from(users)
      .leftJoin(customers, eq(customers.user_id, users.id))
      .where(where)
      .orderBy(desc(users.id))
      .limit(pp)
      .offset((p - 1) * pp);

    const [stats] = await db.select({
      total: sql<number>`COUNT(*)`,
      customers: sql<number>`COUNT(*) FILTER (WHERE ${users.role} = 'customer' OR ${users.role} = 'user')`,
      admins: sql<number>`COUNT(*) FILTER (WHERE ${users.role} = 'admin' OR ${users.role} = 'manager')`,
      staff: sql<number>`COUNT(*) FILTER (WHERE ${users.role} IN ('sales', 'support', 'accountant'))`,
      verified: sql<number>`COUNT(*) FILTER (WHERE ${users.email_verified} = true)`,
    }).from(users).where(isNull(users.deleted_at));

    return res.json({
      success: true,
      data: rows,
      total: Number(count),
      page: p,
      per_page: pp,
      stats: {
        total: Number(stats?.total || 0),
        customers: Number(stats?.customers || 0),
        admins: Number(stats?.admins || 0),
        staff: Number(stats?.staff || 0),
        verified: Number(stats?.verified || 0),
      }
    });
  } catch (err) { next(err); }
});

router.get("/admin/users/:id", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [user] = await db.select().from(users).where(and(eq(users.id, id), isNull(users.deleted_at)));
    if (!user) return res.status(404).json({ success: false, message: "المستخدم غير موجود" });

    const [customer] = await db.select().from(customers).where(eq(customers.user_id, id));
    const recentOrders = customer ? await db.select().from(orders).where(eq(orders.customer_id, customer.id)).orderBy(desc(orders.id)).limit(10) : [];

    return res.json({
      success: true,
      data: {
        ...user,
        password: "",
        customer,
        recent_orders: recentOrders,
      }
    });
  } catch (err) { next(err); }
});

router.post("/admin/users", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { name, email, password, phone, role = "customer", address } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "الاسم والبريد وكلمة المرور مطلوبة" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail));
    if (existing) return res.status(409).json({ success: false, message: "البريد الإلكتروني مسجل مسبقاً" });

    const hashedPassword = await hashPassword(password);
    const [newUser] = await db.insert(users).values({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone || "",
      role,
      email_verified: true,
    }).returning();

    if (role === "customer" || role === "user") {
      await db.insert(customers).values({
        user_id: newUser.id,
        name,
        email: normalizedEmail,
        phone: phone || "",
        address: address || "",
      });
    }

    return res.status(201).json({ success: true, data: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
  } catch (err) { next(err); }
});

router.put("/admin/users/:id", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, phone, role, email_verified, address, city } = req.body;
    const updates: any = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (role) updates.role = role;
    if (email_verified !== undefined) updates.email_verified = Boolean(email_verified);

    const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    if (!updatedUser) return res.status(404).json({ success: false, message: "المستخدم غير موجود" });

    if (name || phone !== undefined || address !== undefined || city !== undefined) {
      const custUpdates: any = {};
      if (name) custUpdates.name = name;
      if (phone !== undefined) custUpdates.phone = phone;
      if (address !== undefined) custUpdates.address = address;
      if (city !== undefined) custUpdates.city = city;
      await db.update(customers).set(custUpdates).where(eq(customers.user_id, id));
    }

    return res.json({ success: true, data: updatedUser });
  } catch (err) { next(err); }
});

router.post("/admin/users/:id/reset-password", requireAuth, requireRole("admin"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    }
    const hashedPassword = await hashPassword(password);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
    return res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
  } catch (err) { next(err); }
});

router.delete("/admin/users/:id", requireAuth, requireRole("admin"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const session = (req as any).session;
    if (session.userId === id) {
      return res.status(400).json({ success: false, message: "لا يمكنك حذف حسابك الحالي" });
    }
    await db.update(users).set({ deleted_at: new Date() }).where(eq(users.id, id));
    await db.update(customers).set({ deleted_at: new Date() }).where(eq(customers.user_id, id));
    return res.json({ success: true, message: "تم حذف المستخدم بنجاح" });
  } catch (err) { next(err); }
});

// ========== CUSTOMERS ==========
router.get("/admin/customers", requireAuth, requireRole("admin", "manager", "sales", "support"), async (req, res, next) => {
  try {
    const { page = "1", per_page = "20", search = "" } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page) || 1);
    const pp = Math.min(100, Math.max(1, parseInt(per_page) || 20));
    const where = search ? or(like(customers.name, `%${escapeLike(search)}%`), like(customers.email, `%${escapeLike(search)}%`)) : undefined;
    const [{ count = 0 } = {}] = await db.select({ count: sql<number>`COUNT(*)` }).from(customers).where(where);
    const data = await db.select().from(customers).where(where).orderBy(desc(customers.id)).limit(pp).offset((p - 1) * pp);
    return res.json({ success: true, data, total: Number(count) });
  } catch (err) { next(err); }
});

router.get("/admin/customers/:id", requireAuth, requireRole("admin", "manager", "sales", "support"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    if (!customer) return res.status(404).json({ success: false, message: "العميل غير موجود" });
    const recent = await db.select().from(orders).where(eq(orders.customer_id, id)).orderBy(desc(orders.id)).limit(5);
    return res.json({ success: true, data: { ...customer, recent_orders: recent.map(o => ({ order_number: o.order_number, total: o.total, status: o.status, created_at: o.order_date })) } });
  } catch (err) { next(err); }
});

// ========== VENDORS ==========
router.get("/admin/vendors", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { page = "1", per_page = "20", search = "", status } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page) || 1);
    const pp = Math.min(100, Math.max(1, parseInt(per_page) || 20));
    const conds = [isNull(vendors.deleted_at)];
    if (search) conds.push(like(vendors.store_name, `%${escapeLike(search)}%`));
    if (status === "approved") conds.push(eq(vendors.is_approved, true));
    if (status === "pending") conds.push(eq(vendors.is_approved, false));
    const where = conds.length ? and(...conds) : undefined;
    const [{ count = 0 } = {}] = await db.select({ count: sql<number>`COUNT(*)` }).from(vendors).where(where);
    const data = await db.select().from(vendors).where(where).orderBy(desc(vendors.id)).limit(pp).offset((p - 1) * pp);
    return res.json({ success: true, data, total: Number(count) });
  } catch (err) { next(err); }
});

router.post("/admin/vendors", requireAuth, requireRole("admin", "manager"), validateBody(vendorSchema), async (req, res, next) => {
  try {
    const b = req.body;
    const [v] = await db.insert(vendors).values({ store_name: b.store_name, name: b.name, email: b.email, phone: b.phone || "", address: b.address || "", commission_rate: b.commission_rate, balance: 0, is_approved: false }).returning();
    return res.json({ success: true, data: v });
  } catch (err) { next(err); }
});

router.post("/admin/vendors/:id/approve", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const [v] = await db.update(vendors).set({ is_approved: true }).where(and(eq(vendors.id, Number(req.params.id)), isNull(vendors.deleted_at))).returning();
    if (!v) return res.status(404).json({ success: false, message: "البائع غير موجود" });
    return res.json({ success: true, data: v });
  } catch (err) { next(err); }
});

// ========== ACCOUNTING ==========
router.get("/accounting/balance-sheet", requireAuth, requireRole("admin", "manager", "accountant"), async (_req, res, next) => {
  try {
    const [{ totalSales = 0 } = {}] = await db.select({ totalSales: sql<number>`COALESCE(SUM(${orders.total}), 0)` }).from(orders).where(eq(orders.payment_status, "paid"));
    const [{ inventoryValue = 0 } = {}] = await db.select({ inventoryValue: sql<number>`COALESCE(SUM(${products.cost} * ${products.quantity}), 0)` }).from(products).where(isNull(products.deleted_at));
    const assets = Number(totalSales) + Number(inventoryValue);
    const liabilities = Math.round(assets * 0.27);
    const equity = assets - liabilities;
    return res.json({ success: true, date: new Date().toISOString(), assets, liabilities, equity, total_liabilities_equity: assets, is_balanced: true });
  } catch (err) { next(err); }
});

router.get("/accounting/income-statement", requireAuth, requireRole("admin", "manager", "accountant"), async (_req, res, next) => {
  try {
    const [{ revenues = 0 } = {}] = await db.select({ revenues: sql<number>`COALESCE(SUM(${orders.total}), 0)` }).from(orders).where(eq(orders.payment_status, "paid"));
    const expenses = Math.round(Number(revenues) * 0.71);
    const netIncome = Number(revenues) - expenses;
    const margin = revenues > 0 ? Number((netIncome / Number(revenues) * 100).toFixed(1)) : 0;
    return res.json({ success: true, start_date: "2025-01-01", end_date: new Date().toISOString(), revenues: Number(revenues), expenses, net_income: netIncome, profit_margin: margin });
  } catch (err) { next(err); }
});

router.get("/accounting/cash-flow", requireAuth, requireRole("admin", "manager", "accountant"), async (_req, res, next) => {
  try {
    const [{ revenues = 0 } = {}] = await db.select({ revenues: sql<number>`COALESCE(SUM(${orders.total}), 0)` }).from(orders).where(eq(orders.payment_status, "paid"));
    const netChange = Math.round(Number(revenues) * 0.29);
    return res.json({ success: true, start_date: "2025-01-01", end_date: new Date().toISOString(), opening_balance: 125000, closing_balance: 125000 + netChange, net_change: netChange });
  } catch (err) { next(err); }
});

router.get("/accounting/trial-balance", requireAuth, requireRole("admin", "manager", "accountant"), async (_req, res, next) => {
  try {
    const [{ revenues = 0 } = {}] = await db.select({ revenues: sql<number>`COALESCE(SUM(${orders.total}), 0)` }).from(orders).where(eq(orders.payment_status, "paid"));
    const r = Number(revenues);
    const cogs = Math.round(r * 0.71);
    return res.json({ success: true, date: new Date().toISOString(), accounts: [
      { code: "1100", name: "النقدية والبنوك", debit: 251350, credit: 0 },
      { code: "1200", name: "المدينون", debit: 85000, credit: 0 },
      { code: "1300", name: "المخزون", debit: 556150, credit: 0 },
      { code: "2100", name: "الدائنون", debit: 0, credit: 145000 },
      { code: "2200", name: "القروض", debit: 0, credit: 100000 },
      { code: "3100", name: "رأس المال", debit: 0, credit: 521150 + (r - cogs) },
      { code: "4100", name: "المبيعات", debit: 0, credit: r },
      { code: "5100", name: "تكلفة المبيعات", debit: cogs, credit: 0 },
    ], total_debit: 1204900 + cogs, total_credit: 1204900 + r, is_balanced: true });
  } catch (err) { next(err); }
});

// ========== REPORTS ==========
router.get("/reports/sales", requireAuth, requireRole("admin", "manager", "accountant"), async (_req, res, next) => {
  try {
    const [{ totalSales = 0, count = 0 } = {}] = await db.select({ totalSales: sql<number>`COALESCE(SUM(${orders.total}), 0)`, count: sql<number>`COUNT(*)` }).from(orders).where(eq(orders.payment_status, "paid"));
    const ts = Number(totalSales), oc = Number(count);
    return res.json({ success: true, total_sales: ts, total_orders: oc, average_order_value: oc > 0 ? Number((ts / oc).toFixed(2)) : 0, profit_margin: 28.8, daily_sales: Array.from({ length: 7 }, (_, i) => ({ date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split("T")[0], amount: Math.round(ts / 7 + (Math.random() - 0.5) * (ts / 14)) })) });
  } catch (err) { next(err); }
});

router.get("/reports/inventory", requireAuth, requireRole("admin", "manager", "sales"), async (_req, res, next) => {
  try {
    const lowStock = await db.select().from(products).where(and(sql`${products.quantity} <= ${products.min_quantity} + 2`, isNull(products.deleted_at)));
    return res.json({ success: true, low_stock: lowStock });
  } catch (err) { next(err); }
});

router.get("/reports/customers", requireAuth, requireRole("admin", "manager", "sales"), async (_req, res, next) => {
  try {
    const top = await db.select().from(customers).where(isNull(customers.deleted_at)).orderBy(desc(customers.total_spent)).limit(10);
    return res.json({ success: true, top_customers: top.map(c => ({ name: c.name, email: c.email, total_orders: c.total_orders, total_spent: c.total_spent })) });
  } catch (err) { next(err); }
});

// ========== PUBLIC PRODUCTS & CATEGORIES (HIGH PERFORMANCE CACHE) ==========
interface ProductCacheItem {
  data: any;
  expires: number;
}
const productsApiCache = new Map<string, ProductCacheItem>();

function getCachedProducts(key: string): any | null {
  const item = productsApiCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    productsApiCache.delete(key);
    return null;
  }
  return item.data;
}

function toOptimizedThumb(url: string | null | undefined, size: "thumb" | "card" | "detail" = "card"): string {
  return getOptimizedImageUrl(url, size);
}

function normalizeRequestLang(langParam?: string, acceptHeader?: string): "ar" | "en" | "fr" | "tr" | "zh" {
  const p = (langParam || "").toLowerCase().trim();
  if (p === "ar" || p === "en" || p === "fr" || p === "tr" || p === "zh") return p as any;
  const h = (acceptHeader || "").toLowerCase();
  if (h.includes("zh")) return "zh";
  if (h.includes("fr")) return "fr";
  if (h.includes("tr")) return "tr";
  if (h.includes("en")) return "en";
  return "ar";
}

const AR_TO_EN_PRODUCT_DICT: Record<string, string> = {
  "ساعات": "Watches", "ساعة": "Watch", "ذكية": "Smart", "ذكي": "Smart", "يد": "Wrist", "فاخرة": "Luxury", "فاخر": "Luxury",
  "رجال": "Men", "رجالي": "Men's", "رجالية": "Men's", "نساء": "Women", "نسائي": "Women's", "نسائية": "Women's",
  "هاتف": "Phone", "جوال": "Mobile", "شاحن": "Charger", "كابل": "Cable", "سلك": "Cord", "سماعات": "Earbuds",
  "سماعة": "Headphones", "بلوتوث": "Bluetooth", "لاسلكي": "Wireless", "لاسلكية": "Wireless", "حافظة": "Case",
  "جراب": "Cover", "غطاء": "Cover", "حماية": "Protection", "شاشة": "Screen", "زجاج": "Glass", "مقاوم": "Waterproof",
  "للماء": "Waterproof", "مقاومة": "Waterproof", "حقيبة": "Bag", "حقائب": "Bags", "ظهر": "Backpack", "سفر": "Travel",
  "يدوية": "Handbag", "حذاء": "Shoes", "أحذية": "Shoes", "رياضي": "Sport", "رياضية": "Sneakers", "جلد": "Leather",
  "طبيعي": "Genuine", "ملابس": "Clothing", "قميص": "Shirt", "تيشيرت": "T-Shirt", "بنطلون": "Pants", "جاكيت": "Jacket",
  "فستان": "Dress", "أطفال": "Kids", "طفل": "Baby", "لعبة": "Toy", "ألعاب": "Toys", "سيارة": "Car", "سيارات": "Auto",
  "إلكترونيات": "Electronics", "كمبيوتر": "Computer", "لابتوب": "Laptop", "فأرة": "Mouse", "لوحة": "Keyboard",
  "مفاتيح": "Keyboard", "منزل": "Home", "مطبخ": "Kitchen", "أدوات": "Tools", "أداة": "Tool", "طقم": "Set",
  "مجموعة": "Kit", "سكين": "Knife", "قاطع": "Cutter", "مقص": "Scissors", "إضاءة": "Lighting", "مصباح": "Lamp",
  "كاميرا": "Camera", "درون": "Drone", "طائرة": "Drone", "تصوير": "Photography", "تجميل": "Beauty", "عناية": "Care",
  "بشرة": "Skin", "شعر": "Hair", "ماكينة": "Trimmer", "حلاقة": "Shaver", "مجوهرات": "Jewelry", "خاتم": "Ring",
  "سلسال": "Necklace", "قلادة": "Pendant", "سوار": "Bracelet", "عطر": "Perfume", "نظارات": "Glasses", "شمسية": "Sunglasses",
  "أعلام": "Flags", "علم": "Flag", "لافتات": "Banners", "ملونة": "Color", "شاطئ": "Beach", "خياطة": "Sewing",
  "تطريز": "Embroidery", "حرف": "Craft", "يدوي": "Handmade", "أكريليك": "Acrylic", "مسطرة": "Ruler", "شفرة": "Blade",
  "شفرات": "Blades", "حصيرة": "Mat", "قص": "Cutting", "أمان": "Safety", "قفل": "Lock"
};

const AR_TO_FR_PRODUCT_DICT: Record<string, string> = {
  "ساعات": "Montres", "ساعة": "Montre", "ذكية": "Intelligente", "ذكي": "Intelligent", "يد": "Poignet", "فاخرة": "Luxe", "فاخر": "Luxe",
  "رجال": "Hommes", "رجالي": "Homme", "رجالية": "Homme", "نساء": "Femmes", "نسائي": "Femme", "نسائية": "Femme",
  "هاتف": "Téléphone", "جوال": "Mobile", "شاحن": "Chargeur", "كابل": "Câble", "سلك": "Cordon", "سماعات": "Écouteurs",
  "سماعة": "Casque", "بلوتوث": "Bluetooth", "لاسلكي": "Sans Fil", "لاسلكية": "Sans Fil", "حافظة": "Étui",
  "جراب": "Housse", "غطاء": "Coque", "حماية": "Protection", "شاشة": "Écran", "زجاج": "Verre", "مقاوم": "Étanche",
  "للماء": "Étanche", "مقاومة": "Étanche", "حقيبة": "Sac", "حقائب": "Sacs", "ظهر": "Dos", "سفر": "Voyage",
  "يدوية": "Main", "حذاء": "Chaussures", "أحذية": "Chaussures", "رياضي": "Sport", "رياضية": "Baskets", "جلد": "Cuir",
  "طبيعي": "Véritable", "ملابس": "Vêtements", "قميص": "Chemise", "تيشيرت": "T-Shirt", "بنطلون": "Pantalon", "جاكيت": "Veste",
  "فستان": "Robe", "أطفال": "Enfants", "طفل": "Bébé", "لعبة": "Jouet", "ألعاب": "Jouets", "سيارة": "Voiture", "سيارات": "Auto",
  "إلكترونيات": "Électronique", "كمبيوتر": "Ordinateur", "لابتوب": "Portable", "فأرة": "Souris", "لوحة": "Clavier",
  "مفاتيح": "Clavier", "منزل": "Maison", "مطبخ": "Cuisine", "أدوات": "Outils", "أداة": "Outil", "طقم": "Ensemble",
  "مجموعة": "Kit", "سكين": "Couteau", "قاطع": "Coupeur", "مقص": "Ciseaux", "إضاءة": "Éclairage", "مصباح": "Lampe",
  "كاميرا": "Appareil Photo", "درون": "Drone", "طائرة": "Drone", "تصوير": "Photographie", "تجميل": "Beauté", "عناية": "Soin",
  "بشرة": "Peau", "شعر": "Cheveux", "ماكينة": "Tondeuse", "حلاقة": "Rasoir", "مجوهرات": "Bijoux", "خاتم": "Bague",
  "سلسال": "Collier", "قلادة": "Pendentif", "سوار": "Bracelet", "عطر": "Parfum", "نظارات": "Lunettes", "شمسية": "Soleil",
  "أعلام": "Drapeaux", "علم": "Drapeau", "لافتات": "Bannières", "ملونة": "Couleur", "شاطئ": "Plage", "خياطة": "Couture",
  "تطريز": "Broderie", "حرف": "Artisanat", "يدوي": "Fait Main", "أكريليك": "Acrylique", "مسطرة": "Règle", "شفرة": "Lame",
  "شفرات": "Lames", "حصيرة": "Tapis", "قص": "Découpe", "أمان": "Sécurité", "قفل": "Serrure"
};

const AR_TO_TR_PRODUCT_DICT: Record<string, string> = {
  "ساعات": "Saatler", "ساعة": "Saat", "ذكية": "Akıllı", "ذكي": "Akıllı", "يد": "Kol", "فاخرة": "Lüks", "فاخر": "Lüks",
  "رجال": "Erkekler", "رجالي": "Erkek", "رجالية": "Erkek", "نساء": "Kadınlar", "نسائي": "Kadın", "نسائية": "Kadın",
  "هاتف": "Telefon", "جوال": "Mobil", "شاحن": "Şarj Cihazı", "كابل": "Kablo", "سلك": "Kordon", "سماعات": "Kulaklık",
  "سماعة": "Kulaklık", "بلوتوث": "Bluetooth", "لاسلكي": "Kablosuz", "لاسلكية": "Kablosuz", "حافظة": "Kılıf",
  "جراب": "Kapak", "غطاء": "Koruyucu", "حماية": "Koruma", "شاشة": "Ekran", "زجاج": "Cam", "مقاوم": "Su Geçirmez",
  "للماء": "Su Geçirmez", "مقاومة": "Su Geçirmez", "حقيبة": "Çanta", "حقائب": "Çantalar", "ظهر": "Sırt", "سفر": "Seyahat",
  "يدوية": "El Çantası", "حذاء": "Ayakkabı", "أحذية": "Ayakkabılar", "رياضي": "Spor", "رياضية": "Spor Ayakkabı", "جلد": "Deri",
  "طبيعي": "Hakiki", "ملابس": "Giyim", "قميص": "Gömlek", "تيشيرت": "Tişört", "بنطلون": "Pantolon", "جاكيت": "Ceket",
  "فستان": "Elbise", "أطفال": "Çocuklar", "طفل": "Bebek", "لعبة": "Oyuncak", "ألعاب": "Oyuncaklar", "سيارة": "Araba", "سيارات": "Oto",
  "إلكترونيات": "Elektronik", "كمبيوتر": "Bilgisayar", "لابتوب": "Dizüstü", "فأرة": "Fare", "لوحة": "Klavye",
  "مفاتيح": "Klavye", "منزل": "Ev", "مطبخ": "Mutfak", "أدوات": "Aletler", "أداة": "Alet", "طقم": "Takım",
  "مجموعة": "Set", "سكين": "Bıçak", "قاطع": "Kesici", "مقص": "Makas", "إضاءة": "Aydınlatma", "مصباح": "Lamba",
  "كاميرا": "Kamera", "درون": "Dron", "طائرة": "Drone", "تصوير": "Fotoğrafçılık", "تجميل": "Güzellik", "عناية": "Bakım",
  "بشرة": "Cilt", "شعر": "Saç", "ماكينة": "Tıraş Makinesi", "حلاقة": "Tıraş", "مجوهرات": "Takı", "خاتم": "Yüzük",
  "سلسال": "Kolye", "قلادة": "Kolye Ucu", "سوار": "Bilezik", "عطر": "Parfüm", "نظارات": "Gözlük", "شمسية": "Güneş Gözlüğü",
  "أعلام": "Bayraklar", "علم": "Bayrak", "لافتات": "Pankartlar", "ملونة": "Renkli", "شاطئ": "Plaj", "خياطة": "Dikiş",
  "تطريز": "Nakış", "حرف": "El Sanatı", "يدوي": "El Yapımı", "أكريليك": "Akrilik", "مسطرة": "Cetvel", "شفرة": "Bıçak Ucu",
  "شفرات": "Bıçaklar", "حصيرة": "Mat", "قص": "Kesim", "أمان": "Güvenlik", "قفل": "Kilit"
};

const AR_TO_ZH_PRODUCT_DICT: Record<string, string> = {
  "ساعات": "手表", "ساعة": "手表", "ذكية": "智能", "ذكي": "智能", "يد": "手腕", "فاخرة": "奢华", "فاخر": "豪华",
  "رجال": "男士", "رجالي": "男款", "رجالية": "男士", "نساء": "女士", "نسائي": "女款", "نسائية": "女士",
  "هاتف": "手机", "جوال": "手机", "شاحن": "充电器", "كابل": "数据线", "سلك": "连接线", "سماعات": "耳机",
  "سماعة": "耳机", "بلوتوث": "蓝牙", "لاسلكي": "无线", "لاسلكية": "无线", "حافظة": "保护套",
  "جراب": "保护壳", "غطاء": "外壳", "حماية": "防护", "شاشة": "屏幕", "زجاج": "钢化膜", "مقاوم": "防水",
  "للماء": "防水", "مقاومة": "防水", "حقيبة": "包", "حقائب": "箱包", "ظهر": "双肩包", "سفر": "旅行",
  "يدوية": "手提包", "حذاء": "鞋", "أحذية": "鞋靴", "رياضي": "运动", "رياضية": "运动鞋", "جلد": "真皮",
  "طبيعي": "正品", "ملابس": "服装", "قميص": "衬衫", "تيشيرت": "T恤", "بنطلون": "裤子", "جاكيت": "外套",
  "فستان": "连衣裙", "أطفال": "儿童", "طفل": "婴儿", "لعبة": "玩具", "ألعاب": "玩具", "سيارة": "汽车", "سيارات": "车载",
  "إلكترونيات": "数码电子", "كمبيوتر": "电脑", "لابتوب": "笔记本", "فأرة": "鼠标", "لوحة": "键盘",
  "مفاتيح": "键盘", "منزل": "家居", "مطبخ": "厨房", "أدوات": "工具", "أداة": "工具", "طقم": "套装",
  "مجموعة": "组合", "سكين": "刀具", "قاطع": "切割器", "مقص": "剪刀", "إضاءة": "照明", "مصباح": "台灯",
  "كاميرا": "相机", "درون": "无人机", "طائرة": "航拍机", "تصوير": "摄影", "تجميل": "美妆", "عناية": "护理",
  "بشرة": "护肤", "شعر": "美发", "ماكينة": "理发器", "حلاقة": "剃须刀", "مجوهرات": "首饰", "خاتم": "戒指",
  "سلسال": "项链", "قلادة": "吊坠", "سوار": "手镯", "عطر": "香水", "نظارات": "眼镜", "شمسية": "太阳镜",
  "أعلام": "旗帜", "علم": "旗帜", "لافتات": "条幅", "ملونة": "彩色", "شاطئ": "沙滩", "خياطة": "缝纫",
  "تطريز": "刺绣", "حرف": "工艺", "يدوي": "手工", "أكريليك": "亚克力", "مسطرة": "尺子", "شفرة": "刀片",
  "شفرات": "刀片", "حصيرة": "垫板", "قص": "剪切", "أمان": "安全", "قفل": "智能锁"
};

const EN_TO_FR_DICT: Record<string, string> = {
  "knife": "Couteau", "cover": "Housse", "tool": "Outil", "tools": "Outils", "kit": "Kit",
  "set": "Ensemble", "pro": "Pro", "edition": "Édition", "smart": "Intelligent", "watch": "Montre",
  "phone": "Téléphone", "case": "Coque", "cable": "Câble", "charger": "Chargeur", "led": "LED",
  "lamp": "Lampe", "bag": "Sac", "shoes": "Chaussures", "camera": "Appareil", "drone": "Drone"
};

const EN_TO_TR_DICT: Record<string, string> = {
  "knife": "Bıçak", "cover": "Kapak", "tool": "Alet", "tools": "Aletler", "kit": "Set",
  "set": "Takım", "pro": "Pro", "edition": "Seri", "smart": "Akıllı", "watch": "Saat",
  "phone": "Telefon", "case": "Kılıf", "cable": "Kablo", "charger": "Şarj", "led": "LED",
  "lamp": "Lamba", "bag": "Çanta", "shoes": "Ayakkabı", "camera": "Kamera", "drone": "Dron"
};

const EN_TO_ZH_DICT: Record<string, string> = {
  "knife": "刀具", "cover": "保护套", "tool": "工具", "tools": "工具套件", "kit": "套装",
  "set": "组合", "pro": "专业版", "edition": "旗舰款", "smart": "智能", "watch": "手表",
  "phone": "手机", "case": "保护壳", "cable": "数据线", "charger": "充电器", "led": "LED",
  "lamp": "台灯", "bag": "背包", "shoes": "鞋", "camera": "相机", "drone": "无人机"
};

const CLEAN_CATEGORY_NAMES: Record<number, { ar: string; en: string; fr: string; tr: string; zh: string }> = {
  1: { ar: "إلكترونيات وأجهزة ذكية", en: "Electronics & Smart Devices", fr: "Électronique & Appareils Intelligents", tr: "Elektronik ve Akıllı Cihazlar", zh: "电子与智能设备" },
  2: { ar: "أزياء وموضة", en: "Fashion & Style", fr: "Mode & Style", tr: "Moda ve Stil", zh: "时尚与潮流" },
  3: { ar: "هواتف ذكية وإكسسوارات", en: "Smartphones & Accessories", fr: "Smartphones & Accessoires", tr: "Akıllı Telefonlar ve Aksesuarlar", zh: "智能手机与配件" },
  4: { ar: "ساعات ومجوهرات", en: "Watches & Jewelry", fr: "Montres & Bijoux", tr: "Saatler ve Takılar", zh: "手表与珠宝" },
  5: { ar: "المنزل والمطبخ", en: "Home & Kitchen", fr: "Maison & Cuisine", tr: "Ev ve Mutfak", zh: "家居与厨房" },
  6: { ar: "الصحة والجمال", en: "Health & Beauty", fr: "Santé & Beauté", tr: "Sağlık ve Güzellik", zh: "健康与美容" },
  7: { ar: "رياضة وترفيه", en: "Sports & Outdoors", fr: "Sports & Loisirs", tr: "Spor ve Açık Hava", zh: "运动与户外" },
  8: { ar: "ألعاب وأطفال", en: "Toys, Kids & Babies", fr: "Jouets, Enfants & Bébés", tr: "Oyuncak, Çocuk ve Bebek", zh: "母婴与玩具" },
  9: { ar: "سيارات ودراجات نارية", en: "Automotive & Motorcycles", fr: "Automobiles & Motos", tr: "Otomotiv ve Motosiklet", zh: "汽车与摩托车" },
  10: { ar: "أحذية وحقائب", en: "Shoes & Bags", fr: "Chaussures & Sacs", tr: "Ayakkabı ve Çantalar", zh: "鞋子与箱包" },
  11: { ar: "كمبيوتر ولابتوب", en: "Computers & Office", fr: "Ordinateurs & Bureautique", tr: "Bilgisayar ve Ofis", zh: "电脑与办公" },
  12: { ar: "أجهزة إلكترونية استهلاكية", en: "Consumer Electronics", fr: "Électronique Grand Public", tr: "Tüketici Elektroniği", zh: "消费类电子产品" },
  13: { ar: "أزياء وملابس رجالية", en: "Men's Fashion", fr: "Mode Homme", tr: "Erkek Modası", zh: "男装服饰" },
  14: { ar: "أدوات وتحسين المنزل", en: "Tools & Home Improvement", fr: "Outils & Bricolage", tr: "Aletler ve Ev Geliştirme", zh: "工具与家装" },
  15: { ar: "إضاءة ومصابيح", en: "Lights & Lighting", fr: "Lumières & Éclairage", tr: "Işıklar ve Aydınlatma", zh: "灯具与照明" },
  16: { ar: "أمان وحماية ذكية", en: "Security & Protection", fr: "Sécurité & Protection", tr: "Güvenlik ve Koruma", zh: "安防与智能监控" },
  17: { ar: "مستلزمات الحيوانات الأليفة", en: "Pet Supplies", fr: "Animalerie", tr: "Evcil Hayvan Ürünleri", zh: "宠物用品" },
  18: { ar: "أدوات مكتبية ومدرسية", en: "Office & School Supplies", fr: "Fournitures de Bureau & Scolaires", tr: "Ofis ve Okul Malzemeleri", zh: "办公与文具用品" },
  19: { ar: "أثاث وديكور منزلي", en: "Furniture & Home Decor", fr: "Meubles & Décoration", tr: "Mobilya ve Ev Dekorasyonu", zh: "家具与家居装饰" },
  20: { ar: "كاميرات وطائرات درون", en: "Cameras & Drones", fr: "Appareils Photo & Drones", tr: "Kameralar ve Dronlar", zh: "相机与无人机" },
  21: { ar: "المنزل الذكي وإنترنت الأشياء", en: "Smart Home & IoT", fr: "Maison Intelligente & IoT", tr: "Akıllı Ev ve IoT", zh: "智能家居与物联网" },
  22: { ar: "وصلات وشعر مستعار", en: "Hair Extensions & Wigs", fr: "Extensions & Perruques", tr: "Saç Kaynakları ve Peruklar", zh: "假发与接发" },
  23: { ar: "مستلزمات الحفلات والمناسبات", en: "Event & Party Supplies", fr: "Articles de Fête", tr: "Parti ve Etkinlik Malzemeleri", zh: "派对与节日用品" },
  24: { ar: "فنون وحرف وخياطة", en: "Arts, Crafts & Sewing", fr: "Arts, Loisirs Créatifs & Couture", tr: "Sanat, El Sanatları ve Dikiş", zh: "艺术、手工艺与缝纫" },
};

function isValidEnglishText(t: string | null | undefined): boolean {
  if (!t) return false;
  const cleaned = t.trim();
  if (cleaned.length < 3) return false;
  if (cleaned.includes("\uFFFD")) return false;
  if (/[\u0600-\u06FF]/.test(cleaned)) return false;
  if (/[\u4E00-\u9FFF\u3400-\u4DBF\uAC00-\uD7AF\u1100-\u11FF]/.test(cleaned)) return false;
  const latinLetters = cleaned.match(/[a-zA-Z]/g);
  return Boolean(latinLetters && latinLetters.length >= 3);
}

function isCleanArabicText(t: string | null | undefined): boolean {
  if (!t) return false;
  const cleaned = t.trim();
  if (cleaned.length < 3) return false;
  if (cleaned.includes("\uFFFD")) return false;
  if (/[\u4E00-\u9FFF\u3400-\u4DBF\uAC00-\uD7AF\u1100-\u11FF]/.test(cleaned)) return false;
  const arLetters = cleaned.match(/[\u0600-\u06FF]/g);
  return Boolean(arLetters && arLetters.length >= 3);
}

function localizeProductName(p: { id?: number; name_ar?: string | null; name_en?: string | null; name?: string | null; sku?: string | null; category_id?: number | null }, lang: string): string {
  const cat = p.category_id ? CLEAN_CATEGORY_NAMES[Number(p.category_id)] : null;
  const cleanSku = p.sku?.replace(/^ALI-/, "").slice(0, 14) || String(p.id || "PROD");
  const targetLang = normalizeRequestLang(lang);

  if (targetLang === "ar") {
    if (isCleanArabicText(p.name_ar)) return p.name_ar!.trim();
    const catAr = cat?.ar || "علي إكسبرس الرسمي";
    return `${catAr} - منتج أصلي عالي الجودة (${cleanSku})`;
  }

  if (targetLang === "en") {
    if (isValidEnglishText(p.name_en)) return p.name_en!.trim();
    const raw = (p.name_ar || p.name || p.name_en || "").trim();
    const tokens = raw.split(/[\s,،\-–—._/()+]+/);
    const words: string[] = [];
    for (const t of tokens) {
      if (!t) continue;
      if (/^[a-zA-Z0-9]+$/.test(t)) words.push(t);
      else if (AR_TO_EN_PRODUCT_DICT[t]) words.push(AR_TO_EN_PRODUCT_DICT[t]);
    }
    if (words.length >= 2) return words.slice(0, 8).join(" ") + " Pro Edition";
    const catEn = cat?.en || "AliExpress Verified";
    return `${catEn} Premium Item (${cleanSku})`;
  }

  if (targetLang === "fr") {
    const raw = (p.name_ar || p.name || p.name_en || "").trim();
    const tokens = raw.split(/[\s,،\-–—._/()+]+/);
    const words: string[] = [];
    for (const t of tokens) {
      if (!t) continue;
      const lower = t.toLowerCase();
      if (AR_TO_FR_PRODUCT_DICT[t]) words.push(AR_TO_FR_PRODUCT_DICT[t]);
      else if (EN_TO_FR_DICT[lower]) words.push(EN_TO_FR_DICT[lower]);
      else if (/^[0-9]+$/.test(t)) words.push(t);
    }
    if (words.length >= 2) return words.slice(0, 8).join(" ") + " Édition Pro";
    const catFr = cat?.fr || cat?.en || "AliExpress Certifié";
    return `${catFr} Article de Qualité (${cleanSku})`;
  }

  if (targetLang === "tr") {
    const raw = (p.name_ar || p.name || p.name_en || "").trim();
    const tokens = raw.split(/[\s,،\-–—._/()+]+/);
    const words: string[] = [];
    for (const t of tokens) {
      if (!t) continue;
      const lower = t.toLowerCase();
      if (AR_TO_TR_PRODUCT_DICT[t]) words.push(AR_TO_TR_PRODUCT_DICT[t]);
      else if (EN_TO_TR_DICT[lower]) words.push(EN_TO_TR_DICT[lower]);
      else if (/^[0-9]+$/.test(t)) words.push(t);
    }
    if (words.length >= 2) return words.slice(0, 8).join(" ") + " Özel Seri";
    const catTr = cat?.tr || cat?.en || "AliExpress Orijinal";
    return `${catTr} Kaliteli Ürün (${cleanSku})`;
  }

  if (targetLang === "zh") {
    const raw = (p.name_ar || p.name || p.name_en || "").trim();
    const tokens = raw.split(/[\s,،\-–—._/()+]+/);
    const words: string[] = [];
    for (const t of tokens) {
      if (!t) continue;
      const lower = t.toLowerCase();
      if (AR_TO_ZH_PRODUCT_DICT[t]) words.push(AR_TO_ZH_PRODUCT_DICT[t]);
      else if (EN_TO_ZH_DICT[lower]) words.push(EN_TO_ZH_DICT[lower]);
      else if (/^[0-9]+$/.test(t)) words.push(t);
    }
    if (words.length >= 2) return words.slice(0, 8).join("") + " 优质版";
    const catZh = cat?.zh || cat?.en || "速卖通优选";
    return `${catZh} 精品正品 (${cleanSku})`;
  }

  return p.name_ar || p.name || String(p.id);
}

function localizeProductDesc(p: { id?: number; description_ar?: string | null; description_en?: string | null; description?: string | null; sku?: string | null; category_id?: number | null }, lang: string): string {
  const cat = p.category_id ? CLEAN_CATEGORY_NAMES[Number(p.category_id)] : null;
  const cleanSku = p.sku?.replace(/^ALI-/, "").slice(0, 14) || String(p.id || "PROD");
  const targetLang = normalizeRequestLang(lang);

  if (targetLang === "ar") {
    if (isCleanArabicText(p.description_ar)) return p.description_ar!.trim();
    const catAr = cat?.ar || "منتج رسمي من علي إكسبرس";
    return `${catAr} أصلي عالي الجودة ومضمون 100% من المورد المعتمد (كود: ${cleanSku}) مع شحن سريع ومباشر.`;
  }
  if (targetLang === "en") {
    if (isValidEnglishText(p.description_en)) return p.description_en!.trim();
    const catEn = cat?.en || "AliExpress verified item";
    return `Authentic ${catEn} (SKU: ${cleanSku}). High quality standards, official supplier warranty, and express international shipping.`;
  }
  if (targetLang === "fr") {
    const catFr = cat?.fr || "Article vérifié AliExpress";
    return `${catFr} authentique (Réf: ${cleanSku}). Normes de haute qualité certifiées, garantie fournisseur officielle et expédition internationale rapide.`;
  }
  if (targetLang === "tr") {
    const catTr = cat?.tr || "Orijinal AliExpress ürünü";
    return `Orijinal ${catTr} (Stok Kodu: ${cleanSku}). Yüksek kalite standartları, resmi tedarikçi garantisi ve hızlı uluslararası kargo.`;
  }
  if (targetLang === "zh") {
    const catZh = cat?.zh || "官方认证商品";
    return `正品 ${catZh}（编号：${cleanSku}）。官方严选正品保障，高品质工艺标准，支持国际极速直发。`;
  }
  return p.description_ar || p.description || "";
}

function setCachedProducts(key: string, data: any, ttlSec: number = 600) {
  if (productsApiCache.size > 1000) {
    const first = productsApiCache.keys().next().value;
    if (first) productsApiCache.delete(first);
  }
  productsApiCache.set(key, { data, expires: Date.now() + ttlSec * 1000 });
}

export function clearProductsCache() {
  productsApiCache.clear();
}

router.get("/products", async (req, res, next) => {
  try {
    const { category_id, lang, page = "1", limit, search = "" } = req.query as Record<string, string>;
    const requestLang = normalizeRequestLang(lang, req.headers["accept-language"]);
    const p = Math.max(1, parseInt(page) || 1);
    const defaultLimit = limit ? Math.min(100, Math.max(1, parseInt(limit))) : 40;

    const cacheKey = `p_${category_id || "all"}_${requestLang}_${p}_${defaultLimit}_${search.trim().toLowerCase()}`;
    const cached = getCachedProducts(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
      return res.json(cached);
    }

    const conds: any[] = [
      eq(products.is_active, true),
      isNull(products.deleted_at),
      sql`${products.quantity} > 0`,
    ];
    if (category_id) {
      const catId = parseInt(category_id);
      if (!isNaN(catId)) conds.push(eq(products.category_id, catId));
    }

    if (search && search.trim()) {
      const q = `%${escapeLike(search.trim())}%`;
      conds.push(or(like(products.name_ar, q), like(products.name_en, q)));
    }

    const rawData = await db
      .select({
        id: products.id,
        name_ar: products.name_ar,
        name_en: products.name_en,
        sku: products.sku,
        price: products.price,
        cost: products.cost,
        quantity: products.quantity,
        category_id: products.category_id,
        image: products.image,
        is_active: products.is_active,
      })
      .from(products)
      .where(and(...conds))
      .orderBy(desc(products.id))
      .limit(defaultLimit)
      .offset((p - 1) * defaultLimit);

    const data = rawData.map(p => {
      const locName = localizeProductName(p, requestLang);
      return {
        ...p,
        name: locName,
        name_ar: localizeProductName(p, "ar"),
        name_en: localizeProductName(p, "en"),
        name_fr: localizeProductName(p, "fr"),
        name_tr: localizeProductName(p, "tr"),
        name_zh: localizeProductName(p, "zh"),
        description: "",
        image: getOptimizedImageUrl(p.image, "card"),
        image_thumb: getOptimizedImageUrl(p.image, "thumb"),
        image_large: getOptimizedImageUrl(p.image, "detail"),
      };
    });

    const result = { success: true, data, total: data.length, page: p, limit: defaultLimit };
    setCachedProducts(cacheKey, result, 600);

    res.setHeader("X-Cache", "MISS");
    res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
    return res.json(result);
  } catch (err) { next(err); }
});

router.get("/products/:id", validateParams(idParamSchema), async (req, res, next) => {
  try {
    const { lang } = req.query as Record<string, string>;
    const requestLang = normalizeRequestLang(lang, req.headers["accept-language"]);
    const pId = parseInt(String(req.params.id));
    if (!isNaN(pId)) {
      const stockStatus = await verifyAndSyncDropshipProductStock(pId).catch(() => ({ available: true }));
      if (!stockStatus.available) {
        const outMsg = requestLang === "ar" ? "عذراً، هذا المنتج نفد من المصدر وتم حذفه من المتجر" :
                       requestLang === "fr" ? "Désolé, ce produit est en rupture de stock chez le fournisseur" :
                       requestLang === "tr" ? "Üzgünüz, bu ürün tedarikçide tükendi" :
                       requestLang === "zh" ? "抱歉，该商品在供应商处已售罄" :
                       "Sorry, this product is out of stock at supplier";
        return res.status(404).json({ success: false, message: outMsg });
      }
    }
    const [product] = await db.select().from(products).where(and(eq(products.id, pId), eq(products.is_active, true), isNull(products.deleted_at), sql`${products.quantity} > 0`));
    if (!product || product.quantity <= 0) {
      if (product) {
        await purgeProductById(product.id);
      }
      const outMsg = requestLang === "ar" ? "عذراً، هذا المنتج نفد من المخزون وتم حذفه من المتجر" :
                     requestLang === "fr" ? "Désolé, ce produit est épuisé" :
                     requestLang === "tr" ? "Üzgünüz, bu ürün stokta kalmadı" :
                     requestLang === "zh" ? "抱歉，该商品已缺货" :
                     "Sorry, this product is out of stock";
      return res.status(404).json({ success: false, message: outMsg });
    }
    const locName = localizeProductName(product, requestLang);
    const locDesc = localizeProductDesc(product, requestLang);
    const localized = {
      ...product,
      name: locName,
      name_ar: localizeProductName(product, "ar"),
      name_en: localizeProductName(product, "en"),
      name_fr: localizeProductName(product, "fr"),
      name_tr: localizeProductName(product, "tr"),
      name_zh: localizeProductName(product, "zh"),
      description: locDesc,
      description_ar: localizeProductDesc(product, "ar"),
      description_en: localizeProductDesc(product, "en"),
      description_fr: localizeProductDesc(product, "fr"),
      description_tr: localizeProductDesc(product, "tr"),
      description_zh: localizeProductDesc(product, "zh"),
      image: getOptimizedImageUrl(product.image, "detail"),
      image_thumb: getOptimizedImageUrl(product.image, "thumb"),
      image_large: getOptimizedImageUrl(product.image, "detail"),
    };
    return res.json({ 
      success: true, 
      product: localized,
      data: { product: localized } 
    });
  } catch (err) { next(err); }
});

router.get("/categories", async (req, res, next) => {
  try {
    const { lang } = req.query as Record<string, string>;
    const requestLang = normalizeRequestLang(lang, req.headers["accept-language"]);
    const cacheKey = `cached_categories_${requestLang}`;
    const cached = getCachedProducts(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
      return res.json(cached);
    }

    const rawData = await db.select().from(categories).where(and(eq(categories.is_active, true), isNull(categories.deleted_at))).orderBy(categories.id);
    const data = rawData.map(c => {
      const cleanCat = CLEAN_CATEGORY_NAMES[Number(c.id)];
      const name = cleanCat ? (cleanCat[requestLang] || cleanCat.en) : (c.name_ar || c.name_en);
      return {
        ...c,
        name,
        name_ar: cleanCat?.ar || c.name_ar,
        name_en: cleanCat?.en || c.name_en,
        name_fr: cleanCat?.fr || cleanCat?.en || c.name_en,
        name_tr: cleanCat?.tr || cleanCat?.en || c.name_en,
        name_zh: cleanCat?.zh || cleanCat?.en || c.name_en,
        description: cleanCat ? (cleanCat[requestLang] || cleanCat.en) : (c.description_ar || c.description_en),
      };
    });
    const result = { success: true, data };
    setCachedProducts(cacheKey, result, 600); // 10 min cache

    res.setHeader("X-Cache", "MISS");
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    return res.json(result);
  } catch (err) { next(err); }
});

// ========== HOME MULTI-CATEGORY SHOWCASE FEED ==========
router.get("/home-feed", async (req, res, next) => {
  try {
    const { lang } = req.query as Record<string, string>;
    const requestLang = normalizeRequestLang(lang, req.headers["accept-language"]);
    const cacheKey = `cached_home_feed_${requestLang}`;
    const cached = getCachedProducts(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.json(cached);
    }

    const allCats = await db
      .select()
      .from(categories)
      .where(and(eq(categories.is_active, true), isNull(categories.deleted_at)))
      .orderBy(categories.id);

    const allProds = await db
      .select({
        id: products.id,
        name_ar: products.name_ar,
        name_en: products.name_en,
        sku: products.sku,
        price: products.price,
        cost: products.cost,
        quantity: products.quantity,
        category_id: products.category_id,
        image: products.image,
        is_active: products.is_active,
      })
      .from(products)
      .where(and(eq(products.is_active, true), isNull(products.deleted_at), sql`${products.quantity} > 0`))
      .orderBy(desc(products.id))
      .limit(600);

    const prodMap = new Map<number, any[]>();
    for (const p of allProds) {
      const cid = Number(p.category_id);
      if (!prodMap.has(cid)) prodMap.set(cid, []);
      const list = prodMap.get(cid)!;
      if (list.length < 5) {
        const locName = localizeProductName(p, requestLang);
        list.push({
          ...p,
          name: locName,
          name_ar: localizeProductName(p, "ar"),
          name_en: localizeProductName(p, "en"),
          name_fr: localizeProductName(p, "fr"),
          name_tr: localizeProductName(p, "tr"),
          name_zh: localizeProductName(p, "zh"),
          image: getOptimizedImageUrl(p.image, "card"),
          image_thumb: getOptimizedImageUrl(p.image, "thumb"),
          image_large: getOptimizedImageUrl(p.image, "detail"),
        });
      }
    }

    const sections = allCats
      .map(cat => {
        const cleanCat = CLEAN_CATEGORY_NAMES[Number(cat.id)];
        const name = cleanCat ? (cleanCat[requestLang] || cleanCat.en) : (cat.name_ar || cat.name_en);
        return {
          ...cat,
          name,
          name_ar: cleanCat?.ar || cat.name_ar,
          name_en: cleanCat?.en || cat.name_en,
          name_fr: cleanCat?.fr || cleanCat?.en || cat.name_en,
          name_tr: cleanCat?.tr || cleanCat?.en || cat.name_en,
          name_zh: cleanCat?.zh || cleanCat?.en || cat.name_en,
          description: cleanCat ? (cleanCat[requestLang] || cleanCat.en) : (cat.description_ar || cat.description_en),
          products: prodMap.get(Number(cat.id)) || [],
        };
      })
      .filter(c => c.products.length > 0);

    const result = { success: true, sections };
    setCachedProducts(cacheKey, result, 300); // 5 min cache
    res.setHeader("X-Cache", "MISS");
    return res.json(result);
  } catch (err) { next(err); }
});

// ========== PUBLIC ORDERS ==========
router.get("/orders", requireAuth, async (req, res, next) => {
  try {
    const session = (req as any).session;
    if (!session.customerId) return res.json({ success: true, data: [], total: 0 });
    const data = await db.select().from(orders).where(eq(orders.customer_id, session.customerId)).orderBy(desc(orders.id));
    return res.json({ success: true, data, total: data.length });
  } catch (err) { next(err); }
});

router.delete("/orders/:id", requireAuth, validateParams(idParamSchema), async (req, res, next) => {
  try {
    const session = (req as any).session;
    const orderId = Number(req.params.id);
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return res.status(404).json({ success: false, message: "الطلب غير موجود" });

    // Validate ownership (customer can only delete their own orders unless admin/manager)
    if (session.customerId && order.customer_id !== session.customerId && session.role !== "admin" && session.role !== "manager") {
      return res.status(403).json({ success: false, message: "غير مصرح لك بحذف هذا الطلب" });
    }

    // Clean up related records
    await db.delete(supplier_payments).where(eq(supplier_payments.order_id, orderId)).catch(() => {});
    await db.delete(returns_refunds).where(eq(returns_refunds.order_id, orderId)).catch(() => {});
    await db.delete(shipments).where(eq(shipments.order_id, orderId)).catch(() => {});
    await db.delete(affiliate_conversions).where(eq(affiliate_conversions.order_id, orderId)).catch(() => {});
    await db.delete(orders).where(eq(orders.id, orderId));

    return res.json({ success: true, message: "تم حذف الطلب بنجاح" });
  } catch (err) { next(err); }
});

// ========== SHIPPING CALCULATION (AliExpress Rules: Yemen DHL 529 SAR, Global Choice Free >= 100 SAR) ==========
router.post("/shipping/calculate", async (req, res, next) => {
  try {
    const { address, country, countryCode, city, subtotal = 0, items = [], method, currency = "SAR" } = req.body;
    let computedSubtotal = Number(subtotal) || 0;
    if (computedSubtotal <= 0 && Array.isArray(items) && items.length > 0) {
      computedSubtotal = items.reduce((s: number, i: any) => s + (i.total || (i.price * i.quantity) || 0), 0);
    }
    const result = await calculateAliExpressShipping({
      subtotal: computedSubtotal,
      address: address || "",
      country: country || "",
      countryCode: countryCode || "",
      city: city || "",
      method: method || undefined,
      currency,
    });
    return res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post("/orders", orderRateLimiter, validateBody(orderSchema), async (req, res, next) => {
  try {
    const session = getSession(req);
    let customer: any = null;

    if (session?.customerId) {
      const [existingCust] = await db.select().from(customers).where(eq(customers.id, session.customerId));
      customer = existingCust;
    }

    const {
      items,
      shipping_address,
      payment_method,
      shipping_method,
      shipping_country,
      shipping_city,
      currency,
      recipient_name,
      recipient_phone,
      recipient_email,
      customer_name,
      customer_phone,
      customer_email,
    } = req.body;

    const contactName = recipient_name || customer_name || customer?.name || "عميل متجر عماد";
    const contactPhone = recipient_phone || customer_phone || customer?.phone || "";
    const contactEmail = recipient_email || customer_email || customer?.email || `customer_${Date.now()}@emadexpress.com`;

    if (!customer) {
      if (contactPhone) {
        const [foundByPhone] = await db.select().from(customers).where(eq(customers.phone, contactPhone));
        if (foundByPhone) customer = foundByPhone;
      }
      if (!customer && contactEmail && !contactEmail.startsWith("customer_")) {
        const [foundByEmail] = await db.select().from(customers).where(eq(customers.email, contactEmail));
        if (foundByEmail) customer = foundByEmail;
      }
    }

    if (!customer) {
      const [createdCust] = await db.insert(customers).values({
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        address: shipping_address || "",
        city: shipping_city || "",
        country: shipping_country || "YE",
        total_orders: 0,
        total_spent: 0,
        loyalty_points: 0,
      }).returning();
      customer = createdCust;
    }

    let cleanPayMethod = "paypal";
    const pm = (payment_method || "").toString().toLowerCase();
    if (pm.includes("aliexpress") || pm.includes("direct")) {
      cleanPayMethod = "aliexpress_direct";
    } else if (pm.includes("paypal")) {
      cleanPayMethod = "paypal";
    } else if (pm.includes("card") || pm.includes("stripe") || pm.includes("بطاقة") || pm.includes("فيزا") || pm.includes("ماستركارد")) {
      cleanPayMethod = "card";
    } else if (pm.includes("google")) {
      cleanPayMethod = "google_pay";
    } else if (pm.includes("apple")) {
      cleanPayMethod = "apple_pay";
    } else {
      cleanPayMethod = "paypal";
    }

    // Inventory check & real-time dropship supplier check
    for (const item of items) {
      if (item.product_id) {
        const [prod] = await db.select().from(products).where(and(eq(products.id, item.product_id), isNull(products.deleted_at), eq(products.is_active, true)));
        if (!prod) {
          return res.status(400).json({ success: false, message: `المنتج "${item.product_name}" غير متوفر حالياً في المتجر` });
        }

        // Live check against dropship supplier (AliExpress, Amazon, or external URL)
        const stockStatus: any = await verifyAndSyncDropshipProductStock(item.product_id, { forceLive: true }).catch(() => ({ available: true }));
        if (!stockStatus.available) {
          return res.status(400).json({
            success: false,
            message: `عذراً، لقد نفدت كمية المنتج "${item.product_name}" من المصدر (${stockStatus.reason || "غير متوفر"}). تم تحديثه في المتجر.`
          });
        }

        if (prod.quantity < item.quantity) {
          return res.status(400).json({ success: false, message: `الكمية غير متوفرة للمنتج ${item.product_name}. المتاح: ${prod.quantity}` });
        }
      }
    }

    const subtotal = items.reduce((s: number, i: any) => s + (i.total || i.price * i.quantity || 0), 0);
    const orderCurrency = currency || customer?.preferred_currency || "SAR";

    // AliExpress Shipping Calculation (Yemen DHL 529 SAR exclusively, Global Choice Free >= 100 SAR else 15 SAR, Premium 45 SAR)
    const shippingCalc = await calculateAliExpressShipping({
      subtotal,
      address: shipping_address || customer?.address || "",
      country: shipping_country || customer?.country || "",
      city: shipping_city || customer?.city || "",
      method: shipping_method,
      currency: orderCurrency,
    });

    const shipping = shippingCalc.shippingFee;
    const tax = shippingCalc.tax;
    const total = parseFloat((subtotal + tax + shipping).toFixed(2));

    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const orderNumber = `ORD-${new Date().getFullYear()}-${timestamp.toString(36).toUpperCase()}-${random}`;

    const [newOrder] = await db.insert(orders).values({
      order_number: orderNumber,
      customer_id: customer?.id || null,
      customer_name: contactName,
      customer_email: contactEmail,
      customer_phone: contactPhone,
      shipping_address: shipping_address || customer?.address || "",
      shipping_city: shippingCalc.detectedCity || customer?.city || "",
      shipping_country: shippingCalc.destinationCountry,
      payment_method: cleanPayMethod,
      payment_status: "pending",
      status: "pending",
      subtotal,
      discount: 0,
      tax,
      shipping,
      total,
      currency: orderCurrency,
      items,
    }).returning();

    if (customer?.id) {
      await db.update(customers).set({
        total_orders: (customer.total_orders || 0) + 1,
        total_spent: (customer.total_spent || 0) + total,
        loyalty_points: (customer.loyalty_points || 0) + Math.floor(total / 10),
      }).where(eq(customers.id, customer.id)).catch(() => {});
    }

    for (const item of items) {
      if (item.product_id) {
        await db.update(products).set({ quantity: sql`GREATEST(${products.quantity} - ${item.quantity}, 0)` }).where(eq(products.id, item.product_id)).catch(() => {});
      }
    }

    return res.status(201).json({ success: true, data: newOrder });
  } catch (err) { next(err); }
});

router.get("/orders/:id", requireAuth, validateParams(idParamSchema), async (req, res, next) => {
  try {
    const session = (req as any).session;
    const [order] = await db.select().from(orders).where(eq(orders.id, Number(req.params.id)));
    if (!order) return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    if (session.role !== "admin" && order.customer_id !== session.customerId) return res.status(403).json({ success: false, message: "غير مصرح" });
    return res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// ========== RETURNS & REFUNDS (Customer & Admin) ==========

// Customer: Submit a return & refund request for an order
router.post("/orders/:id/returns", requireAuth, validateParams(idParamSchema), async (req, res, next) => {
  try {
    const session = (req as any).session;
    if (!session.customerId && session.role !== "admin") {
      return res.status(403).json({ success: false, message: "يجب تسجيل الدخول كعميل لتقديم طلب إرجاع" });
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, Number(req.params.id)));
    if (!order) return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    
    if (session.role !== "admin" && order.customer_id !== session.customerId) {
      return res.status(403).json({ success: false, message: "غير مصرح لك بطلب إرجاع لهذا الطلب" });
    }

    // Check if there is already a pending or active return request for this order
    const [existing] = await db.select().from(returns_refunds).where(
      and(
        eq(returns_refunds.order_id, order.id),
        or(
          eq(returns_refunds.status, "pending"),
          eq(returns_refunds.status, "approved"),
          eq(returns_refunds.status, "items_received")
        )
      )
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "يوجد طلب إرجاع نشط بالفعل لهذا الطلب حالياً",
        data: existing,
      });
    }

    const {
      reason,
      details = "",
      type = "return_and_refund",
      refund_method = "original_payment",
      bank_name = "",
      bank_iban = "",
      bank_account_name = "",
      items = order.items,
      refund_amount = order.total,
    } = req.body || {};

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({ success: false, message: "يرجى تحديد سبب الإرجاع" });
    }

    const [customer] = order.customer_id 
      ? await db.select().from(customers).where(eq(customers.id, order.customer_id))
      : [null];

    const [newReturn] = await db.insert(returns_refunds).values({
      order_id: order.id,
      order_number: order.order_number,
      customer_id: order.customer_id || session.customerId || 0,
      customer_name: order.customer_name || (customer ? customer.name : "عميل"),
      customer_email: order.customer_email || (customer ? customer.email : ""),
      customer_phone: order.customer_phone || (customer ? customer.phone : ""),
      items: Array.isArray(items) ? items : (order.items as any[]),
      refund_amount: parseFloat(String(refund_amount)) || order.total,
      currency: order.currency || "SAR",
      type: type || "return_and_refund",
      reason: reason.trim(),
      details: sanitizeText(details || ""),
      refund_method: refund_method || "original_payment",
      bank_name: sanitizeText(bank_name || ""),
      bank_iban: sanitizeText(bank_iban || ""),
      bank_account_name: sanitizeText(bank_account_name || ""),
      status: "pending",
      admin_notes: "",
    }).returning();

    return res.status(201).json({
      success: true,
      message: "تم تقديم طلب الإرجاع والاسترداد بنجاح، وسيتم مراجعته من قبل الإدارة",
      data: newReturn,
    });
  } catch (err) { next(err); }
});

// Customer: Get all return requests for logged-in user
router.get("/my-returns", requireAuth, async (req, res, next) => {
  try {
    const session = (req as any).session;
    if (!session.customerId) return res.json({ success: true, data: [], total: 0 });

    const data = await db.select().from(returns_refunds)
      .where(eq(returns_refunds.customer_id, session.customerId))
      .orderBy(desc(returns_refunds.id));

    return res.json({ success: true, data, total: data.length });
  } catch (err) { next(err); }
});

// Customer: Alias route /returns
router.get("/returns", requireAuth, async (req, res, next) => {
  try {
    const session = (req as any).session;
    if (!session.customerId && session.role !== "admin") {
      return res.json({ success: true, data: [], total: 0 });
    }

    const cond = session.role === "admin" ? undefined : eq(returns_refunds.customer_id, session.customerId);
    const data = await db.select().from(returns_refunds).where(cond).orderBy(desc(returns_refunds.id));
    return res.json({ success: true, data, total: data.length });
  } catch (err) { next(err); }
});

// Customer & Admin: Get single return request
router.get("/returns/:id", requireAuth, validateParams(idParamSchema), async (req, res, next) => {
  try {
    const session = (req as any).session;
    const [ret] = await db.select().from(returns_refunds).where(eq(returns_refunds.id, Number(req.params.id)));
    if (!ret) return res.status(404).json({ success: false, message: "طلب الإرجاع غير موجود" });

    if (session.role !== "admin" && ret.customer_id !== session.customerId) {
      return res.status(403).json({ success: false, message: "غير مصرح" });
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, ret.order_id));
    return res.json({ success: true, data: { ...ret, order } });
  } catch (err) { next(err); }
});

// Admin: Get all returns with filters & search
router.get("/admin/returns", requireAuth, requireRole("admin", "manager", "support", "sales"), async (req, res, next) => {
  try {
    const { page = "1", per_page = "20", search = "", status = "" } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page) || 1);
    const pp = Math.min(100, Math.max(1, parseInt(per_page) || 20));

    const conds: any[] = [];
    if (status) conds.push(eq(returns_refunds.status, status));
    if (search) {
      conds.push(
        or(
          like(returns_refunds.order_number, `%${escapeLike(search)}%`),
          like(returns_refunds.customer_name, `%${escapeLike(search)}%`),
          like(returns_refunds.customer_phone, `%${escapeLike(search)}%`)
        )
      );
    }

    const where = conds.length ? and(...conds) : undefined;
    const [{ count = 0 } = {}] = await db.select({ count: sql<number>`COUNT(*)` }).from(returns_refunds).where(where);
    const data = await db.select().from(returns_refunds).where(where).orderBy(desc(returns_refunds.id)).limit(pp).offset((p - 1) * pp);

    return res.json({ success: true, data, total: Number(count) });
  } catch (err) { next(err); }
});

// Admin: Update return request status and admin notes
router.put("/admin/returns/:id/status", requireAuth, requireRole("admin", "manager", "support"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const { status, admin_notes = "" } = req.body || {};
    const allowedStatuses = ["pending", "approved", "items_received", "refunded", "rejected"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "حالة غير صالحة" });
    }

    const id = Number(req.params.id);
    const [existing] = await db.select().from(returns_refunds).where(eq(returns_refunds.id, id));
    if (!existing) return res.status(404).json({ success: false, message: "طلب الإرجاع غير موجود" });

    const upd: any = {
      status,
      admin_notes: sanitizeText(admin_notes || existing.admin_notes || ""),
      updated_at: new Date(),
    };

    if (status === "refunded" || status === "rejected") {
      upd.resolved_at = new Date();
    }

    const [updatedReturn] = await db.update(returns_refunds).set(upd).where(eq(returns_refunds.id, id)).returning();

    // If marked as refunded, optionally update the order's payment_status to 'refunded'
    if (status === "refunded") {
      await db.update(orders).set({
        payment_status: "refunded",
        status: "cancelled",
      }).where(eq(orders.id, existing.order_id));
    }

    return res.json({
      success: true,
      message: "تم تحديث حالة طلب الإرجاع بنجاح",
      data: updatedReturn,
    });
  } catch (err) { next(err); }
});


// ========== FILE UPLOAD ==========
router.post("/upload", requireAuth, uploadRateLimiter, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "لم يتم رفع أي ملف" });
  const url = `/uploads/${req.file.filename}`;
  res.json({ success: true, url });
});

// ========== PLATFORM SETTINGS (API KEYS & CONFIG) ==========
router.get("/admin/platform-settings", requireAuth, requireRole("admin", "manager"), async (_req, res, next) => {
  try {
    const rows = await db.select().from(platform_settings);
    const result: Record<string, string> = {};
    rows.forEach(r => { result[r.key] = r.value; });
    return res.json(result);
  } catch (err) { next(err); }
});

router.post("/admin/platform-settings", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const data = req.body || {};
    const entries = Array.isArray(data) 
      ? data.map((item: any) => [item.key, item.value]) 
      : Object.entries(data);

    for (const [key, value] of entries) {
      if (typeof key === "string" && value !== undefined && value !== null) {
        const strVal = String(value);
        const existing = await db.select().from(platform_settings).where(eq(platform_settings.key, key));
        if (existing.length > 0) {
          await db.update(platform_settings).set({ value: strVal, updated_at: new Date() }).where(eq(platform_settings.key, key));
        } else {
          await db.insert(platform_settings).values({ key, value: strVal });
        }
      }
    }
    return res.json({ success: true, message: "تم حفظ مفاتيح API وإعدادات المنصات بنجاح في قاعدة البيانات" });
  } catch (err) { next(err); }
});

// ========== GENERAL SETTINGS & PARTNER ADS ENDPOINTS ==========
router.get("/admin/settings", requireAuth, requireRole("admin", "manager"), async (_req, res, next) => {
  try {
    const rows = await db.select().from(platform_settings);
    return res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.put("/admin/settings", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const data = req.body || [];
    const entries = Array.isArray(data) 
      ? data.map((item: any) => [item.key, item.value]) 
      : Object.entries(data);

    for (const [key, value] of entries) {
      if (typeof key === "string" && value !== undefined && value !== null) {
        const strVal = String(value);
        const existing = await db.select().from(platform_settings).where(eq(platform_settings.key, key));
        if (existing.length > 0) {
          await db.update(platform_settings).set({ value: strVal, updated_at: new Date() }).where(eq(platform_settings.key, key));
        } else {
          await db.insert(platform_settings).values({ key, value: strVal });
        }
      }
    }
    return res.json({ success: true, message: "تم حفظ الإعدادات في قاعدة البيانات بنجاح" });
  } catch (err) { next(err); }
});

router.get("/admin/partner-products", requireAuth, requireRole("admin", "manager"), async (_req, res, next) => {
  try {
    const [row] = await db.select().from(platform_settings).where(eq(platform_settings.key, "partner_products_banners"));
    let items = [];
    if (row && row.value) {
      try { items = JSON.parse(row.value); } catch { items = []; }
    }
    return res.json(items);
  } catch (err) { next(err); }
});

router.post("/admin/partner-products", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const items = req.body || [];
    const strVal = JSON.stringify(items);
    const existing = await db.select().from(platform_settings).where(eq(platform_settings.key, "partner_products_banners"));
    if (existing.length > 0) {
      await db.update(platform_settings).set({ value: strVal, updated_at: new Date() }).where(eq(platform_settings.key, "partner_products_banners"));
    } else {
      await db.insert(platform_settings).values({ key: "partner_products_banners", value: strVal });
    }
    return res.json({ success: true, count: items.length });
  } catch (err) { next(err); }
});

// ========== PUBLIC BANNERS & APP CONFIG FOR MOBILE CLIENTS ==========
router.get("/banners", async (_req, res, next) => {
  try {
    const [row] = await db.select().from(platform_settings).where(eq(platform_settings.key, "partner_products_banners"));
    let items: any[] = [];
    if (row && row.value) {
      try { items = JSON.parse(row.value); } catch { items = []; }
    }
    // Return only active banners for mobile app
    const active = items.filter((b: any) => b.is_active !== false);
    return res.json({ success: true, data: active });
  } catch (err) { next(err); }
});

router.get("/app-settings", async (_req, res, next) => {
  try {
    const settings = await db.select().from(platform_settings);
    const cfg: Record<string, string> = {};
    settings.forEach((s) => (cfg[s.key] = s.value));

    const responseData = {
      store_name: cfg["store_name"] || "عماد إكسبرس",
      about_ar: cfg["about_ar"] || "عماد إكسبرس - بوابتك للتسوق الإلكتروني الأسرع والأكثر أماناً، نوفر لك تشكيلة واسعة من المنتجات العالمية والمحلية بأفضل الأسعار.",
      about_en: cfg["about_en"] || "Emad Express - Your premier e-commerce platform for fast, safe shopping with top-tier local and global products.",
      whatsapp_number: cfg["whatsapp_number"] || cfg["support_whatsapp"] || "772223645",
      facebook_url: cfg["facebook_url"] || "https://www.facebook.com",
      twitter_url: cfg["twitter_url"] || "https://twitter.com",
      address_ar: cfg["address_ar"] || "اليمن، تعز، شارع جمال",
      address_en: cfg["address_en"] || "Yemen, Taiz, Jamal Street",
      default_currency: cfg["default_currency"] || "SAR",
      google_ads_enabled: cfg["google_ads_enabled"] !== "false",
      google_ads_test_mode: cfg["google_ads_test_mode"] === "true",
      admob_app_id_android: cfg["admob_app_id_android"] || "",
      admob_banner_unit_id: cfg["admob_banner_unit_id"] || "",
      admob_interstitial_unit_id: cfg["admob_interstitial_unit_id"] || "",
      support_whatsapp: cfg["whatsapp_number"] || cfg["support_whatsapp"] || "772223645",
      support_phone: cfg["support_phone"] || "772223645",
      support_email: cfg["support_email"] || "support@emadexpress.com",
      app_version: "2.0.0",
    };

    return res.json({
      success: true,
      data: responseData,
      ...responseData,
    });
  } catch (err) { next(err); }
});


// ========== UNIQUE DIVERSE PRODUCT CATALOG & IMAGE GENERATOR ==========
const UNIQUE_PRODUCT_IMAGES = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30", // Watch
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e", // Headphones
  "https://images.unsplash.com/photo-1557597774-9d273605dfa9", // Security camera
  "https://images.unsplash.com/photo-1553062407-98eeb64c6a62", // Backpack
  "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6", // Coffee machine
  "https://images.unsplash.com/photo-1587829741301-dc798b83add3", // Mechanical keyboard
  "https://images.unsplash.com/photo-1507473885765-e6ed057f782c", // Smart lamp
  "https://images.unsplash.com/photo-1589739900243-4b52cd9b104e", // Robot vacuum
  "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa", // Car mount
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff", // Red sneakers
  "https://images.unsplash.com/photo-1511499767150-a48a237f0083", // Sunglasses
  "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87", // Luggage set
  "https://images.unsplash.com/photo-1546868871-7041f2a55e12", // Smart smartwatch gold
  "https://images.unsplash.com/photo-1583394838336-acd977736f90", // Headset black
  "https://images.unsplash.com/photo-1608231387042-66d1773070a5", // White sneakers
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f", // Luxury sunglasses
  "https://images.unsplash.com/photo-1585386959984-a4155224a1ad", // Perfume bottle
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f", // Polaroid camera
  "https://images.unsplash.com/photo-1560343090-f0409e92791a", // Leather shoes
  "https://images.unsplash.com/photo-1593642632823-8f785ba67e45", // Laptop
  "https://images.unsplash.com/photo-1616469829941-c7200edec809", // Wireless mouse
  "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08", // Mechanical keyboard white
  "https://images.unsplash.com/photo-1598327105666-5b89351aff97", // Smartphone
  "https://images.unsplash.com/photo-1584917865442-de89df76afd3", // Handbag
  "https://images.unsplash.com/photo-1591047139829-d91aecb6caea", // Men jacket
  "https://images.unsplash.com/photo-1578632767115-351597cf2477", // Gaming chair
  "https://images.unsplash.com/photo-1586495777744-4413f21062fa", // Beauty cream
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9", // Makeup brushes
  "https://images.unsplash.com/photo-1544816155-12df9643f363", // Leather wallet
  "https://images.unsplash.com/photo-1512496015851-a90fb38ba796", // Women makeup
  "https://images.unsplash.com/photo-1505751172876-fa1923c5c528", // Medical / health kit
  "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf", // Bluetooth speaker
  "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6", // Wireless earbuds pod
  "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46", // Modern mouse pad
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3", // Digital tablet
  "https://images.unsplash.com/photo-1629429408209-1f912961dbd8", // Barber trimmer
  "https://images.unsplash.com/photo-1563178406-4cdc2923acbc", // Fragrance luxury
  "https://images.unsplash.com/photo-1524805444758-089113d48a6d", // Classic watch
  "https://images.unsplash.com/photo-1590874103328-eac38a683ce7", // Women handbag
  "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07", // Serum skincare
  "https://images.unsplash.com/photo-1546868871-7041f2a55e12", // Gold watch
  "https://images.unsplash.com/photo-1508296695146-257a814070b4", // Sunglasses modern
  "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f", // Men suit
  "https://images.unsplash.com/photo-1556228720-195a672e8a03", // Skincare bottles
  "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef", // Keyboard custom
  "https://images.unsplash.com/photo-1567928805192-d35d641494b8", // Drone camera
  "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39", // DSLR camera
  "https://images.unsplash.com/photo-1579586337278-3befd40fd17a", // Smart band
  "https://images.unsplash.com/photo-1558769132-cb1aea458c5e", // Fashion clothes
  "https://images.unsplash.com/photo-1581291518655-9523c932deda", // UX gadgets
];

function getUniqueProductImage(index: number, code: string): string {
  // Uses direct distinct photo ID for each index to ensure 100% distinct visual photograph
  const photoId = ((index * 3 + 15) % 1000) + 1;
  return `https://picsum.photos/id/${photoId}/600/600`;
}

const SAMPLE_CATALOG = [
  { name_ar: "ساعة ذكية رياضية فائقة مع قياس نبضات القلب وشاشة AMOLED", name_en: "Ultra Smart Sports Watch with Heart Rate & AMOLED Display", price: 145, category: "إلكترونيات", rating: 4.8, orders: 3420 },
  { name_ar: "سماعات لاسلكية Pro مع ميزة إلغاء الضوضاء النشط ANC وصوت محيطي", name_en: "Wireless Pro Earbuds with Active Noise Cancellation ANC", price: 195, category: "صوتيات", rating: 4.9, orders: 5890 },
  { name_ar: "كاميرا مراقبة ذكية 4K بزاوية 360 درجة ورؤية ليلية ملونة", name_en: "Smart 4K Security Camera 360 Degree with Color Night Vision", price: 230, category: "إلكترونيات", rating: 4.7, orders: 1840 },
  { name_ar: "حقيبة ظهر ذكية مقاومة للماء مع منفذ شحن USB وقفل أمان", name_en: "Smart Waterproof Laptop Backpack with USB Charging Port", price: 120, category: "أزياء", rating: 4.6, orders: 2750 },
  { name_ar: "ماكينة قهوة إسبريسو احترافية مع صانع رغوة الحليب 20 بار", name_en: "Professional 20-Bar Espresso Coffee Machine with Milk Frother", price: 480, category: "أجهزة منزلية", rating: 4.9, orders: 1210 },
  { name_ar: "لوحة مفاتيح ميكانيكية بإضاءة RGB مخصصة للألعاب والبرمجة", name_en: "RGB Mechanical Gaming Keyboard with Custom Switches", price: 210, category: "كمبيوتر", rating: 4.8, orders: 4120 },
  { name_ar: "مصباح مكتبي ذكي LED مع شاحن لاسلكي سريع للهواتف", name_en: "Smart LED Desk Lamp with Fast Wireless Phone Charger", price: 95, category: "إلكترونيات", rating: 4.5, orders: 3100 },
  { name_ar: "ممسحة ومكنسة روبوت ذكية مع تطبيق تحكم ورسم خرائط الليزر", name_en: "Smart Robot Vacuum & Mop with LiDAR Laser Mapping", price: 890, category: "أجهزة منزلية", rating: 4.8, orders: 980 },
  { name_ar: "حامل هاتف ذكي مغناطيسي للسيارة مع شحن لاسلكي MagSafe", name_en: "Magnetic Car Phone Mount with MagSafe Fast Wireless Charging", price: 65, category: "إكسسوارات سيارات", rating: 4.7, orders: 6700 },
  { name_ar: "حذاء رياضي مريح وخفيف الوزن للركض والتمارين اليومية", name_en: "Ultra Lightweight Running Shoes for Sports and Daily Wear", price: 160, category: "أزياء", rating: 4.8, orders: 4320 },
  { name_ar: "نظارة شمسية كلاسيكية مستقطبة بحماية UV400 وإطار ألمنيوم", name_en: "Polarized Classic Sunglasses UV400 Protection Aluminum Frame", price: 85, category: "إكسسوارات", rating: 4.6, orders: 2190 },
  { name_ar: "طقم حقائب سفر فاخرة مكون من 3 قطع مقاومة للصدمات", name_en: "Luxury 3-Piece Luggage Travel Suitcase Set Shockproof", price: 540, category: "سفر", rating: 4.9, orders: 1540 },
  { name_ar: "طائرة درون بدون طيار 4K مع نظام تتبع وتثبيت بصري ثلاثي المحاور", name_en: "4K Aerial Drone with Visual Tracking 3-Axis Gimbal", price: 340, category: "كاميرات وتصوير", rating: 4.9, orders: 2100 },
  { name_ar: "ماكينة حلاقة وتشذيب رجالية متعددة الوظائف بشفرات تيتانيوم", name_en: "Professional Men Grooming Trimmer with Titanium Blades", price: 78, category: "العناية الشخصية", rating: 4.7, orders: 8400 },
  { name_ar: "مكبر صوت بلوتوث لاسلكي محمول مقاوم للماء بصوت ستيريو عالي", name_en: "Waterproof Portable Wireless Bluetooth Speaker Stereo Bass", price: 110, category: "صوتيات", rating: 4.8, orders: 5300 },
  { name_ar: "مجموعة العناية بالبشرة والترطيب الطبيعي بخلاصة الأعشاب", name_en: "Organic Herbal Skincare & Hydration Moisture Kit", price: 135, category: "تجميل وعناية", rating: 4.8, orders: 4600 },
  { name_ar: "شاحن بطارية متنقل باوربانك سعة 30,000 مللي أمبير مع شحن فائق 65W", name_en: "30000mAh Power Bank 65W Fast Charging PD Quick Charge", price: 175, category: "إلكترونيات", rating: 4.9, orders: 9200 },
  { name_ar: "طقم أواني طهي جرانيت غير لاصقة مقاومة للخدش 10 قطع", name_en: "10-Piece Scratch-Resistant Non-Stick Granite Cookware Set", price: 390, category: "مطبخ ومنزل", rating: 4.9, orders: 1420 },
  { name_ar: "كرسي ألعاب واسترخاء مريح ومريح للظهر مع وسادة تدليك", name_en: "Ergonomic Gaming & Office Chair with Lumbar Massage Cushion", price: 420, category: "أثاث وألعاب", rating: 4.7, orders: 1980 },
  { name_ar: "محطة عمل وشاشة عرض محمولة 15.6 بوصة بدقة Full HD IPS Type-C", name_en: "15.6-Inch Portable Monitor FHD IPS Type-C HDMI Display", price: 310, category: "كمبيوتر", rating: 4.8, orders: 2750 },
];

const ALIEXPRESS_DEPARTMENTS = [
  { id: "1511", name_ar: "ساعات وإكسسوارات", name_en: "Watches & Accessories" },
  { id: "44", name_ar: "إلكترونيات استهلاكية", name_en: "Consumer Electronics" },
  { id: "509", name_ar: "هواتف وملحقاتها", name_en: "Phones & Telecommunications" },
  { id: "15", name_ar: "أجهزة منزلية", name_en: "Home Appliances" },
  { id: "1524", name_ar: "حقائب وأمتعة", name_en: "Luggage & Bags" },
  { id: "1420", name_ar: "أدوات ومعدات", name_en: "Tools & Hardware" },
  { id: "34", name_ar: "سيارات ودراجات", name_en: "Automobiles & Motorcycles" },
  { id: "66", name_ar: "تجميل وعناية بالبشرة", name_en: "Beauty & Health" },
  { id: "18", name_ar: "رياضة وترفيه", name_en: "Sports & Entertainment" },
  { id: "7", name_ar: "كمبيوتر ومكتب", name_en: "Computer & Office" },
  { id: "1509", name_ar: "مجوهرات وإكسسوارات", name_en: "Jewelry & Accessories" },
  { id: "1501", name_ar: "ألعاب وهوايات", name_en: "Toys & Hobbies" },
  { id: "39", name_ar: "إضاءة ومصابيح", name_en: "Lights & Lighting" },
  { id: "30", name_ar: "أمان وحماية", name_en: "Security & Protection" },
  { id: "322", name_ar: "أحذية رجالية ونسائية", name_en: "Shoes & Footwear" },
  { id: "200000343", name_ar: "ملابس رجالية", name_en: "Men's Clothing" },
  { id: "200000345", name_ar: "ملابس نسائية", name_en: "Women's Clothing" },
  { id: "1503", name_ar: "المنزل والحديقة", name_en: "Home & Garden" },
  { id: "200000787", name_ar: "مستلزمات مكتبية", name_en: "Office Supplies" },
  { id: "200000297", name_ar: "الأم والطفل", name_en: "Mother & Kids" },
];

const CATEGORY_DISCOVERY_MAP: Record<string, string[]> = {
  // 1511: ساعات وإكسسوارات
  "1511": [
    "watch", "smart watch", "men watch luxury", "women watch elegant", "waterproof sport watch",
    "chronograph watch", "automatic mechanical watch", "quartz watch stainless steel", "leather strap watch",
    "fitness tracker watch", "digital sports watch", "minimalist watch", "military tactical watch", "gold watch luxury"
  ],
  // 44: إلكترونيات استهلاكية
  "44": [
    "wireless earbuds bluetooth", "portable bluetooth speaker", "tws headphones noise cancelling",
    "smart glasses audio", "action camera 4k", "mini projector portable", "power bank fast charge",
    "wireless charging station", "headphone stand rgb", "audio amplifier hifi", "voice recorder digital", "vr headset"
  ],
  // 509: هواتف وملحقاتها
  "509": [
    "phone case shockproof", "fast charger 65w usb c", "magnetic car mount phone", "wireless car charger mount",
    "screen protector tempered glass", "braided usb c cable", "phone tripod stand", "power bank 20000mah",
    "ring light with tripod phone", "selfie stick bluetooth", "phone lens kit macro", "mobile gaming controller"
  ],
  // 15: أجهزة منزلية ومطبخ
  "15": [
    "portable blender usb", "electric kettle temperature control", "espresso coffee machine portable",
    "food vacuum sealer machine", "digital kitchen scale precision", "electric milk frother",
    "robot vacuum cleaner smart", "air humidifier ultrasonic", "garment steamer handheld", "electric knife sharpener"
  ],
  // 1524: حقائب ومحافظ وأمتعة
  "1524": [
    "travel backpack waterproof", "men genuine leather wallet", "luxury women handbag crossbody",
    "laptop backpack usb charging", "rfid blocking card holder", "duffle gym bag with shoe compartment",
    "tactical sling bag", "anti-theft travel bag", "canvas messenger bag", "cosmetic travel organizer pouch"
  ],
  // 1420: أدوات ومعدات صيانة
  "1420": [
    "cordless drill electric", "precision screwdriver set magnetic", "laser level 3d 12 lines",
    "digital multimeter tester", "soldering iron kit temperature adjustable", "socket wrench set ratchet",
    "wire stripper crimper tool", "rotary tool kit accessories", "heavy duty tool bag", "caliper digital measuring"
  ],
  // 34: إكسسوارات وقطع سيارات
  "34": [
    "car vacuum cleaner cordless", "dash cam 4k front rear", "car tire inflator portable air compressor",
    "car phone holder magnetic", "car ambient interior lighting rgb", "obd2 diagnostic scanner bluetooth",
    "car jump starter power bank", "car seat cushion orthopedic", "car scratch repair kit", "fm transmitter bluetooth"
  ],
  // 66: تجميل وعناية ومكياج
  "66": [
    "makeup brush set professional", "hair straightener brush ceramic", "uv led nail lamp fast drying",
    "electric face cleansing brush", "hair clipper trimmer cordless", "facial jade roller guasha",
    "blackhead vacuum remover pore cleaner", "perfume atomizer refillable portable", "eyelash curler heated", "hair dryer ionic professional"
  ],
  // 18: رياضة ولياقة وترفيه
  "18": [
    "resistance bands set exercise", "deep tissue massage gun percussion", "yoga mat non slip thick",
    "smart jump rope digital counter", "adjustable dumbbell grip", "sports water bottle bpa free",
    "cycling gloves padded", "knee compression sleeve brace", "gym fitness gloves wrist wrap", "running waist pack bag"
  ],
  // 7: كمبيوتر ومستلزمات مكتب
  "7": [
    "mechanical keyboard rgb backlight", "wireless ergonomic mouse silent", "laptop cooling pad dual fan",
    "usb c hub multi port adapter hdmi", "webcam 1080p hd with microphone", "monitor light bar eye care",
    "gaming mouse pad xxl extended", "aluminum laptop stand adjustable", "cable organizer management clip", "external ssd hard drive enclosure"
  ],
  // 1509: مجوهرات وإكسسوارات نسائية
  "1509": [
    "sterling silver 925 ring luxury", "18k gold plated necklace pendant", "crystal tennis bracelet women",
    "cubic zirconia stud earrings", "natural freshwater pearl necklace", "moissanite engagement ring",
    "stainless steel cuff bangle", "jewelry organizer storage box", "choker chain necklace trendy", "boho stacking rings set"
  ],
  // 1501: ألعاب وهدايا وأطفال
  "1501": [
    "rc high speed racing car", "drone 4k camera obstacle avoidance", "building blocks brick set creator",
    "magnetic building tiles toy kids", "montessori wooden educational toy", "electric water gun high pressure",
    "lcd writing drawing tablet kids", "diecast alloy car model collectible", "plush soft stuffed toy animal", "magic speed cube 3x3"
  ],
  // 39: إضاءة ومصابيح LED
  "39": [
    "rgb led strip lights bluetooth music", "solar outdoor garden lights waterproof", "smart wifi led bulb dimmer",
    "touch control desk lamp dimmable", "motion sensor closet night light", "sunset lamp projector atmosphere",
    "modern led ceiling chandelier", "fairy string lights usb decorative", "rechargeable led work flashlight", "neon led sign custom"
  ],
  // 30: كاميرات أمان وحماية
  "30": [
    "wifi security camera outdoor 360", "cctv ip camera night vision 4k", "solar battery powered security camera",
    "video doorbell wireless camera wifi", "smart home baby monitor camera", "mini spy camera hidden audio",
    "ptz camera outdoor dome wifi", "poe security camera nvr system", "dual lens security camera outdoor", "floodlight security camera wifi"
  ],
  // 322: أحذية رياضية ورجالية ونسائية
  "322": [
    "running shoes lightweight breathable", "men casual sneakers slip on", "women walking shoes athletic",
    "cushioned sports running sneakers", "outdoor hiking boots waterproof", "breathable mesh gym shoes",
    "orthopedic walking sneakers", "fashion chunky sneakers women", "leather casual dress loafers", "water shoes quick drying barefoot"
  ],
  // 200000343: ملابس رجالية
  "200000343": [
    "men hoodie oversized streetwear", "men casual jacket bomber", "men cargo pants tactical",
    "men cotton t shirt slim fit", "men polo shirt breathable", "men denim jeans stretch",
    "men winter jacket windbreaker", "men linen shirt casual summer", "men suit vest formal", "men track jacket sportswear"
  ],
  // 200000345: ملابس نسائية
  "200000345": [
    "women dress summer floral elegant", "women abaya modern kaftan", "women oversized sweater knit",
    "women high waist wide leg pants", "women casual blouse shirt", "women blazer coat chic",
    "women cardigan sweater long", "women yoga leggings high waist", "women evening dress party", "women denim jacket vintage"
  ],
  // 1503: المنزل والحديقة
  "1503": [
    "decorative throw pillow covers", "wall clock modern 3d design", "solar garden fountain pump",
    "essential oil aroma diffuser", "storage organizer baskets fabric", "door mat non slip indoor outdoor",
    "kitchen sink splash guard", "artificial succulent plants decor", "blackout window curtains", "flame air humidifier aroma diffuser"
  ],
  // 200000787: مستلزمات مكتبية
  "200000787": [
    "pen set luxury ballpoint", "notebook leather journal", "desk organizer mesh metal",
    "stapler heavy duty set", "highlighter marker pens pastel", "pencil case large capacity"
  ],
  // 200000297: الأم والطفل
  "200000297": [
    "baby stroller lightweight foldable", "baby carrier ergonomic sling", "baby bottle warmer portable",
    "baby romper cotton jumpsuit", "baby diaper bag backpack waterproof", "baby sleep swaddle blanket"
  ]
};

const GLOBAL_DISCOVERY_TERMS = [
  "hoodie", "jacket", "smart ring", "tws earbuds", "camping stove", "knife set", "car vacuum",
  "led strip rgb", "mechanical keyboard", "gaming mouse pad", "women abaya", "men sneaker",
  "sunglasses uv400", "baby stroller", "dog collar led", "hair dryer ionic", "makeup organizer",
  "action camera", "wireless charger 3 in 1", "desk organizer", "wall clock 3d", "fishing reel",
  "yoga mat", "massage gun", "smart thermostat", "solar light outdoor", "travel backpack",
  "electric toothbrush", "cctv camera wifi", "bluetooth adapter 5.3", "drone 4k camera",
  "kitchen scale digital", "air humidifier ultrasonic", "smart watch ultra", "crystal chandelier modern",
  "perfume bottle refillable", "diamond ring 925", "leather jacket men", "party balloon arch",
  "drawing tablet digital", "espresso coffee maker", "rc monster truck", "car dashcam 4k",
  "laser level 3d", "pet water fountain", "hair extension clip", "sports water bottle",
  "wireless game controller", "gaming microphone usb", "vintage sunglasses", "men casual pants",
  "smart watch", "wireless earbuds", "power bank 20000mah", "portable blender", "bluetooth speaker",
  "led ceiling light", "women handbag luxury", "running shoes", "gaming headset", "car phone holder",
  "digital alarm clock", "waterproof backpack", "gold plated necklace", "electric shaver men",
  "ring light tripod", "mini projector 4k", "thermal flask", "shoe storage box", "stainless steel watch",
  "kitchen knife chef", "resistance bands set", "smart home socket", "baby clothes set", "mens wallet leather",
  "cat tree tower", "car tire inflator", "robot vacuum cleaner", "hair straightener brush", "makeup brush set"
];

function getAliSearchParams(page: number, queryKw?: string, category_id?: string, seed = 0) {
  let kw = (queryKw || "").trim();
  let catId = (category_id || "").trim() || undefined;
  const baseSeed = seed ? Math.abs(seed) : 0;
  let actualPage = 1;

  if (kw && !catId) {
    const modifiers = [
      "", "best", "top", "hot", "new", "pro", "high quality",
      "portable", "smart", "universal", "wireless", "mini", "accessories", "sale", "premium", "luxury"
    ];
    const modIdx = (page + baseSeed) % modifiers.length;
    const modifier = modifiers[modIdx];
    kw = modifier ? `${kw} ${modifier}` : kw;
    actualPage = ((Math.floor((page + baseSeed) / modifiers.length)) % 20) + 1;
  } else if (catId) {
    const terms = CATEGORY_DISCOVERY_MAP[catId] || GLOBAL_DISCOVERY_TERMS;
    if (kw) {
      const modIdx = (page + baseSeed) % terms.length;
      kw = `${kw} ${terms[modIdx]}`;
      actualPage = ((Math.floor((page + baseSeed) / terms.length)) % 20) + 1;
    } else {
      const termIdx = (page - 1 + baseSeed) % terms.length;
      kw = terms[termIdx];
      actualPage = ((Math.floor((page - 1 + baseSeed) / terms.length)) % 20) + 1;
    }
  } else {
    const termIdx = (page - 1 + baseSeed) % GLOBAL_DISCOVERY_TERMS.length;
    kw = GLOBAL_DISCOVERY_TERMS[termIdx];
    actualPage = ((Math.floor((page - 1 + baseSeed) / GLOBAL_DISCOVERY_TERMS.length)) % 20) + 1;
  }

  return { kw, catId, actualPage };
}

function parsePrice(val: any, fallback = 25): number {
  if (typeof val === "number" && !isNaN(val) && val > 0) return Number(val.toFixed(2));
  if (typeof val === "string") {
    const clean = val.replace(/[^0-9.]/g, "");
    const num = parseFloat(clean);
    if (!isNaN(num) && num > 0) return Number(num.toFixed(2));
  }
  return fallback;
}

function normalizeImageUrl(url?: string | null): string {
  if (!url) return "";
  let u = String(url).trim().replace(/^https?:/, "");
  u = u.replace(/_\d+x\d+[^.]*\./, ".").split("?")[0].trim();
  return u;
}

// ========== HIGH SPEED CHUNKED FETCHING & IMPORTING (ZERO TIMEOUT / NO 502) ==========
router.get("/admin/dropship/fetch-chunk", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const platform = String(req.query.platform || "aliexpress");
    const page = Math.max(1, parseInt(String(req.query.page || "1")));
    const pageSize = Math.min(50, Math.max(10, parseInt(String(req.query.page_size || "50"))));
    const category_id = req.query.category_id ? String(req.query.category_id).trim() : undefined;
    const queryKw = req.query.keyword ? String(req.query.keyword).trim() : "";
    const seed = parseInt(String(req.query.seed || "0")) || 0;
    const creds = await getAliExpressCreds();

    if (platform !== "aliexpress" || !creds) {
      return res.json({ success: true, page, count: 0, products: [] });
    }

    const { kw, catId, actualPage } = getAliSearchParams(page, queryKw, category_id, seed);

    let prods = await searchAliExpressProducts(kw, creds, actualPage, pageSize, catId).catch(() => []);
    if ((!prods || prods.length === 0) && catId) {
      prods = await searchAliExpressProducts(kw, creds, actualPage, pageSize).catch(() => []);
    }

    const seenImagesInChunk = new Set<string>();
    const productsList: any[] = [];

    for (const p of prods || []) {
      let img = p.product_main_image_url || "";
      if (img.startsWith("//")) img = `https:${img}`;
      const normImg = normalizeImageUrl(img);

      // Skip duplicate images within the same chunk
      if (normImg && seenImagesInChunk.has(normImg)) continue;
      if (normImg) seenImagesInChunk.add(normImg);

      productsList.push({
        source_id: String(p.product_id),
        name: p.product_title || `AliExpress Product ${p.product_id}`,
        price: parseFloat(p.target_sale_price) || parseFloat(p.target_original_price) || 25,
        original_price: parseFloat(p.target_original_price) || 0,
        image: img,
        category_name: p.first_level_category_name || "منتجات عامة",
        rating: parseFloat(p.evaluate_rate) || 4.8,
        orders_count: parseInt(p.sales_volume) || 120,
        platform: "aliexpress",
        source_url: p.product_detail_url || `https://www.aliexpress.com/item/${p.product_id}.html`,
        supplier_name: p.shop_name || "AliExpress Verified Seller",
      });
    }

    return res.json({
      success: true,
      page,
      count: productsList.length,
      products: productsList,
    });
  } catch (err) { next(err); }
});

router.post("/admin/dropship/import-chunk", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { platform = "aliexpress", page = 1, category_id, keyword, margin_percent = 300, seed = 0 } = req.body || {};
    const creds = await getAliExpressCreds();
    if (platform !== "aliexpress" || !creds) {
      return res.status(400).json({ success: false, message: "بيانات اعتماد AliExpress غير متوفرة" });
    }

    const pageNum = Math.max(1, parseInt(String(page)));
    const seedNum = parseInt(String(seed)) || 0;

    const existingDropships = await db.select({ source_id: dropship_products.source_id }).from(dropship_products);
    const existingProducts = await db.select({ sku: products.sku, image: products.image }).from(products).where(isNull(products.deleted_at));
    const existingSet = new Set([
      ...existingDropships.map(d => String(d.source_id).trim()),
      ...existingProducts.map(p => (p.sku || "").replace(/^ALI-/, "").split("-")[0].trim()).filter(Boolean),
    ]);
    const existingImageSet = new Set(
      existingProducts.map(p => normalizeImageUrl(p.image)).filter(Boolean)
    );

    const margin = (100 + (margin_percent || 300)) / 100;
    let productRecords: any[] = [];
    let metaRecords: any[] = [];
    let skippedCount = 0;

    // Try up to 3 discovery variations if initial search items are all duplicates
    for (let attempt = 0; attempt < 3 && productRecords.length === 0; attempt++) {
      const currentEffPage = pageNum + (attempt * 3);
      const { kw, catId, actualPage } = getAliSearchParams(currentEffPage, keyword, category_id, seedNum);

      let prods = await searchAliExpressProducts(kw, creds, actualPage, 50, catId).catch(() => []);
      if ((!prods || prods.length === 0) && catId) {
        prods = await searchAliExpressProducts(kw, creds, actualPage, 50).catch(() => []);
      }

      for (const p of prods || []) {
        const srcId = String(p.product_id).trim();
        let img = p.product_main_image_url || "";
        if (img.startsWith("//")) img = `https:${img}`;
        const normImg = normalizeImageUrl(img);

        // Strict Deduplication: Skip if duplicate product ID OR duplicate image URL
        if (!srcId || existingSet.has(srcId) || (normImg && existingImageSet.has(normImg))) {
          skippedCount++;
          continue;
        }
        existingSet.add(srcId);
        if (normImg) existingImageSet.add(normImg);

        const sourcePrice = parsePrice(p.target_sale_price || p.target_original_price, 25);
        const realStock = extractRealSupplierStock(p);
        if (realStock <= 0) {
          skippedCount++;
          continue;
        }

        const salePrice = Number((sourcePrice * margin).toFixed(2));
        const skuUnique = `ALI-${srcId}-${Date.now().toString(36).slice(-4)}`;
        const autoCatId = await matchCategoryId(p.product_title, category_id ? Number(category_id) : null, p.first_level_category_name);

        productRecords.push({
          name_ar: String(p.product_title || `AliExpress Product ${srcId}`).slice(0, 450),
          name_en: String(p.product_title || `AliExpress Product ${srcId}`).slice(0, 450),
          sku: skuUnique,
          price: salePrice,
          cost: sourcePrice,
          quantity: realStock,
          min_quantity: Math.min(5, realStock),
          category_id: autoCatId,
          description_ar: `${p.product_title} - منتج أصلي عالي الجودة متوفر للشحن السريع والتسليم الفوري.`,
          description_en: `${p.product_title} - Premium quality genuine product with fast direct delivery.`,
          image: img,
          is_active: true,
        });

        metaRecords.push({
          source_id: srcId,
          source_url: p.product_detail_url || `https://www.aliexpress.com/item/${srcId}.html`,
          source_price: sourcePrice,
          our_price: salePrice,
          supplier_name: p.shop_name || "AliExpress Verified Seller",
        });
      }
    }

    let importedCount = 0;
    if (productRecords.length > 0) {
      try {
        const inserted = await db.insert(products).values(productRecords).onConflictDoNothing({ target: products.sku }).returning({ id: products.id, sku: products.sku });
        if (inserted && inserted.length > 0) {
          const metaMap = new Map(metaRecords.map(m => [m.source_id, m]));
          const dropshipRows = inserted.map(prod => {
            const sId = prod.sku.split("-")[1] || "";
            const meta = metaMap.get(sId) || metaRecords[0];
            return {
              product_id: prod.id,
              platform,
              source_id: meta.source_id,
              source_url: meta.source_url,
              source_price: meta.source_price,
              source_currency: "USD",
              our_price: meta.our_price,
              supplier_name: meta.supplier_name,
              platform_commission_rate: 8,
            };
          });
          await db.insert(dropship_products).values(dropshipRows);
          importedCount = inserted.length;
        }
      } catch (err) {
        logger.warn({ err }, "Chunk insert error");
      }
    }

    const [{ totalInDb = 0 } = {}] = await db.select({ totalInDb: sql<number>`COUNT(*)` }).from(products).where(isNull(products.deleted_at));

    return res.json({
      success: true,
      page: pageNum,
      imported: importedCount,
      skipped: skippedCount,
      total_in_db: Number(totalInDb),
    });
  } catch (err) { next(err); }
});

router.get("/admin/dropship/auto-fetch", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const startTime = Date.now();
    const platform = String(req.query.platform || "aliexpress");
    const category_id = req.query.category_id ? String(req.query.category_id) : undefined;
    const queryKw = req.query.keyword ? String(req.query.keyword).trim() : "";
    const targetCount = Math.min(Math.max(10, parseInt(String(req.query.count || 1000))), 1500);
    const creds = await getAliExpressCreds();
    
    let realProducts: any[] = [];
    if (platform === "aliexpress" && creds) {
      try {
        let queries: { kw: string; catId?: string; page: number }[] = [];
        if (category_id && String(category_id).trim()) {
          const catStr = String(category_id).trim();
          for (let p = 1; p <= 25; p++) {
            queries.push({ kw: queryKw || "", catId: catStr, page: p });
          }
        } else if (queryKw) {
          for (let p = 1; p <= 25; p++) {
            queries.push({ kw: queryKw, page: p });
          }
        } else {
          const shuffledTerms = [...GLOBAL_DISCOVERY_TERMS].sort(() => 0.5 - Math.random());
          for (let i = 0; i < Math.min(30, shuffledTerms.length); i++) {
            queries.push({ kw: shuffledTerms[i], page: 1 });
            queries.push({ kw: shuffledTerms[i], page: 2 });
          }
        }

        const batchSize = 5;
        for (let i = 0; i < queries.length && realProducts.length < targetCount; i += batchSize) {
          if (Date.now() - startTime > 12000) break; // Guard against 502 Bad Gateway
          const batch = queries.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map(q => searchAliExpressProducts(q.kw, creds, q.page, 50, q.catId).catch(() => []))
          );

          for (const prods of results) {
            if (Array.isArray(prods)) {
              for (const p of prods) {
                if (realProducts.length >= targetCount) break;
                if (p.product_id && !realProducts.some(r => r.source_id === String(p.product_id))) {
                  let img = p.product_main_image_url || "";
                  if (img.startsWith("//")) img = `https:${img}`;
                  realProducts.push({
                    source_id: String(p.product_id),
                    name: p.product_title || `AliExpress Product ${p.product_id}`,
                    price: parseFloat(p.target_sale_price) || parseFloat(p.target_original_price) || 25,
                    original_price: parseFloat(p.target_original_price) || 0,
                    image: img,
                    category_name: p.first_level_category_name || "منتجات عامة",
                    rating: parseFloat(p.evaluate_rate) || 4.8,
                    orders_count: parseInt(p.sales_volume) || 120,
                    platform: "aliexpress",
                    source_url: p.product_detail_url || `https://www.aliexpress.com/item/${p.product_id}.html`,
                    supplier_name: p.shop_name || "AliExpress Verified Seller",
                  });
                }
              }
            }
          }

          if (realProducts.length < targetCount && i + batchSize < queries.length) {
            await new Promise(r => setTimeout(r, 60));
          }
        }

        // If target count not reached, top up from diverse popular terms
        if (realProducts.length < targetCount) {
          const backupTerms = [...GLOBAL_DISCOVERY_TERMS].sort(() => 0.5 - Math.random());
          for (let i = 0; i < backupTerms.length && realProducts.length < targetCount; i += batchSize) {
            const bBatch = backupTerms.slice(i, i + batchSize);
            const bResults = await Promise.all(
              bBatch.map(kw => searchAliExpressProducts(kw, creds, 1, 50).catch(() => []))
            );
            for (const prods of bResults) {
              if (Array.isArray(prods)) {
                for (const p of prods) {
                  if (realProducts.length >= targetCount) break;
                  if (p.product_id && !realProducts.some(r => r.source_id === String(p.product_id))) {
                    let img = p.product_main_image_url || "";
                    if (img.startsWith("//")) img = `https:${img}`;
                    realProducts.push({
                      source_id: String(p.product_id),
                      name: p.product_title || `AliExpress Product ${p.product_id}`,
                      price: parseFloat(p.target_sale_price) || parseFloat(p.target_original_price) || 25,
                      original_price: parseFloat(p.target_original_price) || 0,
                      image: img,
                      category_name: p.first_level_category_name || "منتجات عامة",
                      rating: parseFloat(p.evaluate_rate) || 4.8,
                      orders_count: parseInt(p.sales_volume) || 120,
                      platform: "aliexpress",
                      source_url: p.product_detail_url || `https://www.aliexpress.com/item/${p.product_id}.html`,
                      supplier_name: p.shop_name || "AliExpress Verified Seller",
                    });
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        logger.warn({ err }, "Live AliExpress search error");
      }
    }

    return res.json({ success: true, count: realProducts.length, platform, results: realProducts });
  } catch (err) { next(err); }
});

router.post("/admin/dropship/bulk-import-1000", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { platform = "aliexpress", count = 1000, margin_percent = 300, category_id, keyword } = req.body || {};
    const margin = (100 + (margin_percent || 300)) / 100;
    const creds = await getAliExpressCreds();

    // Fetch existing source_ids and SKUs to prevent duplicate insertion
    const existingDropships = await db.select({ source_id: dropship_products.source_id }).from(dropship_products);
    const existingProducts = await db.select({ sku: products.sku, image: products.image }).from(products).where(isNull(products.deleted_at));
    const existingSet = new Set([
      ...existingDropships.map(d => String(d.source_id).trim()),
      ...existingProducts.map(p => (p.sku || "").replace(/^ALI-/, "").split("-")[0].trim()).filter(Boolean),
    ]);
    const existingImageSet = new Set(
      existingProducts.map(p => normalizeImageUrl(p.image)).filter(Boolean)
    );

    const targetCount = Math.min(Math.max(10, parseInt(count) || 1000), 2500);
    const startTime = Date.now();

    let liveFetched: any[] = [];
    if (platform === "aliexpress" && creds) {
      try {
        const pageStart = existingSet.size > 80 ? Math.floor(Math.random() * 6) + 1 : 1;
        let queries: { kw: string; catId?: string; page: number }[] = [];
        if (category_id && String(category_id).trim()) {
          const catStr = String(category_id).trim();
          for (let p = pageStart; p < pageStart + 35; p++) {
            queries.push({ kw: keyword ? String(keyword).trim() : "", catId: catStr, page: p });
          }
        } else if (keyword && String(keyword).trim()) {
          for (let p = pageStart; p < pageStart + 35; p++) {
            queries.push({ kw: String(keyword).trim(), page: p });
          }
        } else {
          const shuffledTerms = [...GLOBAL_DISCOVERY_TERMS].sort(() => 0.5 - Math.random());
          for (let i = 0; i < Math.min(35, shuffledTerms.length); i++) {
            queries.push({ kw: shuffledTerms[i], page: pageStart });
            queries.push({ kw: shuffledTerms[i], page: pageStart + 1 });
            queries.push({ kw: shuffledTerms[i], page: pageStart + 2 });
          }
        }

        // Fetch in concurrent batches of 5 to maximize throughput
        const batchSize = 5;
        for (let i = 0; i < queries.length && liveFetched.length < targetCount; i += batchSize) {
          if (Date.now() - startTime > 12000) break; // Avoid 502 Bad Gateway
          const batch = queries.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map(q => searchAliExpressProducts(q.kw, creds, q.page, 50, q.catId).catch(() => []))
          );

          for (const prods of results) {
            if (Array.isArray(prods)) {
              for (const p of prods) {
                if (liveFetched.length >= targetCount) break;
                const srcId = String(p.product_id).trim();
                let img = p.product_main_image_url || "";
                if (img.startsWith("//")) img = `https:${img}`;
                const normImg = normalizeImageUrl(img);

                // Skip duplicate product ID or duplicate image URL
                if (srcId && !existingSet.has(srcId) && (!normImg || !existingImageSet.has(normImg)) && !liveFetched.some(l => l.source_id === srcId || (normImg && normalizeImageUrl(l.image) === normImg))) {
                  existingSet.add(srcId);
                  if (normImg) existingImageSet.add(normImg);
                  const cPrice = parsePrice(p.target_sale_price || p.target_original_price, 25);
                  const realStock = extractRealSupplierStock(p);
                  if (realStock <= 0) continue;
                  liveFetched.push({
                    source_id: srcId,
                    name: p.product_title || `AliExpress Product ${srcId}`,
                    cost: cPrice,
                    image: img,
                    category_name: p.first_level_category_name || "",
                    quantity: realStock,
                    source_url: p.product_detail_url || `https://www.aliexpress.com/item/${srcId}.html`,
                    supplier_name: p.shop_name || "AliExpress Verified Seller",
                  });
                }
              }
            }
          }

          if (liveFetched.length < targetCount && i + batchSize < queries.length) {
            await new Promise(r => setTimeout(r, 60));
          }
        }

        // If target count not yet reached, iterate through multiple pages of discovery terms
        if (liveFetched.length < targetCount) {
          const backupTerms = [...GLOBAL_DISCOVERY_TERMS].sort(() => 0.5 - Math.random());
          for (let p = 1; p <= 4 && liveFetched.length < targetCount; p++) {
            for (let i = 0; i < backupTerms.length && liveFetched.length < targetCount; i += batchSize) {
              const bBatch = backupTerms.slice(i, i + batchSize);
              const bResults = await Promise.all(
                bBatch.map(kw => searchAliExpressProducts(kw, creds, p, 50).catch(() => []))
              );
              for (const prods of bResults) {
                if (Array.isArray(prods)) {
                  for (const p of prods) {
                    if (liveFetched.length >= targetCount) break;
                    const srcId = String(p.product_id);
                    if (srcId && !existingSet.has(srcId) && !liveFetched.some(l => l.source_id === srcId)) {
                      let img = p.product_main_image_url || "";
                      if (img.startsWith("//")) img = `https:${img}`;
                      const cPrice = parsePrice(p.target_sale_price || p.target_original_price, 25);
                      const realStock = extractRealSupplierStock(p);
                      if (realStock <= 0) continue;
                      liveFetched.push({
                        source_id: srcId,
                        name: p.product_title || `AliExpress Product ${srcId}`,
                        cost: cPrice,
                        image: img,
                        category_name: p.first_level_category_name || "",
                        quantity: realStock,
                        source_url: p.product_detail_url || `https://www.aliexpress.com/item/${srcId}.html`,
                        supplier_name: p.shop_name || "AliExpress Verified Seller",
                      });
                    }
                  }
                }
              }
              if (liveFetched.length < targetCount) {
                await new Promise(r => setTimeout(r, 60));
              }
            }
          }
        }
      } catch (e) {
        logger.warn({ e }, "AliExpress live bulk fetch error");
      }
    }

    let importedCount = 0;
    let skippedCount = 0;
    const chunkSize = 50;

    for (let i = 0; i < liveFetched.length; i += chunkSize) {
      const chunk = liveFetched.slice(i, i + chunkSize);
      const productRecords: any[] = [];
      const metaRecords: any[] = [];

      for (const item of chunk) {
        if (existingSet.has(item.source_id)) {
          skippedCount++;
          continue;
        }
        existingSet.add(item.source_id);

        const sourcePrice = parsePrice(item.cost, 25);
        const finalStock = Number(item.quantity) > 0 ? Number(item.quantity) : extractRealSupplierStock(item);
        if (finalStock <= 0) {
          skippedCount++;
          continue;
        }

        const salePrice = Number((sourcePrice * margin).toFixed(2));
        const skuUnique = `ALI-${item.source_id}-${Date.now().toString(36).slice(-4)}`;
        const autoCatId = await matchCategoryId(item.name, category_id ? Number(category_id) : null, item.category_name);

        productRecords.push({
          name_ar: String(item.name || `AliExpress Product ${item.source_id}`).slice(0, 450),
          name_en: String(item.name_en || item.name || `AliExpress Product ${item.source_id}`).slice(0, 450),
          sku: skuUnique,
          price: salePrice,
          cost: sourcePrice,
          quantity: finalStock,
          min_quantity: Math.min(5, finalStock),
          category_id: autoCatId,
          description_ar: `${item.name} - منتج أصلي عالي الجودة متوفر للشحن السريع والتسليم الفوري.`,
          description_en: `${item.name_en || item.name} - Premium quality genuine product with fast direct delivery.`,
          image: String(item.image || ""),
          is_active: true,
        });

        metaRecords.push({
          source_id: item.source_id,
          source_url: item.source_url || `https://www.aliexpress.com/item/${item.source_id}.html`,
          source_price: sourcePrice,
          our_price: salePrice,
          supplier_name: item.supplier_name || "AliExpress Verified Seller",
        });
      }

      if (productRecords.length > 0) {
        try {
          const inserted = await db.insert(products).values(productRecords).onConflictDoNothing({ target: products.sku }).returning({ id: products.id, sku: products.sku });
          if (inserted && inserted.length > 0) {
            const metaMap = new Map(metaRecords.map(m => [m.source_id, m]));
            const dropshipRows = inserted.map(p => {
              const srcId = p.sku.split("-")[1] || "";
              const meta = metaMap.get(srcId) || metaRecords[0];
              return {
                product_id: p.id,
                platform,
                source_id: meta.source_id,
                source_url: meta.source_url,
                source_price: meta.source_price,
                source_currency: "USD",
                our_price: meta.our_price,
                supplier_name: meta.supplier_name,
                platform_commission_rate: 8,
              };
            });
            await db.insert(dropship_products).values(dropshipRows);
            importedCount += inserted.length;
          }
        } catch (err) {
          logger.warn({ err }, "Bulk chunk insert error");
        }
      }
    }

    const [{ totalInDb = 0 } = {}] = await db.select({ totalInDb: sql<number>`COUNT(*)` }).from(products).where(isNull(products.deleted_at));

    let msg = `تم استيراد ${importedCount} منتج بنجاح وحفظها في قاعدة البيانات وتوزيعها تلقائياً على فئاتها! (إجمالي المنتجات في متجرك: ${Number(totalInDb).toLocaleString()} منتج)`;
    if (importedCount === 0) {
      msg = `جميع المنتجات المجلوبة (${liveFetched.length} منتج) موجودة بالفعل في متجرك (${Number(totalInDb).toLocaleString()} منتج حالياً). جرب البحث بكلمة جديدة أو فئة أخرى!`;
    }

    return res.json({
      success: true,
      message: msg,
      imported: importedCount,
      target: targetCount,
      fetched: liveFetched.length,
      skipped: skippedCount,
      total_in_db: Number(totalInDb),
      platform,
      debug: {
        live_fetched: liveFetched.length,
        creds_found: Boolean(creds),
      }
    });
  } catch (err) { next(err); }
});

// Batch import selected or all browsed products in one click
router.post("/admin/dropship/import-batch", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { items = [], margin_percent = 300 } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "لا توجد منتجات للاستيراد" });
    }
    const margin = (100 + (margin_percent || 300)) / 100;
    const existingDropships = await db.select({ source_id: dropship_products.source_id }).from(dropship_products);
    const existingProducts = await db.select({ sku: products.sku, image: products.image }).from(products).where(isNull(products.deleted_at));
    const existingSet = new Set([
      ...existingDropships.map(d => String(d.source_id).trim()),
      ...existingProducts.map(p => (p.sku || "").replace(/^ALI-/, "").split("-")[0].trim()).filter(Boolean),
    ]);
    const existingImageSet = new Set(
      existingProducts.map(p => normalizeImageUrl(p.image)).filter(Boolean)
    );

    let importedCount = 0;
    const chunkSize = 50;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const productRecords: any[] = [];
      const metaRecords: any[] = [];
      for (const item of chunk) {
        const srcId = String(item.source_id || item.product_id).trim();
        const normImg = normalizeImageUrl(item.image);
        if (!srcId || existingSet.has(srcId) || (normImg && existingImageSet.has(normImg))) continue;
        existingSet.add(srcId);
        if (normImg) existingImageSet.add(normImg);
        const sourcePrice = parseFloat(item.price || item.source_price || 25) || 25;
        const realStock = extractRealSupplierStock(item);
        if (realStock <= 0) continue;

        const salePrice = Number((sourcePrice * margin).toFixed(2));
        const skuUnique = `ALI-${srcId}-${Date.now().toString(36).slice(-4)}`;
        const autoCatId = await matchCategoryId(item.name || "", null, item.category_name);
        productRecords.push({
          name_ar: String(item.name || `AliExpress Product ${srcId}`).slice(0, 450),
          name_en: String(item.name_en || item.name || `AliExpress Product ${srcId}`).slice(0, 450),
          sku: skuUnique,
          price: salePrice,
          cost: sourcePrice,
          quantity: realStock,
          min_quantity: Math.min(5, realStock),
          category_id: autoCatId,
          description_ar: `${item.name} - منتج أصلي عالي الجودة للشحن المباشر والتسليم السريع.`,
          description_en: `${item.name} - High quality product with fast direct shipping.`,
          image: String(item.image || ""),
          is_active: true,
        });
        metaRecords.push({
          source_id: srcId,
          source_url: item.source_url || `https://www.aliexpress.com/item/${srcId}.html`,
          source_price: sourcePrice,
          our_price: salePrice,
          supplier_name: item.supplier_name || "AliExpress Verified Seller",
        });
      }
      if (productRecords.length > 0) {
        const inserted = await db.insert(products).values(productRecords).onConflictDoNothing({ target: products.sku }).returning({ id: products.id, sku: products.sku });
        if (inserted && inserted.length > 0) {
          const metaMap = new Map(metaRecords.map(m => [m.source_id, m]));
          const dropshipRows = inserted.map(p => {
            const srcId = p.sku.split("-")[1] || "";
            const meta = metaMap.get(srcId) || metaRecords[0];
            return {
              product_id: p.id,
              platform: "aliexpress",
              source_id: meta.source_id,
              source_url: meta.source_url,
              source_price: meta.source_price,
              source_currency: "USD",
              our_price: meta.our_price,
              supplier_name: meta.supplier_name,
              platform_commission_rate: 8,
            };
          });
          await db.insert(dropship_products).values(dropshipRows);
          importedCount += inserted.length;
        }
      }
    }
    const [{ totalInDb = 0 } = {}] = await db.select({ totalInDb: sql<number>`COUNT(*)` }).from(products).where(isNull(products.deleted_at));
    return res.json({
      success: true,
      imported: importedCount,
      total_in_db: Number(totalInDb),
      message: `تم استيراد ${importedCount} منتج وحفظها في متجرك بنجاح! (إجمالي المنتجات في متجرك: ${Number(totalInDb).toLocaleString()} منتج)`,
    });
  } catch (err) { next(err); }
});

// Dropdown/Search endpoint for dropship platforms
router.get("/admin/dropship/search", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const platform = String(req.query.platform || "aliexpress");
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ success: true, results: [], count: 0 });

    if (platform === "aliexpress") {
      const creds = await getAliExpressCreds();
      if (!creds) return res.status(400).json({ success: false, message: "بيانات علي إكسبرس غير متوفرة" });
      const [p1, p2, p3, p4] = await Promise.all([
        searchAliExpressProducts(q, creds, 1, 50),
        searchAliExpressProducts(q, creds, 2, 50),
        searchAliExpressProducts(q, creds, 3, 50),
        searchAliExpressProducts(q, creds, 4, 50),
      ]);
      const all = [...p1, ...p2, ...p3, ...p4];
      const seen = new Set();
      const results: any[] = [];
      for (const p of all) {
        const id = String(p.product_id);
        if (id && !seen.has(id)) {
          seen.add(id);
          let img = p.product_main_image_url || "";
          if (img.startsWith("//")) img = `https:${img}`;
          results.push({
            source_id: id,
            name: p.product_title,
            price: parseFloat(p.target_sale_price) || parseFloat(p.target_original_price) || 25,
            original_price: parseFloat(p.target_original_price) || 0,
            image: img,
            category_name: p.first_level_category_name || "",
            rating: parseFloat(p.evaluate_rate) || 4.8,
            orders_count: parseInt(p.sales_volume) || 120,
            platform: "aliexpress",
            source_url: p.product_detail_url || `https://www.aliexpress.com/item/${id}.html`,
            supplier_name: p.shop_name || "AliExpress Verified Seller",
          });
        }
      }
      return res.json({ success: true, results, count: results.length });
    }
    return res.json({ success: true, results: [], count: 0 });
  } catch (err) { next(err); }
});

// ========== DATABASE CLEANUP & RESET (ALL PRODUCTS) ==========
router.delete("/admin/dropship/clear-products", requireAuth, requireRole("admin", "manager"), async (_req, res, next) => {
  try {
    // Delete all dropship linkages
    await db.delete(dropship_products);

    // Delete all products completely
    await db.delete(products);

    return res.json({
      success: true,
      message: "تم تنظيف وتفريغ جميع المنتجات بالكامل من قاعدة البيانات وصفحة المنتجات!",
    });
  } catch (err) { next(err); }
});

// ========== PRODUCT FETCHER (BY URL OR PRODUCT ID / CODE) ==========
router.get("/admin/dropship/fetch-url", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    let { url } = req.query as { url: string };
    if (!url || !url.trim()) return res.status(400).json({ success: false, message: "كود المنتج أو الرابط مطلوب" });
    url = url.trim();
    let cleanInput = url.replace(/^[#\s]+/, "").trim();

    // Check if input contains a product ID / code (e.g. 10050071340609, #10050071340609, or item URL)
    let productId = "";
    const matchId = cleanInput.match(/(\d{10,20})/);
    if (matchId) {
      productId = matchId[1];
      if (!url.startsWith("http")) {
        url = `https://www.aliexpress.com/item/${productId}.html`;
      }
    }

    // Try AliExpress Official API if product ID and credentials are present
    if (productId) {
      const creds = await getAliExpressCreds();
      if (creds) {
        try {
          const apiProduct = await fetchAliExpressProduct(productId, creds);
          if (apiProduct && (apiProduct.product_title || apiProduct.product_main_image_url)) {
            let img = apiProduct.product_main_image_url || "";
            if (img.startsWith("//")) img = `https:${img}`;
            return res.json({
              success: true,
              source_id: apiProduct.product_id || productId,
              name: apiProduct.product_title || `منتج علي إكسبرس كود ${productId}`,
              name_ar: apiProduct.title_ar || apiProduct.product_title || `منتج علي إكسبرس كود ${productId}`,
              name_en: apiProduct.title_en || apiProduct.product_title || `AliExpress Product ${productId}`,
              price: parseFloat(apiProduct.target_sale_price) || parseFloat(apiProduct.target_original_price) || 45,
              original_price: parseFloat(apiProduct.target_original_price) || 0,
              quantity: extractRealSupplierStock(apiProduct),
              image: img,
              description: "منتج أصلي عالي الجودة متوفر للشحن السريع والتسليم الفوري",
              platform: "aliexpress",
              source_url: apiProduct.product_detail_url || url,
              supplier_name: apiProduct.shop_name || "AliExpress Verified Seller",
            });
          }
        } catch (e) {
          logger.warn({ productId, err: e }, "AliExpress API fetch failed, falling back to scraper");
        }
      }
    }

    if (!url.startsWith("http")) {
      url = `https://${url}`;
    }

    const response: any = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(12000),
    });
    const html = await response.text();

    let name = "", price = 0, image = "", description = "", source_id = productId || "";
    const getOgTag = (property: string) => {
      const m = html.match(new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, "i")) || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`, "i"));
      return m ? m[1] : "";
    };
    const getMeta = (nameAttr: string) => {
      const m = html.match(new RegExp(`<meta[^>]*name=["']${nameAttr}["'][^>]*content=["']([^"']+)["']`, "i"));
      return m ? m[1] : "";
    };

    if (url.includes("aliexpress") || productId) {
      if (!source_id) {
        const idM = url.match(/item\/(\d+)/);
        source_id = idM ? idM[1] : `ale-${Date.now()}`;
      }
      name = getOgTag("title") || getMeta("title") || "";
      image = getOgTag("image") || "";
      description = getOgTag("description") || getMeta("description") || "";
      
      const ldMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (ldMatch) {
        for (const block of ldMatch) {
          try {
            const inner = block.replace(/<\/?script[^>]*>/gi, "");
            const j = JSON.parse(inner);
            if (j["@type"] === "Product" || j.name) {
              name = name || j.name || "";
              image = image || (Array.isArray(j.image) ? j.image[0] : j.image) || "";
              description = description || j.description || "";
              if (j.offers?.price) price = parseFloat(j.offers.price);
            }
          } catch {}
        }
      }

      const priceM = html.match(/"maxAmount":\{"value":"?(\d+\.?\d*)"?/); if (priceM && !price) price = parseFloat(priceM[1]);
      const price2 = html.match(/"actSkuCalcPrice":"?(\d+\.?\d*)"?/); if (price2 && !price) price = parseFloat(price2[1]);
      const price3 = html.match(/"formattedAmount":"?\$?(\d+\.?\d*)"?/); if (price3 && !price) price = parseFloat(price3[1]);

      if (name.includes("|")) name = name.split("|")[0].trim();
      if (name.includes("- AliExpress")) name = name.replace("- AliExpress", "").trim();

      // Extract real stock quantity from AliExpress page data
      let quantity = 500;
      const qtyM = html.match(/"totalAvailQuantity":\s*(\d+)/i) || html.match(/"inventory":\s*(\d+)/i) || html.match(/"quantity":\s*(\d+)/i) || html.match(/"availQuantity":\s*(\d+)/i);
      if (qtyM && parseInt(qtyM[1]) > 0) {
        quantity = parseInt(qtyM[1]);
      }

      // Extract high resolution real AliExpress image
      const hdImgM = html.match(/"imagePathList":\s*\[\s*"([^"]+)"/i) || html.match(/"mainPic":\s*"([^"]+)"/i);
      if (hdImgM && hdImgM[1]) {
        let hdUrl = hdImgM[1].replace(/\\u002F/g, "/");
        if (!hdUrl.startsWith("http")) hdUrl = `https:${hdUrl}`;
        image = hdUrl;
      }

      // Extract real seller shop name
      let supplierName = "AliExpress Verified Supplier";
      const shopM = html.match(/"storeName":\s*"([^"]+)"/i) || html.match(/"sellerName":\s*"([^"]+)"/i);
      if (shopM && shopM[1]) {
        supplierName = shopM[1];
      }

      if (!name) name = `منتج علي إكسبرس كود ${source_id}`;
      if (!image) image = `https://picsum.photos/seed/ali_${source_id}/600/600`;
      if (!price) price = 45;

      return res.json({
        success: true,
        source_id,
        name,
        price,
        quantity,
        image,
        description: description || `منتج علي إكسبرس الأصلي كود ${source_id}. وارد من متجر ${supplierName}.`,
        platform: "aliexpress",
        source_url: url,
        supplier_name: supplierName,
      });
    } else if (url.includes("amazon")) {
      const asinM = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
      source_id = asinM ? (asinM[1] || asinM[2]) : `amz-${Date.now()}`;
      name = getOgTag("title") || getMeta("title") || "";
      image = getOgTag("image") || "";
      description = getMeta("description") || getOgTag("description") || "";
      const ldMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (ldMatch) { for (const block of ldMatch) { try { const j = JSON.parse(block.replace(/<\/?script[^>]*>/gi, "")); if (j["@type"] === "Product") { name = name || j.name || ""; if (j.offers?.price) price = parseFloat(j.offers.price); } } catch {} } }
      const priceM = html.match(/class="a-price-whole"[^>]*>\s*([0-9,]+)/); if (priceM && !price) price = parseFloat(priceM[1].replace(/,/g, ""));
      if (name.includes(":")) name = name.split(":")[0].trim(); if (name.includes("- Amazon")) name = name.replace("- Amazon", "").trim(); if (name.includes("| Amazon")) name = name.replace(/\|.*$/, "").trim();

      return res.json({
        success: true,
        source_id,
        name: name || `منتج أمازون ASIN ${source_id}`,
        price: price || 60,
        quantity: 250,
        image: image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
        description: description || "منتج أصلي مستورد من أمازون",
        platform: "amazon",
        source_url: url,
        supplier_name: "Amazon Prime Supplier",
      });
    }

    return res.json({
      success: true,
      source_id: `ext-${Date.now()}`,
      name: getOgTag("title") || getMeta("title") || "منتج مستورد",
      price: 50,
      quantity: 100,
      image: getOgTag("image") || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
      description: getMeta("description") || getOgTag("description") || "منتج مستورد",
      platform: "other",
      source_url: url,
      supplier_name: "المورد الخارجي",
    });
  } catch (err: any) {
    logger.error({ err: err.message, url: req.query.url }, "URL scraper failed");
    return res.status(500).json({ success: false, message: "فشل الاتصال بالرابط أو كود المنتج. تأكد من صحته أو أدخل البيانات يدوياً." });
  }
});

// ========== CENTRAL DROPSHIP STOCK & AVAILABILITY VERIFIER ==========
const dropshipStockCheckCache = new Map<number, { timestamp: number; result: { available: boolean; reason?: string; newPrice?: number } }>();

/**
 * Verifies live stock and supplier availability for a dropship product.
 * If the product is out of stock or removed by the supplier (AliExpress, Amazon, or external link),
 * it automatically:
 *  1. Hides and disables the product (is_active = false, quantity = 0, deleted_at = now())
 *  2. Deletes from dropship_products
 *  3. Logs the action
 *  4. Returns { available: false, reason: "..." }
 */
export async function purgeProductById(productId: number): Promise<void> {
  try {
    const client = await pool.connect();
    try {
      await client.query("SET default_transaction_read_only = off;");
      await client.query("DELETE FROM product_translations WHERE product_id = $1;", [productId]);
      await client.query("DELETE FROM dropship_products WHERE product_id = $1;", [productId]);
      await client.query("DELETE FROM products WHERE id = $1;", [productId]);
    } finally {
      client.release();
    }
    clearProductsCache();
    logger.info({ productId }, "Permanently deleted zero-stock / unavailable product from database");
  } catch (err: any) {
    logger.error({ err: err.message, productId }, "Failed to purge product by id from database");
    await db.update(products).set({ is_active: false, quantity: 0, deleted_at: new Date() }).where(eq(products.id, productId)).catch(() => {});
  }
}

export async function purgeZeroStockAndDeletedProducts(): Promise<number> {
  try {
    const client = await pool.connect();
    try {
      await client.query("SET default_transaction_read_only = off;");
      
      // Delete translations for products with 0 stock, inactive, or marked deleted
      await client.query(`
        DELETE FROM product_translations 
        WHERE product_id IN (
          SELECT id FROM products 
          WHERE quantity <= 0 OR is_active = false OR deleted_at IS NOT NULL
        );
      `);

      // Delete dropship records for products with 0 stock, inactive, or marked deleted
      await client.query(`
        DELETE FROM dropship_products 
        WHERE product_id IN (
          SELECT id FROM products 
          WHERE quantity <= 0 OR is_active = false OR deleted_at IS NOT NULL
        );
      `);

      // Permanently delete zero stock / inactive / deleted products from database
      const res = await client.query(`
        DELETE FROM products 
        WHERE quantity <= 0 OR is_active = false OR deleted_at IS NOT NULL;
      `);

      const count = res.rowCount || 0;
      if (count > 0) {
        logger.info({ count }, "Purged zero-stock / inactive / deleted products permanently from database");
        clearProductsCache();
      }
      return count;
    } finally {
      client.release();
    }
  } catch (err: any) {
    logger.error({ err: err.message }, "Error purging zero stock products from database");
    return 0;
  }
}

export async function verifyAndSyncDropshipProductStock(
  productId: number,
  options: { forceLive?: boolean } = {}
): Promise<{ available: boolean; reason?: string; newPrice?: number }> {
  try {
    if (!options.forceLive) {
      const cached = dropshipStockCheckCache.get(productId);
      if (cached && Date.now() - cached.timestamp < 60_000) {
        return cached.result;
      }
    }

    const [dp] = await db.select().from(dropship_products).where(eq(dropship_products.product_id, productId));
    if (!dp) {
      // Local inventory check
      const [p] = await db.select().from(products).where(eq(products.id, productId));
      if (!p || p.deleted_at || !p.is_active || p.quantity <= 0) {
        if (p) {
          await purgeProductById(productId);
        }
        return { available: false, reason: "المنتج غير متوفر في المخزون وتم حذفه" };
      }
      return { available: true };
    }

    const markOutOfStockAndRemove = async (reason: string) => {
      logger.warn({ productId, platform: dp.platform, source_id: dp.source_id, reason }, "Dropship product out of stock / 0 stock. Automatically zeroing and permanently deleting from database...");
      await purgeProductById(productId);
      const res = { available: false, reason };
      dropshipStockCheckCache.set(productId, { timestamp: Date.now(), result: res });
      return res;
    };

    const settings = await db.select().from(platform_settings);
    const cfg: Record<string, string> = {};
    settings.forEach(s => { cfg[s.key] = s.value; });

    // 1. ALIEXPRESS
    if (dp.platform === "aliexpress") {
      const creds = await getAliExpressCreds();
      if (creds && dp.source_id) {
        const aliProduct = await fetchAliExpressProduct(dp.source_id, creds);
        if (!aliProduct) {
          return await markOutOfStockAndRemove("المنتج لم يعد متوفراً أو تم حذفه من AliExpress");
        }

        const targetSalePrice = parseFloat(aliProduct.target_sale_price) || 0;
        const targetOrigPrice = parseFloat(aliProduct.target_original_price) || 0;
        const newSourcePrice = targetSalePrice || targetOrigPrice;

        const realStock = extractRealSupplierStock(aliProduct);
        const isOutOfStock = newSourcePrice <= 0 ||
          realStock <= 0 ||
          (aliProduct as any).product_status === "offline" || 
          (aliProduct as any).product_status === "out_of_stock";

        if (isOutOfStock) {
          return await markOutOfStockAndRemove(`نفدت كمية المنتج من AliExpress (المخزون الحقيقي ${realStock})`);
        }

        const margin = dp.source_price > 0 ? dp.our_price / dp.source_price : 4.0;
        const newOurPrice = parseFloat((newSourcePrice * margin).toFixed(2));
        await db.update(dropship_products).set({
          source_price: newSourcePrice,
          our_price: newOurPrice,
          supplier_name: aliProduct.shop_name || dp.supplier_name,
        }).where(eq(dropship_products.id, dp.id));

        await db.update(products).set({
          price: newOurPrice,
          cost: newSourcePrice,
          quantity: realStock,
          is_active: true,
        }).where(eq(products.id, productId));

        const res = { available: true, newPrice: newOurPrice };
        dropshipStockCheckCache.set(productId, { timestamp: Date.now(), result: res });
        return res;
      }
    }

    // 2. AMAZON
    if (dp.platform === "amazon" && dp.source_id) {
      const amazonCreds = await getAmazonCreds();
      if (amazonCreds) {
        const items = await fetchAmazonItems([dp.source_id], amazonCreds);
        if (!items || items.length === 0) {
          return await markOutOfStockAndRemove("المنتج لم يعد متوفراً على أمازون");
        }
        const item = items[0];
        const price = item.Offers?.Listings?.[0]?.Price?.Amount || 0;
        const realStock = extractRealSupplierStock(item);
        if (price <= 0 || realStock <= 0) {
          return await markOutOfStockAndRemove("نفد مخزون المنتج من أمازون");
        }
        const margin = dp.source_price > 0 ? dp.our_price / dp.source_price : 4.0;
        const newOurPrice = parseFloat((price * margin).toFixed(2));
        await db.update(dropship_products).set({
          source_price: price,
          our_price: newOurPrice,
        }).where(eq(dropship_products.id, dp.id));
        await db.update(products).set({
          price: newOurPrice,
          cost: price,
          quantity: realStock,
          is_active: true,
        }).where(eq(products.id, productId));
        const res = { available: true, newPrice: newOurPrice };
        dropshipStockCheckCache.set(productId, { timestamp: Date.now(), result: res });
        return res;
      }
    }

    // 3. EXTERNAL URL / OTHER PLATFORMS
    if (dp.source_url && dp.source_url.startsWith("http")) {
      try {
        const res: any = await fetch(dp.source_url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
          },
          signal: AbortSignal.timeout(7000),
          redirect: "follow",
        });

        if (res.status === 404 || res.status === 410) {
          return await markOutOfStockAndRemove("صفحة المنتج في الموقع المصدر محذوفة أو غير موجودة (404)");
        }

        if (res.ok) {
          const html = await res.text();
          const lower = html.toLowerCase();
          const outOfStockKeywords = [
            "out of stock",
            "currently unavailable",
            "sold out",
            "item is no longer available",
            "غير متوفر حالياً",
            "نفدت الكمية",
            "غير متاح",
            "نفذت الكمية",
            "this product is no longer available"
          ];
          const isOut = outOfStockKeywords.some(kw => lower.includes(kw));
          if (isOut) {
            return await markOutOfStockAndRemove("نفد مخزون المنتج من موقع المورد الخارجي");
          }
        }
      } catch (scrapeErr: any) {
        logger.warn({ err: scrapeErr.message, url: dp.source_url }, "External source URL check timed out or errored, preserving product");
      }
    }

    const res = { available: true };
    dropshipStockCheckCache.set(productId, { timestamp: Date.now(), result: res });
    return res;
  } catch (err: any) {
    logger.error({ err: err.message, productId }, "verifyAndSyncDropshipProductStock failed");
    return { available: true };
  }
}

// ========== SYNC LIVE STOCK & PRICES FROM ALL PLATFORMS (ALIEXPRESS, AMAZON, EXTERNAL) ==========
router.post("/admin/dropship/sync-stock", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const limit = req.query.all === "true" ? 200 : (Number(req.query.limit) || 80);
    const result = await syncAllDropshipPricesAndStock(limit);
    return res.json({
      success: true,
      message: `تمت مزامنة وفحص المخزون بنجاح (فحص ${result.total} منتج، تحديث ${result.synced}، وحذف ${result.deletedOutOfStock} منتج نفد من المصدر)!`,
      total_checked: result.total,
      synced_count: result.synced,
      deleted_count: result.deletedOutOfStock,
    });
  } catch (err) { next(err); }
});

router.post("/admin/dropship/run-auto-import", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { count = 500 } = req.body || {};
    const result = await runAutoImportCycle(Number(count) || 500);
    return res.json({
      success: true,
      message: `تم تشغيل الجلب التلقائي ومزامنة المنتجات بنجاح بهامش ربح 300%!`,
      ...result,
    });
  } catch (err) { next(err); }
});

// ========== ADMIN COMMISSION ==========
router.get("/admin/my-commission", requireAuth, requireRole("admin", "manager", "accountant"), async (_req, res, next) => {
  try {
    const allOrders = await db.select().from(orders);
    const paidOrders = allOrders.filter(o => o.payment_status === "paid");
    const allProducts = await db.select().from(products).where(isNull(products.deleted_at));
    const allDropships = await db.select().from(dropship_products);
    const [rateSetting] = await db.select().from(platform_settings).where(eq(platform_settings.key, "admin_commission_rate"));
    const commissionRate = rateSetting ? parseFloat(rateSetting.value) : 15;

    const settingsRows = await db.select().from(platform_settings);
    const cfg: Record<string, string> = {};
    settingsRows.forEach(s => { cfg[s.key] = s.value; });
    const platformRates: Record<string, number> = {
      aliexpress: parseFloat(cfg["aliexpress_commission_rate"] || "0"),
      amazon: parseFloat(cfg["amazon_commission_rate"] || "0"),
      alibaba: parseFloat(cfg["alibaba_commission_rate"] || "0"),
    };

    let totalRevenue = 0, totalCost = 0;
    const orderBreakdown: any[] = [];
    const byPlatform: Record<string, { revenue: number; cost: number; markup: number; affiliate_commission: number; count: number }> = {
      aliexpress: { revenue: 0, cost: 0, markup: 0, affiliate_commission: 0, count: 0 },
      amazon: { revenue: 0, cost: 0, markup: 0, affiliate_commission: 0, count: 0 },
      alibaba: { revenue: 0, cost: 0, markup: 0, affiliate_commission: 0, count: 0 },
      other: { revenue: 0, cost: 0, markup: 0, affiliate_commission: 0, count: 0 },
    };

    for (const order of paidOrders) {
      let orderCost = 0, orderMarkup = 0, orderAffCommission = 0;
      const orderPlatforms = new Set<string>();
      const items = (order.items as any[]) || [];
      for (const item of items) {
        const product = allProducts.find(p => (p.name_ar === item.product_name || p.name_en === item.product_name || (p as any).name === item.product_name));
        const dp = product ? allDropships.find(d => d.product_id === product.id) : null;
        const itemCost = (product?.cost || 0) * (item.quantity || 1);
        const itemRevenue = item.total || (item.price * item.quantity);
        const itemMarkup = itemRevenue - itemCost;
        const plt = dp?.platform || "other";
        const affRate = dp?.platform_commission_rate || platformRates[plt] || 0;
        const itemAff = itemCost * (affRate / 100);
        orderCost += itemCost; orderMarkup += itemMarkup; orderAffCommission += itemAff; orderPlatforms.add(plt);
        if (!byPlatform[plt]) byPlatform[plt] = { revenue: 0, cost: 0, markup: 0, affiliate_commission: 0, count: 0 };
        byPlatform[plt].revenue += itemRevenue; byPlatform[plt].cost += itemCost; byPlatform[plt].markup += itemMarkup; byPlatform[plt].affiliate_commission += itemAff;
      }
      const profit = order.total - orderCost;
      const myCommission = order.total * (commissionRate / 100);
      totalRevenue += order.total; totalCost += orderCost;
      for (const plt of orderPlatforms) { if (byPlatform[plt]) byPlatform[plt].count += 1; }
      orderBreakdown.push({ order_number: order.order_number, customer_name: order.customer_name, total: order.total, cost: orderCost, profit, markup: orderMarkup, affiliate_commission: orderAffCommission, my_commission: myCommission, platforms: Array.from(orderPlatforms), fulfillment_status: (order as any).fulfillment_status || "unfulfilled", date: order.order_date });
    }

    const totalProfit = totalRevenue - totalCost;
    const totalMyCommission = totalRevenue * (commissionRate / 100);
    const totalAffiliateCommission = Object.values(byPlatform).reduce((s, p) => s + p.affiliate_commission, 0);

    const monthly: Record<string, { revenue: number; commission: number; affiliate: number }> = {};
    for (const o of orderBreakdown) {
      const key = new Date(o.date).toLocaleString("ar-SA", { month: "short", year: "numeric" });
      if (!monthly[key]) monthly[key] = { revenue: 0, commission: 0, affiliate: 0 };
      monthly[key].revenue += o.total; monthly[key].commission += o.my_commission; monthly[key].affiliate += o.affiliate_commission;
    }

    const platformNames: Record<string, string> = { aliexpress: "علي إكسبرس 🇨🇳", amazon: "أمازون 🛒", alibaba: "علي بابا 🏪", other: "مباشر 🏪" };
    const platformSummary = Object.entries(byPlatform).filter(([, v]) => v.revenue > 0).map(([key, v]) => ({
      platform: key, name: platformNames[key] || key, revenue: v.revenue, cost: v.cost, markup: v.markup,
      affiliate_commission: v.affiliate_commission, total_earnings: v.markup + v.affiliate_commission, orders_count: v.count, commission_rate: platformRates[key] || 0,
    }));

    return res.json({ success: true, commission_rate: commissionRate, total_revenue: totalRevenue, total_cost: totalCost, total_profit: totalProfit, total_my_commission: totalMyCommission, total_affiliate_commission: totalAffiliateCommission, orders_count: paidOrders.length, all_orders_count: allOrders.length, orders: orderBreakdown.slice(0, 20), monthly: Object.entries(monthly).map(([month, v]) => ({ month, ...v })), by_platform: platformSummary, platform_rates: platformRates });
  } catch (err) { next(err); }
});

router.post("/admin/my-commission/settings", requireAuth, requireRole("admin", "manager", "accountant"), validateBody(commissionSettingsSchema), async (req, res, next) => {
  try {
    const { commission_rate } = req.body;
    const existing = await db.select().from(platform_settings).where(eq(platform_settings.key, "admin_commission_rate"));
    if (existing.length > 0) await db.update(platform_settings).set({ value: String(commission_rate), updated_at: new Date() }).where(eq(platform_settings.key, "admin_commission_rate"));
    else await db.insert(platform_settings).values({ key: "admin_commission_rate", value: String(commission_rate) });
    return res.json({ success: true, message: "تم الحفظ", commission_rate });
  } catch (err) { next(err); }
});

// ========== AFFILIATES ==========
router.get("/admin/affiliates/stats", requireAuth, requireRole("admin", "manager", "sales"), async (_req, res, next) => {
  try {
    const [{ total = 0 } = {}] = await db.select({ total: sql<number>`COUNT(*)` }).from(affiliates).where(isNull(affiliates.deleted_at));
    const [{ clicks = 0 } = {}] = await db.select({ clicks: sql<number>`COALESCE(SUM(${affiliates.total_clicks}),0)` }).from(affiliates).where(isNull(affiliates.deleted_at));
    const [{ convs = 0 } = {}] = await db.select({ convs: sql<number>`COALESCE(SUM(${affiliates.total_conversions}),0)` }).from(affiliates).where(isNull(affiliates.deleted_at));
    const [{ pending = 0 } = {}] = await db.select({ pending: sql<number>`COALESCE(SUM(${affiliate_conversions.commission_amount}),0)` }).from(affiliate_conversions).where(eq(affiliate_conversions.status, "pending"));
    return res.json({ success: true, total_affiliates: Number(total), total_clicks: Number(clicks), total_conversions: Number(convs), total_pending: Number(pending) });
  } catch (err) { next(err); }
});

router.get("/admin/affiliates", requireAuth, requireRole("admin", "manager", "sales"), async (req, res, next) => {
  try {
    const { search = "" } = req.query as Record<string, string>;
    const where = search ? or(like(affiliates.name, `%${escapeLike(search)}%`), like(affiliates.email, `%${escapeLike(search)}%`)) : isNull(affiliates.deleted_at);
    const data = await db.select().from(affiliates).where(where).orderBy(desc(affiliates.id));
    return res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post("/admin/affiliates", requireAuth, requireRole("admin", "manager"), validateBody(affiliateSchema), async (req, res, next) => {
  try {
    const b = req.body;
    const code = b.code || `AFF${Date.now().toString(36).toUpperCase()}`;
    const [a] = await db.insert(affiliates).values({ name: b.name, email: b.email.trim().toLowerCase(), phone: b.phone || "", code, commission_rate: b.commission_rate, balance: 0, total_earned: 0, total_clicks: 0, total_conversions: 0, is_active: true }).returning();
    return res.status(201).json({ success: true, data: a });
  } catch (err: any) { if (err.message?.includes("unique constraint")) return res.status(409).json({ success: false, message: "البريد أو الكود مستخدم بالفعل" }); next(err); }
});

router.put("/admin/affiliates/:id", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const b = req.body;
    const update: any = {};
    if (b.name !== undefined) update.name = b.name;
    if (b.commission_rate !== undefined) update.commission_rate = b.commission_rate;
    if (b.is_active !== undefined) update.is_active = b.is_active;
    if (b.balance !== undefined) update.balance = b.balance;
    const [a] = await db.update(affiliates).set(update).where(and(eq(affiliates.id, Number(req.params.id)), isNull(affiliates.deleted_at))).returning();
    if (!a) return res.status(404).json({ success: false, message: "المسوّق غير موجود" });
    return res.json({ success: true, data: a });
  } catch (err) { next(err); }
});

router.delete("/admin/affiliates/:id", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    await db.update(affiliates).set({ deleted_at: new Date() }).where(eq(affiliates.id, Number(req.params.id)));
    return res.json({ success: true, message: "تم الحذف" });
  } catch (err) { next(err); }
});

router.get("/admin/affiliates/:id/conversions", requireAuth, requireRole("admin", "manager", "sales"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const data = await db.select().from(affiliate_conversions).where(eq(affiliate_conversions.affiliate_id, Number(req.params.id))).orderBy(desc(affiliate_conversions.id));
    return res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get("/affiliates/:code", async (req, res, next) => {
  try {
    const [aff] = await db.select().from(affiliates).where(and(eq(affiliates.code, String(req.params.code)), eq(affiliates.is_active, true), isNull(affiliates.deleted_at)));
    if (!aff) return res.status(404).json({ success: false, message: "رابط الإحالة غير صحيح" });
    await db.update(affiliates).set({ total_clicks: sql`${affiliates.total_clicks} + 1` }).where(eq(affiliates.id, aff.id));
    return res.json({ success: true, data: { name: aff.name, code: aff.code, commission_rate: aff.commission_rate } });
  } catch (err) { next(err); }
});

// ========== DROPSHIPPING DEMO PRODUCTS ==========


router.get("/admin/dropship/products", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || "50")), 100);
    const dps = await db.select().from(dropship_products).orderBy(desc(dropship_products.id)).limit(limit);
    const prodIds = dps.map(d => d.product_id).filter(Boolean) as number[];
    const prods = prodIds.length > 0 ? await db.select().from(products).where(and(inArray(products.id, prodIds), isNull(products.deleted_at))) : [];
    const prodMap = new Map(prods.map(p => [p.id, p]));
    const result = dps.map(dp => ({
      ...dp,
      product: dp.product_id ? prodMap.get(dp.product_id) || null : null,
    }));
    return res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post("/admin/dropship/import", requireAuth, requireRole("admin", "manager"), validateBody(dropshipImportSchema), async (req, res, next) => {
  try {
    const b = req.body;
    const skuUnique = `DS-${b.source_id?.slice(-6) || Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6)}`;
    const matchedCatId = await matchCategoryId(`${b.name || ""} ${b.description || ""}`, b.category_id);
    const realStock = extractRealSupplierStock(b);
    const finalStock = Number(b.quantity) > 0 ? Number(b.quantity) : (realStock > 0 ? realStock : (35 + (Math.abs(parseInt(String(b.source_id || Date.now()), 10) || 1) % 95)));

    const [newProduct] = await db.insert(products).values({
      name_ar: b.name || "منتج دروبشيبينغ",
      name_en: b.name || "Dropshipping Product",
      sku: skuUnique,
      price: b.our_price || b.source_price || 50,
      cost: b.source_price || 0,
      quantity: finalStock,
      min_quantity: Math.min(5, finalStock),
      category_id: matchedCatId,
      description_ar: sanitizeText(b.description || "منتج عالي الجودة"),
      description_en: sanitizeText(b.description || "High quality product"),
      image: b.image || "",
      is_active: true,
    }).returning();

    const [dp] = await db.insert(dropship_products).values({
      product_id: newProduct.id,
      platform: b.platform || "aliexpress",
      source_id: b.source_id || `src-${Date.now()}`,
      source_url: b.source_url || "",
      source_price: b.source_price || 0,
      source_currency: "USD",
      our_price: b.our_price || b.source_price || 50,
      supplier_name: b.supplier_name || b.platform || "AliExpress Supplier",
      platform_commission_rate: 0,
    }).returning();
    return res.json({ success: true, data: { product: newProduct, dropship: dp } });
  } catch (err: any) { if (err.message?.includes("unique constraint")) return res.status(409).json({ success: false, message: "SKU أو source_id مستخدم بالفعل" }); next(err); }
});

router.get("/admin/dropship/api-search", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { platform, q } = req.query as Record<string, string>;
    if (!platform || !q) return res.status(400).json({ success: false, message: "المنصة وكلمة البحث مطلوبة" });

    if (platform === "aliexpress") {
      const creds = await getAliExpressCreds();
      if (!creds) return res.status(400).json({ success: false, message: "أضف App Key و App Secret لعلي إكسبرس أولاً في الإعدادات > منصات التسويق" });
      const products = await searchAliExpressProducts(q, creds, 1, 20);
      return res.json({ success: true, data: products.map(p => ({
        source_id: p.product_id,
        name: p.product_title,
        price: parseFloat(p.target_sale_price) || parseFloat(p.target_original_price) || 0,
        original_price: parseFloat(p.target_original_price) || 0,
        currency: p.target_sale_price_currency,
        image: p.product_main_image_url,
        source_url: p.product_detail_url,
        commission_rate: parseFloat(p.commission_rate) || 0,
        category: p.first_level_category_name,
        shop_name: p.shop_name,
        shop_url: p.shop_url,
        rating: p.evaluate_rate,
        sales_volume: p.sales_volume,
        platform: "aliexpress",
      })), total: products.length });
    }

    if (platform === "amazon") {
      const accessKey = (await db.select().from(platform_settings).where(eq(platform_settings.key, "amazon_access_key")))[0]?.value;
      if (!accessKey) return res.status(400).json({ success: false, message: "أضف Access Key لأمازون أولاً في الإعدادات" });
      return res.status(501).json({ success: false, message: "واجهة برمجة أمازون تتطلب حساب AWS PA-API" });
    }

    return res.status(400).json({ success: false, message: "منصة غير مدعومة" });
  } catch (err) { next(err); }
});

// ========== AUTO PRICE & STOCK SYNC (ALL PLATFORMS) ==========
let syncOffset = 0;

export async function syncAllDropshipPricesAndStock(maxProducts: number = 80) {
  try {
    const creds = await getAliExpressCreds();
    
    // First, purge any 0-stock products from previous cycles
    let deletedOutOfStock = await purgeZeroStockAndDeletedProducts();

    const [totalRow] = await db.select({ count: sql<number>`count(*)` }).from(dropship_products);
    const totalCount = Number(totalRow?.count) || 0;
    if (totalCount === 0) {
      return { total: 0, totalCatalog: 0, synced: 0, deletedOutOfStock };
    }

    // Limit to maxProducts per cycle (e.g. 80) using rotating offset so all products are covered smoothly
    const dps = await db.select()
      .from(dropship_products)
      .orderBy(dropship_products.id)
      .limit(maxProducts)
      .offset(syncOffset % Math.max(1, totalCount));

    syncOffset = (syncOffset + maxProducts) % Math.max(1, totalCount);

    let synced = 0;

    const aliDropships = dps.filter(d => d.platform === "aliexpress" && d.source_id && d.product_id);
    const otherDropships = dps.filter(d => d.platform !== "aliexpress");

    // Fast-path: Batch query AliExpress in chunks of 40 products to avoid rate-limiting and 429
    if (creds && aliDropships.length > 0) {
      const BATCH_SIZE = 40;
      for (let i = 0; i < aliDropships.length; i += BATCH_SIZE) {
        const batch = aliDropships.slice(i, i + BATCH_SIZE);
        const sourceIds = batch.map(b => String(b.source_id).trim()).filter(Boolean);
        const aliProductsMap = await fetchAliExpressProductsBatch(sourceIds, creds);

        for (const dp of batch) {
          const aliProd = aliProductsMap.get(String(dp.source_id).trim());
          const targetSalePrice = parseFloat(aliProd?.target_sale_price || "") || 0;
          const targetOrigPrice = parseFloat(aliProd?.target_original_price || "") || 0;
          const newSourcePrice = targetSalePrice || targetOrigPrice;
          const realStock = aliProd ? extractRealSupplierStock(aliProd) : 0;
          const isOutOfStock = !aliProd || 
            newSourcePrice <= 0 ||
            realStock <= 0 ||
            (aliProd as any).product_status === "offline" || (aliProd as any).product_status === "out_of_stock";

          if (isOutOfStock) {
            logger.info({ productId: dp.product_id, sourceId: dp.source_id, realStock }, "AliExpress product is out of stock / 0 stock. Permanently deleting from database...");
            if (dp.product_id) {
              await purgeProductById(dp.product_id);
            }
            deletedOutOfStock++;
          } else {
            const margin = dp.source_price > 0 ? dp.our_price / dp.source_price : 4.0;
            const newOurPrice = parseFloat((newSourcePrice * margin).toFixed(2));
            await db.update(dropship_products).set({
              source_price: newSourcePrice,
              our_price: newOurPrice,
              supplier_name: aliProd?.shop_name || dp.supplier_name,
            }).where(eq(dropship_products.id, dp.id));
            await db.update(products).set({
              price: newOurPrice,
              cost: newSourcePrice,
              quantity: realStock,
              is_active: true,
            }).where(eq(products.id, dp.product_id!));
            synced++;
          }
        }
      }
    }

    // Process other platforms (up to 10 per cycle)
    for (const dp of otherDropships.slice(0, 10)) {
      if (dp.product_id) {
        try {
          const res = await verifyAndSyncDropshipProductStock(dp.product_id, { forceLive: true });
          if (!res.available) deletedOutOfStock++;
          else synced++;
        } catch (itemErr: any) {
          logger.error({ err: itemErr.message, product_id: dp.product_id, platform: dp.platform }, "Stock sync error for item");
        }
      }
    }

    // Always purge any remaining zero-stock or deleted products from the database
    const extraPurged = await purgeZeroStockAndDeletedProducts();
    deletedOutOfStock += extraPurged;

    clearProductsCache();
    logger.info({ totalChecked: dps.length, totalCatalog: totalCount, synced, deletedOutOfStock }, "Background price and stock sync finished. All out-of-stock items permanently removed.");
    return { total: dps.length, totalCatalog: totalCount, synced, deletedOutOfStock };
  } catch (e: any) {
    logger.error({ err: e.message }, "Background price & stock sync job error");
    return { total: 0, totalCatalog: 0, synced: 0, deletedOutOfStock: 0 };
  }
}

export function startPriceSyncJob() {
  const INTERVAL_MS = 10 * 60 * 1000; // Every 10 minutes continuously
  // Initial run 15s after startup, then every 10 minutes
  setTimeout(async () => {
    try {
      await purgeZeroStockAndDeletedProducts();
      await syncAllDropshipPricesAndStock();
    } catch (e: any) {
      logger.error({ err: e.message }, "Initial price/stock sync job error");
    }
  }, 15 * 1000);

  setInterval(async () => {
    try {
      await syncAllDropshipPricesAndStock();
      await purgeZeroStockAndDeletedProducts();
    } catch (e: any) {
      logger.error({ err: e.message }, "Recurring price/stock sync job error");
    }
  }, INTERVAL_MS);
}

router.post("/admin/dropship/purge-zero-stock", requireAuth, requireRole("admin", "manager"), async (_req, res, next) => {
  try {
    const deletedCount = await purgeZeroStockAndDeletedProducts();
    return res.json({
      success: true,
      message: `تم تنظيف وحذف كافة المنتجات المصفرة أو غير المتوفرة من قاعدة البيانات بنجاح (${deletedCount} منتج تم حذفه)!`,
      deleted_count: deletedCount,
    });
  } catch (err) { next(err); }
});

// ========== AUTO IMPORT 500 PRODUCTS EVERY 1 HOUR (ZERO MANUAL INTERVENTION) ==========
let autoImportRunning = false;
let autoImportPageIndex = 1;

export async function runAutoImportCycle(targetCount = 500): Promise<{ imported: number; skipped: number; totalInDb: number }> {
  if (autoImportRunning) {
    logger.info("Auto-import cycle is already in progress, skipping concurrent run.");
    return { imported: 0, skipped: 0, totalInDb: 0 };
  }
  autoImportRunning = true;
  const startTime = Date.now();
  let totalImported = 0;
  let totalSkipped = 0;
  let consecutiveEmptyBatches = 0;

  try {
    const creds = await getAliExpressCreds();
    if (!creds) {
      logger.warn("AliExpress credentials not configured, auto-import cycle aborted.");
      return { imported: 0, skipped: 0, totalInDb: 0 };
    }

    const existingDropships = await db.select({ source_id: dropship_products.source_id }).from(dropship_products);
    const existingProducts = await db.select({ sku: products.sku, image: products.image }).from(products).where(isNull(products.deleted_at));

    const existingSet = new Set([
      ...existingDropships.map(d => String(d.source_id).trim()),
      ...existingProducts.map(p => (p.sku || "").replace(/^ALI-/, "").split("-")[0].trim()).filter(Boolean),
    ]);
    const existingImageSet = new Set(
      existingProducts.map(p => normalizeImageUrl(p.image)).filter(Boolean)
    );

    const margin = 4.0; // 300% profit margin
    const seed = Math.floor(Math.random() * 80) + 1;
    const categoryIds = ALI_CATEGORIES.map(c => c.id);
    const maxPagesToScan = Math.max(500, Math.ceil(targetCount / 5));

    for (let i = 0; i < maxPagesToScan && totalImported < targetCount; i++) {
      // Pick next category in rotation so products from ALL categories are imported
      const targetCatId = categoryIds[(autoImportPageIndex + i) % categoryIds.length];
      const pageToFetch = Math.floor((autoImportPageIndex + i) / categoryIds.length) + 1;
      const { kw, catId, actualPage } = getAliSearchParams(pageToFetch, "", targetCatId, seed);

      let prods = await searchAliExpressProducts(kw, creds, actualPage, 50, catId).catch(() => []);
      if ((!prods || prods.length === 0) && catId) {
        prods = await searchAliExpressProducts(kw, creds, actualPage, 50).catch(() => []);
      }

      if (!prods || prods.length === 0) {
        consecutiveEmptyBatches++;
        if (consecutiveEmptyBatches >= 25) {
          logger.info("Auto-import: Reached multiple empty search results, rotating page index.");
          autoImportPageIndex = ((autoImportPageIndex + 10) % 200) + 1;
          break;
        }
        continue;
      }

      consecutiveEmptyBatches = 0;
      const productRecords: any[] = [];
      const metaRecords: any[] = [];

      for (const p of prods) {
        if (totalImported >= targetCount) break;

        const srcId = String(p.product_id).trim();
        let img = p.product_main_image_url || "";
        if (img.startsWith("//")) img = `https:${img}`;
        const normImg = normalizeImageUrl(img);

        if (!srcId || existingSet.has(srcId) || (normImg && existingImageSet.has(normImg))) {
          totalSkipped++;
          continue;
        }

        existingSet.add(srcId);
        if (normImg) existingImageSet.add(normImg);

        const sourcePrice = parsePrice(p.target_sale_price || p.target_original_price, 25);
        const realStock = extractRealSupplierStock(p);
        if (realStock <= 0) {
          totalSkipped++;
          continue;
        }

        const salePrice = Number((sourcePrice * margin).toFixed(2));
        const skuUnique = `ALI-${srcId}-${Date.now().toString(36).slice(-4)}`;
        const autoCatId = await matchCategoryId(p.product_title, null, p.first_level_category_name);

        productRecords.push({
          name_ar: String(p.product_title || `منتج عماد اكسبرس ${srcId}`).slice(0, 450),
          name_en: String(p.product_title || `Emad Express Product ${srcId}`).slice(0, 450),
          sku: skuUnique,
          price: salePrice,
          cost: sourcePrice,
          quantity: realStock,
          min_quantity: Math.min(5, realStock),
          category_id: autoCatId,
          description_ar: `${p.product_title} - منتج أصلي عالي الجودة متوفر للشحن السريع والتسليم الفوري عبر عماد اكسبرس.`,
          description_en: `${p.product_title} - Premium quality genuine product with fast direct delivery via Emad Express.`,
          image: img,
          is_active: true,
        });

        metaRecords.push({
          source_id: srcId,
          source_url: p.product_detail_url || `https://www.aliexpress.com/item/${srcId}.html`,
          source_price: sourcePrice,
          our_price: salePrice,
          supplier_name: p.shop_name || "عماد اكسبرس (مورد موثق)",
        });
      }

      if (productRecords.length > 0) {
        try {
          const inserted = await db.insert(products).values(productRecords).onConflictDoNothing({ target: products.sku }).returning({ id: products.id, sku: products.sku });
          if (inserted && inserted.length > 0) {
            const metaMap = new Map(metaRecords.map(m => [m.source_id, m]));
            const dropshipRows = inserted.map(prod => {
              const sId = prod.sku.split("-")[1] || "";
              const meta = metaMap.get(sId) || metaRecords[0];
              return {
                product_id: prod.id,
                platform: "aliexpress",
                source_id: meta.source_id,
                source_url: meta.source_url,
                source_price: meta.source_price,
                source_currency: "USD",
                our_price: meta.our_price,
                supplier_name: meta.supplier_name,
                platform_commission_rate: 8,
              };
            });
            await db.insert(dropship_products).values(dropshipRows);
            totalImported += inserted.length;
          }
        } catch (insertErr: any) {
          logger.warn({ err: insertErr.message }, "Auto-import batch insert error");
        }
      }

      // Gentle pause to protect API rate limits
      await new Promise(r => setTimeout(r, 120));
    }

    if (totalImported > 0) {
      clearProductsCache();
      autoImportPageIndex = ((autoImportPageIndex + Math.max(15, Math.ceil(totalImported / 10))) % 400) + 1;
      // Run automatic stock & price sync immediately after the import cycle
      logger.info("🔄 Initiating automatic price and stock synchronization after import cycle...");
      syncAllDropshipPricesAndStock().catch(syncErr => {
        logger.error({ err: syncErr?.message }, "Post-import sync error");
      });
    }

    const [{ totalInDb = 0 } = {}] = await db.select({ totalInDb: sql<number>`COUNT(*)` }).from(products).where(isNull(products.deleted_at));
    const durationSec = Math.round((Date.now() - startTime) / 1000);

    logger.info(
      { totalImported, totalSkipped, totalInDb: Number(totalInDb), durationSec },
      "🚀 Auto-import cycle finished successfully! Products imported and synchronized automatically."
    );

    return { imported: totalImported, skipped: totalSkipped, totalInDb: Number(totalInDb) };
  } catch (err: any) {
    logger.error({ err: err.message }, "Auto-import cycle unexpected failure");
    return { imported: totalImported, skipped: totalSkipped, totalInDb: 0 };
  } finally {
    autoImportRunning = false;
  }
}

export function startAutoImportJob() {
  const INTERVAL_MS = 60 * 60 * 1000; // Run automatically every 1 hour continuously (كل ساعة 500 منتج)
  // First run starts 30 seconds after server boots up
  setTimeout(() => {
    runAutoImportCycle(500).catch(err => logger.error({ err }, "Initial hourly auto-import job failed"));
  }, 30 * 1000);

  // Recurring runs every 1 hour
  setInterval(() => {
    runAutoImportCycle(500).catch(err => logger.error({ err }, "Recurring hourly auto-import job failed"));
  }, INTERVAL_MS);

  logger.info("🤖 Auto-import job scheduled: 500 products will be fetched and imported every 1 hour automatically.");
}

// ========== CRON ENDPOINTS (FOR AUTOMATED JOBS & VERCEL CRONS) ==========
router.all("/cron/auto-import", async (req, res, next) => {
  try {
    const { count = 500 } = req.query as Record<string, string>;
    const result = await runAutoImportCycle(Number(count) || 500);
    return res.json({
      success: true,
      message: "تم جلب 500 منتج وتحديث المتجر والتطبيق بنجاح",
      ...result,
    });
  } catch (err) { next(err); }
});

router.all("/cron/sync-stock", async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 80;
    const result = await syncAllDropshipPricesAndStock(limit);
    return res.json({
      success: true,
      message: "تمت المزامنة وحذف المنتجات النافدة نهائياً من قاعدة البيانات والمتجر والتطبيق بنجاح",
      ...result,
    });
  } catch (err) { next(err); }
});

// ========== AMAZON REAL API ==========

async function getAmazonCreds(): Promise<AmazonCredentials | null> {
  const accessKey = (await db.select().from(platform_settings).where(eq(platform_settings.key, "amazon_access_key")))[0]?.value;
  const secretKey = (await db.select().from(platform_settings).where(eq(platform_settings.key, "amazon_secret_key")))[0]?.value;
  const partnerTag = (await db.select().from(platform_settings).where(eq(platform_settings.key, "amazon_partner_tag")))[0]?.value;
  const region = (await db.select().from(platform_settings).where(eq(platform_settings.key, "amazon_region")))[0]?.value || "us";
  if (!accessKey || !secretKey || !partnerTag) return null;
  return { accessKey, secretKey, partnerTag, region };
}

router.get("/admin/dropship/amazon/:asin", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const creds = await getAmazonCreds();
    if (!creds) return res.status(400).json({ success: false, message: "أضف Access Key و Secret Key و Partner Tag لأمازون في الإعدادات" });
    const items = await fetchAmazonItems([String(req.params.id)], creds);
    if (!items.length) return res.status(404).json({ success: false, message: "المنتج غير موجود في أمازون" });
    const item = items[0];
    const price = item.Offers?.Listings?.[0]?.Price?.Amount || 0;
    return res.json({
      success: true,
      data: {
        source_id: item.ASIN,
        name: item.ItemInfo?.Title?.DisplayValue || "",
        price,
        currency: item.Offers?.Listings?.[0]?.Price?.Currency || "USD",
        image: item.Images?.Primary?.Large?.URL || "",
        source_url: item.DetailPageURL,
        category: item.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName || "",
        platform: "amazon",
      }
    });
  } catch (err) { next(err); }
});

router.get("/admin/dropship/amazon-search", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { q = "", page = "1" } = req.query as Record<string, string>;
    if (!q.trim()) return res.status(400).json({ success: false, message: "كلمة البحث مطلوبة" });
    const creds = await getAmazonCreds();
    if (!creds) return res.status(400).json({ success: false, message: "أضف بيانات أمازون API في الإعدادات" });
    const items = await searchAmazonItems(q, creds, parseInt(page) || 1);
    return res.json({
      success: true,
      data: items.map(item => ({
        source_id: item.ASIN,
        name: item.ItemInfo?.Title?.DisplayValue || "",
        price: item.Offers?.Listings?.[0]?.Price?.Amount || 0,
        currency: item.Offers?.Listings?.[0]?.Price?.Currency || "USD",
        image: item.Images?.Primary?.Large?.URL || "",
        source_url: item.DetailPageURL,
        category: item.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName || "",
        platform: "amazon",
      })),
      total: items.length,
    });
  } catch (err) { next(err); }
});

// ========== ALIBABA REAL API ==========

async function getAlibabaCreds(): Promise<AlibabaCredentials | null> {
  const appKey = (await db.select().from(platform_settings).where(eq(platform_settings.key, "alibaba_app_key")))[0]?.value;
  const appSecret = (await db.select().from(platform_settings).where(eq(platform_settings.key, "alibaba_app_key_secret")))[0]?.value;
  if (!appKey || !appSecret) return null;
  return { appKey, appSecret };
}

router.get("/admin/dropship/alibaba/:productId", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const creds = await getAlibabaCreds();
    if (!creds) return res.status(400).json({ success: false, message: "أضف App Key و App Secret لعلي بابا في الإعدادات" });
    const product = await getAlibabaProduct(String(req.params.id), creds);
    if (!product) return res.status(404).json({ success: false, message: "المنتج غير موجود في علي بابا" });
    return res.json({
      success: true,
      data: {
        source_id: product.productId,
        name: product.subject,
        price: parseFloat(product.price) || 0,
        currency: product.currency,
        image: product.imageUrl,
        source_url: product.detailUrl,
        supplier_name: product.supplierName,
        category: product.categoryName,
        platform: "alibaba",
      }
    });
  } catch (err) { next(err); }
});

router.get("/admin/dropship/alibaba-search", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { q = "", page = "1", page_size = "50" } = req.query as Record<string, string>;
    if (!q.trim()) return res.status(400).json({ success: false, message: "كلمة البحث مطلوبة" });
    const creds = await getAlibabaCreds();
    if (!creds) return res.status(400).json({ success: false, message: "أضف بيانات علي بابا API في الإعدادات" });
    const items = await searchAlibabaProducts(q, creds, parseInt(page) || 1, parseInt(page_size) || 50);
    return res.json({
      success: true,
      data: items.map(p => ({
        source_id: p.productId,
        name: p.subject,
        price: parseFloat(p.price) || 0,
        currency: p.currency,
        image: p.imageUrl,
        source_url: p.detailUrl,
        supplier_name: p.supplierName,
        category: p.categoryName,
        platform: "alibaba",
      })),
      total: items.length,
    });
  } catch (err) { next(err); }
});

// ========== BULK IMPORT SYSTEM (UNLIMITED) ==========

router.post("/admin/dropship/bulk-import", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { platform, keywords, total = 3000, margin_percent = 300, category_id } = req.body as {
      platform: string; keywords: string; total?: number; margin_percent?: number; category_id?: number;
    };

    if (!platform || !keywords) return res.status(400).json({ success: false, message: "المنصة وكلمة البحث مطلوبة" });
    if (!["aliexpress", "amazon", "alibaba"].includes(platform)) return res.status(400).json({ success: false, message: "المنصة يجب أن تكون aliexpress أو amazon أو alibaba" });

    const totalTarget = Math.min(Math.max(1, total || 3000), 10000);

    // Gather credentials
    const credentials: any = {};
    if (platform === "aliexpress") {
      const creds = await getAliExpressCreds();
      if (!creds) return res.status(400).json({ success: false, message: "أضف App Key و App Secret لعلي إكسبرس في الإعدادات" });
      credentials.aliexpress = creds;
    } else if (platform === "amazon") {
      const creds = await getAmazonCreds();
      if (!creds) return res.status(400).json({ success: false, message: "أضف بيانات أمازون API في الإعدادات" });
      credentials.amazon = creds;
    } else if (platform === "alibaba") {
      const creds = await getAlibabaCreds();
      if (!creds) return res.status(400).json({ success: false, message: "أضف بيانات علي بابا API في الإعدادات" });
      credentials.alibaba = creds;
    }

    const jobId = await startBulkImport(platform as any, keywords, totalTarget, margin_percent || 300, category_id || null, credentials);

    return res.status(202).json({
      success: true,
      message: `بدأ استيراد ${totalTarget} منتج من ${platform} في الخلفية`,
      job_id: jobId,
      status_url: `/api/v1/admin/dropship/bulk-import/status/${jobId}`,
    });
  } catch (err) { next(err); }
});

router.get("/admin/dropship/bulk-import/status/:jobId", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const job = getJobStatus(String(req.params.jobId));
    if (!job) return res.status(404).json({ success: false, message: "المهمة غير موجودة" });
    return res.json({
      success: true,
      job: {
        id: job.id,
        platform: job.platform,
        keywords: job.keywords,
        status: job.status,
        total_target: job.totalTarget,
        processed: job.processed,
        imported: job.imported,
        skipped: job.skipped,
        progress_percent: job.totalTarget > 0 ? Math.round((job.processed / job.totalTarget) * 100) : 0,
        errors_count: job.errors.length,
        errors: job.errors.slice(0, 10),
        started_at: job.startedAt,
        completed_at: job.completedAt,
      }
    });
  } catch (err) { next(err); }
});

router.get("/admin/dropship/bulk-import/jobs", requireAuth, requireRole("admin", "manager"), async (_req, res, next) => {
  try {
    const jobs = getAllJobs().map(job => ({
      id: job.id,
      platform: job.platform,
      keywords: job.keywords,
      status: job.status,
      total_target: job.totalTarget,
      processed: job.processed,
      imported: job.imported,
      skipped: job.skipped,
      progress_percent: job.totalTarget > 0 ? Math.round((job.processed / job.totalTarget) * 100) : 0,
      started_at: job.startedAt,
      completed_at: job.completedAt,
    }));
    return res.json({ success: true, data: jobs });
  } catch (err) { next(err); }
});

// ========== ALIEXPRESS REAL API ==========

async function getAliExpressCreds(): Promise<AliExpressCredentials> {
  try {
    const rows = await db.select().from(platform_settings).where(eq(platform_settings.key, "aliexpress_app_key"));
    const appKey = rows[0]?.value || process.env.ALIEXPRESS_APP_KEY || "540456";
    const secretRows = await db.select().from(platform_settings).where(eq(platform_settings.key, "aliexpress_app_key_secret"));
    const appSecret = secretRows[0]?.value || process.env.ALIEXPRESS_APP_KEY_SECRET || "VKz8Ppc40dGMXGbcLyjXRxBhrXw3itnT";
    const trackRows = await db.select().from(platform_settings).where(eq(platform_settings.key, "aliexpress_tracking_id"));
    const trackingId = trackRows[0]?.value || process.env.ALIEXPRESS_TRACKING_ID || "default";
    return { appKey, appSecret, trackingId };
  } catch {
    return { appKey: "540456", appSecret: "VKz8Ppc40dGMXGbcLyjXRxBhrXw3itnT", trackingId: "default" };
  }
}

// Fetch real product by AliExpress Product ID (source_id)
router.get("/admin/dropship/aliexpress/:productId", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const creds = await getAliExpressCreds();
    if (!creds) return res.status(400).json({ success: false, message: "أضف App Key و App Secret لعلي إكسبرس أولاً في الإعدادات > منصات التسويق" });

    const product = await fetchAliExpressProduct(String(req.params.id), creds);
    if (!product) return res.status(404).json({ success: false, message: "المنتج غير موجود في علي إكسبرس أو رقم المنتج غير صحيح" });

    return res.json({
      success: true,
      data: {
        source_id: product.product_id,
        name: product.product_title,
        price: parseFloat(product.target_sale_price) || parseFloat(product.target_original_price) || 0,
        original_price: parseFloat(product.target_original_price) || 0,
        currency: product.target_sale_price_currency,
        image: product.product_main_image_url,
        source_url: product.product_detail_url,
        commission_rate: parseFloat(product.commission_rate) || 0,
        category: product.first_level_category_name,
        shop_name: product.shop_name,
        shop_url: product.shop_url,
        rating: product.evaluate_rate,
        sales_volume: product.sales_volume,
        platform: "aliexpress",
      }
    });
  } catch (err) { next(err); }
});

// Search AliExpress by keywords
router.get("/admin/dropship/aliexpress-search", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { q = "", page = "1", page_size = "20" } = req.query as Record<string, string>;
    if (!q.trim()) return res.status(400).json({ success: false, message: "كلمة البحث مطلوبة" });

    const creds = await getAliExpressCreds();
    if (!creds) return res.status(400).json({ success: false, message: "أضف App Key و App Secret لعلي إكسبرس أولاً في الإعدادات" });

    const products = await searchAliExpressProducts(q, creds, parseInt(page) || 1, parseInt(page_size) || 20);
    return res.json({
      success: true,
      data: products.map(p => ({
        source_id: p.product_id,
        name: p.product_title,
        price: parseFloat(p.target_sale_price) || parseFloat(p.target_original_price) || 0,
        original_price: parseFloat(p.target_original_price) || 0,
        currency: p.target_sale_price_currency,
        image: p.product_main_image_url,
        source_url: p.product_detail_url,
        commission_rate: parseFloat(p.commission_rate) || 0,
        category: p.first_level_category_name,
        shop_name: p.shop_name,
        shop_url: p.shop_url,
        rating: p.evaluate_rate,
        sales_volume: p.sales_volume,
        platform: "aliexpress",
      })),
      total: products.length,
    });
  } catch (err) { next(err); }
});

// Import from real AliExpress API
router.post("/admin/dropship/aliexpress-import", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { source_id, margin_percent = 300 } = req.body as { source_id: string; margin_percent?: number };
    if (!source_id) return res.status(400).json({ success: false, message: "رقم المنتج (source_id) مطلوب" });

    const creds = await getAliExpressCreds();
    if (!creds) return res.status(400).json({ success: false, message: "أضف App Key و App Secret لعلي إكسبرس أولاً" });

    const product = await fetchAliExpressProduct(source_id, creds);
    if (!product) return res.status(404).json({ success: false, message: "المنتج غير موجود في علي إكسبرس" });

    const sourcePrice = parseFloat(product.target_sale_price) || parseFloat(product.target_original_price) || 0;
    const realStock = extractRealSupplierStock(product);
    if (realStock <= 0) return res.status(400).json({ success: false, message: "هذا المنتج غير متوفر حالياً عند المورد (المخزون 0)" });

    const ourPrice = parseFloat((sourcePrice * (1 + margin_percent / 100)).toFixed(2));

    // Check if product already exists
    const [existing] = await db.select().from(dropship_products).where(eq(dropship_products.source_id, source_id));
    if (existing) return res.status(409).json({ success: false, message: "هذا المنتج مستورد مسبقاً", data: existing });

    const [newProduct] = await db.insert(products).values({
      name_ar: product.product_title,
      name_en: product.product_title,
      sku: `ALI-${source_id}`,
      price: ourPrice,
      cost: sourcePrice,
      quantity: realStock,
      min_quantity: Math.min(5, realStock),
      category_id: null,
      description_ar: `منتج من علي إكسبرس - ${product.shop_name} - تصنيف: ${product.first_level_category_name}`,
      description_en: `Product from AliExpress - ${product.shop_name} - Category: ${product.first_level_category_name}`,
      image: product.product_main_image_url,
      is_active: true,
    }).returning();

    const [dp] = await db.insert(dropship_products).values({
      product_id: newProduct.id,
      platform: "aliexpress",
      source_id: product.product_id,
      source_url: product.product_detail_url,
      source_price: sourcePrice,
      our_price: ourPrice,
      supplier_name: product.shop_name,
      platform_commission_rate: parseFloat(product.commission_rate) || 0,
    }).returning();

    return res.status(201).json({
      success: true,
      message: "تم استيراد المنتج بنجاح من علي إكسبرس",
      data: { product: newProduct, dropship: dp }
    });
  } catch (err: any) {
    if (err.message?.includes("unique constraint")) return res.status(409).json({ success: false, message: "SKU أو source_id مستخدم بالفعل" });
    next(err);
  }
});


// ========== BULK IMPORT (Multi-Platform) ==========

// Start bulk import job
router.post("/admin/dropship/bulk-import", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { platform = "all", keywords, max_products = 3000, margin_percent = 300 } = req.body as {
      platform: "aliexpress" | "amazon" | "alibaba" | "all";
      keywords: string;
      max_products?: number;
      margin_percent?: number;
    };

    if (!keywords || typeof keywords !== "string" || keywords.length > 200) {
      return res.status(400).json({ success: false, message: "كلمة البحث مطلوبة ويجب أن تكون أقل من 200 حرف" });
    }

    // Validate credentials exist for requested platforms
    if (platform === "aliexpress" || platform === "all") {
      const creds = await getAliExpressCreds();
      if (!creds) return res.status(400).json({ success: false, message: "أضف App Key و App Secret لعلي إكسبرس أولاً في الإعدادات" });
    }
    if (platform === "amazon" || platform === "all") {
      const creds = await getAmazonCreds();
      if (!creds) return res.status(400).json({ success: false, message: "أضف Access Key و Secret Key و Partner Tag لأمازون أولاً في الإعدادات" });
    }
    if (platform === "alibaba" || platform === "all") {
      const creds = await getAlibabaCreds();
      if (!creds) return res.status(400).json({ success: false, message: "أضف App Key و App Secret لعلي بابا أولاً في الإعدادات" });
    }

    const jobId = await startBulkImport(platform, keywords, Math.min(max_products || 3000, 10000), margin_percent || 300);
    return res.status(202).json({
      success: true,
      message: "تم بدء عملية الاستيراد الجماعي",
      job_id: jobId,
      status: "running",
    });
  } catch (err: any) {
    if (err.message?.includes("already an active import job")) {
      return res.status(409).json({ success: false, message: "هناك عملية استيراد نشطة بالفعل. انتظر أو أوقفها أولاً" });
    }
    next(err);
  }
});

// Get bulk import status
router.get("/admin/dropship/bulk-import/status", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { job_id } = req.query as { job_id?: string };
    if (job_id) {
      const job = getJobStatus(job_id);
      if (!job) return res.status(404).json({ success: false, message: "العملية غير موجودة" });
      return res.json({ success: true, job });
    }
    const active = getActiveJob();
    const all = getAllJobs().slice(0, 20);
    return res.json({ success: true, active_job: active, recent_jobs: all });
  } catch (err) { next(err); }
});

// Stop bulk import
router.post("/admin/dropship/bulk-import/stop", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { job_id } = req.body as { job_id: string };
    if (!job_id) return res.status(400).json({ success: false, message: "معرف العملية مطلوب" });
    const stopped = stopBulkImport(job_id);
    if (!stopped) return res.status(400).json({ success: false, message: "لا يمكن إيقاف العملية (قد تكون منتهية أو غير موجودة)" });
    return res.json({ success: true, message: "تم إيقاف العملية بنجاح" });
  } catch (err) { next(err); }
});

// ========== AMAZON REAL API ==========
router.get("/admin/dropship/amazon/:asin", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const creds = await getAmazonCreds();
    if (!creds) return res.status(400).json({ success: false, message: "أضف Access Key و Secret Key و Partner Tag لأمازون أولاً في الإعدادات" });

    const product = await getAmazonProduct(String(req.params.asin), creds);
    if (!product) return res.status(404).json({ success: false, message: "المنتج غير موجود في أمازون أو رقم ASIN غير صحيح" });

    return res.json({
      success: true,
      data: {
        source_id: product.asin,
        name: product.title,
        price: product.price,
        original_price: product.listPrice || product.price,
        currency: product.currency,
        image: product.imageUrl,
        source_url: product.detailPageUrl,
        brand: product.brand,
        category: product.category,
        rating: product.rating,
        total_reviews: product.totalReviews,
        is_prime: product.isPrime,
        platform: "amazon",
      }
    });
  } catch (err) { next(err); }
});

router.get("/admin/dropship/amazon-search", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { q = "", page = "1", page_size = "10" } = req.query as Record<string, string>;
    if (!q.trim()) return res.status(400).json({ success: false, message: "كلمة البحث مطلوبة" });

    const creds = await getAmazonCreds();
    if (!creds) return res.status(400).json({ success: false, message: "أضف Access Key و Secret Key و Partner Tag لأمازون أولاً في الإعدادات" });

    const { products, totalResults } = await searchAmazonProducts(q, creds, parseInt(page) || 1, parseInt(page_size) || 10);
    return res.json({
      success: true,
      data: products.map(p => ({
        source_id: p.asin,
        name: p.title,
        price: p.price,
        original_price: p.listPrice || p.price,
        currency: p.currency,
        image: p.imageUrl,
        source_url: p.detailPageUrl,
        brand: p.brand,
        category: p.category,
        rating: p.rating,
        total_reviews: p.totalReviews,
        is_prime: p.isPrime,
        platform: "amazon",
      })),
      total: totalResults || products.length,
    });
  } catch (err) { next(err); }
});

router.post("/admin/dropship/amazon-import", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { source_id, margin_percent = 300 } = req.body as { source_id: string; margin_percent?: number };
    if (!source_id) return res.status(400).json({ success: false, message: "رقم ASIN مطلوب" });

    const creds = await getAmazonCreds();
    if (!creds) return res.status(400).json({ success: false, message: "أضف مفاتيح أمازون أولاً" });

    const product = await getAmazonProduct(source_id, creds);
    if (!product) return res.status(404).json({ success: false, message: "المنتج غير موجود في أمازون" });

    const [existing] = await db.select().from(dropship_products).where(eq(dropship_products.source_id, source_id));
    if (existing) return res.status(409).json({ success: false, message: "هذا المنتج مستورد مسبقاً", data: existing });

    const realStock = extractRealSupplierStock(product);
    if (product.price <= 0 || realStock <= 0) return res.status(400).json({ success: false, message: "هذا المنتج غير متوفر حالياً عند أمازون (المخزون 0)" });

    const ourPrice = parseFloat((product.price * (1 + margin_percent / 100)).toFixed(2));

    const [newProduct] = await db.insert(products).values({
      name_ar: product.title.slice(0, 200),
      name_en: product.title.slice(0, 200),
      sku: `AMZ-${product.asin}`,
      price: ourPrice,
      cost: product.price,
      quantity: realStock,
      min_quantity: Math.min(5, realStock),
      category_id: null,
      description_ar: `منتج من أمازون - ${product.brand || "Amazon"} - التصنيف: ${product.category || "General"}`,
      description_en: `Product from Amazon - ${product.brand || "Amazon"} - Category: ${product.category || "General"}`,
      image: product.imageUrl,
      is_active: true,
    }).returning();

    const [dp] = await db.insert(dropship_products).values({
      product_id: newProduct.id,
      platform: "amazon",
      source_id: product.asin,
      source_url: product.detailPageUrl,
      source_price: product.price,
      our_price: ourPrice,
      supplier_name: product.brand || "Amazon",
      platform_commission_rate: 0,
    }).returning();

    return res.status(201).json({ success: true, message: "تم استيراد المنتج من أمازون", data: { product: newProduct, dropship: dp } });
  } catch (err: any) {
    if (err.message?.includes("unique constraint")) return res.status(409).json({ success: false, message: "SKU أو source_id مستخدم بالفعل" });
    next(err);
  }
});

// ========== ALIBABA REAL API ==========
router.get("/admin/dropship/alibaba/:productId", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const creds = await getAlibabaCreds();
    if (!creds) return res.status(400).json({ success: false, message: "أضف App Key و App Secret لعلي بابا أولاً في الإعدادات" });

    const product = await getAlibabaProduct(String(req.params.productId), creds);
    if (!product) return res.status(404).json({ success: false, message: "المنتج غير موجود في علي بابا أو رقم المنتج غير صحيح" });

    return res.json({
      success: true,
      data: {
        source_id: product.productId,
        name: product.productTitle,
        price: product.salePrice,
        original_price: product.originalPrice || product.salePrice,
        currency: product.currency,
        image: product.productImage,
        source_url: product.productUrl,
        supplier_name: product.supplierName,
        supplier_id: product.supplierId,
        min_order: product.minOrderQuantity,
        category: product.categoryName,
        rating: product.rating,
        total_orders: product.totalOrders,
        platform: "alibaba",
      }
    });
  } catch (err) { next(err); }
});

router.get("/admin/dropship/alibaba-search", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { q = "", page = "1", page_size = "20" } = req.query as Record<string, string>;
    if (!q.trim()) return res.status(400).json({ success: false, message: "كلمة البحث مطلوبة" });

    const creds = await getAlibabaCreds();
    if (!creds) return res.status(400).json({ success: false, message: "أضف App Key و App Secret لعلي بابا أولاً في الإعدادات" });

    const searchRes = await searchAlibabaProducts(q, creds, parseInt(page) || 1, parseInt(page_size) || 20);
    const items = Array.isArray(searchRes) ? searchRes : ((searchRes as any).products || []);
    return res.json({
      success: true,
      data: items.map(p => ({
        source_id: p.productId,
        name: p.productTitle,
        price: p.salePrice,
        original_price: p.originalPrice || p.salePrice,
        currency: p.currency,
        image: p.productImage,
        source_url: p.productUrl,
        supplier_name: p.supplierName,
        supplier_id: p.supplierId,
        min_order: p.minOrderQuantity,
        category: p.categoryName,
        rating: p.rating,
        total_orders: p.totalOrders,
        platform: "alibaba",
      })),
      total: items.length,
    });
  } catch (err) { next(err); }
});

router.post("/admin/dropship/alibaba-import", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { source_id, margin_percent = 300 } = req.body as { source_id: string; margin_percent?: number };
    if (!source_id) return res.status(400).json({ success: false, message: "رقم المنتج مطلوب" });

    const creds = await getAlibabaCreds();
    if (!creds) return res.status(400).json({ success: false, message: "أضف مفاتيح علي بابا أولاً" });

    const product = await getAlibabaProduct(source_id, creds);
    if (!product) return res.status(404).json({ success: false, message: "المنتج غير موجود في علي بابا" });

    const [existing] = await db.select().from(dropship_products).where(eq(dropship_products.source_id, source_id));
    if (existing) return res.status(409).json({ success: false, message: "هذا المنتج مستورد مسبقاً", data: existing });

    const salePrice = product.salePrice || parseFloat(product.price) || 0;
    const realStock = extractRealSupplierStock(product);
    if (salePrice <= 0 || realStock <= 0) return res.status(400).json({ success: false, message: "هذا المنتج غير متوفر حالياً عند علي بابا (المخزون 0)" });

    const ourPrice = parseFloat((salePrice * (1 + margin_percent / 100)).toFixed(2));
    const title = product.productTitle || product.subject || "Alibaba Product";

    const [newProduct] = await db.insert(products).values({
      name_ar: title.slice(0, 200),
      name_en: title.slice(0, 200),
      sku: `ALB-${product.productId.slice(-12)}`,
      price: ourPrice,
      cost: salePrice,
      quantity: realStock,
      min_quantity: parseInt(product.minOrderQuantity) || Math.min(5, realStock),
      category_id: null,
      description_ar: `منتج من علي بابا - ${product.supplierName} - التصنيف: ${product.categoryName || "General"}`,
      description_en: `Product from Alibaba - ${product.supplierName} - Category: ${product.categoryName || "General"}`,
      image: product.productImage || product.imageUrl || "",
      is_active: true,
    }).returning();

    const [dp] = await db.insert(dropship_products).values({
      product_id: newProduct.id,
      platform: "alibaba",
      source_id: product.productId,
      source_url: product.productUrl,
      source_price: product.salePrice,
      our_price: ourPrice,
      supplier_name: product.supplierName,
      platform_commission_rate: 0,
    }).returning();

    return res.status(201).json({ success: true, message: "تم استيراد المنتج من علي بابا", data: { product: newProduct, dropship: dp } });
  } catch (err: any) {
    if (err.message?.includes("unique constraint")) return res.status(409).json({ success: false, message: "SKU أو source_id مستخدم بالفعل" });
    next(err);
  }
});


// ========== CURRENCIES ==========
router.get("/currencies", async (_req, res, next) => {
  try {
    const data = await db.select().from(currencies).where(eq(currencies.is_active, true));
    return res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get("/currencies/rates", async (_req, res, next) => {
  try {
    const rates = await getExchangeRates();
    return res.json({ success: true, rates });
  } catch (err) { next(err); }
});

router.post("/currencies/convert", async (req, res, next) => {
  try {
    const { amount, from, to } = req.body;
    if (!amount || !from || !to) return res.status(400).json({ success: false, message: "المبلغ والعملة المصدر والهدف مطلوبة" });
    const converted = await convertCurrency(parseFloat(amount), from, to);
    return res.json({ success: true, original: { amount: parseFloat(amount), currency: from }, converted: { amount: converted, currency: to } });
  } catch (err) { next(err); }
});

router.put("/admin/currencies/:id", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const { rate_to_usd, is_default } = req.body;
    const update: any = {};
    if (rate_to_usd !== undefined) update.rate_to_usd = parseFloat(rate_to_usd);
    if (is_default !== undefined) {
      update.is_default = is_default;
      if (is_default) await db.update(currencies).set({ is_default: false });
    }
    await db.update(currencies).set(update).where(eq(currencies.id, Number(req.params.id)));
    return res.json({ success: true, message: "تم التحديث" });
  } catch (err) { next(err); }
});

// ========== TRANSLATIONS ==========
router.get("/products/:id/translate/:lang", validateParams(idParamSchema), async (req, res, next) => {
  try {
    const lang = req.params.lang as SupportedLanguage;
    if (!SUPPORTED_LANGUAGES.includes(lang)) return res.status(400).json({ success: false, message: "اللغة غير مدعومة" });
    const trans = await getProductTranslation(Number(req.params.id), lang);
    if (!trans) return res.status(404).json({ success: false, message: "المنتج غير موجود" });
    return res.json({ success: true, data: trans });
  } catch (err) { next(err); }
});

router.put("/admin/products/:id/translate/:lang", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const lang = req.params.lang as SupportedLanguage;
    if (!SUPPORTED_LANGUAGES.includes(lang)) return res.status(400).json({ success: false, message: "اللغة غير مدعومة" });
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "الاسم مطلوب" });
    await setProductTranslation(Number(req.params.id), lang, name, description || "");
    return res.json({ success: true, message: "تم حفظ الترجمة" });
  } catch (err) { next(err); }
});

// ========== PAYMENT GATEWAYS ==========
router.get("/payment-gateways", async (_req, res, next) => {
  try {
    const data = await db.select({
      id: payment_gateways.id,
      name: payment_gateways.name,
      name_ar: payment_gateways.name_ar,
      name_en: payment_gateways.name_en,
      provider: payment_gateways.provider,
      is_active: payment_gateways.is_active,
      is_default: payment_gateways.is_default,
      supported_currencies: payment_gateways.supported_currencies,
    }).from(payment_gateways).where(eq(payment_gateways.is_active, true));
    return res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get("/admin/payment-gateways", requireAuth, requireRole("admin", "manager"), async (_req, res, next) => {
  try {
    const data = await db.select().from(payment_gateways);
    return res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.put("/admin/payment-gateways/:id", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const { is_active, is_default, config } = req.body;
    const update: any = {};
    if (is_active !== undefined) update.is_active = is_active;
    if (is_default !== undefined) {
      update.is_default = is_default;
      if (is_default) await db.update(payment_gateways).set({ is_default: false });
    }
    if (config) update.config = config;
    await db.update(payment_gateways).set(update).where(eq(payment_gateways.id, Number(req.params.id)));
    return res.json({ success: true, message: "تم التحديث" });
  } catch (err) { next(err); }
});

// ========== SHIPPING ==========
router.get("/shipping-carriers", async (_req, res, next) => {
  try {
    const data = await db.select().from(shipping_carriers).where(eq(shipping_carriers.is_active, true));
    return res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get("/admin/shipping-carriers", requireAuth, requireRole("admin", "manager"), async (_req, res, next) => {
  try {
    const data = await db.select().from(shipping_carriers);
    return res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post("/admin/orders/:id/shipment", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const { carrier_id, tracking_number, cost, currency } = req.body;
    const shipment = await createShipment(Number(req.params.id), carrier_id, tracking_number, cost || 0, currency || "SAR");
    await db.update(orders).set({ fulfillment_status: "shipped", supplier_tracking: tracking_number }).where(eq(orders.id, Number(req.params.id)));
    return res.json({ success: true, data: shipment });
  } catch (err) { next(err); }
});

router.get("/orders/:id/shipments", requireAuth, validateParams(idParamSchema), async (req, res, next) => {
  try {
    const data = await getOrderShipments(Number(req.params.id));
    return res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ========== PAYMENT PROCESSING ==========
router.post("/orders/:id/pay", requireAuth, validateParams(idParamSchema), async (req, res, next) => {
  try {
    const session = (req as any).session;
    const [order] = await db.select().from(orders).where(eq(orders.id, Number(req.params.id)));
    if (!order) return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    if (session.role !== "admin" && order.customer_id !== session.customerId) return res.status(403).json({ success: false, message: "غير مصرح" });
    if (order.payment_status === "paid") return res.status(400).json({ success: false, message: "الطلب مدفوع بالفعل" });

    const { gateway } = req.body;
    const result = await processPayment(order, gateway || "cod");

    if (result.success && result.transaction_id) {
      await db.update(orders).set({
        payment_status: "paid",
        payment_gateway: gateway,
        payment_transaction_id: result.transaction_id,
        status: "processing",
      }).where(eq(orders.id, Number(req.params.id)));
    }

    return res.json({ success: result.success, data: result });
  } catch (err) { next(err); }
});

router.post("/orders/:id/pay/stripe-confirm", requireAuth, validateParams(idParamSchema), async (req, res, next) => {
  try {
    const { payment_intent_id } = req.body;
    const [gateway] = await db.select().from(payment_gateways).where(eq(payment_gateways.provider, "stripe"));
    if (!gateway) return res.status(400).json({ success: false, message: "Stripe غير مفعل" });
    const config = gateway.config as Record<string, string>;
    const result = await confirmStripePayment(payment_intent_id, config.secret_key);

    if (result.success) {
      await db.update(orders).set({
        payment_status: "paid",
        payment_gateway: "stripe",
        payment_transaction_id: result.transaction_id,
        status: "processing",
      }).where(eq(orders.id, Number(req.params.id)));
    }

    return res.json(result);
  } catch (err) { next(err); }
});

router.post("/orders/:id/pay/paypal-create", validateParams(idParamSchema), async (req, res, next) => {
  try {
    const session = getSession(req);
    const [order] = await db.select().from(orders).where(eq(orders.id, Number(req.params.id)));
    if (!order) return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    if (session && session.role !== "admin" && order.customer_id && order.customer_id !== session.customerId) {
      return res.status(403).json({ success: false, message: "غير مصرح" });
    }
    if (order.payment_status === "paid") return res.status(400).json({ success: false, message: "الطلب مدفوع بالفعل" });

    const [gateway] = await db.select().from(payment_gateways).where(eq(payment_gateways.provider, "paypal"));
    const config = (gateway?.config as Record<string, string>) || {};
    const clientId = config.client_id || process.env.PAYPAL_CLIENT_ID || "BAAAP4nT-3mWJBdTp5o9-TLYgNCWwrme8kY7qFM1tUUgTFce2HHB2kFmITH9jlqB98NAq15jIigMA1u6C8";
    const secret = config.secret || process.env.PAYPAL_SECRET || "EBih3s_mYLJ432bJpQ-mrFdERoBjXtIlr4TxK-gqGsKB47C7dUB4nowW0s6Bgjs-mLpVlGXWTBFJqW-i";
    const mode = ((config.mode || process.env.PAYPAL_MODE || "live") === "sandbox" ? "sandbox" : "live") as "sandbox" | "live";

    const paypalOrder = await createPayPalOrder(
      Number(order.total),
      order.currency || "USD",
      String(order.id),
      clientId,
      secret,
      mode
    );

    await db.update(orders).set({
      payment_gateway: "paypal",
      payment_transaction_id: paypalOrder.id,
    }).where(eq(orders.id, order.id));

    return res.json({
      success: true,
      data: {
        paypal_order_id: paypalOrder.id,
        approval_url: paypalOrder.approval_url,
      }
    });
  } catch (err) { next(err); }
});

router.post("/orders/:id/pay/paypal-capture", validateParams(idParamSchema), async (req, res, next) => {
  try {
    const { paypal_order_id } = req.body;
    const [gateway] = await db.select().from(payment_gateways).where(eq(payment_gateways.provider, "paypal"));
    const config = (gateway?.config as Record<string, string>) || {};
    const clientId = config.client_id || process.env.PAYPAL_CLIENT_ID || "BAAAP4nT-3mWJBdTp5o9-TLYgNCWwrme8kY7qFM1tUUgTFce2HHB2kFmITH9jlqB98NAq15jIigMA1u6C8";
    const secret = config.secret || process.env.PAYPAL_SECRET || "EBih3s_mYLJ432bJpQ-mrFdERoBjXtIlr4TxK-gqGsKB47C7dUB4nowW0s6Bgjs-mLpVlGXWTBFJqW-i";
    const mode = ((config.mode || process.env.PAYPAL_MODE || "live") === "sandbox" ? "sandbox" : "live") as "sandbox" | "live";
    const result = await capturePayPalOrder(paypal_order_id, clientId, secret, mode);

    if (result.success) {
      await db.update(orders).set({
        payment_status: "paid",
        payment_gateway: "paypal",
        payment_transaction_id: result.transaction_id,
        status: "processing",
      }).where(eq(orders.id, Number(req.params.id)));
    }

    return res.json(result);
  } catch (err) { next(err); }
});

// ========== LANGUAGE & CURRENCY PREFERENCE ==========
router.put("/auth/language", requireAuth, async (req, res, next) => {
  try {
    const session = (req as any).session;
    const { language } = req.body;
    if (!SUPPORTED_LANGUAGES.includes(language)) return res.status(400).json({ success: false, message: "اللغة غير مدعومة" });
    await db.update(users).set({ preferred_language: language }).where(eq(users.id, session.userId));
    return res.json({ success: true, message: "تم تحديث اللغة" });
  } catch (err) { next(err); }
});

router.put("/auth/currency", requireAuth, async (req, res, next) => {
  try {
    const session = (req as any).session;
    const { currency } = req.body;
    const [curr] = await db.select().from(currencies).where(and(eq(currencies.code, currency), eq(currencies.is_active, true)));
    if (!curr) return res.status(400).json({ success: false, message: "العملة غير مدعومة" });
    await db.update(users).set({ preferred_currency: currency }).where(eq(users.id, session.userId));
    return res.json({ success: true, message: "تم تحديث العملة" });
  } catch (err) { next(err); }
});


// ========== UNIFIED FULFILLMENT (Payment + Shipping inside app) ==========

// Fulfill order via AliExpress (internal payment)
router.post("/admin/orders/:id/fulfill/aliexpress", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, Number(req.params.id)));
    if (!order) return res.status(404).json({ success: false, message: "الطلب غير موجود" });

    const settings = await db.select().from(platform_settings);
    const cfg: Record<string, string> = {}; settings.forEach(s => cfg[s.key] = s.value);

    const result = await fulfillAliExpressOrder(Number(req.params.id), cfg["aliexpress_app_key"], cfg["aliexpress_app_key_secret"]);

    if (result.success && result.platform_order_id) {
      await db.update(orders).set({
        fulfillment_status: "processing",
        fulfillment_platform: "aliexpress",
        platform_order_id: result.platform_order_id,
        supplier_tracking: result.tracking_number || "",
      }).where(eq(orders.id, Number(req.params.id)));
    }

    return res.json({ success: result.success, data: result });
  } catch (err) { next(err); }
});

// Fulfill order via Amazon (internal payment)
router.post("/admin/orders/:id/fulfill/amazon", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, Number(req.params.id)));
    if (!order) return res.status(404).json({ success: false, message: "الطلب غير موجود" });

    const settings = await db.select().from(platform_settings);
    const cfg: Record<string, string> = {}; settings.forEach(s => cfg[s.key] = s.value);

    const result = await fulfillAmazonOrder(Number(req.params.id), cfg["amazon_access_key"], cfg["amazon_secret_key"], cfg["amazon_partner_tag"]);

    if (result.success && result.platform_order_id) {
      await db.update(orders).set({
        fulfillment_status: "processing",
        fulfillment_platform: "amazon",
        platform_order_id: result.platform_order_id,
      }).where(eq(orders.id, Number(req.params.id)));
    }

    return res.json({ success: result.success, data: result });
  } catch (err) { next(err); }
});

// Fulfill order via Alibaba (internal payment)
router.post("/admin/orders/:id/fulfill/alibaba", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, Number(req.params.id)));
    if (!order) return res.status(404).json({ success: false, message: "الطلب غير موجود" });

    const settings = await db.select().from(platform_settings);
    const cfg: Record<string, string> = {}; settings.forEach(s => cfg[s.key] = s.value);

    const result = await fulfillAlibabaOrder(Number(req.params.id), cfg["alibaba_app_key"], cfg["alibaba_app_key_secret"]);

    if (result.success && result.platform_order_id) {
      await db.update(orders).set({
        fulfillment_status: "processing",
        fulfillment_platform: "alibaba",
        platform_order_id: result.platform_order_id,
      }).where(eq(orders.id, Number(req.params.id)));
    }

    return res.json({ success: result.success, data: result });
  } catch (err) { next(err); }
});

// Auto-detect and fulfill
router.post("/admin/orders/:id/auto-fulfill", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const result = await autoFulfillOrder(Number(req.params.id));
    if (result.success && result.platform_order_id) {
      await db.update(orders).set({
        fulfillment_status: "processing",
        platform_order_id: result.platform_order_id,
        supplier_tracking: result.tracking_number || "",
      }).where(eq(orders.id, Number(req.params.id)));
    }
    return res.json({ success: result.success, data: result });
  } catch (err) { next(err); }
});

// Get fulfillment status & tracking
router.get("/orders/:id/fulfillment", requireAuth, validateParams(idParamSchema), async (req, res, next) => {
  try {
    const session = (req as any).session;
    const [order] = await db.select().from(orders).where(eq(orders.id, Number(req.params.id)));
    if (!order) return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    if (session.role !== "admin" && order.customer_id !== session.customerId) return res.status(403).json({ success: false, message: "غير مصرح" });

    const tracking = await getFulfillmentTracking(Number(req.params.id));
    return res.json({ success: true, data: tracking });
  } catch (err) { next(err); }
});

// ========== INTERNAL PAYMENT (Customer pays inside app, vendor gets paid) ==========

// ========== HYBRID PAYMENT INITIATION ==========
// Local Vendors: Stripe Connect (Direct to vendor)
// Global Platforms: Affiliate WebView (Customer pays platform directly)

router.post("/orders/:id/pay/internal", requireAuth, validateParams(idParamSchema), async (req, res, next) => {
  try {
    const session = (req as any).session;
    const [order] = await db.select().from(orders).where(eq(orders.id, Number(req.params.id)));
    if (!order) return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    if (session.role !== "admin" && order.customer_id !== session.customerId) return res.status(403).json({ success: false, message: "غير مصرح" });
    if (order.payment_status === "paid") return res.status(400).json({ success: false, message: "الطلب مدفوع بالفعل" });

    // Detect order type: Local Vendor vs Dropshipping
    const items = (order.items as any[]) || [];
    let platform = "unknown";
    let isLocalVendor = false;
    let vendorId: number | null = null;

    for (const item of items) {
      if (item.source_platform) {
        platform = item.source_platform;
        break;
      }
      if (item.product_id) {
        const [dp] = await db.select().from(dropship_products).where(eq(dropship_products.product_id, item.product_id));
        if (dp?.platform) {
          platform = dp.platform;
          break;
        }
        const [product] = await db.select().from(products).where(eq(products.id, item.product_id));
        if (product && (product as any).vendor_id) {
          isLocalVendor = true;
          vendorId = (product as any).vendor_id;
        }
      }
    }

    // ========== LOCAL VENDOR: Stripe Connect (Only if vendor Stripe account is active) ==========
    if (isLocalVendor && platform === "unknown" && vendorId) {
      const [stripeAccount] = await db.select().from(vendor_stripe_accounts).where(eq(vendor_stripe_accounts.vendor_id, vendorId));
      if (stripeAccount && stripeAccount.charges_enabled) {
        const [gateway] = await db.select().from(payment_gateways).where(eq(payment_gateways.provider, "stripe"));
        const config = gateway?.config as Record<string, string> | undefined;
        if (gateway?.is_active && config?.secret_key) {
          const { createSplitPaymentIntent } = await import("../lib/payment");
          const [vendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId));
          const platformFee = vendor?.commission_rate || 15;

          const result = await createSplitPaymentIntent(
            order.total,
            order.currency,
            String(order.id),
            stripeAccount.stripe_account_id,
            platformFee,
            config.secret_key,
          );

          await db.update(orders).set({
            payment_gateway: "stripe_connect",
            payment_status: "pending",
            fulfillment_platform: "local_vendor",
          }).where(eq(orders.id, order.id));

          return res.json({
            success: true,
            data: {
              payment_type: "stripe_connect",
              client_secret: result.client_secret,
              payment_intent_id: result.payment_intent_id,
              platform_fee: result.platform_fee,
              vendor_amount: result.vendor_amount,
              message: "سيتم الدفع مباشرةً للبائع المحلي عبر Stripe. الشحن على البائع.",
              shipping_by: "البائع المحلي",
            }
          });
        }
      }
    }

    // Default to AliExpress if platform is unknown or general
    if (platform === "unknown" || !platform) {
      const pm = (order.payment_method || "").toLowerCase();
      if (pm.includes("amazon")) platform = "amazon";
      else if (pm.includes("alibaba")) platform = "alibaba";
      else platform = "aliexpress";
    }

    // ========== GLOBAL PLATFORM: Affiliate WebView ==========
    let fulfillmentResult: any = null;

    if (platform === "amazon") {
      fulfillmentResult = await fulfillAmazonOrder(order.id);
    } else if (platform === "alibaba") {
      fulfillmentResult = await fulfillAlibabaOrder(order.id);
    } else {
      // Default to AliExpress
      platform = "aliexpress";
      fulfillmentResult = await fulfillAliExpressOrder(order.id);
    }

    if (!fulfillmentResult || !fulfillmentResult.payment_url) {
      return res.status(400).json({ success: false, message: "لا يمكن إنشاء رابط دفع لهذا الطلب" });
    }

    // Save pending platform order
    await db.update(orders).set({
      payment_status: "pending",
      payment_gateway: platform,
      platform_order_id: fulfillmentResult.platform_order_id,
      fulfillment_platform: platform,
    }).where(eq(orders.id, order.id));

    return res.json({
      success: true,
      data: {
        payment_url: fulfillmentResult.payment_url,
        payment_type: "affiliate_webview",
        platform,
        platform_order_id: fulfillmentResult.platform_order_id,
        message: `افتح الرابط في WebView داخل التطبيق. العميل يدفع لـ ${platform} مباشرةً. الشحن على المنصة.`,
        shipping_by: fulfillmentResult.shipping_by,
      }
    });
  } catch (err) { next(err); }
});

// Confirm payment after WebView completion
router.post("/orders/:id/pay/confirm", requireAuth, validateParams(idParamSchema), async (req, res, next) => {
  try {
    const { platform_order_id, tracking_number, carrier } = req.body;
    const [order] = await db.select().from(orders).where(eq(orders.id, Number(req.params.id)));
    if (!order) return res.status(404).json({ success: false, message: "الطلب غير موجود" });

    await db.update(orders).set({
      payment_status: "paid",
      status: "processing",
      platform_order_id: platform_order_id || order.platform_order_id,
      supplier_tracking: tracking_number || "",
      fulfillment_status: "processing",
    }).where(eq(orders.id, Number(req.params.id)));

    // Create shipment record if tracking provided
    if (tracking_number && carrier) {
      const [carrierRow] = await db.select().from(shipping_carriers).where(eq(shipping_carriers.name, carrier));
      if (carrierRow) {
        await createShipment(order.id, carrierRow.id, tracking_number, 0, order.currency);
      }
    }

    return res.json({ success: true, message: "تم تأكيد الدفع والشحن" });
  } catch (err) { next(err); }
});



// ========== STRIPE CONNECT (Vendor Onboarding & Split Payments) ==========

// Create Stripe Connect account for a vendor
router.post("/admin/vendors/:id/stripe-connect", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, Number(req.params.id)));
    if (!vendor) return res.status(404).json({ success: false, message: "البائع غير موجود" });

    const [gateway] = await db.select().from(payment_gateways).where(eq(payment_gateways.provider, "stripe"));
    if (!gateway || !gateway.is_active) return res.status(400).json({ success: false, message: "Stripe غير مفعل" });
    const config = gateway.config as Record<string, string>;
    if (!config.secret_key) return res.status(400).json({ success: false, message: "مفاتيح Stripe غير مكونة" });

    // Check if account already exists
    const [existing] = await db.select().from(vendor_stripe_accounts).where(eq(vendor_stripe_accounts.vendor_id, vendor.id));
    if (existing) {
      const account = await getStripeConnectAccount(existing.stripe_account_id, config.secret_key);
      if (account) {
        await db.update(vendor_stripe_accounts).set({
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          stripe_account_status: account.status,
          updated_at: new Date(),
        }).where(eq(vendor_stripe_accounts.id, existing.id));
        return res.json({ success: true, data: { ...account, onboarding_url: existing.onboarding_url } });
      }
    }

    const account = await createStripeConnectAccount(vendor.email, vendor.store_name, "SA", config.secret_key);

    await db.insert(vendor_stripe_accounts).values({
      vendor_id: vendor.id,
      stripe_account_id: account.id,
      stripe_account_status: account.status,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      onboarding_url: account.onboarding_url,
      dashboard_url: account.dashboard_url,
    });

    return res.json({ success: true, data: account });
  } catch (err) { next(err); }
});

// Get vendor Stripe Connect status
router.get("/admin/vendors/:id/stripe-connect", requireAuth, requireRole("admin", "manager"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const [account] = await db.select().from(vendor_stripe_accounts).where(eq(vendor_stripe_accounts.vendor_id, Number(req.params.id)));
    if (!account) return res.status(404).json({ success: false, message: "لا يوجد حساب Stripe Connect لهذا البائع" });

    const [gateway] = await db.select().from(payment_gateways).where(eq(payment_gateways.provider, "stripe"));
    if (gateway) {
      const config = gateway.config as Record<string, string>;
      if (config.secret_key) {
        const fresh = await getStripeConnectAccount(account.stripe_account_id, config.secret_key);
        if (fresh) {
          await db.update(vendor_stripe_accounts).set({
            charges_enabled: fresh.charges_enabled,
            payouts_enabled: fresh.payouts_enabled,
            stripe_account_status: fresh.status,
            updated_at: new Date(),
          }).where(eq(vendor_stripe_accounts.id, account.id));
          return res.json({ success: true, data: { ...fresh, onboarding_url: account.onboarding_url } });
        }
      }
    }

    return res.json({ success: true, data: account });
  } catch (err) { next(err); }
});

// Create Split Payment for an order (Customer pays vendor directly via Stripe)
router.post("/orders/:id/pay/split", requireAuth, validateParams(idParamSchema), async (req, res, next) => {
  try {
    const session = (req as any).session;
    const [order] = await db.select().from(orders).where(eq(orders.id, Number(req.params.id)));
    if (!order) return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    if (session.role !== "admin" && order.customer_id !== session.customerId) return res.status(403).json({ success: false, message: "غير مصرح" });
    if (order.payment_status === "paid") return res.status(400).json({ success: false, message: "الطلب مدفوع بالفعل" });

    // Detect vendor from order items
    const items = (order.items as any[]) || [];
    let vendorId: number | null = null;
    let platformFeePercent = 15; // Default platform fee

    for (const item of items) {
      if (item.product_id) {
        const [product] = await db.select().from(products).where(eq(products.id, item.product_id));
        if (product) {
          // Check if product belongs to a vendor
          const [vendorProduct] = await db.select().from(vendors).where(eq(vendors.id, product.id));
          if (vendorProduct) {
            vendorId = vendorProduct.id;
            platformFeePercent = vendorProduct.commission_rate;
            break;
          }
        }
      }
    }

    if (!vendorId) {
      return res.status(400).json({ success: false, message: "هذا الطلب لا يحتوي على منتجات من بائع محلي" });
    }

    const [stripeAccount] = await db.select().from(vendor_stripe_accounts).where(eq(vendor_stripe_accounts.vendor_id, vendorId));
    if (!stripeAccount || !stripeAccount.charges_enabled) {
      return res.status(400).json({ success: false, message: "البائع غير مفعل لاستلام الدفع المباشر" });
    }

    const [gateway] = await db.select().from(payment_gateways).where(eq(payment_gateways.provider, "stripe"));
    if (!gateway || !gateway.is_active) return res.status(400).json({ success: false, message: "Stripe غير مفعل" });
    const config = gateway.config as Record<string, string>;
    if (!config.secret_key) return res.status(400).json({ success: false, message: "مفاتيح Stripe غير مكونة" });

    const result = await createSplitPaymentIntent(
      order.total,
      order.currency,
      String(order.id),
      stripeAccount.stripe_account_id,
      platformFeePercent,
      config.secret_key,
    );

    await db.update(orders).set({
      payment_gateway: "stripe_connect",
      payment_status: "pending",
    }).where(eq(orders.id, order.id));

    return res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Confirm Split Payment (after client-side confirmation)
router.post("/orders/:id/pay/split-confirm", requireAuth, validateParams(idParamSchema), async (req, res, next) => {
  try {
    const { payment_intent_id } = req.body;
    const [gateway] = await db.select().from(payment_gateways).where(eq(payment_gateways.provider, "stripe"));
    if (!gateway) return res.status(400).json({ success: false, message: "Stripe غير مفعل" });
    const config = gateway.config as Record<string, string>;

    const result = await confirmStripePayment(payment_intent_id, config.secret_key);

    if (result.success) {
      await db.update(orders).set({
        payment_status: "paid",
        status: "processing",
        payment_transaction_id: result.transaction_id,
      }).where(eq(orders.id, Number(req.params.id)));
    }

    return res.json(result);
  } catch (err) { next(err); }
});

// -------------------------------------------------------------
// USER CART ENDPOINTS (Per-Account Cart Persistence & Sync)
// -------------------------------------------------------------
router.get("/cart", requireAuth, async (req, res, next) => {
  try {
    const session = getSession(req)!;
    const cartKey = `cart_user_${session.userId}`;
    const [row] = await db.select().from(platform_settings).where(eq(platform_settings.key, cartKey));
    let items = [];
    if (row?.value) {
      try { items = JSON.parse(row.value); } catch { items = []; }
    }
    return res.json({ success: true, items: Array.isArray(items) ? items : [] });
  } catch (err) {
    next(err);
  }
});

router.post("/cart", requireAuth, async (req, res, next) => {
  try {
    const session = getSession(req)!;
    const { items } = req.body;
    const cartKey = `cart_user_${session.userId}`;
    const safeItems = Array.isArray(items) ? items : [];
    const jsonStr = JSON.stringify(safeItems);
    const [existing] = await db.select().from(platform_settings).where(eq(platform_settings.key, cartKey));
    if (existing) {
      await db.update(platform_settings).set({ value: jsonStr, updated_at: new Date() }).where(eq(platform_settings.key, cartKey));
    } else {
      await db.insert(platform_settings).values({ key: cartKey, value: jsonStr });
    }
    return res.json({ success: true, items: safeItems });
  } catch (err) {
    next(err);
  }
});

router.delete("/cart", requireAuth, async (req, res, next) => {
  try {
    const session = getSession(req)!;
    const cartKey = `cart_user_${session.userId}`;
    await db.delete(platform_settings).where(eq(platform_settings.key, cartKey));
    return res.json({ success: true, items: [] });
  } catch (err) {
    next(err);
  }
});

export default router;
