import { z } from "zod";

export const emailSchema = z.string().email("بريد إلكتروني غير صالح").max(255);

export const phoneSchema = z.string().regex(/^\+?[0-9\s\-]{8,20}$/, "رقم هاتف غير صالح").max(20);

export const passwordSchema = z.string()
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
  .max(128, "كلمة المرور طويلة جداً")
  .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير")
  .regex(/[a-z]/, "يجب أن تحتوي على حرف صغير")
  .regex(/[0-9]/, "يجب أن تحتوي على رقم");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "كلمة المرور مطلوبة").max(128),
});

export const registerSchema = z.object({
  name: z.string().min(2, "الاسم قصير جداً").max(100),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional(),
  address: z.string().max(500).optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب").max(200),
  sku: z.string().min(1).max(100),
  price: z.coerce.number().min(0, "السعر يجب أن يكون موجباً").max(99999999),
  cost: z.coerce.number().min(0).max(99999999).default(0),
  quantity: z.coerce.number().int().min(0).max(999999).default(0),
  min_quantity: z.coerce.number().int().min(0).max(999999).default(0),
  category_id: z.coerce.number().int().positive().nullable().optional(),
  description: z.string().max(5000).default(""),
  image: z.string().max(2000).default(""),
  is_active: z.coerce.boolean().default(true),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(50).default("📦"),
  image: z.string().max(2000).default(""),
  description: z.string().max(2000).default(""),
  is_active: z.coerce.boolean().default(true),
});

export const orderSchema = z.object({
  items: z.array(z.object({
    product_id: z.number().int().positive().optional(),
    product_name: z.string().min(1).max(200),
    quantity: z.number().int().positive().max(1000),
    price: z.number().min(0).max(99999999),
    total: z.number().min(0).max(99999999).optional(),
  })).min(1, "السلة فارغة").max(50, "عدد العناصر كبير جداً"),
  shipping_address: z.string().max(1000).optional(),
  payment_method: z.enum(["cod", "card", "bank_transfer"]).default("cod"),
});

export const employeeSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional(),
  role: z.enum(["manager", "sales", "support", "accountant"]),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("معرف غير صالح"),
});

export const affiliateSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  code: z.string().min(3).max(50).optional(),
  commission_rate: z.coerce.number().min(0).max(100).default(5),
});

export const vendorSchema = z.object({
  store_name: z.string().min(1).max(200),
  name: z.string().min(2).max(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  address: z.string().max(1000).optional(),
  commission_rate: z.coerce.number().min(0).max(100).default(10),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: phoneSchema.optional(),
  address: z.string().max(1000).optional(),
});

export const adminProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  current_password: z.string().max(128).optional(),
});

export const commissionSettingsSchema = z.object({
  commission_rate: z.coerce.number().min(0).max(100),
});

export const platformSettingsSchema = z.record(z.string().min(1).max(100), z.string().max(5000));

export const dropshipImportSchema = z.object({
  name: z.string().min(1).max(200),
  source_id: z.string().min(1).max(200),
  source_price: z.coerce.number().min(0).max(99999999),
  our_price: z.coerce.number().min(0).max(99999999),
  image: z.string().max(2000).optional(),
  description: z.string().max(5000).optional(),
  platform: z.enum(["aliexpress", "amazon", "alibaba", "ebay", "noon", "jumia", "temu", "other"]),
  source_url: z.string().max(2000).optional(),
});

export const fulfillmentSchema = z.object({
  fulfillment_platform: z.string().min(1).max(100),
  notes: z.string().max(2000).optional(),
});

export const trackingSchema = z.object({
  supplier_tracking: z.string().min(1).max(200),
  platform_order_id: z.string().max(200).optional(),
});
