/**
 * JWT-Hilfsfunktionen für das ATLAS-System
 *
 * Diese Datei enthält Hilfsfunktionen für die JWT-basierte Authentifizierung.
 */

const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const logger = require('./logger');

/**
 * Generiert einen JWT-Token für einen Benutzer
 * @param {Object} user - Benutzerobjekt
 * @returns {string} - JWT-Token
 */
const generateToken = (user) => {
  try {
    // Entferne sensible Daten aus dem Token
    const { password_hash, ...userWithoutPassword } = user;

    // Erstelle den Token mit den Benutzerdaten
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return token;
  } catch (error) {
    logger.error('Fehler bei der Token-Generierung:', error);
    throw new Error('Fehler bei der Token-Generierung');
  }
};

/**
 * Generiert einen Refresh-Token für einen Benutzer
 * @param {Object} user - Benutzerobjekt
 * @returns {string} - Refresh-Token
 */
const generateRefreshToken = (user) => {
  try {
    // Erstelle den Refresh-Token mit minimalen Daten
    const refreshToken = jwt.sign(
      { id: user.id },
      jwtConfig.secret,
      { expiresIn: jwtConfig.refreshExpiresIn }
    );

    return refreshToken;
  } catch (error) {
    logger.error('Fehler bei der Refresh-Token-Generierung:', error);
    throw new Error('Fehler bei der Refresh-Token-Generierung');
  }
};

/**
 * Überprüft einen JWT-Token
 * @param {string} token - JWT-Token
 * @returns {Object} - Dekodierte Token-Daten oder null bei ungültigem Token
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    return decoded;
  } catch (error) {
    logger.error('Fehler bei der Token-Überprüfung:', error);
    return null;
  }
};

/**
 * Überprüft einen Refresh-Token
 * @param {string} refreshToken - Refresh-Token
 * @returns {Object} - Dekodierte Token-Daten oder null bei ungültigem Token
 */
const verifyRefreshToken = (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, jwtConfig.secret);
    return decoded;
  } catch (error) {
    logger.error('Fehler bei der Refresh-Token-Überprüfung:', error);
    return null;
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken
};
