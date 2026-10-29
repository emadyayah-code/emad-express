import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { mkdirSync, existsSync } from "fs";
import { join, resolve } from "path";
import router from "./routes/index";
import privacyRouter from "./routes/privacy";
import { logger } from "./lib/logger";
import { env } from "./lib/env";
import { globalRateLimiter } from "./middlewares/rateLimiter";
import { requestId, timeoutMiddleware, sanitizeInput } from "./middlewares/security";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";

const isServerlessEnv = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION);
const UPLOADS_DIR = isServerlessEnv ? "/tmp/uploads" : env.UPLOADS_DIR;
try {
  mkdirSync(UPLOADS_DIR, { recursive: true });
} catch {
  // Read-only filesystem in serverless environments
}

const app: Express = express();
app.disable("x-powered-by");

// Trust proxy for accurate client IP behind reverse proxy
if (env.TRUST_PROXY) {
  app.set("trust proxy", true);
}

// Restore rewritten URL in Vercel/serverless environments
app.use((req, res, next) => {
  const original = (req.headers["x-matched-path"] as string) || (req.headers["x-invoke-path"] as string);
  if (original && original !== req.url) {
    req.url = original;
  }
  next();
});

// Block sensitive file and path scanning attempts
app.use((req, res, next) => {
  const lowerUrl = req.url.toLowerCase();
  if (
    lowerUrl.includes("/.env") ||
    lowerUrl.includes("/.git") ||
    lowerUrl.includes("/package.json") ||
    lowerUrl.includes("/tsconfig") ||
    lowerUrl.includes("/node_modules")
  ) {
    return res.status(403).json({ success: false, message: "ممنوع الوصول" });
  }
  next();
});

// Quick top-level health and API checks
app.get("/api", (_req, res) => res.json({
  success: true,
  service: "emad-express-api",
  status: "online",
  message: "منصة عماد إكسبرس API تعمل بنجاح",
  health: "/api/health"
}));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// Request ID for tracing
app.use(requestId);

// Security headers
const helmetFn: any = (helmet as any)?.default || helmet;
app.use(helmetFn({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS - restrict in production
app.use(cors({
  origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
}));

// Request timeout
app.use(timeoutMiddleware(30000));

// Body parsers with limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sanitize query inputs
app.use(sanitizeInput);

// HTTP logging
const pinoHttpFn: any = (pinoHttp as any)?.default || pinoHttp;
app.use(
  pinoHttpFn({
    logger,
    genReqId: (req: any) => req?.id || "unknown",
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
          ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
    redact: {
      paths: ["req.headers.authorization", "req.headers.cookie", "req.body.password", "req.body.current_password"],
      censor: "[REDACTED]",
    },
  }),
);

// Static uploads
app.use("/uploads", express.static(UPLOADS_DIR, {
  maxAge: "1d",
  dotfiles: "deny",
}));

// Public Privacy Policy endpoint (Google Play / App Store / Web verified)
app.use(privacyRouter);

// API routes (with generous API rate limiting)
app.use("/api", globalRateLimiter, router);

// Serve admin panel & frontend directly on root domain if present
const possibleAdminDirs = [
  resolve(process.cwd(), "public"),
  resolve(process.cwd(), env.ADMIN_PANEL_DIR),
  resolve(process.cwd(), "../admin-panel/dist/public"),
  resolve(process.cwd(), "artifacts/admin-panel/dist/public"),
];
const adminPanelDir = possibleAdminDirs.find(d => existsSync(resolve(d, "index.html"))) || possibleAdminDirs[0];

if (existsSync(adminPanelDir)) {
  app.use(
    express.static(adminPanelDir, {
      setHeaders: (res, path) => {
        if (path.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else if (path.includes("/assets/") || path.includes("\\assets\\")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    })
  );
}

app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
  const indexHtml = resolve(adminPanelDir, "index.html");
  if (existsSync(indexHtml)) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.sendFile(indexHtml);
  }
  return res.json({
    success: true,
    service: "emad-express-api",
    status: "online",
    message: "منصة عماد إكسبرس API تعمل بنجاح",
    docs: "/api/health"
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
