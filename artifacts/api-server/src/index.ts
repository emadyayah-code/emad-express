import app from "./app";
import { logger } from "./lib/logger";
import { env } from "./lib/env";
import { pool } from "@workspace/db";
import { seedIfEmpty, startPriceSyncJob } from "./routes/emad";

const port = env.PORT;

const server = app.listen(port, async (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port, nodeEnv: env.NODE_ENV }, "Server listening");
  try {
    await seedIfEmpty();
    startPriceSyncJob();
  } catch (e) {
    logger.error({ err: e }, "Seed failed");
  }
});

// Graceful shutdown
function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down gracefully...");
  server.close(async () => {
    try {
      await pool.end();
      logger.info("Database pool closed");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during shutdown");
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled rejection");
});
