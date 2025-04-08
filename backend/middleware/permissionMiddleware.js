const db = require('../db');
const logger = require('../utils/logger');

/**
 * Middleware zur Überprüfung der Benutzerberechtigungen
 * @param {string} requiredPermission - Erforderliche Berechtigung
 * @returns {Function} Express Middleware-Funktion
 */
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // Benutzer-ID aus dem Authentifizierungstoken
      const userId = req.user.id;

      // Benutzerberechtigungen abrufen
      const query = `
        SELECT * FROM get_user_permissions($1)
        WHERE permission_name = $2
      `;

      const { rows } = await db.query(query, [userId, requiredPermission]);

      // Prüfen, ob Benutzer die erforderliche Berechtigung hat
      if (rows.length === 0) {
        logger.warn(`Zugriff verweigert: Benutzer ${userId} hat keine Berechtigung für ${requiredPermission}`);
        return res.status(403).json({
          success: false,
          message: 'Keine Berechtigung für diese Aktion'
        });
      }

      // Berechtigung vorhanden, Request fortsetzen
      next();
    } catch (error) {
      logger.error(`Fehler bei der Berechtigungsprüfung für ${requiredPermission}:`, error);
      res.status(500).json({
        success: false,
        message: 'Fehler bei der Berechtigungsprüfung',
        error: error.message
      });
    }
  };
};

/**
 * Middleware zur Überprüfung mehrerer Benutzerberechtigungen (ODER-Verknüpfung)
 * @param {Array<string>} requiredPermissions - Array von erforderlichen Berechtigungen
 * @returns {Function} Express Middleware-Funktion
 */
const checkAnyPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // Benutzer-ID aus dem Authentifizierungstoken
      const userId = req.user.id;

      // Benutzerberechtigungen abrufen
      const query = `
        SELECT * FROM get_user_permissions($1)
        WHERE permission_name = ANY($2)
      `;

      const { rows } = await db.query(query, [userId, requiredPermissions]);

      // Prüfen, ob Benutzer mindestens eine der erforderlichen Berechtigungen hat
      if (rows.length === 0) {
        logger.warn(`Zugriff verweigert: Benutzer ${userId} hat keine der erforderlichen Berechtigungen: ${requiredPermissions.join(', ')}`);
        return res.status(403).json({
          success: false,
          message: 'Keine Berechtigung für diese Aktion'
        });
      }

      // Mindestens eine Berechtigung vorhanden, Request fortsetzen
      next();
    } catch (error) {
      logger.error(`Fehler bei der Berechtigungsprüfung für ${requiredPermissions.join(', ')}:`, error);
      res.status(500).json({
        success: false,
        message: 'Fehler bei der Berechtigungsprüfung',
        error: error.message
      });
    }
  };
};

/**
 * Middleware zur Überprüfung mehrerer Benutzerberechtigungen (UND-Verknüpfung)
 * @param {Array<string>} requiredPermissions - Array von erforderlichen Berechtigungen
 * @returns {Function} Express Middleware-Funktion
 */
const checkAllPermissions = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // Benutzer-ID aus dem Authentifizierungstoken
      const userId = req.user.id;

      // Benutzerberechtigungen abrufen
      const query = `
        SELECT * FROM get_user_permissions($1)
        WHERE permission_name = ANY($2)
      `;

      const { rows } = await db.query(query, [userId, requiredPermissions]);

      // Prüfen, ob Benutzer alle erforderlichen Berechtigungen hat
      if (rows.length < requiredPermissions.length) {
        const missingPermissions = requiredPermissions.filter(
          permission => !rows.some(row => row.permission_name === permission)
        );

        logger.warn(`Zugriff verweigert: Benutzer ${userId} fehlen Berechtigungen: ${missingPermissions.join(', ')}`);
        return res.status(403).json({
          success: false,
          message: 'Fehlende Berechtigungen für diese Aktion',
          missingPermissions
        });
      }

      // Alle Berechtigungen vorhanden, Request fortsetzen
      next();
    } catch (error) {
      logger.error(`Fehler bei der Berechtigungsprüfung für ${requiredPermissions.join(', ')}:`, error);
      res.status(500).json({
        success: false,
        message: 'Fehler bei der Berechtigungsprüfung',
        error: error.message
      });
    }
  };
};

/**
 * Middleware zur Überprüfung der Gruppenmitgliedschaft
 * @param {string} groupName - Name der erforderlichen Gruppe
 * @returns {Function} Express Middleware-Funktion
 */
const checkGroupMembership = (groupName) => {
  return async (req, res, next) => {
    try {
      // Benutzer-ID aus dem Authentifizierungstoken
      const userId = req.user.id;

      // Benutzergruppen abrufen
      const query = `
        SELECT * FROM get_user_groups($1)
        WHERE name = $2
      `;

      const { rows } = await db.query(query, [userId, groupName]);

      // Prüfen, ob Benutzer Mitglied der erforderlichen Gruppe ist
      if (rows.length === 0) {
        logger.warn(`Zugriff verweigert: Benutzer ${userId} ist kein Mitglied der Gruppe ${groupName}`);
        return res.status(403).json({
          success: false,
          message: `Keine Mitgliedschaft in der erforderlichen Gruppe: ${groupName}`
        });
      }

      // Gruppenmitgliedschaft vorhanden, Request fortsetzen
      next();
    } catch (error) {
      logger.error(`Fehler bei der Gruppenmitgliedschaftsprüfung für ${groupName}:`, error);
      res.status(500).json({
        success: false,
        message: 'Fehler bei der Gruppenmitgliedschaftsprüfung',
        error: error.message
      });
    }
  };
};

module.exports = {
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  checkGroupMembership
};
