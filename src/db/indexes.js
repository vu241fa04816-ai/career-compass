'use strict';

const User = require('../models/User');
const Result = require('../models/Result');
const Question = require('../models/Question');

/**
 * Creates required MongoDB Atlas indexes.
 *
 * Indexes created:
 *   - Unique index on users.email
 *   - Index on results.userId
 *   - Index on questions.sequence
 *
 * Uses Model.collection.createIndex() so indexes are created idempotently
 * (MongoDB ignores the call if the index already exists with the same options).
 *
 * Requirements: 13.2
 */
async function ensureIndexes() {
  try {
    await User.collection.createIndex({ email: 1 }, { unique: true, background: true });
    console.log('[indexes] Unique index on users.email ensured');

    await Result.collection.createIndex({ userId: 1 }, { background: true });
    console.log('[indexes] Index on results.userId ensured');

    await Question.collection.createIndex({ sequence: 1 }, { background: true });
    console.log('[indexes] Index on questions.sequence ensured');
  } catch (err) {
    // Log but do not crash — the app can still function without explicit indexes
    console.error(`[indexes] Failed to ensure indexes: ${err.message}`);
  }
}

module.exports = { ensureIndexes };
