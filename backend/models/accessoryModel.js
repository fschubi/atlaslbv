const db = require('../db');

/**
 * Zubehörmodell - Stellt Datenbankabfragen und -manipulationen für Zubehör bereit
 */
const AccessoryModel = {
  /**
   * Alles Zubehör abrufen
   * @param {Object} filters - Optionale Filter für die Abfrage
   * @returns {Promise<Array>} - Array aller Zubehörteile
   */
  getAllAccessories: async (filters = {}) => {
    try {
      let query = `
        SELECT a.*,
          CONCAT(u.first_name, ' ', u.last_name) AS user_name,
          d.inventory_number AS device_inventory_number
        FROM accessories a
        LEFT JOIN users u ON a.assigned_to_user_id = u.id
        LEFT JOIN devices d ON a.assigned_to_device_id = d.id
      `;

      const whereConditions = [];
      const queryParams = [];
      let paramIndex = 1;

      // Filter nach Name
      if (filters.name) {
        whereConditions.push(`a.name ILIKE $${paramIndex++}`);
        queryParams.push(`%${filters.name}%`);
      }

      // Filter nach zugewiesenem Benutzer
      if (filters.assigned_to_user_id) {
        whereConditions.push(`a.assigned_to_user_id = $${paramIndex++}`);
        queryParams.push(filters.assigned_to_user_id);
      }

      // Filter nach zugewiesenem Gerät
      if (filters.assigned_to_device_id) {
        whereConditions.push(`a.assigned_to_device_id = $${paramIndex++}`);
        queryParams.push(filters.assigned_to_device_id);
      }

      // Filter für nicht zugewiesenes Zubehör
      if (filters.unassigned === 'true') {
        whereConditions.push(`(a.assigned_to_user_id IS NULL AND a.assigned_to_device_id IS NULL)`);
      }

      // Suchfilter für Name oder Beschreibung
      if (filters.search) {
        whereConditions.push(`(
          a.name ILIKE $${paramIndex} OR
          a.description ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${filters.search}%`);
        paramIndex++;
      }

      // WHERE-Klausel hinzufügen, falls Filter vorhanden
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      // Sortierung
      query += ` ORDER BY ${filters.sort_by || 'a.name'} ${filters.sort_order || 'ASC'}`;

      // Paginierung
      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        queryParams.push(filters.limit);

        if (filters.offset) {
          query += ` OFFSET $${paramIndex++}`;
          queryParams.push(filters.offset);
        }
      }

      const result = await db.query(query, queryParams);
      return result.rows;
    } catch (error) {
      console.error('Fehler beim Abrufen des Zubehörs:', error);
      throw error;
    }
  },

  /**
   * Zubehör nach ID abrufen
   * @param {number} id - Zubehör-ID
   * @returns {Promise<Object|null>} - Zubehörobjekt oder null
   */
  getAccessoryById: async (id) => {
    try {
      const query = `
        SELECT a.*,
          CONCAT(u.first_name, ' ', u.last_name) AS user_name,
          d.inventory_number AS device_inventory_number
        FROM accessories a
        LEFT JOIN users u ON a.assigned_to_user_id = u.id
        LEFT JOIN devices d ON a.assigned_to_device_id = d.id
        WHERE a.id = $1
      `;
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Zubehörs mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Neues Zubehör erstellen
   * @param {Object} accessoryData - Zubehördaten
   * @returns {Promise<Object>} - Neu erstelltes Zubehörobjekt
   */
  createAccessory: async (accessoryData) => {
    try {
      const {
        name,
        description,
        assigned_to_user_id,
        assigned_to_device_id
      } = accessoryData;

      const query = `
        INSERT INTO accessories (
          name,
          description,
          assigned_to_user_id,
          assigned_to_device_id,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *
      `;

      const values = [
        name,
        description,
        assigned_to_user_id,
        assigned_to_device_id
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Fehler beim Erstellen des Zubehörs:', error);
      throw error;
    }
  },

  /**
   * Zubehör aktualisieren
   * @param {number} id - Zubehör-ID
   * @param {Object} accessoryData - Aktualisierte Zubehördaten
   * @returns {Promise<Object|null>} - Aktualisiertes Zubehörobjekt oder null
   */
  updateAccessory: async (id, accessoryData) => {
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      // Dynamisches Erstellen des UPDATE-Strings basierend auf den vorhandenen Daten
      Object.keys(accessoryData).forEach(key => {
        if (accessoryData[key] !== undefined) {
          updateFields.push(`${key} = $${paramIndex++}`);
          values.push(accessoryData[key]);
        }
      });

      // Immer das updated_at-Feld aktualisieren
      updateFields.push(`updated_at = NOW()`);

      // Wenn keine aktualisierbaren Felder gefunden wurden
      if (updateFields.length === 1) {
        throw new Error('Keine Daten zum Aktualisieren angegeben');
      }

      // ID für die WHERE-Klausel hinzufügen
      values.push(id);

      const query = `
        UPDATE accessories
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Zubehörs mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Zubehör löschen
   * @param {number} id - Zubehör-ID
   * @returns {Promise<boolean>} - true wenn erfolgreich gelöscht
   */
  deleteAccessory: async (id) => {
    try {
      const query = `DELETE FROM accessories WHERE id = $1 RETURNING id`;
      const result = await db.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Fehler beim Löschen des Zubehörs mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Zubehör nach Gerät abrufen
   * @param {number} deviceId - Geräte-ID
   * @returns {Promise<Array>} - Array von Zubehörteilen für das Gerät
   */
  getAccessoriesByDevice: async (deviceId) => {
    try {
      const query = `
        SELECT a.*
        FROM accessories a
        WHERE a.assigned_to_device_id = $1
        ORDER BY a.name ASC
      `;
      const result = await db.query(query, [deviceId]);
      return result.rows;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Zubehörs für Gerät mit ID ${deviceId}:`, error);
      throw error;
    }
  },

  /**
   * Zubehör nach Benutzer abrufen
   * @param {number} userId - Benutzer-ID
   * @returns {Promise<Array>} - Array von Zubehörteilen für den Benutzer
   */
  getAccessoriesByUser: async (userId) => {
    try {
      const query = `
        SELECT a.*
        FROM accessories a
        WHERE a.assigned_to_user_id = $1
        ORDER BY a.name ASC
      `;
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Zubehörs für Benutzer mit ID ${userId}:`, error);
      throw error;
    }
  }
};

module.exports = AccessoryModel;
