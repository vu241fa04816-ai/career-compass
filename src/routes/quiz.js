'use strict';

const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { getQuestions, submitQuiz } = require('../controllers/quizController');

const router = Router();

// Rate limiter specific to quiz submission: 10 requests per IP per minute
const submitLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

// GET /questions → retrieve active questions (cached)
router.get('/questions', getQuestions);

// POST /submit → rate-limited quiz submission
router.post('/submit', submitLimiter, submitQuiz);

module.exports = router;
