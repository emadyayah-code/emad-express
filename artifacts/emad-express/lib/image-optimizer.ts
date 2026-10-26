/**
 * Mobile App Image URL Optimizer for Ultra-Fast Loading
 * Converts high-resolution images to lightweight CDN thumbnails (15KB - 30KB)
 * and provides background prefetching for 0ms render latency.
 */
import { Image as ExpoImage } from "expo-image";

export type ImageSize = "thumb" | "card" | "detail" | "original";

export function getOptimizedImageUrl(url?: string | null, size: ImageSize = "card"): string {
  if (!url || typeof url !== "string") return "";
  let clean = url.trim();
  if (clean.startsWith("//")) clean = `https:${clean}`;

  if (size === "original") return clean;

  // 1. AliExpress CDN optimization
  if (clean.includes("aliexpress-media.com") || clean.includes("alicdn.com")) {
    const base = clean.replace(/_\d+x\d+\.(jpg|jpeg|png|webp).*$/i, "");
    if (size === "thumb") {
      return `${base}_220x220.jpg`;
    }
    if (size === "card") {
      return `${base}_350x350.jpg`;
    }
    return `${base}_640x640.jpg`;
  }

  // 2. Amazon PAAPI / S3 CDN optimization
  if (clean.includes("media-amazon.com") || clean.includes("images-amazon.com")) {
    if (size === "thumb") {
      return clean.replace(/\._AC_SL\d+_\./, "._AC_SL220_.");
    }
    if (size === "card") {
      return clean.replace(/\._AC_SL\d+_\./, "._AC_SL350_.");
    }
    return clean.replace(/\._AC_SL\d+_\./, "._AC_SL640_.");
  }

  // 3. Unsplash images
  if (clean.includes("images.unsplash.com")) {
    const width = size === "thumb" ? 220 : size === "card" ? 350 : 640;
    const cleanUrl = clean.replace(/[?&]w=\d+/, "").replace(/[?&]q=\d+/, "");
    const separator = cleanUrl.includes("?") ? "&" : "?";
    return `${cleanUrl}${separator}w=${width}&q=80&auto=format`;
  }

  return clean;
}

/**
 * Prefetches an array of product image URLs into device RAM/disk cache
 * for instant, zero-delay rendering when scrolled into view.
 */
export function prefetchProductImages(items: any[], count = 12): void {
  if (!Array.isArray(items) || items.length === 0) return;
  try {
    const urls = items
      .slice(0, count)
      .map((it) => getOptimizedImageUrl(it?.image, "card"))
      .filter((u) => Boolean(u) && u.startsWith("http"));

    if (urls.length > 0) {
      ExpoImage.prefetch(urls);
    }
  } catch {}
}
