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
      sameSite: isProduction ? 'none' : 'lax',
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
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
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

/**
 * POST /api/auth/user/login
 * Authenticate student/user, set HttpOnly user_token cookie.
 */
const userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return errorResponse(res, 'Email atau password salah.', 401);
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return errorResponse(res, 'Email atau password salah.', 401);
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('user_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return successResponse(res, 'Login berhasil.', {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const userLogout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Clear the user session cookie
  res.clearCookie('user_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });

  // Clear the admin session cookie to prevent reload loop
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });

  return successResponse(res, 'Logout berhasil.');
};

/**
 * GET /api/auth/user/check
 * Verify the user is authenticated.
 */
const checkUserAuth = async (req, res) => {
  return successResponse(res, 'Token valid.', {
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

module.exports = { login, logout, checkAuth, userLogin, userLogout, checkUserAuth };
