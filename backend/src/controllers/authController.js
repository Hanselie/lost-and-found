const prisma = require('../config/database');
const { comparePassword, generateToken } = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * POST /api/auth/login
 * Authenticate admin, set HttpOnly JWT cookie.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return errorResponse(res, 'Email atau password salah.', 401);
    }

    const isPasswordValid = await comparePassword(password, admin.password_hash);

    if (!isPasswordValid) {
      return errorResponse(res, 'Email atau password salah.', 401);
    }

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      username: admin.username,
    });

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return successResponse(res, 'Login berhasil.', {
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Clear the JWT cookie.
 */
const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return successResponse(res, 'Logout berhasil.');
};

/**
 * GET /api/auth/check
 * Verify the current token is still valid.
 */
const checkAuth = async (req, res) => {
  return successResponse(res, 'Token valid.', {
    admin: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
    },
  });
};

module.exports = { login, logout, checkAuth };
