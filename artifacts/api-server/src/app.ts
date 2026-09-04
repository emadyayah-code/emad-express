import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { mkdirSync } from "fs";
import { join, resolve } from "path";
import router from "./routes";
import privacyRouter from "./routes/privacy";
import { logger } from "./lib/logger";
import { env } from "./lib/env";
import { globalRateLimiter } from "./middlewares/rateLimiter";
import { requestId, timeoutMiddleware, sanitizeInput } from "./middlewares/security";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";

const UPLOADS_DIR = env.UPLOADS_DIR;
mkdirSync(UPLOADS_DIR, { recursive: true });

const app: Express = express();

// Trust proxy for accurate client IP behind reverse proxy
if (env.TRUST_PROXY) {
  app.set("trust proxy", true);
}

// Request ID for tracing
app.use(requestId);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
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
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req as any).id || "unknown",
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

// Rate limiting
app.use(globalRateLimiter);

// Static uploads
app.use("/uploads", express.static(UPLOADS_DIR, {
  maxAge: "1d",
  dotfiles: "deny",
}));

// Public Privacy Policy endpoint (Google Play / App Store / Web verified)
app.use(privacyRouter);

// API routes
app.use("/api", router);

// Serve admin panel & frontend directly on root domain
const adminPanelDir = resolve(process.cwd(), env.ADMIN_PANEL_DIR);
app.use(express.static(adminPanelDir, { maxAge: "1h" }));

app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
  res.sendFile(resolve(adminPanelDir, "index.html"));
});

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
