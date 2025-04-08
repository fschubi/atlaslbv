const { validationResult } = require('express-validator');

/**
 * Middleware für die Validierung von Eingabedaten
 * @param {Object} req - Express Request-Objekt
 * @param {Object} res - Express Response-Objekt
 * @param {Function} next - Express Next-Funktion
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

module.exports = { validateRequest };
