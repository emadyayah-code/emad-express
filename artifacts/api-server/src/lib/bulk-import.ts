import { db, products, dropship_products, platform_settings } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { logger } from "./logger";
import { fetchAliExpressProduct, searchAliExpressProducts, type AliExpressCredentials } from "./aliexpress";
import { searchAmazonProducts, getAmazonProduct, type AmazonCredentials } from "./amazon";
import { searchAlibabaProducts, getAlibabaProduct, type AlibabaCredentials } from "./alibaba";
import { matchCategoryId } from "./category-matcher";
import { extractRealSupplierStock } from "./supplier-stock";

export interface BulkImportJob {
  id: string;
  platform: "aliexpress" | "amazon" | "alibaba" | "all";
  keywords: string;
  category?: string;
  maxProducts: number;
  totalTarget: number;
  marginPercent: number;
  status: "pending" | "running" | "completed" | "failed" | "stopped";
  imported: number;
  skipped: number;
  failed: number;
  processed: number;
  totalPages: number;
  currentPage: number;
  errors: string[];
  startedAt?: Date;
  completedAt?: Date;
}

const jobs = new Map<string, BulkImportJob>();
let activeJobId: string | null = null;

function generateJobId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function getAliExpressCreds(): Promise<AliExpressCredentials | null> {
  const [keyRow] = await db.select().from(platform_settings).where(eq(platform_settings.key, "aliexpress_app_key"));
  const [secretRow] = await db.select().from(platform_settings).where(eq(platform_settings.key, "aliexpress_app_key_secret"));
  const [trackRow] = await db.select().from(platform_settings).where(eq(platform_settings.key, "aliexpress_tracking_id"));
  if (!keyRow?.value || !secretRow?.value) return null;
  return { appKey: keyRow.value, appSecret: secretRow.value, trackingId: trackRow?.value || undefined };
}

async function getAmazonCreds(): Promise<AmazonCredentials | null> {
  const [keyRow] = await db.select().from(platform_settings).where(eq(platform_settings.key, "amazon_access_key"));
  const [secretRow] = await db.select().from(platform_settings).where(eq(platform_settings.key, "amazon_secret_key"));
  const [tagRow] = await db.select().from(platform_settings).where(eq(platform_settings.key, "amazon_partner_tag"));
  const [marketRow] = await db.select().from(platform_settings).where(eq(platform_settings.key, "amazon_marketplace"));
  if (!keyRow?.value || !secretRow?.value || !tagRow?.value) return null;
  return {
    accessKey: keyRow.value,
    secretKey: secretRow.value,
    partnerTag: tagRow.value,
    marketplace: marketRow?.value || "us",
  };
}

async function getAlibabaCreds(): Promise<AlibabaCredentials | null> {
  const [keyRow] = await db.select().from(platform_settings).where(eq(platform_settings.key, "alibaba_app_key"));
  const [secretRow] = await db.select().from(platform_settings).where(eq(platform_settings.key, "alibaba_app_secret"));
  if (!keyRow?.value || !secretRow?.value) return null;
  return { appKey: keyRow.value, appSecret: secretRow.value };
}

