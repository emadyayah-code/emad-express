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
    const url = buildApiUrl("aliexpress.affiliate.productdetail.get", {
      product_ids: productId,
      fields: "product_id,product_title,product_main_image_url,target_sale_price,target_original_price,target_sale_price_currency,product_detail_url,commission_rate,first_level_category_name,second_level_category_name,shop_url,shop_name,evaluate_rate,sales_volume",
      ...(creds.trackingId ? { tracking_id: creds.trackingId } : {}),
    }, creds);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      logger.error({ status: response.status, productId }, "AliExpress API error");
      return null;
    }

    const data = await response.json();
    logger.info({ data, productId }, "AliExpress API response");

    const resp = data?.aliexpress_affiliate_productdetail_get_response || data?.aliexpress_affiliate_product_detail_get_response;
    const result = resp?.resp_result || resp?.result || resp;

    let rawProducts = result?.result?.products?.product || result?.products?.product || result?.products || [];
    if (!Array.isArray(rawProducts) && rawProducts && typeof rawProducts === "object") {
      rawProducts = [rawProducts];
    }

    if (!rawProducts || !rawProducts.length) {
      logger.warn({ productId, data }, "AliExpress product not found in response");
      return null;
    }

    const prod = rawProducts[0];
    let img = prod.product_main_image_url || prod.product_image_url || prod.image || "";
    if (img.startsWith("//")) img = `https:${img}`;

    return {
      ...prod,
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
  pageSize = 20,
): Promise<AliExpressProduct[]> {
  try {
    const url = buildApiUrl("aliexpress.affiliate.product.query", {
      keywords,
      page_no: String(page),
      page_size: String(Math.min(pageSize, 50)),
      target_currency: "USD",
      target_language: "AR",
      ...(creds.trackingId ? { tracking_id: creds.trackingId } : {}),
    }, creds);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      logger.error({ status: response.status, keywords }, "AliExpress search error");
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
    logger.error({ err: err.message, keywords }, "AliExpress search failed");
    return [];
  }
}
