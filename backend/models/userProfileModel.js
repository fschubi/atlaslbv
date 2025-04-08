const db = require('../db');
const logger = require('../utils/logger');

const UserProfileModel = {
  /**
   * Benutzerprofil nach Benutzer-ID abrufen
   * @param {number} userId - Benutzer-ID
   * @returns {Promise<Object>} - Benutzerprofil
   */
  getUserProfile: async (userId) => {
    try {
      const query = `
        SELECT
          up.*,
          u.username,
          u.email,
          u.role
        FROM user_profiles up
        JOIN users u ON up.user_id = u.id
        WHERE up.user_id = $1
      `;

      const { rows } = await db.query(query, [userId]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Abrufen des Benutzerprofils für Benutzer ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Benutzerprofil erstellen oder aktualisieren
   * @param {number} userId - Benutzer-ID
   * @param {Object} profileData - Profildaten
   * @returns {Promise<Object>} - Aktualisiertes Benutzerprofil
   */
  upsertUserProfile: async (userId, profileData) => {
    try {
      // Prüfen, ob Profil bereits existiert
      const existingProfile = await UserProfileModel.getUserProfile(userId);

      if (existingProfile) {
        // Profil aktualisieren
        const updateFields = [];
        const values = [];
        let paramCount = 1;

        // Dynamisch Felder zum Update hinzufügen
        Object.keys(profileData).forEach(key => {
          if (profileData[key] !== undefined) {
            updateFields.push(`${key} = $${paramCount}`);
            values.push(profileData[key]);
            paramCount++;
          }
        });

        // Aktualisierungszeitpunkt hinzufügen
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

        // Benutzer-ID als letzten Parameter hinzufügen
        values.push(userId);

        const query = `
          UPDATE user_profiles
          SET ${updateFields.join(', ')}
          WHERE user_id = $${paramCount}
          RETURNING *
        `;

        const { rows } = await db.query(query, values);
        return rows[0];
      } else {
        // Neues Profil erstellen
        const fields = ['user_id'];
        const values = [userId];
        let paramCount = 2;

        // Dynamisch Felder zum Insert hinzufügen
        Object.keys(profileData).forEach(key => {
          if (profileData[key] !== undefined) {
            fields.push(key);
            values.push(profileData[key]);
            paramCount++;
          }
        });

        const placeholders = values.map((_, i) => `$${i + 1}`);

        const query = `
          INSERT INTO user_profiles (${fields.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `;

        const { rows } = await db.query(query, values);
        return rows[0];
      }
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren des Benutzerprofils für Benutzer ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Profilbild aktualisieren
   * @param {number} userId - Benutzer-ID
   * @param {string} profilePicture - Pfad zum Profilbild
   * @returns {Promise<Object>} - Aktualisiertes Benutzerprofil
   */
  updateProfilePicture: async (userId, profilePicture) => {
    try {
      const query = `
        UPDATE user_profiles
        SET profile_picture = $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *
      `;

      const { rows } = await db.query(query, [profilePicture, userId]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren des Profilbilds für Benutzer ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Passwortänderung protokollieren
   * @param {number} userId - Benutzer-ID
   * @returns {Promise<Object>} - Aktualisiertes Benutzerprofil
   */
  logPasswordChange: async (userId) => {
    try {
      const query = `
        UPDATE user_profiles
        SET last_password_change = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `;

      const { rows } = await db.query(query, [userId]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Protokollieren der Passwortänderung für Benutzer ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Zwei-Faktor-Authentifizierung aktivieren
   * @param {number} userId - Benutzer-ID
   * @param {string} secret - Zwei-Faktor-Secret
   * @param {string} backupCodes - Backup-Codes
   * @returns {Promise<Object>} - Aktualisiertes Benutzerprofil
   */
  enableTwoFactor: async (userId, secret, backupCodes) => {
    try {
      const query = `
        UPDATE user_profiles
        SET two_factor_enabled = TRUE, two_factor_secret = $1, backup_codes = $2, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $3
        RETURNING *
      `;

      const { rows } = await db.query(query, [secret, backupCodes, userId]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Aktivieren der Zwei-Faktor-Authentifizierung für Benutzer ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Zwei-Faktor-Authentifizierung deaktivieren
   * @param {number} userId - Benutzer-ID
   * @returns {Promise<Object>} - Aktualisiertes Benutzerprofil
   */
  disableTwoFactor: async (userId) => {
    try {
      const query = `
        UPDATE user_profiles
        SET two_factor_enabled = FALSE, two_factor_secret = NULL, backup_codes = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `;

      const { rows } = await db.query(query, [userId]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Deaktivieren der Zwei-Faktor-Authentifizierung für Benutzer ${userId}:`, error);
      throw error;
    }
  }
};

module.exports = UserProfileModel;
