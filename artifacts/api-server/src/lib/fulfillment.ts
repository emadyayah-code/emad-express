import { db, orders, products, dropship_products, shipments, shipping_carriers, customers, platform_settings } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger";
import { convertCurrency } from "./currency";

// ========== HYBRID FULFILLMENT MODEL ==========
// Local Vendors: Stripe Connect (Direct Payment + Split)
// Global Platforms: Affiliate Deep Links (Customer pays platform directly)
// Shipping: ALWAYS on the supplier/platform

export interface FulfillmentResult {
  success: boolean;
  platform_order_id?: string;
  tracking_number?: string;
  carrier?: string;
  estimated_delivery?: string;
  payment_url?: string; // For WebView checkout (Affiliate / Platform checkout)
  payment_type?: "stripe_connect" | "affiliate_webview" | "platform_direct";
  message: string;
  shipping_by?: string; // Who handles shipping
}

// ========== ALIEXPRESS AFFILIATE DEEP LINK ==========
export async function fulfillAliExpressOrder(
  orderId: number,
  apiKey?: string,
  apiSecret?: string,
  trackingId?: string,
): Promise<FulfillmentResult> {
  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return { success: false, message: "الطلب غير موجود" };

    if (!trackingId) {
      const [trackRow] = await db.select().from(platform_settings).where(eq(platform_settings.key, "aliexpress_tracking_id"));
      if (trackRow?.value) trackingId = trackRow.value;
    }

    const orderItems = (order.items as any[]) || [];
    const aliItems: any[] = [];

    for (const item of orderItems) {
      if (item.source_platform === "aliexpress" && item.source_id) {
        aliItems.push(item);
      } else {
        const [dp] = await db.select().from(dropship_products).where(
          and(eq(dropship_products.product_id, item.product_id), eq(dropship_products.platform, "aliexpress"))
        );
        if (dp) aliItems.push({ ...item, source_id: dp.source_id, source_url: dp.source_url });
      }
    }

    if (!aliItems.length) {
      const firstItem = orderItems[0];
      const searchKeyword = firstItem?.product_name || "store";
      const targetUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(searchKeyword)}`;
      const affiliateUrl = generateAliExpressAffiliateUrl("", trackingId, targetUrl);

      return {
        success: true,
        platform_order_id: `ALI-AFFILIATE-${orderId}`,
        payment_url: affiliateUrl,
        payment_type: "affiliate_webview",
        message: "تم إنشاء رابط أفيليت. العميل سيدفع لـ AliExpress مباشرةً داخل التطبيق.",
        shipping_by: "AliExpress (الشحن على المنصة)",
      };
    }

    const primaryItem = aliItems[0];

    // Generate REAL Affiliate Deep Link with tracking
    const affiliateUrl = generateAliExpressAffiliateUrl(primaryItem.source_id, trackingId, primaryItem.source_url);

    return {
      success: true,
      platform_order_id: `ALI-AFFILIATE-${orderId}`,
      payment_url: affiliateUrl,
      payment_type: "affiliate_webview",
      message: "تم إنشاء رابط أفيليت. العميل سيدفع لـ AliExpress مباشرةً داخل التطبيق.",
      shipping_by: "AliExpress (الشحن على المنصة)",
    };
  } catch (err: any) {
    logger.error({ err: err.message, orderId }, "AliExpress fulfillment failed");
    return { success: false, message: err.message };
  }
}

function generateAliExpressAffiliateUrl(productId: string, trackingId?: string, sourceUrl?: string): string {
  const itemUrl = sourceUrl && sourceUrl.includes("aliexpress.com")
    ? sourceUrl
    : productId ? `https://www.aliexpress.com/item/${productId}.html` : `https://www.aliexpress.com/`;

  if (trackingId && trackingId.trim() && trackingId.trim() !== "default") {
    return `https://s.click.aliexpress.com/deep_link.htm?dl_target_url=${encodeURIComponent(itemUrl)}&aff_short_key=${encodeURIComponent(trackingId.trim())}`;
  }

  return itemUrl;
}

// ========== AMAZON ASSOCIATES DEEP LINK ==========
export async function fulfillAmazonOrder(
  orderId: number,
  accessKey?: string,
  secretKey?: string,
  partnerTag?: string,
): Promise<FulfillmentResult> {
  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return { success: false, message: "الطلب غير موجود" };

    if (!partnerTag) {
      const [tagRow] = await db.select().from(platform_settings).where(eq(platform_settings.key, "amazon_partner_tag"));
      if (tagRow?.value) partnerTag = tagRow.value;
    }

    const orderItems = (order.items as any[]) || [];
    const amazonItems: any[] = [];

    for (const item of orderItems) {
      if (item.source_platform === "amazon" && item.source_id) {
        amazonItems.push(item);
      } else {
        const [dp] = await db.select().from(dropship_products).where(
          and(eq(dropship_products.product_id, item.product_id), eq(dropship_products.platform, "amazon"))
        );
        if (dp) amazonItems.push({ ...item, source_id: dp.source_id, source_url: dp.source_url });
      }
    }

    if (!amazonItems.length) return { success: false, message: "لا يوجد منتجات من أمازون في هذا الطلب" };

    const primaryItem = amazonItems[0];

    // Generate Amazon Associates Link
    const affiliateUrl = generateAmazonAssociatesUrl(primaryItem.source_id, partnerTag);

    return {
      success: true,
      platform_order_id: `AMZ-AFFILIATE-${orderId}`,
      payment_url: affiliateUrl,
      payment_type: "affiliate_webview",
      message: "تم إنشاء رابط Associates. العميل سيدفع لـ Amazon مباشرةً داخل التطبيق.",
      shipping_by: "Amazon FBA (الشحن على أمازون)",
    };
  } catch (err: any) {
    logger.error({ err: err.message, orderId }, "Amazon fulfillment failed");
    return { success: false, message: err.message };
  }
}

