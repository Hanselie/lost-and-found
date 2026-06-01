const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { validateLoginInput } = require('../middleware/validator');

// POST /api/auth/login
router.post('/login', validateLoginInput, authController.login);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET /api/auth/check
router.get('/check', auth, authController.checkAuth);

module.exports = router;
