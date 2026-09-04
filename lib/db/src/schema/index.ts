import { pgTable, serial, text, integer, boolean, timestamp, jsonb, real, numeric } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("user"),
  preferred_language: text("preferred_language").default("ar"),
  preferred_currency: text("preferred_currency").default("SAR"),
  email_verified: boolean("email_verified").default(false).notNull(),
  verification_code: text("verification_code").default(""),
  verification_expires_at: timestamp("verification_expires_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const currencies = pgTable("currencies", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // SAR, USD, YER
  name_ar: text("name_ar").notNull(),
  name_en: text("name_en").notNull(),
  symbol: text("symbol").notNull(), // ر.س, $, ر.ي
  rate_to_usd: real("rate_to_usd").notNull().default(1), // 1 USD = ? this currency
  is_active: boolean("is_active").default(true).notNull(),
  is_default: boolean("is_default").default(false).notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name_ar: text("name_ar").notNull(),
  name_en: text("name_en").notNull(),
  icon: text("icon").default("📦"),
  image: text("image").default(""),
  description_ar: text("description_ar").default(""),
  description_en: text("description_en").default(""),
  is_active: boolean("is_active").default(true).notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name_ar: text("name_ar").notNull(),
  name_en: text("name_en").notNull(),
  sku: text("sku").notNull().unique(),
  price: real("price").notNull(), // stored in base currency (USD)
  cost: real("cost").default(0).notNull(),
  quantity: integer("quantity").default(0).notNull(),
  min_quantity: integer("min_quantity").default(0).notNull(),
  category_id: integer("category_id"),
  description_ar: text("description_ar").default(""),
  description_en: text("description_en").default(""),
  image: text("image").default(""),
  is_active: boolean("is_active").default(true).notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const product_translations = pgTable("product_translations", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").notNull(),
  language: text("language").notNull(), // ar, en
  name: text("name").notNull(),
  description: text("description").default(""),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").default(""),
  address: text("address").default(""),
  city: text("city").default(""),
  country: text("country").default("SA"),
  total_orders: integer("total_orders").default(0).notNull(),
  total_spent: real("total_spent").default(0).notNull(),
  loyalty_points: integer("loyalty_points").default(0).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  store_name: text("store_name").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").default(""),
  address: text("address").default(""),
  commission_rate: real("commission_rate").default(10).notNull(),
  balance: real("balance").default(0).notNull(),
  is_approved: boolean("is_approved").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const affiliates = pgTable("affiliates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").default(""),
  code: text("code").notNull().unique(),
  commission_rate: real("commission_rate").default(5).notNull(),
  balance: real("balance").default(0).notNull(),
  total_earned: real("total_earned").default(0).notNull(),
  total_clicks: integer("total_clicks").default(0).notNull(),
  total_conversions: integer("total_conversions").default(0).notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const affiliate_conversions = pgTable("affiliate_conversions", {
  id: serial("id").primaryKey(),
  affiliate_id: integer("affiliate_id").notNull(),
  order_id: integer("order_id"),
  order_number: text("order_number"),
  order_total: real("order_total").default(0).notNull(),
  commission_amount: real("commission_amount").default(0).notNull(),
  status: text("status").default("pending").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const dropship_products = pgTable("dropship_products", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id"),
  platform: text("platform").notNull(),
  source_id: text("source_id").notNull(),
  source_url: text("source_url").default("").notNull(),
  source_price: real("source_price").default(0).notNull(), // in source currency
  source_currency: text("source_currency").default("USD").notNull(),
  our_price: real("our_price").default(0).notNull(), // in base currency (USD)
  supplier_name: text("supplier_name").default(""),
  platform_commission_rate: real("platform_commission_rate").default(0).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const platform_settings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const payment_gateways = pgTable("payment_gateways", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // stripe, paypal, tamara, tabby, etc
  name_ar: text("name_ar").notNull(),
  name_en: text("name_en").notNull(),
  provider: text("provider").notNull(), // stripe, paypal, etc
  config: jsonb("config").$type<Record<string, string>>().default({}).notNull(), // API keys, secrets
  is_active: boolean("is_active").default(true).notNull(),
  is_default: boolean("is_default").default(false).notNull(),
  supported_currencies: jsonb("supported_currencies").$type<string[]>().default([]).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  order_number: text("order_number").notNull().unique(),
  customer_id: integer("customer_id"),
  customer_name: text("customer_name").notNull(),
  customer_email: text("customer_email").default(""),
  customer_phone: text("customer_phone").default(""),
  shipping_address: text("shipping_address").default(""),
  shipping_city: text("shipping_city").default(""),
  shipping_country: text("shipping_country").default("SA"),
  payment_method: text("payment_method").default("cod").notNull(),
  payment_status: text("payment_status").default("pending").notNull(),
  payment_gateway: text("payment_gateway").default(""), // stripe, paypal, etc
  payment_transaction_id: text("payment_transaction_id").default(""),
  status: text("status").default("pending").notNull(),
  currency: text("currency").default("SAR").notNull(),
  subtotal: real("subtotal").default(0).notNull(),
  discount: real("discount").default(0).notNull(),
  tax: real("tax").default(0).notNull(),
  shipping: real("shipping").default(0).notNull(),
  total: real("total").default(0).notNull(),
  items: jsonb("items").$type<Array<{
    product_id?: number;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
    source_platform?: string;
    source_id?: string;
    source_url?: string;
  }>>().default([]).notNull(),
  affiliate_code: text("affiliate_code").default(""),
  fulfillment_status: text("fulfillment_status").default("unfulfilled").notNull(),
  fulfillment_platform: text("fulfillment_platform").default(""),
  supplier_tracking: text("supplier_tracking").default(""),
  platform_order_id: text("platform_order_id").default(""),
  order_date: timestamp("order_date").defaultNow().notNull(),
});

export const supplier_payments = pgTable("supplier_payments", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").notNull(),
  order_number: text("order_number").notNull(),
  platform: text("platform").notNull(),
  supplier_cost: real("supplier_cost").default(0).notNull(),
  supplier_currency: text("supplier_currency").default("USD").notNull(),
  customer_paid: real("customer_paid").default(0).notNull(),
  customer_currency: text("customer_currency").default("SAR").notNull(),
  admin_profit: real("admin_profit").default(0).notNull(),
  status: text("status").default("pending").notNull(),
  paid_at: timestamp("paid_at"),
  notes: text("notes").default(""),
  created_at: timestamp("created_at").defaultNow().notNull(),
});


export const vendor_stripe_accounts = pgTable("vendor_stripe_accounts", {
  id: serial("id").primaryKey(),
  vendor_id: integer("vendor_id").notNull().unique(),
  stripe_account_id: text("stripe_account_id").notNull(), // acct_xxx
  stripe_account_status: text("stripe_account_status").default("pending").notNull(), // pending, active, restricted
  charges_enabled: boolean("charges_enabled").default(false).notNull(),
  payouts_enabled: boolean("payouts_enabled").default(false).notNull(),
  onboarding_url: text("onboarding_url").default(""),
  dashboard_url: text("dashboard_url").default(""),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
export const shipping_carriers = pgTable("shipping_carriers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  name_ar: text("name_ar").notNull(),
  name_en: text("name_en").notNull(),
  tracking_url_template: text("tracking_url_template").default(""),
  is_active: boolean("is_active").default(true).notNull(),
});

export const shipments = pgTable("shipments", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").notNull(),
  carrier_id: integer("carrier_id"),
  tracking_number: text("tracking_number").default(""),
  status: text("status").default("pending").notNull(), // pending, picked_up, in_transit, out_for_delivery, delivered
  estimated_delivery: timestamp("estimated_delivery"),
  actual_delivery: timestamp("actual_delivery"),
  cost: real("cost").default(0).notNull(),
  currency: text("currency").default("SAR").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const returns_refunds = pgTable("returns_refunds", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").notNull(),
  order_number: text("order_number").notNull(),
  customer_id: integer("customer_id").notNull(),
  customer_name: text("customer_name").notNull(),
  customer_email: text("customer_email").default(""),
  customer_phone: text("customer_phone").default(""),
  items: jsonb("items").$type<Array<{
    product_id?: number;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
  }>>().default([]).notNull(),
  refund_amount: real("refund_amount").default(0).notNull(),
  currency: text("currency").default("SAR").notNull(),
  type: text("type").default("return_and_refund").notNull(), // return_and_refund, refund_only, exchange
  reason: text("reason").notNull(), // damaged, wrong_item, defective, changed_mind, not_as_described, other
  details: text("details").default(""),
  refund_method: text("refund_method").default("original_payment").notNull(), // original_payment, bank_transfer, wallet
  bank_name: text("bank_name").default(""),
  bank_iban: text("bank_iban").default(""),
  bank_account_name: text("bank_account_name").default(""),
  status: text("status").default("pending").notNull(), // pending, approved, items_received, refunded, rejected
  admin_notes: text("admin_notes").default(""),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  resolved_at: timestamp("resolved_at"),
});

