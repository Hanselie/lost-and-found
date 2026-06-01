const { verifyToken } = require('../services/authService');
const { errorResponse } = require('../utils/response');

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return errorResponse(res, 'Akses ditolak. Token tidak ditemukan.', 401);
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Token tidak valid.', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token sudah kedaluwarsa.', 401);
    }
    return errorResponse(res, 'Autentikasi gagal.', 401);
  }
};

module.exports = auth;
