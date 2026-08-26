import { createHmac, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import { env } from "./env";

const SECRET = env.SESSION_SECRET;
const JWT_EXPIRY_MS = env.JWT_EXPIRY_HOURS * 60 * 60 * 1000;

export interface SessionPayload {
  userId: number;
  customerId?: number;
  role: string;
  iat: number;
  exp: number;
  jti: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export function signToken(payload: Omit<SessionPayload, "iat" | "exp" | "jti">): string {
  const now = Date.now();
  const fullPayload: SessionPayload = {
    ...payload,
    iat: now,
    exp: now + JWT_EXPIRY_MS,
    jti: randomBytes(16).toString("hex"),
  };
  const body = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = createHmac("sha256", SECRET).update(body).digest("base64url");
    if (sig !== expected) return null;
    const payload: SessionPayload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSession(req: Request): SessionPayload | null {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  return verifyToken(token);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ success: false, message: "غير مصرح. الرجاء تسجيل الدخول" });
  }
  (req as any).session = session;
  return next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = (req as any).session as SessionPayload | undefined;
    if (!session) {
      return res.status(401).json({ success: false, message: "غير مصرح" });
    }
    if (!roles.includes(session.role)) {
      return res.status(403).json({ success: false, message: "ليس لديك صلاحية للوصول" });
    }
    return next();
  };
}
