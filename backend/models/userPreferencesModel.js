const db = require('../db');
const logger = require('../utils/logger');

const UserPreferencesModel = {
  /**
   * Benutzereinstellungen nach Benutzer-ID abrufen
   * @param {number} userId - Benutzer-ID
   * @returns {Promise<Object>} - Benutzereinstellungen
   */
  getUserPreferences: async (userId) => {
    try {
      const query = `
        SELECT * FROM user_preferences
        WHERE user_id = $1
      `;

      const { rows } = await db.query(query, [userId]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Benutzereinstellungen für Benutzer ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Benutzereinstellungen erstellen oder aktualisieren
   * @param {number} userId - Benutzer-ID
   * @param {Object} preferencesData - Einstellungsdaten
   * @returns {Promise<Object>} - Aktualisierte Benutzereinstellungen
   */
  upsertUserPreferences: async (userId, preferencesData) => {
    try {
      // Prüfen, ob Einstellungen bereits existieren
      const existingPreferences = await UserPreferencesModel.getUserPreferences(userId);

      if (existingPreferences) {
        // Einstellungen aktualisieren
        const updateFields = [];
        const values = [];
        let paramCount = 1;

        // Dynamisch Felder zum Update hinzufügen
        Object.keys(preferencesData).forEach(key => {
          if (preferencesData[key] !== undefined) {
            updateFields.push(`${key} = $${paramCount}`);
            values.push(preferencesData[key]);
            paramCount++;
          }
        });

        // Aktualisierungszeitpunkt hinzufügen
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

        // Benutzer-ID als letzten Parameter hinzufügen
        values.push(userId);

        const query = `
          UPDATE user_preferences
          SET ${updateFields.join(', ')}
          WHERE user_id = $${paramCount}
          RETURNING *
        `;

        const { rows } = await db.query(query, values);
        return rows[0];
      } else {
        // Neue Einstellungen erstellen
        const fields = ['user_id'];
        const values = [userId];
        let paramCount = 2;

        // Dynamisch Felder zum Insert hinzufügen
        Object.keys(preferencesData).forEach(key => {
          if (preferencesData[key] !== undefined) {
            fields.push(key);
            values.push(preferencesData[key]);
            paramCount++;
          }
        });

        const placeholders = values.map((_, i) => `$${i + 1}`);

        const query = `
          INSERT INTO user_preferences (${fields.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `;

        const { rows } = await db.query(query, values);
        return rows[0];
      }
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren der Benutzereinstellungen für Benutzer ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Dashboard-Layout aktualisieren
   * @param {number} userId - Benutzer-ID
   * @param {Object} layout - Dashboard-Layout
   * @returns {Promise<Object>} - Aktualisierte Benutzereinstellungen
   */
  updateDashboardLayout: async (userId, layout) => {
    try {
      const query = `
        UPDATE user_preferences
        SET dashboard_layout = $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *
      `;

      const { rows } = await db.query(query, [JSON.stringify(layout), userId]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren des Dashboard-Layouts für Benutzer ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Benachrichtigungseinstellungen aktualisieren
   * @param {number} userId - Benutzer-ID
   * @param {boolean} notificationsEnabled - Benachrichtigungen aktiviert
   * @param {boolean} emailNotifications - E-Mail-Benachrichtigungen aktiviert
   * @returns {Promise<Object>} - Aktualisierte Benutzereinstellungen
   */
  updateNotificationSettings: async (userId, notificationsEnabled, emailNotifications) => {
    try {
      const query = `
        UPDATE user_preferences
        SET notifications_enabled = $1, email_notifications = $2, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $3
        RETURNING *
      `;

      const { rows } = await db.query(query, [notificationsEnabled, emailNotifications, userId]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren der Benachrichtigungseinstellungen für Benutzer ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Theme-Einstellung aktualisieren
   * @param {number} userId - Benutzer-ID
   * @param {string} theme - Theme (dark/light)
   * @returns {Promise<Object>} - Aktualisierte Benutzereinstellungen
   */
  updateTheme: async (userId, theme) => {
    try {
      const query = `
        UPDATE user_preferences
        SET theme = $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *
      `;

      const { rows } = await db.query(query, [theme, userId]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren des Themes für Benutzer ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Spracheinstellung aktualisieren
   * @param {number} userId - Benutzer-ID
   * @param {string} language - Sprache (de/en)
   * @returns {Promise<Object>} - Aktualisierte Benutzereinstellungen
   */
  updateLanguage: async (userId, language) => {
    try {
      const query = `
        UPDATE user_preferences
        SET language = $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *
      `;

      const { rows } = await db.query(query, [language, userId]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren der Sprache für Benutzer ${userId}:`, error);
      throw error;
    }
  }
};

module.exports = UserPreferencesModel;
