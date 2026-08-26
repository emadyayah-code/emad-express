import crypto from "crypto";
import { logger } from "../lib/logger";

const ALIEXPRESS_API_URL = "https://api-sg.aliexpress.com/sync";

export interface AliExpressCredentials {
  appKey: string;
  appSecret: string;
  trackingId?: string;
}

function generateSign(params: Record<string, string>, appSecret: string): string {
  const sortedKeys = Object.keys(params).sort();
  let query = "";
  for (const key of sortedKeys) {
    if (key !== "sign" && params[key] !== undefined && params[key] !== "") {
      query += key + params[key];
    }
  }
  return crypto.createHash("md5").update(appSecret + query + appSecret, "utf8").digest("hex").toUpperCase();
}

function buildApiUrl(method: string, params: Record<string, string>, creds: AliExpressCredentials): string {
  const timestamp = new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
  const baseParams: Record<string, string> = {
    app_key: creds.appKey.trim(),
    timestamp,
    sign_method: "md5",
    v: "2.0",
    format: "json",
    method,
    ...params,
  };
  const sign = generateSign(baseParams, creds.appSecret.trim());
  baseParams.sign = sign;

  const url = new URL(ALIEXPRESS_API_URL);
  Object.entries(baseParams).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

export interface AliExpressProduct {
  product_id: string;
  product_title: string;
  title_ar?: string;
  title_en?: string;
  product_main_image_url: string;
  target_sale_price: string;
  target_original_price: string;
  target_sale_price_currency: string;
  product_detail_url: string;
  commission_rate: string;
  first_level_category_name: string;
  second_level_category_name: string;
  shop_url: string;
  shop_name: string;
  evaluate_rate: string;
  sales_volume: string;
}

export async function fetchAliExpressProduct(
  productId: string,
  creds: AliExpressCredentials,
): Promise<AliExpressProduct | null> {
  try {
    const urlAr = buildApiUrl("aliexpress.affiliate.productdetail.get", {
      product_ids: productId,
      target_currency: "USD",
      target_language: "AR",
      ...(creds.trackingId ? { tracking_id: creds.trackingId } : {}),
    }, creds);

    const urlEn = buildApiUrl("aliexpress.affiliate.productdetail.get", {
      product_ids: productId,
      target_currency: "USD",
      target_language: "EN",
      ...(creds.trackingId ? { tracking_id: creds.trackingId } : {}),
    }, creds);

    const [resAr, resEn] = await Promise.all([
      fetch(urlAr, { signal: AbortSignal.timeout(15000) }).then(r => r.json()).catch(() => null),
      fetch(urlEn, { signal: AbortSignal.timeout(15000) }).then(r => r.json()).catch(() => null),
    ]);

    const extractProduct = (res: any) => {
      const resp = res?.aliexpress_affiliate_productdetail_get_response ||
                   res?.aliexpress_affiliate_product_detail_get_response;
      const result = resp?.resp_result || resp?.result || resp;
      let raw = result?.result?.products?.product ||
                result?.products?.product ||
                result?.products || [];
      if (!Array.isArray(raw) && raw && typeof raw === "object") raw = [raw];
      return Array.isArray(raw) && raw.length > 0 ? raw[0] : null;
    };

    const prodAr = extractProduct(resAr);
    const prodEn = extractProduct(resEn);

    const baseProd = prodAr || prodEn;
    if (!baseProd) {
      logger.warn({ productId, resAr }, "AliExpress product not found in response");
      return null;
    }

    let img = baseProd.product_main_image_url || baseProd.product_image_url || baseProd.image || "";
    if (img.startsWith("//")) img = `https:${img}`;

    return {
      ...baseProd,
      product_title: prodAr?.product_title || prodEn?.product_title || "",
      title_ar: prodAr?.product_title || prodEn?.product_title || "",
      title_en: prodEn?.product_title || prodAr?.product_title || "",
      product_main_image_url: img,
    } as AliExpressProduct;
  } catch (err: any) {
    logger.error({ err: err.message, productId }, "AliExpress fetch failed");
    return null;
  }
}

export async function searchAliExpressProducts(
  keywords: string,
  creds: AliExpressCredentials,
  page = 1,
  pageSize = 50,
  categoryId?: string,
): Promise<AliExpressProduct[]> {
  try {
    const params: Record<string, string> = {
      page_no: String(page),
      page_size: String(Math.min(pageSize, 50)),
      target_currency: "USD",
      target_language: "AR",
      ...(creds.trackingId ? { tracking_id: creds.trackingId } : {}),
    };
    if (keywords && keywords.trim()) params.keywords = keywords.trim();
    if (categoryId && categoryId.trim()) params.category_ids = categoryId.trim();

    const url = buildApiUrl("aliexpress.affiliate.product.query", params, creds);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      logger.error({ status: response.status, keywords, categoryId }, "AliExpress search error");
      return [];
    }

    const data = await response.json();
    const resp = data?.aliexpress_affiliate_product_query_response;
    const result = resp?.resp_result || resp?.result || resp;

    let rawProducts = result?.result?.products?.product || result?.products?.product || result?.products || [];
    if (!Array.isArray(rawProducts) && rawProducts && typeof rawProducts === "object") {
      rawProducts = [rawProducts];
    }

    return (rawProducts || []).map((p: any) => {
      let img = p.product_main_image_url || p.product_image_url || p.image || "";
      if (img.startsWith("//")) img = `https:${img}`;
      return { ...p, product_main_image_url: img };
    }) as AliExpressProduct[];
  } catch (err: any) {
    logger.error({ err: err.message, keywords, categoryId }, "AliExpress search failed");
    return [];
  }
}
