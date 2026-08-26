import { db, payment_gateways, orders, products, customers } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger";
import { convertCurrency, formatCurrency } from "./currency";

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "requires_action" | "succeeded" | "failed" | "canceled";
  client_secret?: string;
  payment_method?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  transaction_id?: string;
  status: string;
  message: string;
  amount?: number;
  currency?: string;
}

// Stripe integration
export async function createStripePaymentIntent(
  amount: number,
  currency: string,
  orderId: string,
  stripeSecretKey: string,
): Promise<PaymentIntent> {
  try {
    const response = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        amount: String(Math.round(amount * 100)), // cents
        currency: currency.toLowerCase(),
        metadata: JSON.stringify({ order_id: orderId }),
        automatic_payment_methods: "{enabled: true}",
      }).toString(),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Stripe error");
    }

    const data = await response.json();
    return {
      id: data.id,
      amount: data.amount / 100,
      currency: data.currency.toUpperCase(),
      status: data.status === "requires_confirmation" ? "requires_action" : data.status,
      client_secret: data.client_secret,
    };
  } catch (err: any) {
    logger.error({ err: err.message }, "Stripe payment intent failed");
    throw err;
  }
}

export async function confirmStripePayment(
  paymentIntentId: string,
  stripeSecretKey: string,
): Promise<PaymentResult> {
  try {
    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${stripeSecretKey}` },
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json();
    const succeeded = data.status === "succeeded";
    return {
      success: succeeded,
      transaction_id: data.id,
      status: data.status,
      message: succeeded ? "تم الدفع بنجاح" : "الدفع غير مكتمل",
      amount: data.amount / 100,
      currency: data.currency?.toUpperCase(),
    };
  } catch (err: any) {
    logger.error({ err: err.message }, "Stripe confirm failed");
    return { success: false, status: "error", message: err.message };
  }
}

// PayPal integration
export async function createPayPalOrder(
  amount: number,
  currency: string,
  orderId: string,
  paypalClientId: string,
  paypalSecret: string,
): Promise<{ id: string; approval_url?: string }> {
  try {
    // Get access token
    const tokenRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${paypalClientId}:${paypalSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(10000),
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Create order
    const orderRes = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: currency, value: amount.toFixed(2) },
          reference_id: orderId,
        }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    const orderData = await orderRes.json();
    const approvalLink = orderData.links?.find((l: any) => l.rel === "approve")?.href;

    return { id: orderData.id, approval_url: approvalLink };
  } catch (err: any) {
    logger.error({ err: err.message }, "PayPal order creation failed");
    throw err;
  }
}

export async function capturePayPalOrder(
  paypalOrderId: string,
  paypalClientId: string,
  paypalSecret: string,
): Promise<PaymentResult> {
  try {
    const tokenRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${paypalClientId}:${paypalSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(10000),
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const captureRes = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    const data = await captureRes.json();
    const succeeded = data.status === "COMPLETED";
    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

    return {
      success: succeeded,
      transaction_id: capture?.id || paypalOrderId,
      status: data.status,
      message: succeeded ? "تم الدفع بنجاح عبر PayPal" : "فشل الدفع",
      amount: capture?.amount ? parseFloat(capture.amount.value) : undefined,
      currency: capture?.amount?.currency_code,
    };
  } catch (err: any) {
    logger.error({ err: err.message }, "PayPal capture failed");
    return { success: false, status: "error", message: err.message };
  }
}

// Generic payment processor
export async function processPayment(
  order: any,
  gatewayName: string,
): Promise<PaymentResult> {
  const [gateway] = await db.select().from(payment_gateways).where(
    and(eq(payment_gateways.name, gatewayName), eq(payment_gateways.is_active, true))
  );

  if (!gateway) {
    return { success: false, status: "error", message: "بوابة الدفع غير متوفرة" };
  }

  const config = gateway.config as Record<string, string>;

  if (gateway.provider === "stripe") {
    if (!config.secret_key) return { success: false, status: "error", message: "مفاتيح Stripe غير مكونة" };
    try {
      const intent = await createStripePaymentIntent(order.total, order.currency, String(order.id), config.secret_key);
      return {
        success: intent.status === "succeeded",
        transaction_id: intent.id,
        status: intent.status,
        message: intent.status === "succeeded" ? "تم الدفع" : "يتطلب تأكيد",
        amount: intent.amount,
        currency: intent.currency,
      };
    } catch (err: any) {
      return { success: false, status: "error", message: err.message };
    }
  }

  if (gateway.provider === "paypal") {
    if (!config.client_id || !config.secret) return { success: false, status: "error", message: "مفاتيح PayPal غير مكونة" };
    try {
      const paypalOrder = await createPayPalOrder(order.total, order.currency, String(order.id), config.client_id, config.secret);
      return {
        success: false, // Requires user approval
        status: "requires_action",
        message: "يرجى إكمال الدفع في نافذة PayPal",
        transaction_id: paypalOrder.id,
      };
    } catch (err: any) {
      return { success: false, status: "error", message: err.message };
    }
  }

  if (gateway.provider === "cod") {
    return { success: true, status: "pending", message: "الدفع عند الاستلام - الطلب قيد التنفيذ" };
  }

  return { success: false, status: "error", message: "بوابة الدفع غير مدعومة" };
}

export async function seedPaymentGateways() {
  const existing = await db.select().from(payment_gateways).limit(1);
  if (existing.length > 0) return;

  await db.insert(payment_gateways).values([
    {
      name: "cod",
      name_ar: "الدفع عند الاستلام",
      name_en: "Cash on Delivery",
      provider: "cod",
      config: {},
      is_active: true,
      is_default: true,
      supported_currencies: ["SAR", "USD", "YER"],
    },
    {
      name: "stripe",
      name_ar: "بطاقة ائتمان (Stripe)",
      name_en: "Credit Card (Stripe)",
      provider: "stripe",
      config: { secret_key: "", publishable_key: "" },
      is_active: false,
      is_default: false,
      supported_currencies: ["SAR", "USD", "EUR", "GBP"],
    },
    {
      name: "stripe_connect",
      name_ar: "دفع مباشر للبائع (Stripe Connect)",
      name_en: "Direct Vendor Payment (Stripe Connect)",
      provider: "stripe",
      config: { secret_key: "", publishable_key: "" },
      is_active: false,
      is_default: false,
      supported_currencies: ["SAR", "USD", "EUR", "GBP"],
    },
    {
      name: "google_pay",
      name_ar: "Google Pay",
      name_en: "Google Pay",
      provider: "stripe",
      config: { secret_key: "", publishable_key: "" },
      is_active: false,
      is_default: false,
      supported_currencies: ["SAR", "USD", "EUR", "GBP"],
    },
    {
      name: "apple_pay",
      name_ar: "Apple Pay",
      name_en: "Apple Pay",
      provider: "stripe",
      config: { secret_key: "", publishable_key: "" },
      is_active: false,
      is_default: false,
      supported_currencies: ["SAR", "USD", "EUR", "GBP"],
    },
    {
      name: "paypal",
      name_ar: "PayPal",
      name_en: "PayPal",
      provider: "paypal",
      config: { client_id: "", secret: "" },
      is_active: false,
      is_default: false,
      supported_currencies: ["USD", "EUR", "GBP"],
    },
  ]);
  logger.info("Payment gateways seeded");
}


// ========== STRIPE CONNECT (Split Payment for Vendors) ==========

export interface StripeConnectAccount {
  id: string;
  onboarding_url: string;
  dashboard_url: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  status: string;
}

export async function createStripeConnectAccount(
  vendorEmail: string,
  vendorName: string,
  vendorCountry: string = "SA",
  stripeSecretKey: string,
): Promise<StripeConnectAccount> {
  try {
    const response = await fetch("https://api.stripe.com/v1/accounts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        type: "express",
        email: vendorEmail,
        "business_profile[name]": vendorName,
        "business_profile[url]": "https://emadexpress.com",
        "capabilities[card_payments][requested]": "true",
        "capabilities[transfers][requested]": "true",
      }).toString(),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Stripe Connect account creation failed");
    }

    const data = await response.json();

    // Create onboarding link
    const linkRes = await fetch("https://api.stripe.com/v1/account_links", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        account: data.id,
        refresh_url: "https://emadexpress.com/admin/vendors",
        return_url: "https://emadexpress.com/admin/vendors?stripe=success",
        type: "account_onboarding",
      }).toString(),
      signal: AbortSignal.timeout(15000),
    });

    const linkData = await linkRes.json();

    return {
      id: data.id,
      onboarding_url: linkData.url,
      dashboard_url: `https://dashboard.stripe.com/${data.id}`,
      charges_enabled: data.charges_enabled,
      payouts_enabled: data.payouts_enabled,
      status: data.charges_enabled ? "active" : "pending",
    };
  } catch (err: any) {
    logger.error({ err: err.message }, "Stripe Connect account creation failed");
    throw err;
  }
}

