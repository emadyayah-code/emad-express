import { db, products, dropship_products, platform_settings } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { logger } from "./logger";
import { fetchAliExpressProduct, searchAliExpressProducts, type AliExpressCredentials } from "./aliexpress";
import { searchAmazonItems, type AmazonCredentials } from "./amazon";
import { searchAlibabaProducts, type AlibabaCredentials } from "./alibaba";

// In-memory job queue
interface ImportJob {
  id: string;
  platform: string;
  keywords: string;
  status: "pending" | "running" | "completed" | "failed";
  totalTarget: number;
  processed: number;
  imported: number;
  skipped: number;
  errors: string[];
  startedAt: Date;
  completedAt?: Date;
  marginPercent: number;
  categoryId?: number | null;
}

const jobs = new Map<string, ImportJob>();

export function getJobStatus(jobId: string): ImportJob | undefined {
  return jobs.get(jobId);
}

export function getAllJobs(): ImportJob[] {
  return Array.from(jobs.values()).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}

function generateJobId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Deduplication: check if product already exists by source_id
async function isDuplicate(sourceId: string, platform: string): Promise<boolean> {
  const [existing] = await db.select().from(dropship_products).where(
    and(eq(dropship_products.source_id, sourceId), eq(dropship_products.platform, platform))
  );
  return !!existing;
}

// Save a single product
async function saveProduct(
  item: any,
  platform: string,
  marginPercent: number,
  categoryId?: number | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    const sourceId = item.source_id || item.ASIN || item.productId || item.id;
    if (!sourceId) return { success: false, error: "Missing source ID" };

    const dup = await isDuplicate(String(sourceId), platform);
    if (dup) return { success: false, error: "Duplicate" };

    let name = item.name || item.product_title || item.subject || item.ItemInfo?.Title?.DisplayValue || "Unknown Product";
    let image = item.image || item.product_main_image_url || item.Images?.Primary?.Large?.URL || item.imageUrl || "";
    let sourcePrice = parseFloat(item.price || item.target_sale_price || item.target_original_price || item.Price?.Amount || item.minPrice || "0");
    let sourceUrl = item.source_url || item.DetailPageURL || item.detailUrl || "";
    let supplierName = item.shop_name || item.supplierName || item.supplier_name || "";
    let commissionRate = parseFloat(item.commission_rate || item.Commission?.Rate || "0");

    const ourPrice = parseFloat((sourcePrice * (1 + marginPercent / 100)).toFixed(2));
    const sku = `${platform.toUpperCase().slice(0, 3)}-${String(sourceId).slice(-12)}`;

    const [newProduct] = await db.insert(products).values({
      name: name.slice(0, 200),
      sku: sku.slice(0, 100),
      price: ourPrice,
      cost: sourcePrice,
      quantity: 999,
      min_quantity: 0,
      category_id: categoryId || null,
      description: `منتج مستورد من ${platform} - ${supplierName}`.slice(0, 500),
      image: image.slice(0, 2000),
      is_active: true,
    }).returning();

    await db.insert(dropship_products).values({
      product_id: newProduct.id,
      platform,
      source_id: String(sourceId).slice(0, 200),
      source_url: sourceUrl.slice(0, 2000),
      source_price: sourcePrice,
      our_price: ourPrice,
      supplier_name: supplierName.slice(0, 100),
      platform_commission_rate: commissionRate,
    });

    return { success: true };
  } catch (err: any) {
    if (err.message?.includes("unique constraint")) return { success: false, error: "Duplicate SKU" };
    return { success: false, error: err.message };
  }
}

// ========== ALIEXPRESS BULK IMPORT ==========
async function runAliExpressBulkImport(
  job: ImportJob,
  creds: AliExpressCredentials,
): Promise<void> {
  let page = 1;
  const maxPages = Math.ceil(job.totalTarget / 50);
  const perPage = 50;

  while (job.processed < job.totalTarget && page <= maxPages) {
    try {
      const items = await searchAliExpressProducts(job.keywords, creds, page, perPage);
      if (!items.length) break;

      for (const item of items) {
        if (job.processed >= job.totalTarget) break;

        const enriched = await fetchAliExpressProduct(item.product_id, creds);
        const productData = enriched || item;

        const result = await saveProduct(productData, "aliexpress", job.marginPercent, job.categoryId);
        if (result.success) job.imported++;
        else if (result.error === "Duplicate" || result.error === "Duplicate SKU") job.skipped++;
        else job.errors.push(`${productData.product_id}: ${result.error}`);

        job.processed++;
      }

      page++;
      await delay(500); // Rate limit: 2 req/sec max
    } catch (err: any) {
      job.errors.push(`Page ${page}: ${err.message}`);
      page++;
      await delay(1000);
    }
  }
}

