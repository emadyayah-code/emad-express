import { db, currencies } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger";

// Exchange rates cache (refreshed every hour)
let ratesCache: Record<string, number> = {};
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const DEFAULT_RATES: Record<string, number> = {
  USD: 1.0,
  SAR: 3.75,      // 1 USD = 3.75 SAR
  YER: 1500.0,    // 1 USD = 1500 YER (approx)
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
};

export async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (now - cacheTime < CACHE_TTL && Object.keys(ratesCache).length > 0) {
    return ratesCache;
  }

  try {
    const rows = await db.select().from(currencies).where(eq(currencies.is_active, true));
    ratesCache = {};
    rows.forEach(c => { ratesCache[c.code] = c.rate_to_usd; });
    cacheTime = now;
    return ratesCache;
  } catch (err) {
    logger.error({ err }, "Failed to load exchange rates, using defaults");
    return DEFAULT_RATES;
  }
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string,
): Promise<number> {
  if (from === to) return amount;
  const rates = await getExchangeRates();
  const fromRate = rates[from] || DEFAULT_RATES[from] || 1;
  const toRate = rates[to] || DEFAULT_RATES[to] || 1;
  // Convert: amount * (toRate / fromRate)
  return parseFloat(((amount / fromRate) * toRate).toFixed(2));
}

export function formatCurrency(amount: number, currency: string, locale: string = "ar-SA"): string {
  const symbols: Record<string, string> = {
    SAR: "ر.س",
    USD: "$",
    YER: "ر.ي",
    EUR: "€",
    GBP: "£",
    AED: "د.إ",
  };
  const symbol = symbols[currency] || currency;
  const formatted = amount.toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return locale === "ar" ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}

export async function seedCurrencies() {
  const existing = await db.select().from(currencies).limit(1);
  if (existing.length > 0) return;

  await db.insert(currencies).values([
    { code: "SAR", name_ar: "ريال سعودي", name_en: "Saudi Riyal", symbol: "ر.س", rate_to_usd: 3.75, is_active: true, is_default: true },
    { code: "USD", name_ar: "دولار أمريكي", name_en: "US Dollar", symbol: "$", rate_to_usd: 1.0, is_active: true, is_default: false },
    { code: "YER", name_ar: "ريال يمني", name_en: "Yemeni Rial", symbol: "ر.ي", rate_to_usd: 1500.0, is_active: true, is_default: false },
    { code: "EUR", name_ar: "يورو", name_en: "Euro", symbol: "€", rate_to_usd: 0.92, is_active: true, is_default: false },
    { code: "AED", name_ar: "درهم إماراتي", name_en: "UAE Dirham", symbol: "د.إ", rate_to_usd: 3.67, is_active: true, is_default: false },
  ]);
  logger.info("Currencies seeded");
}
