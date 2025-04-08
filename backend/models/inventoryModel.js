const db = require('../db');
const logger = require('../utils/logger');

/**
 * Inventur-Modell - Stellt Datenbankabfragen und -manipulationen für Inventureinträge bereit
 */
const InventoryModel = {
  /**
   * Alle Inventureinträge abrufen
   * @param {Object} filters - Optionale Filter für die Abfrage
   * @param {number} page - Seitennummer für Paginierung
   * @param {number} limit - Anzahl der Einträge pro Seite
   * @param {string} sortBy - Feld für Sortierung
   * @param {string} sortOrder - Sortierreihenfolge (asc/desc)
   * @returns {Promise<Object>} - Objekt mit Inventureinträgen und Metadaten
   */
  getAllInventoryItems: async (filters = {}, page = 1, limit = 10, sortBy = 'last_checked_date', sortOrder = 'DESC') => {
    try {
      // Basisabfrage mit Joins
      let query = `
        SELECT
          i.*,
          d.name AS device_name,
          d.serial_number AS device_serial,
          d.inventory_number AS device_inventory_number,
          CONCAT(u.first_name, ' ', u.last_name) AS checked_by_user
        FROM
          inventory i
        LEFT JOIN
          devices d ON i.device_id = d.id
        LEFT JOIN
          users u ON i.checked_by_user_id = u.id
      `;

      // Erstelle WHERE-Klausel basierend auf Filtern
      const whereConditions = [];
      const queryParams = [];
      let paramIndex = 1;

      // Filter für Gerät
      if (filters.device_id) {
        whereConditions.push(`i.device_id = $${paramIndex++}`);
        queryParams.push(filters.device_id);
      }

      // Filter für Prüfer
      if (filters.checked_by_user_id) {
        whereConditions.push(`i.checked_by_user_id = $${paramIndex++}`);
        queryParams.push(filters.checked_by_user_id);
      }

      // Filter für Status
      if (filters.status) {
        whereConditions.push(`i.status = $${paramIndex++}`);
        queryParams.push(filters.status);
      }

      // Filter für Standort
      if (filters.location) {
        whereConditions.push(`i.location ILIKE $${paramIndex++}`);
        queryParams.push(`%${filters.location}%`);
      }

      // Filter für Prüfdatum (von)
      if (filters.checked_from) {
        whereConditions.push(`i.last_checked_date >= $${paramIndex++}`);
        queryParams.push(filters.checked_from);
      }

      // Filter für Prüfdatum (bis)
      if (filters.checked_to) {
        whereConditions.push(`i.last_checked_date <= $${paramIndex++}`);
        queryParams.push(filters.checked_to);
      }

      // Suche über multiple Felder
      if (filters.search) {
        whereConditions.push(`(
          d.name ILIKE $${paramIndex} OR
          d.serial_number ILIKE $${paramIndex} OR
          d.inventory_number ILIKE $${paramIndex} OR
          i.location ILIKE $${paramIndex} OR
          i.notes ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${filters.search}%`);
        paramIndex++;
      }

      // WHERE-Klausel zur Abfrage hinzufügen, falls Filter vorhanden
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      // Zählen der Gesamtanzahl (für Paginierung)
      const countQuery = `SELECT COUNT(*) FROM (${query}) AS count_query`;
      const countResult = await db.query(countQuery, queryParams);
      const totalItems = parseInt(countResult.rows[0].count);

      // Sortierung und Paginierung
      query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;

      // Parameter für Paginierung
      queryParams.push(limit);
      queryParams.push((page - 1) * limit);

      // Ausführung der eigentlichen Abfrage
      const result = await db.query(query, queryParams);

      return {
        items: result.rows,
        metadata: {
          total: totalItems,
          page: page,
          limit: limit,
          pages: Math.ceil(totalItems / limit)
        }
      };
    } catch (error) {
      logger.error('Fehler beim Abrufen der Inventureinträge:', error);
      throw error;
    }
  },

  /**
   * Inventureintrag nach ID abrufen
   * @param {number} id - ID des Inventureintrags
   * @returns {Promise<Object|null>} - Inventureintrag oder null
   */
  getInventoryItemById: async (id) => {
    try {
      const query = `
        SELECT
          i.*,
          d.name AS device_name,
          d.serial_number AS device_serial,
          d.inventory_number AS device_inventory_number,
          CONCAT(u.first_name, ' ', u.last_name) AS checked_by_user
        FROM
          inventory i
        LEFT JOIN
          devices d ON i.device_id = d.id
        LEFT JOIN
          users u ON i.checked_by_user_id = u.id
        WHERE
          i.id = $1
      `;

      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Fehler beim Abrufen des Inventureintrags mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Neuen Inventureintrag erstellen
   * @param {Object} inventoryData - Daten für den neuen Inventureintrag
   * @returns {Promise<Object>} - Erstellter Inventureintrag
   */
  createInventoryItem: async (inventoryData) => {
    try {
      const {
        device_id,
        checked_by_user_id,
        status,
        location,
        notes,
        last_checked_date = new Date()
      } = inventoryData;

      const query = `
        INSERT INTO inventory (
          device_id,
          checked_by_user_id,
          status,
          location,
          notes,
          last_checked_date,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `;

      const values = [
        device_id,
        checked_by_user_id,
        status,
        location,
        notes,
        last_checked_date
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Fehler beim Erstellen des Inventureintrags:', error);
      throw error;
    }
  },

  /**
   * Inventureintrag aktualisieren
   * @param {number} id - ID des Inventureintrags
   * @param {Object} inventoryData - Aktualisierte Daten
   * @returns {Promise<Object|null>} - Aktualisierter Inventureintrag oder null
   */
  updateInventoryItem: async (id, inventoryData) => {
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      // Dynamisches Erstellen des UPDATE-Strings basierend auf vorhandenen Daten
      Object.keys(inventoryData).forEach(key => {
        if (inventoryData[key] !== undefined) {
          updateFields.push(`${key} = $${paramIndex++}`);
          values.push(inventoryData[key]);
        }
      });

      if (updateFields.length === 0) {
        throw new Error('Keine Daten zum Aktualisieren angegeben');
      }

      // ID für die WHERE-Klausel hinzufügen
      values.push(id);

      const query = `
        UPDATE inventory
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren des Inventureintrags mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Inventureintrag löschen
   * @param {number} id - ID des Inventureintrags
   * @returns {Promise<boolean>} - True wenn erfolgreich gelöscht
   */
  deleteInventoryItem: async (id) => {
    try {
      const query = `DELETE FROM inventory WHERE id = $1 RETURNING id`;
      const result = await db.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error(`Fehler beim Löschen des Inventureintrags mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Inventureinträge für ein bestimmtes Gerät abrufen
   * @param {number} deviceId - ID des Geräts
   * @returns {Promise<Array>} - Array von Inventureinträgen
   */
  getInventoryItemsByDevice: async (deviceId) => {
    try {
      const query = `
        SELECT
          i.*,
          CONCAT(u.first_name, ' ', u.last_name) AS checked_by_user
        FROM
          inventory i
        LEFT JOIN
          users u ON i.checked_by_user_id = u.id
        WHERE
          i.device_id = $1
        ORDER BY
          i.last_checked_date DESC
      `;

      const result = await db.query(query, [deviceId]);
      return result.rows;
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Inventureinträge für Gerät mit ID ${deviceId}:`, error);
      throw error;
    }
  },

  /**
   * Geräte abrufen, die seit einem bestimmten Datum nicht mehr geprüft wurden
   * @param {string} date - Datum als String (YYYY-MM-DD)
   * @returns {Promise<Array>} - Array von Geräten
   */
  getDevicesNotCheckedSince: async (date) => {
    try {
      const query = `
        SELECT
          d.*,
          MAX(i.last_checked_date) AS last_checked
        FROM
          devices d
        LEFT JOIN
          inventory i ON d.id = i.device_id
        GROUP BY
          d.id
        HAVING
          MAX(i.last_checked_date) IS NULL OR MAX(i.last_checked_date) < $1
        ORDER BY
          last_checked ASC NULLS FIRST
      `;

      const result = await db.query(query, [date]);
      return result.rows;
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Geräte, die seit ${date} nicht geprüft wurden:`, error);
      throw error;
    }
  },

  /**
   * Statistiken für die Inventur abrufen
   * @returns {Promise<Object>} - Statistiken zur Inventur
   */
  getInventoryStats: async () => {
    try {
      const query = `
        SELECT
          COUNT(*) AS total_checks,
          COUNT(DISTINCT device_id) AS checked_devices,
          MAX(last_checked_date) AS latest_check,
          (
            SELECT COUNT(*)
            FROM devices
            WHERE id NOT IN (
              SELECT DISTINCT device_id FROM inventory
            )
          ) AS unchecked_devices,
          (
            SELECT COUNT(*)
            FROM inventory
            WHERE status = 'bestätigt'
          ) AS confirmed_items,
          (
            SELECT COUNT(*)
            FROM inventory
            WHERE status = 'vermisst'
          ) AS missing_items,
          (
            SELECT COUNT(*)
            FROM inventory
            WHERE status = 'beschädigt'
          ) AS damaged_items
        FROM
          inventory
      `;

      const result = await db.query(query);
      return result.rows[0] || {
        total_checks: 0,
        checked_devices: 0,
        latest_check: null,
        unchecked_devices: 0,
        confirmed_items: 0,
        missing_items: 0,
        damaged_items: 0
      };
    } catch (error) {
      logger.error('Fehler beim Abrufen der Inventurstatistiken:', error);
      throw error;
    }
  }
};

module.exports = InventoryModel;