// ========== AMAZON BULK IMPORT ==========
async function runAmazonBulkImport(
  job: ImportJob,
  creds: AmazonCredentials,
): Promise<void> {
  let page = 1;
  const maxPages = Math.ceil(job.totalTarget / 10);

  while (job.processed < job.totalTarget && page <= maxPages) {
    try {
      const items = await searchAmazonItems(job.keywords, creds, page);
      if (!items.length) break;

      for (const item of items) {
        if (job.processed >= job.totalTarget) break;

        const price = item.Offers?.Listings?.[0]?.Price?.Amount || 0;
        const productData = {
          id: item.ASIN,
          source_id: item.ASIN,
          name: item.ItemInfo?.Title?.DisplayValue,
          image: item.Images?.Primary?.Large?.URL,
          price: price,
          source_url: item.DetailPageURL,
          shop_name: item.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName,
          commission_rate: 0,
        };

        const result = await saveProduct(productData, "amazon", job.marginPercent, job.categoryId);
        if (result.success) job.imported++;
        else if (result.error === "Duplicate" || result.error === "Duplicate SKU") job.skipped++;
        else job.errors.push(`${item.ASIN}: ${result.error}`);

        job.processed++;
      }

      page++;
      await delay(1200); // Amazon rate limit: ~1 req/sec
    } catch (err: any) {
      job.errors.push(`Page ${page}: ${err.message}`);
      page++;
      await delay(2000);
    }
  }
}

// ========== ALIBABA BULK IMPORT ==========
async function runAlibabaBulkImport(
  job: ImportJob,
  creds: AlibabaCredentials,
): Promise<void> {
  let page = 1;
  const maxPages = Math.ceil(job.totalTarget / 50);
  const perPage = 50;

  while (job.processed < job.totalTarget && page <= maxPages) {
    try {
      const items = await searchAlibabaProducts(job.keywords, creds, page, perPage);
      if (!items.length) break;

      for (const item of items) {
        if (job.processed >= job.totalTarget) break;

        const price = parseFloat(item.price || "0");
        const productData = {
          id: item.productId,
          source_id: item.productId,
          name: item.subject,
          image: item.imageUrl,
          price: price,
          source_url: item.detailUrl,
          shop_name: item.supplierName,
          commission_rate: 0,
        };

        const result = await saveProduct(productData, "alibaba", job.marginPercent, job.categoryId);
        if (result.success) job.imported++;
        else if (result.error === "Duplicate" || result.error === "Duplicate SKU") job.skipped++;
        else job.errors.push(`${item.productId}: ${result.error}`);

        job.processed++;
      }

      page++;
      await delay(800); // Rate limit
    } catch (err: any) {
      job.errors.push(`Page ${page}: ${err.message}`);
      page++;
      await delay(1500);
    }
  }
}

// ========== PUBLIC START IMPORT ==========
export async function startBulkImport(
  platform: string,
  keywords: string,
  totalTarget: number,
  marginPercent: number,
  categoryId?: number | null,
  credentials?: any,
): Promise<string> {
  const jobId = generateJobId();
  const job: ImportJob = {
    id: jobId,
    platform,
    keywords,
    status: "running",
    totalTarget,
    processed: 0,
    imported: 0,
    skipped: 0,
    errors: [],
    startedAt: new Date(),
    marginPercent,
    categoryId,
  };

  jobs.set(jobId, job);

  // Run in background (non-blocking)
  setImmediate(async () => {
    try {
      if (platform === "aliexpress" && credentials?.aliexpress) {
        await runAliExpressBulkImport(job, credentials.aliexpress);
      } else if (platform === "amazon" && credentials?.amazon) {
        await runAmazonBulkImport(job, credentials.amazon);
      } else if (platform === "alibaba" && credentials?.alibaba) {
        await runAlibabaBulkImport(job, credentials.alibaba);
      } else {
        job.errors.push("No valid credentials provided for platform");
      }

      job.status = job.errors.length > 10 && job.imported === 0 ? "failed" : "completed";
      job.completedAt = new Date();
    } catch (err: any) {
      job.status = "failed";
      job.errors.push(`Fatal error: ${err.message}`);
      job.completedAt = new Date();
    }
  });

  return jobId;
}

// Cleanup old jobs (keep last 50)
setInterval(() => {
  const all = getAllJobs();
  if (all.length > 50) {
    const toDelete = all.slice(50);
    toDelete.forEach(j => jobs.delete(j.id));
  }
}, 60 * 60 * 1000); // Every hour
