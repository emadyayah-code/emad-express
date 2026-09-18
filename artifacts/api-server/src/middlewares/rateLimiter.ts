import rateLimit from "express-rate-limit";
import { env } from "../lib/env";

const getClientIp = (req: any) => {
  return (
    (req.headers["cf-connecting-ip"] as string) ||
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown"
  );
};

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Math.max(3000, Number(env.RATE_LIMIT_MAX) || 3000), // 3000 requests per 15 minutes (plenty for apps and dashboards)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "تم تجاوز عدد الطلبات المسموح بها. يرجى المحاولة لاحقاً" },
  keyGenerator: getClientIp,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "محاولات تسجيل دخول كثيرة. يرجى المحاولة بعد قليل" },
  skipSuccessfulRequests: true,
  keyGenerator: getClientIp,
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "تم تجاوز عدد عمليات الرفع المسموح بها" },
  keyGenerator: getClientIp,
});
