import app from "./app";
import { logger } from "./lib/logger";
import { env } from "./lib/env";
import { pool, initDbSchema } from "@workspace/db";
import { seedIfEmpty, startPriceSyncJob, startAutoImportJob } from "./routes/emad";

const port = env.PORT;
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.NOW_REGION
);

let server: any = null;

if (!isServerless) {
  server = app.listen(port, "0.0.0.0", async () => {
    logger.info({ port, nodeEnv: env.NODE_ENV }, "Server listening");
    try {
      logger.info("Initializing database schema...");
      await initDbSchema(pool);
      logger.info("Database schema initialized. Seeding initial data...");
      await seedIfEmpty();
      startPriceSyncJob();
      startAutoImportJob();
    } catch (e) {
      logger.error({ err: e }, "Database initialization/seed failed");
    }
  });

  server.on("error", (err: any) => {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  });
} else {
  // In Serverless/Vercel: ensure pool errors are logged and not fatal
  pool.on("error", (err) => {
    logger.error({ err }, "Database pool error in serverless environment");
  });
}

// Graceful shutdown - only for persistent server environments (Docker, VPS, cPanel)
if (!isServerless) {
  function shutdown(signal: string) {
    logger.info({ signal }, "Shutting down gracefully...");
    if (server) {
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
    } else {
      pool.end().finally(() => process.exit(0));
    }

    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception");
    shutdown("uncaughtException");
  });
}

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled rejection");
});

export default app;
export { app };

