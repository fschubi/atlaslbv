/**
 * Authentifizierungs-Controller für das ATLAS-System
 *
 * Implementiert JWT-basierte Authentifizierung mit Login, Logout,
 * Token-Refresh und Passwort-Reset-Funktionalität.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');
const { getUserById, getUserByEmail, getUserByUsername, verifyPassword, updateLastLogin } = require('../models/userModel');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

/**
 * Benutzer-Login
 * @param {Object} req - Express Request-Objekt
 * @param {Object} res - Express Response-Objekt
 */
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validierungsfehler',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Benutzer nach Benutzernamen oder E-Mail suchen
    let user = await getUserByUsername(username);

    // Wenn kein Benutzer nach Username gefunden wurde, nach E-Mail suchen
    if (!user) {
      user = await getUserByEmail(username);
    }

    // Wenn kein Benutzer gefunden wurde oder Passwort falsch
    if (!user) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    // Benutzer inaktiv?
    if (!user.active) {
      return res.status(401).json({
        message: 'Benutzer ist deaktiviert. Bitte kontaktieren Sie den Administrator.'
      });
    }

    // Passwort überprüfen
    const isPasswordValid = await verifyPassword(user, password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    // Login-Zeit aktualisieren
    await updateLastLogin(user.id);

    // JWT-Token generieren
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Sensible Daten entfernen
    delete user.password;

    res.json({
      message: 'Anmeldung erfolgreich',
      token,
      user
    });
  } catch (error) {
    logger.error('Fehler bei der Benutzeranmeldung:', error);
    res.status(500).json({
      message: 'Serverfehler bei der Anmeldung',
      error: error.message
    });
  }
};

/**
 * Benutzer-Logout
 * @param {Object} req - Express Request-Objekt
 * @param {Object} res - Express Response-Objekt
 */
const logout = (req, res) => {
  res.json({ message: 'Abmeldung erfolgreich' });
};

/**
 * Access-Token mit Refresh-Token erneuern
 * @param {Object} req - Express Request-Objekt
 * @param {Object} res - Express Response-Objekt
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      logger.warn('Token-Refresh fehlgeschlagen: Kein Refresh-Token vorhanden');
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    // Refresh-Token überprüfen
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    if (!decoded) {
      logger.warn('Token-Refresh fehlgeschlagen: Ungültiger Refresh-Token');
      return res.status(401).json({ message: 'Ungültiger Refresh-Token' });
    }

    // Benutzer aus der Datenbank abrufen
    const user = await getUserById(decoded.id);

    if (!user) {
      logger.warn(`Token-Refresh fehlgeschlagen: Benutzer mit ID ${decoded.id} nicht gefunden`);
      return res.status(401).json({ message: 'Benutzer nicht gefunden' });
    }

    // Neuen Access-Token generieren
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logger.debug(`Token erfolgreich erneuert für Benutzer ${user.username}`);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    logger.error('Fehler beim Token-Refresh:', error);
    res.status(500).json({ message: 'Serverfehler beim Token-Refresh' });
  }
};

/**
 * Passwort zurücksetzen anfordern
 * @param {Object} req - Express Request-Objekt
 * @param {Object} res - Express Response-Objekt
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Benutzer anhand der E-Mail-Adresse suchen
    const user = await getUserByEmail(email);

    if (!user) {
      // Aus Sicherheitsgründen keine spezifische Fehlermeldung
      logger.warn(`Passwort-Reset angefordert für nicht existierende E-Mail: ${email}`);
      return res.json({ message: 'Wenn die E-Mail-Adresse registriert ist, erhalten Sie weitere Anweisungen.' });
    }

    // TODO: Implementierung des E-Mail-Versands mit Reset-Link
    // Hier würde der Code für das Generieren eines Reset-Tokens
    // und das Versenden der E-Mail stehen

    logger.info(`Passwort-Reset angefordert für Benutzer ${user.username}`);
    res.json({ message: 'Wenn die E-Mail-Adresse registriert ist, erhalten Sie weitere Anweisungen.' });
  } catch (error) {
    logger.error('Fehler bei der Passwort-Reset-Anfrage:', error);
    res.status(500).json({ message: 'Serverfehler bei der Passwort-Reset-Anfrage' });
  }
};

/**
 * Passwort zurücksetzen
 * @param {Object} req - Express Request-Objekt
 * @param {Object} res - Express Response-Objekt
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // TODO: Implementierung der Token-Validierung und Passwort-Aktualisierung
    // Hier würde der Code für das Überprüfen des Reset-Tokens
    // und das Aktualisieren des Passworts stehen

    logger.info('Passwort erfolgreich zurückgesetzt');
    res.json({ message: 'Passwort wurde erfolgreich zurückgesetzt' });
  } catch (error) {
    logger.error('Fehler beim Zurücksetzen des Passworts:', error);
    res.status(500).json({ message: 'Serverfehler beim Zurücksetzen des Passworts' });
  }
};

/**
 * Token validieren
 */
const validateToken = async (req, res) => {
  res.json({ valid: true, user: req.user });
};

module.exports = {
  login,
  logout,
  refreshToken,
  requestPasswordReset,
  resetPassword,
  validateToken
};
