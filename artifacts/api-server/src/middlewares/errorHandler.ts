import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export function createError(message: string, statusCode: number = 500, code?: string): ApiError {
  const err = new Error(message) as ApiError;
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

export function errorHandler(err: ApiError, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV === "development";

  if (statusCode >= 500) {
    logger.error({ err: err.message, stack: err.stack }, "Server error");
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "بيانات غير صالحة",
      errors: err.errors.map(e => ({ path: e.path.join("."), message: e.message })),
    });
  }

  let userMessage = err.message || "حدث خطأ ما";

  // Sanitize internal database errors and raw SQL queries
  if (
    userMessage.includes("Failed query:") ||
    userMessage.includes("select \"") ||
    userMessage.includes("insert into") ||
    userMessage.includes("update \"") ||
    userMessage.includes("delete from") ||
    userMessage.includes("relation \"") ||
    userMessage.includes("column \"") ||
    userMessage.includes("Database unreachable") ||
    userMessage.includes("ECONNREFUSED") ||
    userMessage.includes("ENOTFOUND")
  ) {
    userMessage = "تعذر الاتصال بقاعدة البيانات أو معالجة الطلب حالياً، يرجى المحاولة لاحقاً";
  }

  res.status(statusCode).json({
    success: false,
    message: userMessage,
    ...(isDev ? { stack: err.stack, details: err.message } : {}),
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: "المسار غير موجود" });
}
