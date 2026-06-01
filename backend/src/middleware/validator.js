const { errorResponse } = require('../utils/response');

/**
 * Strip HTML tags from a string for basic sanitization.
 */
function stripTags(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Validate and sanitize item input fields.
 */
const validateItemInput = (req, res, next) => {
  const { title, category, building, location_detail, date_found } = req.body;

  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Title wajib diisi.');
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push('Kategori wajib diisi.');
  }

  if (!building || typeof building !== 'string' || building.trim().length === 0) {
    errors.push('Gedung wajib diisi.');
  }

  if (!location_detail || typeof location_detail !== 'string' || location_detail.trim().length === 0) {
    errors.push('Detail lokasi wajib diisi.');
  }

  if (!date_found) {
    errors.push('Tanggal ditemukan wajib diisi.');
  } else {
    const parsedDate = new Date(date_found);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Format tanggal ditemukan tidak valid.');
    }
  }

  if (errors.length > 0) {
    return errorResponse(res, errors.join(' '), 400);
  }

  // Sanitize string fields
  req.body.title = stripTags(title.trim());
  req.body.category = stripTags(category.trim());
  req.body.building = stripTags(building.trim());
  req.body.location_detail = stripTags(location_detail.trim());

  if (req.body.internal_note && typeof req.body.internal_note === 'string') {
    req.body.internal_note = stripTags(req.body.internal_note.trim());
  }

  next();
};

/**
 * Validate login input fields.
 */
const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;

  const errors = [];

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('Email wajib diisi.');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Format email tidak valid.');
    }
  }

  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    errors.push('Password wajib diisi.');
  }

  if (errors.length > 0) {
    return errorResponse(res, errors.join(' '), 400);
  }

  req.body.email = email.trim().toLowerCase();

  next();
};

module.exports = { validateItemInput, validateLoginInput };