async function saveProduct(
  job: BulkImportJob,
  sourceId: string,
  platform: string,
  name: string,
  price: number,
  originalPrice: number,
  currency: string,
  image: string,
  sourceUrl: string,
  supplierName: string,
  commissionRate: number,
  categoryName?: string,
  rawStock?: number,
): Promise<"imported" | "skipped" | "failed"> {
  try {
    // Check for duplicate by source_id
    const [existing] = await db.select().from(dropship_products).where(eq(dropship_products.source_id, sourceId));
    if (existing) {
      job.skipped++;
      job.processed = job.imported + job.skipped + job.failed;
      return "skipped";
    }

    const realStock = rawStock && rawStock > 0 ? rawStock : (35 + (Math.abs(parseInt(String(sourceId), 10) || 1) % 95));
    const ourPrice = parseFloat((price * (1 + job.marginPercent / 100)).toFixed(2));
    const matchedCategoryId = await matchCategoryId(`${name} ${categoryName || ""}`);

    const [newProduct] = await db.insert(products).values({
      name_ar: name.slice(0, 450),
      name_en: name.slice(0, 450),
      sku: `${platform.toUpperCase().slice(0, 3)}-${sourceId.slice(-12)}`,
      price: ourPrice,
      cost: price,
      quantity: realStock,
      min_quantity: Math.min(5, realStock),
      category_id: matchedCategoryId,
      description_ar: categoryName ? `منتج من ${platform} - ${supplierName} - التصنيف: ${categoryName}` : `منتج من ${platform} - ${supplierName}`,
      description_en: categoryName ? `Product from ${platform} - ${supplierName} - Category: ${categoryName}` : `Product from ${platform} - ${supplierName}`,
      image: image || "",
      is_active: true,
    }).returning();

    await db.insert(dropship_products).values({
      product_id: newProduct.id,
      platform,
      source_id: sourceId,
      source_url: sourceUrl,
      source_price: price,
      our_price: ourPrice,
      supplier_name: supplierName,
      platform_commission_rate: commissionRate,
    }).returning();

    job.imported++;
    job.processed = job.imported + job.skipped + job.failed;
    return "imported";
  } catch (err: any) {
    logger.error({ err: err.message, sourceId, platform }, "Bulk import save failed");
    job.failed++;
    job.processed = job.imported + job.skipped + job.failed;
    job.errors.push(`Failed to save ${sourceId}: ${err.message}`);
    return "failed";
  }
}

async function importAliExpress(job: BulkImportJob): Promise<void> {
  const creds = await getAliExpressCreds();
  if (!creds) { job.errors.push("AliExpress credentials not configured"); return; }

  let page = 1;
  const pageSize = 50;

  while (job.imported + job.skipped + job.failed < job.maxProducts && job.status === "running") {
    try {
      const items = await searchAliExpressProducts(job.keywords, creds, page, pageSize, job.category);
      if (!items || !items.length) break;

      job.totalPages = Math.ceil(job.maxProducts / pageSize);
      job.currentPage = page;

      for (const item of items) {
        if (job.imported + job.skipped + job.failed >= job.maxProducts) break;
        if (job.status !== "running") break;

        const price = parseFloat(item.target_sale_price) || parseFloat(item.target_original_price) || 0;
        const realStock = extractRealSupplierStock(item);
        if (price <= 0 || realStock <= 0) {
          job.skipped++;
          continue;
        }

        await saveProduct(
          job,
          item.product_id,
          "aliexpress",
          item.product_title,
          price,
          parseFloat(item.target_original_price) || price,
          item.target_sale_price_currency,
          item.product_main_image_url,
          item.product_detail_url,
          item.shop_name || "AliExpress",
          parseFloat(item.commission_rate) || 0,
          item.first_level_category_name,
          realStock,
        );

        // Rate limiting: 1 request per second for AliExpress
        await new Promise(r => setTimeout(r, 1000));
      }

      page++;
      if (items.length < pageSize) break;
    } catch (err: any) {
      job.errors.push(`AliExpress page ${page} failed: ${err.message}`);
      break;
    }
  }
}

async function importAmazon(job: BulkImportJob): Promise<void> {
  const creds = await getAmazonCreds();
  if (!creds) { job.errors.push("Amazon credentials not configured"); return; }

  let page = 1;
  const pageSize = 10; // Amazon PAAPI limit

  while (job.imported + job.skipped + job.failed < job.maxProducts && job.status === "running") {
    try {
      const { products: items, totalResults } = await searchAmazonProducts(job.keywords, creds, page, pageSize);
      if (!items.length) break;

      job.totalPages = Math.ceil((totalResults || items.length) / pageSize);
      job.currentPage = page;

      for (const item of items) {
        if (job.imported + job.skipped + job.failed >= job.maxProducts) break;
        if (job.status !== "running") break;

        const realStock = extractRealSupplierStock(item);
        if (realStock <= 0) {
          job.skipped++;
          continue;
        }

        await saveProduct(
          job,
          item.id || item.asin,
          "amazon",
          item.title,
          item.price,
          item.listPrice || item.price,
          item.currency,
          item.imageUrl,
          item.detailUrl || item.detailPageUrl,
          item.brand || "Amazon",
          0,
          item.category,
          realStock,
        );

        // Rate limiting: 1 request per second for Amazon
        await new Promise(r => setTimeout(r, 1000));
      }

      page++;
      if (items.length < pageSize) break;
    } catch (err: any) {
      job.errors.push(`Amazon page ${page} failed: ${err.message}`);
      break;
    }
  }
}

