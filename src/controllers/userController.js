'use strict';

const { createUser, DuplicateEmailError } = require('../managers/userManager');

/**
 * POST /api/users
 * Registers a new user.
 * Expects req.body to have been validated by registrationValidation + handleValidationErrors.
 *
 * On success: HTTP 201 { userId, name }
 * On duplicate email: passes DuplicateEmailError to next() → global handler returns 409
 * On other errors: passes to next()
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
async function registerUser(req, res, next) {
  try {
    const user = await createUser(req.body);
    return res.status(201).json({ userId: user._id, name: user.name });
  } catch (err) {
    // DuplicateEmailError and all other errors are forwarded to the global handler
    return next(err);
  }
}

module.exports = { registerUser };
