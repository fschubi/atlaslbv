/**
 * Rollenbasierte Zugriffskontrolle für das ATLAS-System
 *
 * Diese Middleware überprüft, ob der authentifizierte Benutzer
 * die erforderlichen Rollen für den Zugriff auf eine Ressource hat.
 */

const logger = require('../utils/logger');

/**
 * Middleware zum Überprüfen der Benutzerrolle
 * @param {string[]} allowedRoles - Array der erlaubten Rollen
 * @returns {Function} Express Middleware-Funktion
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Überprüfen, ob der Benutzer authentifiziert ist
      if (!req.user) {
        logger.warn('Zugriffsverweigerung: Benutzer nicht authentifiziert');
        return res.status(401).json({ message: 'Nicht authentifiziert' });
      }

      // Überprüfen, ob der Benutzer eine der erlaubten Rollen hat
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`Zugriffsverweigerung: Benutzer ${req.user.username} hat keine der erforderlichen Rollen [${allowedRoles.join(', ')}]`);
        return res.status(403).json({
          message: 'Zugriff verweigert',
          requiredRoles: allowedRoles,
          currentRole: req.user.role
        });
      }

      // Log für Debug-Zwecke
      logger.debug(`Rollenprüfung erfolgreich: ${req.user.username} (${req.user.role}) hat Zugriff`);

      // Weiter zur nächsten Middleware
      next();
    } catch (error) {
      logger.error('Fehler in der Rollenmiddleware:', error);
      res.status(500).json({ message: 'Serverfehler bei der Rollenprüfung' });
    }
  };
};

/**
 * Middleware zum Überprüfen der Administratorrolle
 * Kurzform für häufig verwendete Admin-Zugriffskontrolle
 */
const isAdmin = checkRole(['admin']);

/**
 * Middleware zum Überprüfen der Managerrolle
 * Kurzform für häufig verwendete Manager-Zugriffskontrolle
 */
const isManager = checkRole(['admin', 'manager']);

module.exports = {
  checkRole,
  isAdmin,
  isManager
};
