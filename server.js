// cPanel/Passenger startup file.
// The production API bundle is generated at artifacts/api-server/dist/index.mjs.
// cPanel normally injects environment variables itself; this small loader also
// makes `node server.js` work when the package is run directly.
import { existsSync, readFileSync } from "node:fs";

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

await import("./artifacts/api-server/dist/index.mjs");