import rateLimit from "express-rate-limit";
import { env } from "../lib/env";

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "تم تجاوز عدد الطلبات المسموح بها. يرجى المحاولة لاحقاً" },
  keyGenerator: (req) => req.ip || "unknown",
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "محاولات تسجيل دخول كثيرة. يرجى المحاولة لاحقاً" },
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.ip || "unknown",
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "تم تجاوز عدد عمليات الرفع المسموح بها" },
  keyGenerator: (req) => req.ip || "unknown",
});
