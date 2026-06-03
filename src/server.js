'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const { ensureIndexes } = require('./db/indexes');

// ── Environment variable validation ──────────────────────────────────────────
// (Full validation is wired in Task 10.2; basic check here to fail fast)
const REQUIRED_ENV_VARS = ['MONGODB_URI'];
for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    console.error(`[startup] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 3000;
if (!process.env.PORT) {
  console.warn('[startup] PORT not set, defaulting to 3000');
}

if (!process.env.FRONTEND_ORIGIN) {
  console.warn('[startup] FRONTEND_ORIGIN not set; CORS will be unrestricted in production');
}

const MONGODB_URI = process.env.MONGODB_URI;

// ── MongoDB connection with exponential backoff ───────────────────────────────
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function connectWithRetry(attempt = 1) {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[db] Connected to MongoDB');
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(
        `[db] Connection attempt ${attempt} failed. Retrying in ${delay}ms…`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectWithRetry(attempt + 1);
    }
    console.error(
      `[db] Failed to connect after ${MAX_RETRIES} attempts: ${err.message}`
    );
    process.exit(1);
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
(async () => {
  await connectWithRetry();

  // Ensure MongoDB indexes are in place after connection is established
  await ensureIndexes();

  app.listen(PORT, () => {
    console.log(`[server] Listening on port ${PORT}`);
  });
})();
