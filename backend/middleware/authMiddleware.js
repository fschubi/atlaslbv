/**
 * Mock-Authentifizierungsmiddleware
 *
 * Simuliert die Authentifizierung und Autorisierung für das Ticket-System
 * in der Development-Umgebung
 */

const jwt = require('jsonwebtoken');
const db = require('../db');
const logger = require('../utils/logger');

// Simulierter Benutzer für Entwicklungszwecke
const mockUser = {
  id: 1,
  username: 'admin',
  name: 'Administrator',
  email: 'admin@example.com',
  role: 'admin',
  permissions: ['read', 'write', 'delete', 'admin']
};

/**
 * Middleware zur Authentifizierung von Benutzern
 * @param {Object} req - Express Request-Objekt
 * @param {Object} res - Express Response-Objekt
 * @param {Function} next - Express Next-Funktion
 */
const authenticate = async (req, res, next) => {
  try {
    // Token aus dem Authorization-Header extrahieren
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentifizierung fehlgeschlagen: Kein Token vorhanden'
      });
    }

    // Token extrahieren (ohne "Bearer " Präfix)
    const token = authHeader.split(' ')[1];

    // Token validieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Benutzer aus der Datenbank abrufen
    const query = `
      SELECT id, username, email, role_id, is_active, last_login
      FROM users
      WHERE id = $1
    `;

    const { rows } = await db.query(query, [decoded.id]);

    // Prüfen, ob Benutzer existiert und aktiv ist
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Authentifizierung fehlgeschlagen: Benutzer nicht gefunden'
      });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Zugriff verweigert: Benutzerkonto ist deaktiviert'
      });
    }

    // Benutzerinformationen im Request-Objekt speichern
    req.user = user;

    // Request fortsetzen
    next();
  } catch (error) {
    // JWT-Verifizierungsfehler
    if (error.name === 'JsonWebTokenError') {
      logger.warn('JWT-Verifizierungsfehler:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Authentifizierung fehlgeschlagen: Ungültiger Token'
      });
    }

    // JWT-Ablauf
    if (error.name === 'TokenExpiredError') {
      logger.warn('JWT-Ablauf:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Authentifizierung fehlgeschlagen: Token abgelaufen'
      });
    }

    // Andere Fehler
    logger.error('Authentifizierungsfehler:', error);
    res.status(500).json({
      success: false,
      message: 'Interner Serverfehler bei der Authentifizierung',
      error: error.message
    });
  }
};

/**
 * Middleware zur Überprüfung der Admin-Rolle
 * @param {Object} req - Express Request-Objekt
 * @param {Object} res - Express Response-Objekt
 * @param {Function} next - Express Next-Funktion
 */
const isAdmin = async (req, res, next) => {
  try {
    // Benutzer-ID aus dem Request-Objekt
    const userId = req.user.id;

    // Admin-Rolle abrufen
    const query = `
      SELECT r.name
      FROM roles r
      JOIN users u ON u.role_id = r.id
      WHERE u.id = $1
    `;

    const { rows } = await db.query(query, [userId]);

    // Prüfen, ob Benutzer die Admin-Rolle hat
    if (rows.length === 0 || rows[0].name !== 'admin') {
      logger.warn(`Zugriff verweigert: Benutzer ${userId} ist kein Administrator`);
      return res.status(403).json({
        success: false,
        message: 'Zugriff verweigert: Administratorberechtigung erforderlich'
      });
    }

    // Admin-Berechtigung vorhanden, Request fortsetzen
    next();
  } catch (error) {
    logger.error('Fehler bei der Admin-Rollenprüfung:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler bei der Berechtigungsprüfung',
      error: error.message
    });
  }
};

/**
 * Middleware zur Überprüfung der Manager-Rolle
 * @param {Object} req - Express Request-Objekt
 * @param {Object} res - Express Response-Objekt
 * @param {Function} next - Express Next-Funktion
 */
const isManager = async (req, res, next) => {
  try {
    // Benutzer-ID aus dem Request-Objekt
    const userId = req.user.id;

    // Manager-Rolle abrufen
    const query = `
      SELECT r.name
      FROM roles r
      JOIN users u ON u.role_id = r.id
      WHERE u.id = $1
    `;

    const { rows } = await db.query(query, [userId]);

    // Prüfen, ob Benutzer die Manager-Rolle hat
    if (rows.length === 0 || (rows[0].name !== 'admin' && rows[0].name !== 'manager')) {
      logger.warn(`Zugriff verweigert: Benutzer ${userId} ist kein Manager`);
      return res.status(403).json({
        success: false,
        message: 'Zugriff verweigert: Managerberechtigung erforderlich'
      });
    }

    // Manager-Berechtigung vorhanden, Request fortsetzen
    next();
  } catch (error) {
    logger.error('Fehler bei der Manager-Rollenprüfung:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler bei der Berechtigungsprüfung',
      error: error.message
    });
  }
};

module.exports = {
  authenticate,
  isAdmin,
  isManager
};
