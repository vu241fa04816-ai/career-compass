'use strict';

const { Router } = require('express');
const { getResultsByUser, getLatestResult } = require('../controllers/recommendationController');

const router = Router();

// GET /:userId/latest must be registered BEFORE /:userId to avoid
// "latest" being treated as a userId value.
router.get('/:userId/latest', getLatestResult);
router.get('/:userId', getResultsByUser);

module.exports = router;
