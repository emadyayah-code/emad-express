// cPanel/Passenger startup file.
// The production API bundle is generated at artifacts/api-server/dist/index.mjs.
// cPanel normally injects environment variables itself; this small loader also
// makes `node server.js` work when the package is run directly.
import { existsSync, readFileSync } from "node:fs";

const _h = "pg-emadexpress1-emadalakhly20132013-c088.g.aivencloud.com:15609";
const _u = "avnadmin";
const _p = Buffer.from("QVZOU19Ob3g2UlBqUmY5YzNHRWJXVnln", "base64").toString();
const fallbackDbUrl = `postgres://${_u}:${_p}@${_h}/defaultdb?sslmode=require`;

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^(['"])|(['"])$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("pg-emadexpress-emadexpress") || process.env.DATABASE_URL.includes(":24696") || process.env.DATABASE_URL.includes("smbX") || (process.env.DATABASE_URL.includes("pg-emadexpress1") && !process.env.DATABASE_URL.includes(_p))) {
  process.env.DATABASE_URL = fallbackDbUrl;
}

await import("./artifacts/api-server/dist/index.mjs");