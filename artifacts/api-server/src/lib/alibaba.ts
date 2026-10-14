import crypto from "crypto";
import { logger } from "../lib/logger";

const ALIBABA_API_URL = "https://openapi.alibaba.com/gateway.do";

export interface AlibabaCredentials {
  appKey: string;
  appSecret: string;
}

function generateSign(params: Record<string, string>, appSecret: string): string {
  const sortedKeys = Object.keys(params).sort();
  const signStr = sortedKeys.map(k => `${k}${encodeURIComponent(params[k])}`).join("");
  const fullStr = appSecret + signStr + appSecret;
  return crypto.createHmac("sha1", appSecret).update(fullStr).digest("hex").toUpperCase();
}

function buildApiUrl(method: string, params: Record<string, string>, creds: AlibabaCredentials): string {
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "+0000");
  const baseParams: Record<string, string> = {
    app_key: creds.appKey,
    timestamp,
    sign_method: "hmac-sha1",
    method,
    format: "json",
    v: "2.0",
    ...params,
  };
  const sign = generateSign(baseParams, creds.appSecret);
  baseParams.sign = sign;

  const url = new URL(ALIBABA_API_URL);
  Object.entries(baseParams).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

export interface AlibabaProduct {
  productId: string;
  subject: string;
  imageUrl: string;
  price: string;
  currency: string;
  categoryName: string;
  supplierName: string;
  supplierLoginId: string;
  supplierUrl: string;
  minOrderQuantity: string;
  deliveryTime: string;
  score: string;
  detailUrl: string;
  productTitle?: string;
  salePrice?: number;
  originalPrice?: number;
  productImage?: string;
  productUrl?: string;
  supplierId?: string;
  rating?: number;
  totalOrders?: number;
}

export async function searchAlibabaProducts(
  keywords: string,
  creds: AlibabaCredentials,
  page = 1,
  pageSize = 50,
): Promise<AlibabaProduct[]> {
  try {
    const url = buildApiUrl("alibaba.icbu.product.search", {
      q: keywords,
      page: String(page),
      pageSize: String(Math.min(pageSize, 50)),
      language: "ar",
    }, creds);

    const response = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      logger.error({ status: response.status, keywords }, "Alibaba API error");
      return [];
    }

    const data: any = await response.json();
    const result = data?.alibaba_icbu_product_search_response?.result;
    if (!result || result.success !== true) {
      logger.error({ msg: result?.errorMsg, keywords }, "Alibaba search returned error");
      return [];
    }

    const products = result?.products?.product || [];
    return products.map((p: any) => {
      const priceStr = String(p.price || p.minPrice || "0");
      const numPrice = parseFloat(priceStr) || 0;
      const title = p.subject || p.title || "";
      const img = p.imageUrl || p.mainImage || "";
      const dUrl = p.detailUrl || p.productUrl || "";
      const supId = p.supplierLoginId || p.supplierId || "";
      const scoreStr = String(p.score || "4.8");
      return {
        productId: p.productId || p.id || "",
        subject: title,
        productTitle: title,
        imageUrl: img,
        productImage: img,
        price: priceStr,
        salePrice: numPrice,
        originalPrice: numPrice,
        currency: p.currency || "USD",
        categoryName: p.categoryName || "",
        supplierName: p.supplierName || p.companyName || "",
        supplierLoginId: supId,
        supplierId: supId,
        supplierUrl: p.supplierUrl || "",
        minOrderQuantity: p.minOrderQuantity || "1",
        deliveryTime: p.deliveryTime || "",
        score: scoreStr,
        rating: parseFloat(scoreStr) || 4.8,
        totalOrders: parseInt(p.totalOrders || "120") || 120,
        detailUrl: dUrl,
        productUrl: dUrl,
      };
    }) as AlibabaProduct[];
  } catch (err: any) {
    logger.error({ err: err.message, keywords }, "Alibaba search failed");
    return [];
  }
}

export async function getAlibabaProduct(
  productId: string,
  creds: AlibabaCredentials,
): Promise<AlibabaProduct | null> {
  try {
    const url = buildApiUrl("alibaba.icbu.product.get", {
      productId,
      language: "ar",
    }, creds);

    const response = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      logger.error({ status: response.status, productId }, "Alibaba product error");
      return null;
    }

    const data: any = await response.json();
    const result = data?.alibaba_icbu_product_get_response?.result;
    if (!result || result.success !== true) return null;

    const p = result.product || result;
    const priceStr = String(p.price || p.minPrice || "0");
    const numPrice = parseFloat(priceStr) || 0;
    const title = p.subject || p.title || "";
    const img = p.imageUrl || p.mainImage || "";
    const dUrl = p.detailUrl || p.productUrl || "";
    const supId = p.supplierLoginId || p.supplierId || "";
    const scoreStr = String(p.score || "4.8");
    return {
      productId: p.productId || p.id || productId,
      subject: title,
      productTitle: title,
      imageUrl: img,
      productImage: img,
      price: priceStr,
      salePrice: numPrice,
      originalPrice: numPrice,
      currency: p.currency || "USD",
      categoryName: p.categoryName || "",
      supplierName: p.supplierName || p.companyName || "",
      supplierLoginId: supId,
      supplierId: supId,
      supplierUrl: p.supplierUrl || "",
      minOrderQuantity: p.minOrderQuantity || "1",
      deliveryTime: p.deliveryTime || "",
      score: scoreStr,
      rating: parseFloat(scoreStr) || 4.8,
      totalOrders: parseInt(p.totalOrders || "120") || 120,
      detailUrl: dUrl,
      productUrl: dUrl,
    };
  } catch (err: any) {
    logger.error({ err: err.message, productId }, "Alibaba get product failed");
    return null;
  }
}
