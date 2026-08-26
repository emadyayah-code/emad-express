import crypto from "crypto";
import { logger } from "../lib/logger";

const AMAZON_REGIONS: Record<string, string> = {
  us: "webservices.amazon.com",
  uk: "webservices.amazon.co.uk",
  de: "webservices.amazon.de",
  fr: "webservices.amazon.fr",
  jp: "webservices.amazon.co.jp",
  ca: "webservices.amazon.ca",
  ae: "webservices.amazon.ae",
  sa: "webservices.amazon.sa",
  in: "webservices.amazon.in",
};

export interface AmazonCredentials {
  accessKey: string;
  secretKey: string;
  partnerTag: string;
  region?: string;
}

function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
  const kDate = crypto.createHmac("sha256", "AWS4" + key).update(dateStamp).digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(regionName).digest();
  const kService = crypto.createHmac("sha256", kRegion).update(serviceName).digest();
  const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();
  return kSigning;
}

function signRequest(
  method: string,
  uri: string,
  headers: Record<string, string>,
  payload: string,
  creds: AmazonCredentials,
): Record<string, string> {
  const region = creds.region || "us";
  const host = AMAZON_REGIONS[region] || AMAZON_REGIONS.us;
  const service = "ProductAdvertisingAPI";
  const algorithm = "AWS4-HMAC-SHA256";
  const now = new Date();
  const amzdate = now.toISOString().replace(/[:\-]|\.\d{3}/g, "");
  const datestamp = amzdate.slice(0, 8);

  const allHeaders: Record<string, string> = {
    host,
    "x-amz-date": amzdate,
    "content-encoding": "amz-1.0",
    "content-type": "application/json; charset=utf-8",
    ...headers,
  };

  const signedHeaders = Object.keys(allHeaders).sort().map(k => k.toLowerCase()).join(";");
  const canonicalHeaders = Object.keys(allHeaders).sort().map(k => `${k.toLowerCase()}:${allHeaders[k].trim()}\n`).join("");
  const payloadHash = crypto.createHash("sha256").update(payload).digest("hex");
  const canonicalRequest = `${method}\n${uri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${datestamp}/${region}/${service}/aws4_request`;
  const stringToSign = `${algorithm}\n${amzdate}\n${credentialScope}\n${crypto.createHash("sha256").update(canonicalRequest).digest("hex")}`;
  const signingKey = getSignatureKey(creds.secretKey, datestamp, region, service);
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const authorizationHeader = `${algorithm} Credential=${creds.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { ...allHeaders, Authorization: authorizationHeader };
}

export interface AmazonItem {
  ASIN: string;
  DetailPageURL: string;
  Images?: { Primary?: { Large?: { URL?: string } } };
  ItemInfo?: {
    Title?: { DisplayValue?: string };
    Features?: { DisplayValues?: string[] };
    ProductInfo?: { Color?: { DisplayValue?: string }; Size?: { DisplayValue?: string } };
  };
  Offers?: {
    Listings?: Array<{
      Price?: { Amount?: number; Currency?: string };
      SavingBasis?: { Amount?: number };
    }>;
  };
  BrowseNodeInfo?: { BrowseNodes?: Array<{ DisplayName?: string }> };
}

export async function fetchAmazonItems(
  asins: string[],
  creds: AmazonCredentials,
): Promise<AmazonItem[]> {
  try {
    const region = creds.region || "us";
    const host = AMAZON_REGIONS[region] || AMAZON_REGIONS.us;
    const payload = JSON.stringify({
      ItemIds: asins,
      ItemIdType: "ASIN",
      Resources: [
        "Images.Primary.Large",
        "ItemInfo.Title",
        "ItemInfo.Features",
        "ItemInfo.ProductInfo",
        "Offers.Listings.Price",
        "Offers.Listings.SavingBasis",
        "BrowseNodeInfo.BrowseNodes",
      ],
      PartnerTag: creds.partnerTag,
      PartnerType: "Associates",
      Marketplace: region === "us" ? "www.amazon.com" : `www.amazon.${region}`,
    });

    const headers = signRequest("POST", "/paapi5/getitems", { "x-amz-target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems" }, payload, creds);

    const response = await fetch(`https://${host}/paapi5/getitems`, {
      method: "POST",
      headers,
      body: payload,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      logger.error({ status: response.status, body: errText.slice(0, 500) }, "Amazon API error");
      return [];
    }

    const data = await response.json();
    const items = data?.ItemsResult?.Items || [];
    return items as AmazonItem[];
  } catch (err: any) {
    logger.error({ err: err.message }, "Amazon fetch failed");
    return [];
  }
}

export async function searchAmazonItems(
  keywords: string,
  creds: AmazonCredentials,
  page = 1,
): Promise<AmazonItem[]> {
  try {
    const region = creds.region || "us";
    const host = AMAZON_REGIONS[region] || AMAZON_REGIONS.us;
    const payload = JSON.stringify({
      Keywords: keywords,
      SearchIndex: "All",
      ItemPage: page,
      Resources: [
        "Images.Primary.Large",
        "ItemInfo.Title",
        "ItemInfo.Features",
        "Offers.Listings.Price",
        "BrowseNodeInfo.BrowseNodes",
      ],
      PartnerTag: creds.partnerTag,
      PartnerType: "Associates",
      Marketplace: region === "us" ? "www.amazon.com" : `www.amazon.${region}`,
    });

    const headers = signRequest("POST", "/paapi5/searchitems", { "x-amz-target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems" }, payload, creds);

    const response = await fetch(`https://${host}/paapi5/searchitems`, {
      method: "POST",
      headers,
      body: payload,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      logger.error({ status: response.status, body: errText.slice(0, 500) }, "Amazon search error");
      return [];
    }

    const data = await response.json();
    const items = data?.SearchResult?.Items || [];
    return items as AmazonItem[];
  } catch (err: any) {
    logger.error({ err: err.message }, "Amazon search failed");
    return [];
  }
}

export async function searchAmazonProducts(
  keywords: string,
  creds: AmazonCredentials,
  page = 1,
  _pageSize = 10,
): Promise<{ products: Array<{ id: string; title: string; price: number; currency: string; imageUrl: string; detailUrl: string; brand?: string; category?: string }>; totalResults: number }> {
  const items = await searchAmazonItems(keywords, creds, page);
  const products = items.map(item => ({
    id: item.ASIN,
    title: item.ItemInfo?.Title?.DisplayValue || "",
    price: item.Offers?.Listings?.[0]?.Price?.Amount || 0,
    currency: item.Offers?.Listings?.[0]?.Price?.Currency || "USD",
    imageUrl: item.Images?.Primary?.Large?.URL || "",
    detailUrl: item.DetailPageURL || "",
    category: item.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName,
  }));
  return { products, totalResults: products.length };
}

export async function getAmazonProduct(
  asin: string,
  creds: AmazonCredentials,
): Promise<{ id: string; title: string; price: number; currency: string; imageUrl: string; detailUrl: string; brand?: string; category?: string } | null> {
  const items = await fetchAmazonItems([asin], creds);
  if (!items.length) return null;
  const item = items[0];
  return {
    id: item.ASIN,
    title: item.ItemInfo?.Title?.DisplayValue || "",
    price: item.Offers?.Listings?.[0]?.Price?.Amount || 0,
    currency: item.Offers?.Listings?.[0]?.Price?.Currency || "USD",
    imageUrl: item.Images?.Primary?.Large?.URL || "",
    detailUrl: item.DetailPageURL || "",
    category: item.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName,
  };
}
