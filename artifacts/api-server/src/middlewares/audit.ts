import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

const SENSITIVE_FIELDS = ["password", "current_password", "token", "secret", "credit_card", "cvv"];

function sanitizeBody(body: any): any {
  if (!body || typeof body !== "object") return body;
  const sanitized: any = {};
  for (const [key, value] of Object.entries(body)) {
    if (SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f))) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function auditLog(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = (req as any).session;
    logger.info({
      action,
      userId: session?.userId,
      role: session?.role,
      ip: req.ip,
      method: req.method,
      path: req.path,
      body: sanitizeBody(req.body),
    }, `Audit: ${action}`);
    next();
  };
}
