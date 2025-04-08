const db = require('../db');
const logger = require('../utils/logger');

const UserGroupModel = {
  /**
   * Alle Benutzergruppen abrufen
   * @returns {Promise<Array>} - Array von Benutzergruppen
   */
  getAllGroups: async () => {
    try {
      const query = `
        SELECT * FROM user_groups
        ORDER BY name
      `;

      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      logger.error('Fehler beim Abrufen aller Benutzergruppen:', error);
      throw error;
    }
  },

  /**
   * Benutzergruppe nach ID abrufen
   * @param {number} id - Gruppen-ID
   * @returns {Promise<Object>} - Benutzergruppe
   */
  getGroupById: async (id) => {
    try {
      const query = `
        SELECT * FROM user_groups
        WHERE id = $1
      `;

      const { rows } = await db.query(query, [id]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Benutzergruppe mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Benutzergruppe nach Namen abrufen
   * @param {string} name - Gruppenname
   * @returns {Promise<Object>} - Benutzergruppe
   */
  getGroupByName: async (name) => {
    try {
      const query = `
        SELECT * FROM user_groups
        WHERE name = $1
      `;

      const { rows } = await db.query(query, [name]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Benutzergruppe mit Namen ${name}:`, error);
      throw error;
    }
  },

  /**
   * Neue Benutzergruppe erstellen
   * @param {Object} groupData - Gruppendaten
   * @returns {Promise<Object>} - Erstellte Benutzergruppe
   */
  createGroup: async (groupData) => {
    try {
      const { name, description, created_by } = groupData;

      const query = `
        INSERT INTO user_groups (name, description, created_by)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const { rows } = await db.query(query, [name, description, created_by]);
      return rows[0];
    } catch (error) {
      logger.error('Fehler beim Erstellen der Benutzergruppe:', error);
      throw error;
    }
  },

  /**
   * Benutzergruppe aktualisieren
   * @param {number} id - Gruppen-ID
   * @param {Object} groupData - Gruppendaten
   * @returns {Promise<Object>} - Aktualisierte Benutzergruppe
   */
  updateGroup: async (id, groupData) => {
    try {
      const { name, description } = groupData;

      const query = `
        UPDATE user_groups
        SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;

      const { rows } = await db.query(query, [name, description, id]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren der Benutzergruppe mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Benutzergruppe löschen
   * @param {number} id - Gruppen-ID
   * @returns {Promise<boolean>} - Erfolg
   */
  deleteGroup: async (id) => {
    try {
      const query = `
        DELETE FROM user_groups
        WHERE id = $1
        RETURNING id
      `;

      const { rows } = await db.query(query, [id]);
      return rows.length > 0;
    } catch (error) {
      logger.error(`Fehler beim Löschen der Benutzergruppe mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Mitglieder einer Benutzergruppe abrufen
   * @param {number} groupId - Gruppen-ID
   * @returns {Promise<Array>} - Array von Gruppenmitgliedern
   */
  getGroupMembers: async (groupId) => {
    try {
      const query = `
        SELECT u.*, ugm.added_at, ugm.added_by
        FROM users u
        JOIN user_group_members ugm ON u.id = ugm.user_id
        WHERE ugm.group_id = $1
        ORDER BY u.name
      `;

      const { rows } = await db.query(query, [groupId]);
      return rows;
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Mitglieder für Gruppe ${groupId}:`, error);
      throw error;
    }
  },

  /**
   * Benutzer zu einer Gruppe hinzufügen
   * @param {number} groupId - Gruppen-ID
   * @param {number} userId - Benutzer-ID
   * @param {number} addedBy - ID des Benutzers, der den Eintrag erstellt
   * @returns {Promise<Object>} - Erstellte Gruppenmitgliedschaft
   */
  addUserToGroup: async (groupId, userId, addedBy) => {
    try {
      const query = `
        INSERT INTO user_group_members (group_id, user_id, added_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (group_id, user_id) DO NOTHING
        RETURNING *
      `;

      const { rows } = await db.query(query, [groupId, userId, addedBy]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Hinzufügen des Benutzers ${userId} zur Gruppe ${groupId}:`, error);
      throw error;
    }
  },

  /**
   * Benutzer aus einer Gruppe entfernen
   * @param {number} groupId - Gruppen-ID
   * @param {number} userId - Benutzer-ID
   * @returns {Promise<boolean>} - Erfolg
   */
  removeUserFromGroup: async (groupId, userId) => {
    try {
      const query = `
        DELETE FROM user_group_members
        WHERE group_id = $1 AND user_id = $2
        RETURNING id
      `;

      const { rows } = await db.query(query, [groupId, userId]);
      return rows.length > 0;
    } catch (error) {
      logger.error(`Fehler beim Entfernen des Benutzers ${userId} aus der Gruppe ${groupId}:`, error);
      throw error;
    }
  },

  /**
   * Gruppen eines Benutzers abrufen
   * @param {number} userId - Benutzer-ID
   * @returns {Promise<Array>} - Array von Benutzergruppen
   */
  getUserGroups: async (userId) => {
    try {
      const query = `
        SELECT * FROM get_user_groups($1)
      `;

      const { rows } = await db.query(query, [userId]);
      return rows;
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Gruppen für Benutzer ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Benutzer einer Gruppe abrufen
   * @param {number} groupId - Gruppen-ID
   * @returns {Promise<Array>} - Array von Benutzern
   */
  getGroupUsers: async (groupId) => {
    try {
      const query = `
        SELECT * FROM get_group_users($1)
      `;

      const { rows } = await db.query(query, [groupId]);
      return rows;
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Benutzer für Gruppe ${groupId}:`, error);
      throw error;
    }
  },

  /**
   * Mehrere Benutzer zu einer Gruppe hinzufügen
   * @param {number} groupId - Gruppen-ID
   * @param {Array<number>} userIds - Array von Benutzer-IDs
   * @param {number} addedBy - ID des Benutzers, der die Einträge erstellt
   * @returns {Promise<Array>} - Array von erstellten Gruppenmitgliedschaften
   */
  addUsersToGroup: async (groupId, userIds, addedBy) => {
    try {
      // Transaktion starten
      await db.query('BEGIN');

      const results = [];

      // Jeden Benutzer zur Gruppe hinzufügen
      for (const userId of userIds) {
        const query = `
          INSERT INTO user_group_members (group_id, user_id, added_by)
          VALUES ($1, $2, $3)
          ON CONFLICT (group_id, user_id) DO NOTHING
          RETURNING *
        `;

        const { rows } = await db.query(query, [groupId, userId, addedBy]);
        if (rows.length > 0) {
          results.push(rows[0]);
        }
      }

      // Transaktion abschließen
      await db.query('COMMIT');

      return results;
    } catch (error) {
      // Transaktion bei Fehler zurücksetzen
      await db.query('ROLLBACK');
      logger.error(`Fehler beim Hinzufügen mehrerer Benutzer zur Gruppe ${groupId}:`, error);
      throw error;
    }
  },

  /**
   * Mehrere Benutzer aus einer Gruppe entfernen
   * @param {number} groupId - Gruppen-ID
   * @param {Array<number>} userIds - Array von Benutzer-IDs
   * @returns {Promise<number>} - Anzahl der entfernten Benutzer
   */
  removeUsersFromGroup: async (groupId, userIds) => {
    try {
      // Transaktion starten
      await db.query('BEGIN');

      let removedCount = 0;

      // Jeden Benutzer aus der Gruppe entfernen
      for (const userId of userIds) {
        const query = `
          DELETE FROM user_group_members
          WHERE group_id = $1 AND user_id = $2
          RETURNING id
        `;

        const { rows } = await db.query(query, [groupId, userId]);
        if (rows.length > 0) {
          removedCount++;
        }
      }

      // Transaktion abschließen
      await db.query('COMMIT');

      return removedCount;
    } catch (error) {
      // Transaktion bei Fehler zurücksetzen
      await db.query('ROLLBACK');
      logger.error(`Fehler beim Entfernen mehrerer Benutzer aus der Gruppe ${groupId}:`, error);
      throw error;
    }
  },

  /**
   * Benutzer in Gruppen suchen
   * @param {string} searchTerm - Suchbegriff
   * @returns {Promise<Array>} - Array von Benutzergruppen
   */
  searchGroups: async (searchTerm) => {
    try {
      const query = `
        SELECT * FROM user_groups
        WHERE name ILIKE $1 OR description ILIKE $1
        ORDER BY name
      `;

      const { rows } = await db.query(query, [`%${searchTerm}%`]);
      return rows;
    } catch (error) {
      logger.error(`Fehler bei der Suche nach Benutzergruppen mit Begriff "${searchTerm}":`, error);
      throw error;
    }
  },

  /**
   * Benutzer in Gruppen suchen
   * @param {number} groupId - Gruppen-ID
   * @param {string} searchTerm - Suchbegriff
   * @returns {Promise<Array>} - Array von Benutzern
   */
  searchGroupMembers: async (groupId, searchTerm) => {
    try {
      const query = `
        SELECT u.*, ugm.added_at, ugm.added_by
        FROM users u
        JOIN user_group_members ugm ON u.id = ugm.user_id
        WHERE ugm.group_id = $1 AND (u.name ILIKE $2 OR u.username ILIKE $2 OR u.email ILIKE $2)
        ORDER BY u.name
      `;

      const { rows } = await db.query(query, [groupId, `%${searchTerm}%`]);
      return rows;
    } catch (error) {
      logger.error(`Fehler bei der Suche nach Gruppenmitgliedern mit Begriff "${searchTerm}":`, error);
      throw error;
    }
  }
};

module.exports = UserGroupModel;
