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

function cleanString(str: string): string {
  return str
    .replace(/\0/g, "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/[<>]/g, "");
}

function sanitizeObject(obj: any, depth = 0): any {
  if (depth > 6 || !obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === "string") {
        obj[i] = cleanString(obj[i]);
      } else if (typeof obj[i] === "object" && obj[i] !== null) {
        sanitizeObject(obj[i], depth + 1);
      }
    }
    return obj;
  }

  for (const key of Object.keys(obj)) {
    // Block prototype pollution vectors
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      delete obj[key];
      continue;
    }
    const val = obj[key];
    if (typeof val === "string") {
      // Preserve raw password strings without altering user credentials
      if (key !== "password" && key !== "current_password" && key !== "new_password" && key !== "confirmPassword") {
        obj[key] = cleanString(val);
      }
    } else if (typeof val === "object" && val !== null) {
      sanitizeObject(val, depth + 1);
    }
  }
  return obj;
}

export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  try {
    // Add defense-in-depth headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    if (req.query && typeof req.query === "object") {
      sanitizeObject(req.query);
    }
    if (req.body && typeof req.body === "object") {
      sanitizeObject(req.body);
    }
    if (req.params && typeof req.params === "object") {
      sanitizeObject(req.params);
    }
  } catch {}
  next();
}