export async function getStripeConnectAccount(
  accountId: string,
  stripeSecretKey: string,
): Promise<StripeConnectAccount | null> {
  try {
    const response = await fetch(`https://api.stripe.com/v1/accounts/${accountId}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${stripeSecretKey}` },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      id: data.id,
      onboarding_url: "",
      dashboard_url: `https://dashboard.stripe.com/${data.id}`,
      charges_enabled: data.charges_enabled,
      payouts_enabled: data.payouts_enabled,
      status: data.charges_enabled ? "active" : data.requirements?.disabled_reason ? "restricted" : "pending",
    };
  } catch (err: any) {
    logger.error({ err: err.message }, "Stripe Connect account fetch failed");
    return null;
  }
}

export interface SplitPaymentResult {
  success: boolean;
  payment_intent_id: string;
  client_secret?: string;
  platform_fee: number;
  vendor_amount: number;
  message: string;
}

export async function createSplitPaymentIntent(
  amount: number,
  currency: string,
  orderId: string,
  vendorStripeAccountId: string,
  platformFeePercent: number,
  stripeSecretKey: string,
): Promise<SplitPaymentResult> {
  try {
    const platformFee = Math.round(amount * (platformFeePercent / 100) * 100); // in cents
    const vendorAmount = Math.round(amount * 100) - platformFee;

    const response = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Account": vendorStripeAccountId, // Direct charge on behalf of vendor
      },
      body: new URLSearchParams({
        amount: String(Math.round(amount * 100)),
        currency: currency.toLowerCase(),
        "application_fee_amount": String(platformFee),
        metadata: JSON.stringify({ order_id: orderId, platform: "emad_express" }),
        automatic_payment_methods: "{enabled: true}",
      }).toString(),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Split payment creation failed");
    }

    const data = await response.json();
    return {
      success: true,
      payment_intent_id: data.id,
      client_secret: data.client_secret,
      platform_fee: platformFee / 100,
      vendor_amount: vendorAmount / 100,
      message: "تم إنشاء intent الدفع المقسم بنجاح",
    };
  } catch (err: any) {
    logger.error({ err: err.message, orderId }, "Split payment intent failed");
    throw err;
  }
}

// ========== GOOGLE PAY / APPLE PAY ==========

export async function createGooglePayPaymentIntent(
  amount: number,
  currency: string,
  orderId: string,
  stripeSecretKey: string,
): Promise<PaymentIntent> {
  // Google Pay uses Stripe Payment Intents with wallet type
  return createStripePaymentIntent(amount, currency, orderId, stripeSecretKey);
}

export async function createApplePayPaymentIntent(
  amount: number,
  currency: string,
  orderId: string,
  stripeSecretKey: string,
): Promise<PaymentIntent> {
  // Apple Pay uses Stripe Payment Intents with wallet type
  return createStripePaymentIntent(amount, currency, orderId, stripeSecretKey);
}

