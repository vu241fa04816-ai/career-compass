'use strict';

const { Router } = require('express');
const { registrationValidation, handleValidationErrors } = require('../middleware/validators');
const { registerUser } = require('../controllers/userController');

const router = Router();

// POST /register → register a new user
// Validation chain runs first, then the controller
router.post('/register', registrationValidation, handleValidationErrors, registerUser);

module.exports = router;
