'use strict';

/**
 * Global Express error handler.
 *
 * Error mappings:
 *   MongoNetworkError / MongoServerSelectionError / 'Database unavailable' → 503
 *   DuplicateEmailError → 409
 *   ValidationError (Mongoose) → 400
 *   Default → 500
 *
 * Logging: only userId (if present in req.body) and event type — no email addresses.
 *
 * Requirements: 11.1, 11.2
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Safe log — never include email or other PII
  const userId = req.body && req.body.userId ? req.body.userId : 'unknown';
  console.error(`[error] event=${err.name || 'Error'} userId=${userId} message=${err.message}`);

  // MongoDB / Mongoose connection errors → 503
  if (
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoServerSelectionError' ||
    err.message === 'Database unavailable'
  ) {
    return res
      .status(503)
      .json({ error: 'Database unavailable, please try again later' });
  }

  // Duplicate email → 409
  if (err.name === 'DuplicateEmailError') {
    return res.status(409).json({ error: 'Email already registered' });
  }

  // Mongoose validation errors → 400
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // Default → 500
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = { errorHandler };
