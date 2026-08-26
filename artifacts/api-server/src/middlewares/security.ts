import type { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export function requestId(req: Request, _res: Response, next: NextFunction) {
  (req as any).id = uuidv4();
  next();
}

export function timeoutMiddleware(ms: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.setTimeout(ms, () => {
      res.status(408).json({ success: false, message: "انتهت مهلة الطلب" });
    });
    next();
  };
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  // Basic XSS prevention for query params
  if (req.query && typeof req.query === "object") {
    try {
      for (const key of Object.keys(req.query)) {
        const val = req.query[key];
        if (typeof val === "string") {
          (req.query as any)[key] = val.replace(/[<>]/g, "");
        }
      }
    } catch {}
  }
  next();
}
