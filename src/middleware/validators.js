'use strict';

const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

// ---------------------------------------------------------------------------
// Task 7.7 — sanitizeQuizSubmission
// Sanitizes string fields in the quiz submission body to prevent NoSQL injection.
// Requirements: 12.1
// ---------------------------------------------------------------------------

/**
 * Express-validator sanitization chain for POST /api/quiz/submit.
 * Trims and escapes the userId string field.
 */
const sanitizeQuizSubmission = [
  body('userId').trim().escape(),
];

// ---------------------------------------------------------------------------
// Task 3.1 — validateQuizSubmission
// Pure validation function with no side effects.
// Returns { isValid: boolean, errors: string[] }
// ---------------------------------------------------------------------------

/**
 * Validates a quiz submission payload.
 *
 * @param {unknown} payload - The parsed request body (may be null/undefined/malformed)
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateQuizSubmission(payload) {
  const errors = [];

  // Guard: treat non-object payloads gracefully
  const data = payload != null && typeof payload === 'object' ? payload : {};

  // Requirement 7.1 / 7.2 — userId must be a non-null valid MongoDB ObjectId
  if (data.userId == null || !mongoose.Types.ObjectId.isValid(data.userId)) {
    errors.push('userId must be a valid MongoDB ObjectId');
  }

  // Requirement 7.3 — answers must be a non-empty array
  if (!Array.isArray(data.answers) || data.answers.length === 0) {
    errors.push('answers must be a non-empty array');
  } else {
    // Requirement 7.4 / 7.5 / 7.6 — validate each answer entry
    for (const answer of data.answers) {
      const qId = answer != null ? answer.questionId : undefined;

      // Requirement 7.4 — questionId must be a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(qId)) {
        errors.push(`Invalid questionId: ${qId}`);
      }

      // Requirement 7.5 / 7.6 — selectedValue must be a positive integer (> 0)
      const sv = answer != null ? answer.selectedValue : undefined;
      if (sv == null || !Number.isInteger(sv) || sv <= 0) {
        errors.push(`selectedValue must be a positive integer for question ${qId}`);
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Task 3.3 — registrationValidation chain (express-validator)
// Requirements: 1.3, 1.4, 1.5
// ---------------------------------------------------------------------------

/**
 * Express-validator chain for POST /api/users/register.
 *
 * - name: required, non-empty, trimmed, max 100 chars
 * - email: required, valid email format, normalised
 * - age: optional; if present must be an integer between 10 and 100
 */
const registrationValidation = [
  body('name')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),

  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),

  body('age')
    .optional({ nullable: true, checkFalsy: false })
    .isInt({ min: 10, max: 100 })
    .withMessage('Age must be an integer between 10 and 100'),
];

// ---------------------------------------------------------------------------
// handleValidationErrors — middleware that checks express-validator results
// Returns HTTP 400 with { error, details } when validation fails.
// ---------------------------------------------------------------------------

/**
 * Express middleware that reads the result of the validation chain and
 * returns a 400 response if any errors were found.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function handleValidationErrors(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.array(),
    });
  }
  next();
}

module.exports = {
  validateQuizSubmission,
  registrationValidation,
  handleValidationErrors,
  sanitizeQuizSubmission,
};
