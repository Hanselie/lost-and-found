/**
 * Send a standardised success response.
 *
 * @param {import('express').Response} res
 * @param {string} message
 * @param {any}    data
 * @param {number} statusCode
 */
const successResponse = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a standardised error response.
 *
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} statusCode
 */
const errorResponse = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = { successResponse, errorResponse };
