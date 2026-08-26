import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    res.json({ status: "ok", timestamp: new Date().toISOString(), database: "connected" });
  } catch (err) {
    logger.error({ err }, "Health check failed - database unreachable");
    res.status(503).json({ status: "error", message: "Database unreachable", timestamp: new Date().toISOString() });
  }
});

router.get("/ready", async (_req, res) => {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    res.json({ status: "ready", timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: "not_ready", timestamp: new Date().toISOString() });
  }
});

export default router;