async function importAlibaba(job: BulkImportJob): Promise<void> {
  const creds = await getAlibabaCreds();
  if (!creds) { job.errors.push("Alibaba credentials not configured"); return; }

  let page = 1;
  const pageSize = 50;

  while (job.imported + job.skipped + job.failed < job.maxProducts && job.status === "running") {
    try {
      const items = await searchAlibabaProducts(job.keywords, creds, page, pageSize);
      if (!items.length) break;

      job.totalPages = Math.ceil(items.length / pageSize) || 1;
      job.currentPage = page;

      for (const item of items) {
        if (job.imported + job.skipped + job.failed >= job.maxProducts) break;
        if (job.status !== "running") break;

        const realStock = extractRealSupplierStock(item);
        if (realStock <= 0) {
          job.skipped++;
          continue;
        }

        await saveProduct(
          job,
          item.productId,
          "alibaba",
          item.productTitle || item.subject || "",
          item.salePrice || parseFloat(item.price) || 0,
          item.originalPrice || item.salePrice || parseFloat(item.price) || 0,
          item.currency || "USD",
          item.productImage || item.imageUrl || "",
          item.productUrl || item.detailUrl || "",
          item.supplierName || "Alibaba",
          0,
          item.categoryName,
          realStock,
        );

        // Rate limiting: 1 request per second
        await new Promise(r => setTimeout(r, 1000));
      }

      page++;
      if (items.length < pageSize) break;
    } catch (err: any) {
      job.errors.push(`Alibaba page ${page} failed: ${err.message}`);
      break;
    }
  }
}

export async function startBulkImport(
  platform: "aliexpress" | "amazon" | "alibaba" | "all",
  keywords: string,
  maxProducts: number,
  marginPercent: number = 300,
  _categoryId?: number | null,
  _credentials?: any,
): Promise<string> {
  if (activeJobId && jobs.get(activeJobId)?.status === "running") {
    throw new Error("There is already an active import job. Please wait or stop it first.");
  }

  const jobId = generateJobId();
  const targetCount = Math.min(maxProducts, 10000);
  const job: BulkImportJob = {
    id: jobId,
    platform,
    keywords,
    maxProducts: targetCount,
    totalTarget: targetCount,
    marginPercent,
    status: "running",
    imported: 0,
    skipped: 0,
    failed: 0,
    processed: 0,
    totalPages: 0,
    currentPage: 0,
    errors: [],
    startedAt: new Date(),
  };

  jobs.set(jobId, job);
  activeJobId = jobId;

  // Run in background
  setImmediate(async () => {
    try {
      if (platform === "all" || platform === "aliexpress") {
        await importAliExpress(job);
      }
      if (platform === "all" || platform === "amazon") {
        await importAmazon(job);
      }
      if (platform === "all" || platform === "alibaba") {
        await importAlibaba(job);
      }

      if (job.status === "running") {
        job.status = "completed";
        job.completedAt = new Date();
      }
    } catch (err: any) {
      job.status = "failed";
      job.errors.push(`Fatal error: ${err.message}`);
      job.completedAt = new Date();
    } finally {
      activeJobId = null;
    }
  });

  return jobId;
}

export function stopBulkImport(jobId: string): boolean {
  const job = jobs.get(jobId);
  if (!job) return false;
  if (job.status === "running") {
    job.status = "stopped";
    job.completedAt = new Date();
    activeJobId = null;
    return true;
  }
  return false;
}

export function getJobStatus(jobId: string): BulkImportJob | undefined {
  return jobs.get(jobId);
}

export function getAllJobs(): BulkImportJob[] {
  return Array.from(jobs.values()).sort((a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0));
}

export function getActiveJob(): BulkImportJob | undefined {
  if (!activeJobId) return undefined;
  return jobs.get(activeJobId);
}
