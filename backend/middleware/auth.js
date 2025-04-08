/**
 * JWT-basierte Authentifizierungsmiddleware für das ATLAS-System
 *
 * Diese Middleware überprüft den JWT-Token in der Authorization-Header
 * und fügt den authentifizierten Benutzer zum Request-Objekt hinzu.
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const { getUserById } = require('../models/userModel');
const logger = require('../utils/logger');

/**
 * Middleware zum Überprüfen der Authentifizierung
 * @param {Object} req - Express Request-Objekt
 * @param {Object} res - Express Response-Objekt
 * @param {Function} next - Express Next-Funktion
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Token aus dem Authorization-Header extrahieren
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.warn('Authentifizierungsfehler: Kein Token vorhanden');
      return res.status(401).json({
        success: false,
        message: 'Kein Token vorhanden'
      });
    }

    // Token verifizieren
    const decoded = jwt.verify(token, JWT_SECRET);

    // Benutzer aus der Datenbank abrufen
    const user = await getUserById(decoded.id);

    if (!user) {
      logger.warn(`Authentifizierungsfehler: Benutzer mit ID ${decoded.id} nicht gefunden`);
      return res.status(401).json({ message: 'Nicht authentifiziert: Benutzer nicht gefunden' });
    }

    // Benutzer zum Request-Objekt hinzufügen
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name
    };

    // Log für Debug-Zwecke
    logger.debug(`Benutzer authentifiziert: ${req.user.username} (ID: ${req.user.id})`);

    // Weiter zur nächsten Middleware
    next();
  } catch (error) {
    logger.error('Fehler in der Authentifizierungsmiddleware:', error);
    res.status(500).json({ message: 'Serverfehler bei der Authentifizierung' });
  }
};

// Middleware für Rollen-basierte Zugriffskontrolle
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Nicht authentifiziert'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Keine Berechtigung für diese Aktion'
      });
    }

    next();
  };
};

module.exports = { authMiddleware, checkRole };
