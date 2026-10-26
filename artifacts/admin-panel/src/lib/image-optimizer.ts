/**
 * Web Store Image URL Optimizer for Ultra-Fast CDN Delivery
 * Downsamples high-resolution 2MB-5MB images to lightweight 15KB-30KB CDN thumbnails:
 * - AliExpress (ali-media / alicdn): appends _350x350.jpg, _220x220.jpg, or _640x640.jpg
 * - Amazon (media-amazon): replaces SL1500 with SL350 or SL220
 * - Unsplash: adds width, quality & auto-format parameters
 */

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
