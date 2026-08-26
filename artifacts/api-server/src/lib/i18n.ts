import { db, product_translations, products, categories } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export type SupportedLanguage = "ar" | "en";

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["ar", "en"];
export const DEFAULT_LANGUAGE: SupportedLanguage = "ar";

export interface TranslatedProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  sku: string;
  category_id: number | null;
  is_active: boolean;
  quantity: number;
}

export async function getProductTranslation(
  productId: number,
  language: SupportedLanguage,
): Promise<{ name: string; description: string } | null> {
  if (language === DEFAULT_LANGUAGE) {
    const [p] = await db.select({ name_ar: products.name_ar, description_ar: products.description_ar }).from(products).where(eq(products.id, productId));
    return p ? { name: p.name_ar, description: p.description_ar || "" } : null;
  }
  const [t] = await db.select().from(product_translations).where(
    and(eq(product_translations.product_id, productId), eq(product_translations.language, language))
  );
  if (t) return { name: t.name, description: t.description || "" };
  // Fallback to default
  const [p] = await db.select({ name_ar: products.name_ar, description_ar: products.description_ar }).from(products).where(eq(products.id, productId));
  return p ? { name: p.name_ar, description: p.description_ar || "" } : null;
}

export async function translateProduct(
  product: any,
  language: SupportedLanguage,
): Promise<TranslatedProduct> {
  const trans = await getProductTranslation(product.id, language);
  return {
    id: product.id,
    name: trans?.name || product.name_ar || product.name_en || "",
    description: trans?.description || "",
    price: product.price,
    image: product.image,
    sku: product.sku,
    category_id: product.category_id,
    is_active: product.is_active,
    quantity: product.quantity,
  };
}

export async function translateProducts(
  productsList: any[],
  language: SupportedLanguage,
): Promise<TranslatedProduct[]> {
  return Promise.all(productsList.map(p => translateProduct(p, language)));
}

export async function setProductTranslation(
  productId: number,
  language: SupportedLanguage,
  name: string,
  description: string,
): Promise<void> {
  const existing = await db.select().from(product_translations).where(
    and(eq(product_translations.product_id, productId), eq(product_translations.language, language))
  );
  if (existing.length > 0) {
    await db.update(product_translations).set({ name, description, updated_at: new Date() }).where(
      and(eq(product_translations.product_id, productId), eq(product_translations.language, language))
    );
  } else {
    await db.insert(product_translations).values({ product_id: productId, language, name, description });
  }
}

export async function getCategoryTranslation(
  categoryId: number,
  language: SupportedLanguage,
): Promise<{ name: string; description: string } | null> {
  if (language === DEFAULT_LANGUAGE) {
    const [c] = await db.select({ name_ar: categories.name_ar, description_ar: categories.description_ar }).from(categories).where(eq(categories.id, categoryId));
    return c ? { name: c.name_ar, description: c.description_ar || "" } : null;
  }
  // For simplicity, categories use name_ar/name_en directly
  const [c] = await db.select({ name_ar: categories.name_ar, name_en: categories.name_en, description_ar: categories.description_ar, description_en: categories.description_en }).from(categories).where(eq(categories.id, categoryId));
  if (!c) return null;
  return {
    name: language === "en" ? c.name_en : c.name_ar,
    description: language === "en" ? (c.description_en || "") : (c.description_ar || ""),
  };
}
