const db = require('../db');
const logger = require('../utils/logger');

/**
 * Inventursitzungs-Modell - Verwaltet Inventursitzungen für gruppierte Inventurprüfungen
 */
const InventorySessionModel = {
  /**
   * Alle Inventursitzungen abrufen
   * @param {Object} filters - Filter für die Abfrage
   * @param {number} page - Seite für Paginierung
   * @param {number} limit - Einträge pro Seite
   * @param {string} sortBy - Sortierfeld
   * @param {string} sortOrder - Sortierreihenfolge (asc/desc)
   * @returns {Promise<Object>} - Objekt mit Sitzungen und Metadaten
   */
  getAllSessions: async (filters = {}, page = 1, limit = 10, sortBy = 'start_date', sortOrder = 'DESC') => {
    try {
      // Basisabfrage
      let query = `
        SELECT
          s.*,
          (SELECT COUNT(*) FROM inventory i WHERE i.session_id = s.id) AS check_count,
          (
            SELECT COUNT(DISTINCT device_id)
            FROM inventory
            WHERE session_id = s.id
          ) AS device_count,
          (
            SELECT COUNT(*)
            FROM inventory
            WHERE session_id = s.id AND status = 'bestätigt'
          ) AS confirmed_count,
          (
            SELECT COUNT(*)
            FROM inventory
            WHERE session_id = s.id AND status = 'vermisst'
          ) AS missing_count,
          (
            SELECT COUNT(*)
            FROM inventory
            WHERE session_id = s.id AND status = 'beschädigt'
          ) AS damaged_count,
          CONCAT(u.first_name, ' ', u.last_name) AS created_by_name
        FROM
          inventory_sessions s
        LEFT JOIN
          users u ON s.created_by_user_id = u.id
      `;

      // Filter erstellen
      const whereConditions = [];
      const queryParams = [];
      let paramIndex = 1;

      // Filter für Titel
      if (filters.title) {
        whereConditions.push(`s.title ILIKE $${paramIndex++}`);
        queryParams.push(`%${filters.title}%`);
      }

      // Filter für aktive Sitzungen
      if (filters.is_active !== undefined) {
        whereConditions.push(`s.is_active = $${paramIndex++}`);
        queryParams.push(filters.is_active === 'true' || filters.is_active === true);
      }

      // Filter für Startdatum (von)
      if (filters.start_date_from) {
        whereConditions.push(`s.start_date >= $${paramIndex++}`);
        queryParams.push(filters.start_date_from);
      }

      // Filter für Startdatum (bis)
      if (filters.start_date_to) {
        whereConditions.push(`s.start_date <= $${paramIndex++}`);
        queryParams.push(filters.start_date_to);
      }

      // Filter für Enddatum (von)
      if (filters.end_date_from) {
        whereConditions.push(`s.end_date >= $${paramIndex++}`);
        queryParams.push(filters.end_date_from);
      }

      // Filter für Enddatum (bis)
      if (filters.end_date_to) {
        whereConditions.push(`s.end_date <= $${paramIndex++}`);
        queryParams.push(filters.end_date_to);
      }

      // Filter für erstellt von
      if (filters.created_by_user_id) {
        whereConditions.push(`s.created_by_user_id = $${paramIndex++}`);
        queryParams.push(filters.created_by_user_id);
      }

      // Suche über mehrere Felder
      if (filters.search) {
        whereConditions.push(`(
          s.title ILIKE $${paramIndex} OR
          s.notes ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${filters.search}%`);
        paramIndex++;
      }

      // WHERE-Klausel hinzufügen
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      // Zählen der Gesamtanzahl (für Paginierung)
      const countQuery = `SELECT COUNT(*) FROM (${query}) AS count_query`;
      const countResult = await db.query(countQuery, queryParams);
      const totalItems = parseInt(countResult.rows[0].count);

      // Sortierung und Paginierung
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;

      // Parameter für Paginierung
      queryParams.push(limit);
      queryParams.push((page - 1) * limit);

      // Ausführung der eigentlichen Abfrage
      const result = await db.query(query, queryParams);

      return {
        sessions: result.rows,
        metadata: {
          total: totalItems,
          page: page,
          limit: limit,
          pages: Math.ceil(totalItems / limit)
        }
      };
    } catch (error) {
      logger.error('Fehler beim Abrufen der Inventursitzungen:', error);
      throw error;
    }
  },

  /**
   * Inventursitzung nach ID abrufen
   * @param {number} id - ID der Sitzung
   * @returns {Promise<Object|null>} - Sitzungsobjekt oder null
   */
  getSessionById: async (id) => {
    try {
      const query = `
        SELECT
          s.*,
          (SELECT COUNT(*) FROM inventory i WHERE i.session_id = s.id) AS check_count,
          (
            SELECT COUNT(DISTINCT device_id)
            FROM inventory
            WHERE session_id = s.id
          ) AS device_count,
          (
            SELECT COUNT(*)
            FROM inventory
            WHERE session_id = s.id AND status = 'bestätigt'
          ) AS confirmed_count,
          (
            SELECT COUNT(*)
            FROM inventory
            WHERE session_id = s.id AND status = 'vermisst'
          ) AS missing_count,
          (
            SELECT COUNT(*)
            FROM inventory
            WHERE session_id = s.id AND status = 'beschädigt'
          ) AS damaged_count,
          CONCAT(u.first_name, ' ', u.last_name) AS created_by_name
        FROM
          inventory_sessions s
        LEFT JOIN
          users u ON s.created_by_user_id = u.id
        WHERE
          s.id = $1
      `;

      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Inventursitzung mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Aktive Inventursitzung abrufen
   * @returns {Promise<Object|null>} - Aktive Sitzung oder null
   */
  getActiveSession: async () => {
    try {
      const query = `
        SELECT
          s.*,
          (SELECT COUNT(*) FROM inventory i WHERE i.session_id = s.id) AS check_count,
          CONCAT(u.first_name, ' ', u.last_name) AS created_by_name
        FROM
          inventory_sessions s
        LEFT JOIN
          users u ON s.created_by_user_id = u.id
        WHERE
          s.is_active = true
        ORDER BY
          s.start_date DESC
        LIMIT 1
      `;

      const result = await db.query(query);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Fehler beim Abrufen der aktiven Inventursitzung:', error);
      throw error;
    }
  },

  /**
   * Neue Inventursitzung erstellen
   * @param {Object} sessionData - Sitzungsdaten
   * @returns {Promise<Object>} - Erstellte Sitzung
   */
  createSession: async (sessionData) => {
    try {
      // Wenn es eine aktive Sitzung gibt und die neue auch aktiv sein soll,
      // deaktivieren wir zuerst alle anderen aktiven Sitzungen
      if (sessionData.is_active) {
        await db.query(
          'UPDATE inventory_sessions SET is_active = false WHERE is_active = true'
        );
      }

      const {
        title,
        start_date = new Date(),
        end_date = null,
        is_active = true,
        notes = null,
        created_by_user_id
      } = sessionData;

      const query = `
        INSERT INTO inventory_sessions (
          title,
          start_date,
          end_date,
          is_active,
          notes,
          created_by_user_id,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `;

      const values = [
        title,
        start_date,
        end_date,
        is_active,
        notes,
        created_by_user_id
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Fehler beim Erstellen der Inventursitzung:', error);
      throw error;
    }
  },

  /**
   * Inventursitzung aktualisieren
   * @param {number} id - ID der Sitzung
   * @param {Object} sessionData - Aktualisierte Sitzungsdaten
   * @returns {Promise<Object|null>} - Aktualisierte Sitzung oder null
   */
  updateSession: async (id, sessionData) => {
    try {
      // Wenn diese Sitzung aktiviert werden soll, deaktivieren wir zuerst alle anderen
      if (sessionData.is_active) {
        await db.query(
          'UPDATE inventory_sessions SET is_active = false WHERE is_active = true AND id != $1',
          [id]
        );
      }

      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      // Dynamisches Erstellen des UPDATE-Strings
      Object.keys(sessionData).forEach(key => {
        if (sessionData[key] !== undefined) {
          updateFields.push(`${key} = $${paramIndex++}`);
          values.push(sessionData[key]);
        }
      });

      // Immer das updated_at Feld aktualisieren
      updateFields.push(`updated_at = NOW()`);

      if (updateFields.length === 1) {
        throw new Error('Keine Daten zum Aktualisieren angegeben');
      }

      // ID für die WHERE-Klausel hinzufügen
      values.push(id);

      const query = `
        UPDATE inventory_sessions
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren der Inventursitzung mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Inventursitzung beenden
   * @param {number} id - ID der Sitzung
   * @returns {Promise<Object|null>} - Beendete Sitzung oder null
   */
  endSession: async (id) => {
    try {
      const query = `
        UPDATE inventory_sessions
        SET
          is_active = false,
          end_date = NOW(),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Fehler beim Beenden der Inventursitzung mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Inventursitzung löschen
   * @param {number} id - ID der Sitzung
   * @returns {Promise<boolean>} - True wenn erfolgreich gelöscht
   */
  deleteSession: async (id) => {
    try {
      // Zuerst prüfen, ob Inventureinträge mit dieser Sitzung verknüpft sind
      const checkQuery = `SELECT COUNT(*) FROM inventory WHERE session_id = $1`;
      const checkResult = await db.query(checkQuery, [id]);

      if (parseInt(checkResult.rows[0].count) > 0) {
        throw new Error('Inventursitzung kann nicht gelöscht werden, da verknüpfte Inventureinträge existieren');
      }

      // Wenn keine verknüpften Einträge, dann löschen
      const deleteQuery = `DELETE FROM inventory_sessions WHERE id = $1 RETURNING id`;
      const deleteResult = await db.query(deleteQuery, [id]);

      return deleteResult.rows.length > 0;
    } catch (error) {
      logger.error(`Fehler beim Löschen der Inventursitzung mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Inventureinträge für eine Sitzung abrufen
   * @param {number} sessionId - ID der Sitzung
   * @param {Object} filters - Filter für die Abfrage
   * @param {number} page - Seite für Paginierung
   * @param {number} limit - Einträge pro Seite
   * @param {string} sortBy - Sortierfeld
   * @param {string} sortOrder - Sortierreihenfolge (asc/desc)
   * @returns {Promise<Object>} - Objekt mit Einträgen und Metadaten
   */
  getSessionItems: async (sessionId, filters = {}, page = 1, limit = 10, sortBy = 'last_checked_date', sortOrder = 'DESC') => {
    try {
      // Basisabfrage
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
        WHERE
          i.session_id = $1
      `;

      const queryParams = [sessionId];
      let paramIndex = 2;

      // Weitere Filterkriterien
      const whereConditions = [];

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

      // Filter für Gerätename oder Inventarnummer
      if (filters.search) {
        whereConditions.push(`(
          d.name ILIKE $${paramIndex} OR
          d.serial_number ILIKE $${paramIndex} OR
          d.inventory_number ILIKE $${paramIndex} OR
          i.notes ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${filters.search}%`);
        paramIndex++;
      }

      // WHERE-Klausel erweitern
      if (whereConditions.length > 0) {
        query += ` AND ${whereConditions.join(' AND ')}`;
      }

      // Zählen der Gesamtanzahl
      const countQuery = `SELECT COUNT(*) FROM (${query}) AS count_query`;
      const countResult = await db.query(countQuery, queryParams);
      const totalItems = parseInt(countResult.rows[0].count);

      // Sortierung und Paginierung
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
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
      logger.error(`Fehler beim Abrufen der Inventureinträge für Sitzung ${sessionId}:`, error);
      throw error;
    }
  }
};

module.exports = InventorySessionModel;
