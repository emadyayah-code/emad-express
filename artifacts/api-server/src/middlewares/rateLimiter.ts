import rateLimit from "express-rate-limit";
import { env } from "../lib/env";

const rateLimitFn: any = (rateLimit as any)?.default || rateLimit;

const getClientIp = (req: any) => {
  return (
    (req.headers["cf-connecting-ip"] as string) ||
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown"
  );
};

export const globalRateLimiter = rateLimitFn({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Math.max(5000, Number(env.RATE_LIMIT_MAX) || 5000), // Generous limit for high-volume store traffic
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "تم تجاوز عدد الطلبات المسموح بها مؤقتاً. يرجى المحاولة بعد قليل" },
  keyGenerator: getClientIp,
  skip: (req: any) => {
    // Completely exempt admin operations and internal dropship synchronization from rate limiting
    if (req.path?.startsWith("/admin") || req.path?.includes("sync") || req.path?.includes("dropship")) {
      return true;
    }
    return false;
  },
});

export const authRateLimiter = rateLimitFn({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "محاولات تسجيل دخول كثيرة. يرجى المحاولة بعد قليل" },
  skipSuccessfulRequests: true,
  keyGenerator: getClientIp,
});

export const uploadRateLimiter = rateLimitFn({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "تم تجاوز عدد عمليات الرفع المسموح بها" },
  keyGenerator: getClientIp,
});

export const orderRateLimiter = rateLimitFn({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // max 15 order creation attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "يرجى الانتظار قليلاً قبل إرسال طلب جديد" },
  keyGenerator: getClientIp,
});

