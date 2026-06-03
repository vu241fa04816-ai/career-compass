'use strict';

const User = require('../models/User');
const Result = require('../models/Result');

// ---------------------------------------------------------------------------
// DuplicateEmailError
// Thrown by createUser when the supplied email is already registered.
// Maps to HTTP 409 in the controller layer.
// ---------------------------------------------------------------------------

class DuplicateEmailError extends Error {
  constructor(message = 'Email already registered') {
    super(message);
    this.name = 'DuplicateEmailError';
  }
}

// ---------------------------------------------------------------------------
// findUserByEmail
// Query the users collection by email (case-insensitive).
// Returns a plain object or null if not found.
// Requirements: 6.3, 9.1
// ---------------------------------------------------------------------------

/**
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
async function findUserByEmail(email) {
  const user = await User.findOne({ email: email.trim().toLowerCase() }).lean();
  return user || null;
}

// ---------------------------------------------------------------------------
// findUserById
// Query the users collection by _id.
// Returns a plain object or null if not found.
// Requirements: 6.3, 9.1
// ---------------------------------------------------------------------------

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {Promise<Object|null>}
 */
async function findUserById(userId) {
  const user = await User.findById(userId).lean();
  return user || null;
}

// ---------------------------------------------------------------------------
// createUser
// Sanitize input, check for duplicate email, create and persist the user.
// Returns a plain object including _id, name, email, age, createdAt, updatedAt.
// Requirements: 1.1, 1.2, 10.1
// ---------------------------------------------------------------------------

/**
 * @param {{ name: string, email: string, age?: number }} data
 * @returns {Promise<Object>}
 * @throws {DuplicateEmailError} if the email is already registered
 */
async function createUser(data) {
  // Sanitize
  const name = typeof data.name === 'string' ? data.name.trim() : data.name;
  const email = typeof data.email === 'string' ? data.email.trim() : data.email;
  const age = data.age;

  // Duplicate-email guard
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new DuplicateEmailError('Email already registered');
  }

  // Persist
  const user = new User({ name, email, age });
  await user.save();

  // Return plain object (not a Mongoose document)
  return user.toObject();
}

// ---------------------------------------------------------------------------
// saveResult
// Persist a quiz result and return the saved plain object.
// Requirements: 3.6, 9.1, 9.2, 9.3
// ---------------------------------------------------------------------------

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {Object} profile   — five-trait personality profile
 * @param {Array}  careers   — ranked career suggestions
 * @param {Array}  answers   — raw quiz answers
 * @returns {Promise<Object>}
 */
async function saveResult(userId, profile, careers, answers) {
  const result = new Result({
    userId,
    profile,
    careers,
    answers,
    takenAt: new Date(),
  });

  await result.save();
  return result.toObject();
}

module.exports = {
  createUser,
  findUserById,
  findUserByEmail,
  saveResult,
  DuplicateEmailError,
};
