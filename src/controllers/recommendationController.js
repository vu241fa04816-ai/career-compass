'use strict';

const mongoose = require('mongoose');
const Result = require('../models/Result');
const { findUserById } = require('../managers/userManager');

/**
 * Validates that a string is a valid MongoDB ObjectId.
 * @param {string} id
 * @returns {boolean}
 */
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * GET /api/results/:userId
 * Returns all quiz results for the given user.
 *
 * Validation: userId param must be a valid ObjectId.
 * Response: HTTP 200 { results }
 * Errors:
 *   HTTP 400 { error: 'Invalid userId' }
 *   HTTP 404 { error: 'User not found' }
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
async function getResultsByUser(req, res, next) {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const results = await Result.find({ userId }).lean();
    return res.status(200).json({ results });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/results/:userId/latest
 * Returns the most recent quiz result for the given user.
 *
 * Validation: userId param must be a valid ObjectId.
 * Response: HTTP 200 { profile, careers }
 * Errors:
 *   HTTP 400 { error: 'Invalid userId' }
 *   HTTP 404 { error: 'User not found' }
 *   HTTP 404 { error: 'No results found' }
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
async function getLatestResult(req, res, next) {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await Result.findOne({ userId })
      .sort({ takenAt: -1 })
      .lean();

    if (!result) {
      return res.status(404).json({ error: 'No results found' });
    }

    return res.status(200).json({ profile: result.profile, careers: result.careers });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getResultsByUser, getLatestResult };
