import { cleanEnv, str, port, url, bool, num } from "envalid";

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ["development", "production", "test"], default: "development" }),
  PORT: port({ default: 3000 }),
  SESSION_SECRET: str({ default: "dev-secret-change-me-please" }),
  DATABASE_URL: url(),
  UPLOADS_DIR: str({ default: "./assets/uploads" }),
  ADMIN_PANEL_DIR: str({ default: "./artifacts/admin-panel/dist/public" }),
  LOG_LEVEL: str({ choices: ["trace", "debug", "info", "warn", "error", "fatal"], default: "info" }),
  CORS_ORIGIN: str({ default: "*" }),
  RATE_LIMIT_WINDOW_MS: num({ default: 15 * 60 * 1000 }), // 15 minutes
  RATE_LIMIT_MAX: num({ default: 100 }),
  BCRYPT_ROUNDS: num({ default: 12 }),
  JWT_EXPIRY_HOURS: num({ default: 24 }),
  MAX_FILE_SIZE_MB: num({ default: 5 }),
  TRUST_PROXY: bool({ default: false }),
});
