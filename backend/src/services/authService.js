const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Hash a plaintext password with bcrypt (10 salt rounds).
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a plaintext password against a bcrypt hash.
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Sign a JWT with the configured secret and expiration.
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

/**
 * Verify and decode a JWT. Throws on invalid / expired tokens.
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { hashPassword, comparePassword, generateToken, verifyToken };
