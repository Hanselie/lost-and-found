const { verifyToken } = require('../services/authService');
const { errorResponse } = require('../utils/response');

/**
 * Middleware to authenticate public users (or admins).
 * Checks 'user_token' first, then falls back to 'token' (admin token).
 */
const userAuth = async (req, res, next) => {
  try {
    const userToken = req.cookies.user_token;
    const adminToken = req.cookies.token;

    // 1. Try to authenticate as a normal user first
    if (userToken) {
      try {
        const decoded = verifyToken(userToken);
        req.user = { ...decoded, role: 'user' };
        return next();
      } catch (err) {
        // If user token is invalid/expired, fall back to check admin token
      }
    }

    // 2. Fall back to check if it's an admin accessing public endpoints
    if (adminToken) {
      try {
        const decoded = verifyToken(adminToken);
        req.user = { ...decoded, role: 'admin' };
        return next();
      } catch (err) {
        // If both failed, reject
      }
    }

    return errorResponse(res, 'Akses ditolak. Silakan login terlebih dahulu.', 401);
  } catch (error) {
    return errorResponse(res, 'Autentikasi gagal.', 401);
  }
};

module.exports = userAuth;