function generateAmazonAssociatesUrl(asin: string, partnerTag?: string): string {
  const tag = partnerTag || "emadexpress-20";
  return `https://www.amazon.com/dp/${asin}?tag=${tag}&linkCode=ogi&th=1&psc=1`;
}

// ========== ALIBABA TRADE ASSURANCE ==========
export async function fulfillAlibabaOrder(
  orderId: number,
  appKey?: string,
  appSecret?: string,
): Promise<FulfillmentResult> {
  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return { success: false, message: "الطلب غير موجود" };

    const orderItems = (order.items as any[]) || [];
    const alibabaItems: any[] = [];

    for (const item of orderItems) {
      if (item.source_platform === "alibaba" && item.source_id) {
        alibabaItems.push(item);
      } else {
        const [dp] = await db.select().from(dropship_products).where(
          and(eq(dropship_products.product_id, item.product_id), eq(dropship_products.platform, "alibaba"))
        );
        if (dp) alibabaItems.push({ ...item, source_id: dp.source_id, source_url: dp.source_url });
      }
    }

    if (!alibabaItems.length) return { success: false, message: "لا يوجد منتجات من علي بابا في هذا الطلب" };

    const primaryItem = alibabaItems[0];

    return {
      success: true,
      platform_order_id: `ALB-AFFILIATE-${orderId}`,
      payment_url: primaryItem.source_url || `https://www.alibaba.com/product-detail/${primaryItem.source_id}.html`,
      payment_type: "affiliate_webview",
      message: "تم إنشاء رابط علي بابا. العميل سيدفع لـ Alibaba مباشرةً داخل التطبيق.",
      shipping_by: "Alibaba Supplier (الشحن على المورد)",
    };
  } catch (err: any) {
    logger.error({ err: err.message, orderId }, "Alibaba fulfillment failed");
    return { success: false, message: err.message };
  }
}

// ========== LOCAL VENDOR (Stripe Connect) ==========
export async function fulfillLocalVendorOrder(
  orderId: number,
): Promise<FulfillmentResult> {
  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return { success: false, message: "الطلب غير موجود" };

    // Check if order has local vendor products
    const orderItems = (order.items as any[]) || [];
    let hasLocalVendor = false;

    for (const item of orderItems) {
      if (item.product_id) {
        const [product] = await db.select().from(products).where(eq(products.id, item.product_id));
        if (product && !item.source_platform) {
          hasLocalVendor = true;
          break;
        }
      }
    }

    if (!hasLocalVendor) {
      return { success: false, message: "هذا الطلب لا يحتوي على منتجات من بائع محلي" };
    }

    return {
      success: true,
      payment_type: "stripe_connect",
      message: "سيتم الدفع عبر Stripe Connect مباشرةً للبائع المحلي.",
      shipping_by: "البائع المحلي (الشحن على البائع)",
    };
  } catch (err: any) {
    logger.error({ err: err.message, orderId }, "Local vendor fulfillment failed");
    return { success: false, message: err.message };
  }
}

// ========== AUTO FULFILLMENT (Hybrid Router) ==========
export async function autoFulfillOrder(orderId: number): Promise<FulfillmentResult> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return { success: false, message: "الطلب غير موجود" };

  const items = (order.items as any[]) || [];
  const platforms = new Set<string>();
  let hasLocalVendor = false;

  for (const item of items) {
    if (item.source_platform) {
      platforms.add(item.source_platform);
    } else if (item.product_id) {
      // Check if product belongs to a local vendor
      const [product] = await db.select().from(products).where(eq(products.id, item.product_id));
      if (product) {
        hasLocalVendor = true;
      }
    }
  }

  // Priority: Local Vendor (Stripe Connect) > Global Platform (Affiliate)
  if (hasLocalVendor && platforms.size === 0) {
    return fulfillLocalVendorOrder(orderId);
  }

  const platform = Array.from(platforms)[0] || "unknown";
  const settings = await db.select().from(platform_settings);
  const cfg: Record<string, string> = {};
  settings.forEach(s => cfg[s.key] = s.value);

  switch (platform) {
    case "aliexpress":
      return fulfillAliExpressOrder(orderId, cfg["aliexpress_app_key"], cfg["aliexpress_app_key_secret"], cfg["aliexpress_tracking_id"]);
    case "amazon":
      return fulfillAmazonOrder(orderId, cfg["amazon_access_key"], cfg["amazon_secret_key"], cfg["amazon_partner_tag"]);
    case "alibaba":
      return fulfillAlibabaOrder(orderId, cfg["alibaba_app_key"], cfg["alibaba_app_key_secret"]);
    default:
      if (hasLocalVendor) return fulfillLocalVendorOrder(orderId);
      return { success: false, message: "لا يمكن تحديد نوع الطلب (محلي أو دروبشيبنج)" };
  }
}

// ========== TRACKING ==========
export async function getFulfillmentTracking(orderId: number): Promise<any> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return null;

  const shipments_data = await db.select().from(shipments).where(eq(shipments.order_id, orderId));

  return {
    order_id: orderId,
    order_number: order.order_number,
    fulfillment_status: order.fulfillment_status,
    platform_order_id: order.platform_order_id,
    supplier_tracking: order.supplier_tracking,
    shipping_by: order.fulfillment_platform === "aliexpress" ? "AliExpress" : 
                 order.fulfillment_platform === "amazon" ? "Amazon FBA" : 
                 order.fulfillment_platform === "alibaba" ? "Alibaba Supplier" : "البائع المحلي",
    shipments: shipments_data,
  };
}
