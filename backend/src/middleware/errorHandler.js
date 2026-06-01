const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, next) => {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('─── ERROR ───');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('──────────────');
  }

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          message: 'Data dengan nilai unik tersebut sudah ada.',
        });
      case 'P2025':
        return res.status(404).json({
          success: false,
          message: 'Data tidak ditemukan.',
        });
      case 'P2003':
        return res.status(400).json({
          success: false,
          message: 'Referensi data tidak valid.',
        });
      default:
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan database.',
        });
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Data yang dikirim tidak valid.',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token sudah kedaluwarsa.',
    });
  }

  // Syntax error (malformed JSON body)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Format JSON request tidak valid.',
    });
  }

  // Generic / fallback error
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Terjadi kesalahan pada server.'
      : err.message || 'Terjadi kesalahan pada server.';

  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
