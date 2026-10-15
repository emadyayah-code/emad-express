import app from "../dist/index.mjs";

export default function handler(req, res) {
  try {
    return app(req, res);
  } catch (err) {
    console.error("Vercel Serverless Invocation Error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal Server Error",
        message: err?.message || String(err),
      });
    }
  }
}
