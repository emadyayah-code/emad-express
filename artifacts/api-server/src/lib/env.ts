import { cleanEnv, str, port, url, bool, num } from "envalid";

// Sanitize corrupted or mistakenly encrypted environment variables
const rawEnv: Record<string, string | undefined> = { ...process.env };
for (const [key, value] of Object.entries(rawEnv)) {
  if (typeof value === "string") {
    // If it starts with Vercel encrypted token marker or raw JSON blob
    if (value.startsWith("eyJ2I") || value.startsWith('{"v":')) {
      console.warn(`[WARN] Ignored corrupted environment variable for ${key}`);
      delete rawEnv[key];
    }
  }
}

// Clean non-numeric inputs for numeric specs to prevent envalid crashing on startup
const numericFields = ["PORT", "RATE_LIMIT_WINDOW_MS", "RATE_LIMIT_MAX", "BCRYPT_ROUNDS", "JWT_EXPIRY_HOURS", "MAX_FILE_SIZE_MB"];
for (const field of numericFields) {
  if (rawEnv[field] && isNaN(Number(rawEnv[field]))) {
    console.warn(`[WARN] Resetting invalid numeric field ${field}: "${rawEnv[field]}" to default.`);
    delete rawEnv[field];
  }
}

export const env = cleanEnv(rawEnv, {
  NODE_ENV: str({ choices: ["development", "production", "test"], default: "development" }),
  PORT: port({ default: 3000 }),
  SESSION_SECRET: str({ default: "dev-secret-change-me-please" }),
  DATABASE_URL: str({ default: "" }),
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
}, {
  reporter: ({ errors }) => {
    if (Object.keys(errors).length > 0) {
      console.warn("[WARN] Some environment variables had errors and used defaults:", Object.keys(errors));
    }
  }
});
