'use strict';

const Question = require('../models/Question');
const Career = require('../models/Career');
const { validateQuizSubmission } = require('../middleware/validators');
const { findUserById } = require('../managers/userManager');
const { scoreAnswers, rankCareers } = require('../engine/scoringEngine');
const { saveResult } = require('../managers/userManager');

// ── In-memory question cache ──────────────────────────────────────────────────
// Structure: { questions: Array, expiresAt: number (ms epoch) }
let questionCache = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * GET /api/quiz/questions
 * Returns active questions sorted by sequence ascending, limited to 30.
 * Results are cached in memory for 1 hour.
 *
 * Response: HTTP 200 { questions }
 *
 * Requirements: 2.1, 2.2, 2.3, 13.1, 13.3
 */
async function getQuestions(req, res, next) {
  try {
    const now = Date.now();

    // Serve from cache if still valid
    if (questionCache && questionCache.expiresAt > now) {
      return res.status(200).json({ questions: questionCache.questions });
    }

    // Fetch from DB: active questions, sorted by sequence, max 30
    const questions = await Question.find({ isActive: true })
      .sort({ sequence: 1 })
      .limit(30)
      .lean();

    // Populate cache
    questionCache = { questions, expiresAt: now + CACHE_TTL_MS };

    return res.status(200).json({ questions });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/quiz/submit
 * Validates the submission, scores answers, ranks careers, saves and returns results.
 *
 * Response: HTTP 200 { profile, careers }
 * Error responses:
 *   HTTP 400 { error: 'Validation failed', details }
 *   HTTP 404 { error: 'User not found' }
 *   HTTP 500 { error: 'Career data not available' }
 *
 * Requirements: 3.1–3.8, 12.2, 13.4
 */
async function submitQuiz(req, res, next) {
  try {
    // Step 1: Validate payload
    const { isValid, errors } = validateQuizSubmission(req.body);
    if (!isValid) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const { userId, answers } = req.body;

    // Step 2: Verify user exists
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Step 3: Fetch all careers
    const careers = await Career.find({}).lean();
    if (!careers || careers.length === 0) {
      return res.status(500).json({ error: 'Career data not available' });
    }

    // Step 4: Resolve traitWeights for each answer by looking up the Question
    //         and finding the matching option.
    const questions = await Question.find({
      _id: { $in: answers.map((a) => a.questionId) },
    }).lean();

    // Build a lookup map: questionId (string) → question document
    const questionMap = {};
    for (const q of questions) {
      questionMap[String(q._id)] = q;
    }

    const resolvedAnswers = answers.map((answer) => {
      const question = questionMap[String(answer.questionId)];
      let option = null;
      if (question && Array.isArray(question.options)) {
        option = question.options.find((o) => o.value === answer.selectedValue) || null;
      }
      return { ...answer, option };
    });

    // Step 5: Score and rank
    const profile = scoreAnswers(resolvedAnswers);
    const rankedCareers = rankCareers(profile, careers);

    // Step 6: Cap API response at 10 careers (separate from MAX_SUGGESTIONS engine config)
    const apiCareers = rankedCareers.slice(0, 10);

    // Step 7: Persist result (store the engine-ranked list, not the capped one)
    await saveResult(userId, profile, rankedCareers, answers);

    return res.status(200).json({ profile, careers: apiCareers });
  } catch (err) {
    return next(err);
  }
}

// Expose cache invalidation for testing purposes
function _clearQuestionCache() {
  questionCache = null;
}

module.exports = { getQuestions, submitQuiz, _clearQuestionCache };
