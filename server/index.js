/**
 * index.js — Express server entry point
 * Qwen↔ChatGPT Bridge local archival backend
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authMiddleware = require("./middleware/auth");
const sessionsRouter = require("./routes/sessions");
const messagesRouter = require("./routes/messages");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security Headers ──────────────────────────────────────────
app.use(helmet());

// ─── CORS Configuration ────────────────────────────────────────
// Allow requests from any Chrome extension origin
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests from Chrome extensions and localhost
      if (
        !origin ||
        origin.startsWith("chrome-extension://") ||
        origin.startsWith("http://localhost")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Body Parsing ───────────────────────────────────────────────
app.use(express.json({ limit: "5mb" })); // LLM responses can be large

// ─── Health Check (unauthenticated) ─────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Auth Middleware (all routes below require token) ───────────
app.use(authMiddleware);

// ─── Routes ─────────────────────────────────────────────────────
app.use("/api/sessions", sessionsRouter);
app.use("/api/messages", messagesRouter);

// ─── 404 Handler ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

// ─── Error Handler ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Server] Unhandled error:", err.message);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

// ─── Start Server ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ⚡ Qwen↔ChatGPT Bridge Server`);
  console.log(`  ├─ Port:      ${PORT}`);
  console.log(`  ├─ Database:  ${process.env.DB_NAME || "llm_bridge"}`);
  console.log(`  ├─ Auth:      ${process.env.AUTH_TOKEN ? "✓ Token configured" : "✗ NO TOKEN SET"}`);
  console.log(`  └─ Ready at:  http://localhost:${PORT}\n`);
});

module.exports = app;
