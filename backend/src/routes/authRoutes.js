const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const userAuth = require('../middleware/userAuth');
const { validateLoginInput } = require('../middleware/validator');

// ─── Admin Auth Routes ───
// POST /api/auth/login
router.post('/login', validateLoginInput, authController.login);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET /api/auth/check
router.get('/check', auth, authController.checkAuth);

// ─── Student/User Auth Routes ───
// POST /api/auth/user/login
router.post('/user/login', validateLoginInput, authController.userLogin);

// POST /api/auth/user/logout
router.post('/user/logout', authController.userLogout);

// GET /api/auth/user/check
router.get('/user/check', userAuth, authController.checkUserAuth);

module.exports = router;
