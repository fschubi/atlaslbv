const db = require('../db');

/**
 * Gerätemodell - Stellt Datenbankabfragen und -manipulationen für Geräte bereit
 */
const DeviceModel = {
  /**
   * Alle Geräte abrufen
   * @param {Object} filters - Optionale Filter für die Abfrage
   * @returns {Promise<Array>} - Array aller Geräte
   */
  getAllDevices: async (filters = {}) => {
    try {
      let query = `
        SELECT d.*,
          c.name AS category_name,
          dm.model_name,
          m.name AS manufacturer_name,
          r.room_number,
          l.name AS location_name,
          CONCAT(u.first_name, ' ', u.last_name) AS user_name
        FROM devices d
        LEFT JOIN categories c ON d.category_id = c.id
        LEFT JOIN device_models dm ON d.device_model_id = dm.id
        LEFT JOIN manufacturers m ON dm.manufacturer_id = m.id
        LEFT JOIN rooms r ON d.room_id = r.id
        LEFT JOIN locations l ON r.location_id = l.id
        LEFT JOIN users u ON d.user_id = u.id
      `;

      const whereConditions = [];
      const queryParams = [];
      let paramIndex = 1;

      // Filter nach Status
      if (filters.status) {
        whereConditions.push(`d.status = $${paramIndex++}`);
        queryParams.push(filters.status);
      }

      // Filter nach Kategorie
      if (filters.category_id) {
        whereConditions.push(`d.category_id = $${paramIndex++}`);
        queryParams.push(filters.category_id);
      }

      // Filter nach Benutzer
      if (filters.user_id) {
        whereConditions.push(`d.user_id = $${paramIndex++}`);
        queryParams.push(filters.user_id);
      }

      // Filter nach Standort
      if (filters.location_id) {
        whereConditions.push(`r.location_id = $${paramIndex++}`);
        queryParams.push(filters.location_id);
      }

      // Suchfilter für Inventarnummer oder Seriennummer
      if (filters.search) {
        whereConditions.push(`(
          d.inventory_number ILIKE $${paramIndex} OR
          d.serial_number ILIKE $${paramIndex} OR
          dm.model_name ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${filters.search}%`);
        paramIndex++;
      }

      // WHERE-Klausel hinzufügen, falls Filter vorhanden
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      // Sortierung
      query += ` ORDER BY ${filters.sort_by || 'd.inventory_number'} ${filters.sort_order || 'ASC'}`;

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
      console.error('Fehler beim Abrufen der Geräte:', error);
      throw error;
    }
  },

  /**
   * Gerät nach ID abrufen
   * @param {number} id - Geräte-ID
   * @returns {Promise<Object|null>} - Geräteobjekt oder null
   */
  getDeviceById: async (id) => {
    try {
      const query = `
        SELECT d.*,
          c.name AS category_name,
          dm.model_name,
          m.name AS manufacturer_name,
          r.room_number,
          l.name AS location_name,
          CONCAT(u.first_name, ' ', u.last_name) AS user_name
        FROM devices d
        LEFT JOIN categories c ON d.category_id = c.id
        LEFT JOIN device_models dm ON d.device_model_id = dm.id
        LEFT JOIN manufacturers m ON dm.manufacturer_id = m.id
        LEFT JOIN rooms r ON d.room_id = r.id
        LEFT JOIN locations l ON r.location_id = l.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE d.id = $1
      `;
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Geräts mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Neues Gerät erstellen
   * @param {Object} deviceData - Gerätedaten
   * @returns {Promise<Object>} - Neu erstelltes Gerät
   */
  createDevice: async (deviceData) => {
    try {
      const {
        inventory_number,
        serial_number,
        status,
        purchase_date,
        warranty_until,
        eol_date,
        lbv_number,
        switch_id,
        switch_port,
        base_pc_number,
        base_pc_inventory_number,
        mac_address,
        network_port_number,
        category_id,
        device_model_id,
        room_id,
        user_id,
        supplier_id
      } = deviceData;

      const query = `
        INSERT INTO devices (
          inventory_number,
          serial_number,
          status,
          purchase_date,
          warranty_until,
          eol_date,
          lbv_number,
          switch_id,
          switch_port,
          base_pc_number,
          base_pc_inventory_number,
          mac_address,
          network_port_number,
          category_id,
          device_model_id,
          room_id,
          user_id,
          supplier_id,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
        RETURNING *
      `;

      const values = [
        inventory_number,
        serial_number,
        status,
        purchase_date,
        warranty_until,
        eol_date,
        lbv_number,
        switch_id,
        switch_port,
        base_pc_number,
        base_pc_inventory_number,
        mac_address,
        network_port_number,
        category_id,
        device_model_id,
        room_id,
        user_id,
        supplier_id
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Fehler beim Erstellen des Geräts:', error);
      throw error;
    }
  },

  /**
   * Gerät aktualisieren
   * @param {number} id - Geräte-ID
   * @param {Object} deviceData - Aktualisierte Gerätedaten
   * @returns {Promise<Object|null>} - Aktualisiertes Gerät oder null
   */
  updateDevice: async (id, deviceData) => {
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      // Dynamisches Erstellen des UPDATE-Strings basierend auf den vorhandenen Daten
      Object.keys(deviceData).forEach(key => {
        if (deviceData[key] !== undefined) {
          updateFields.push(`${key} = $${paramIndex++}`);
          values.push(deviceData[key]);
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
        UPDATE devices
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Geräts mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Gerät löschen
   * @param {number} id - Geräte-ID
   * @returns {Promise<boolean>} - true wenn erfolgreich gelöscht
   */
  deleteDevice: async (id) => {
    try {
      const query = `DELETE FROM devices WHERE id = $1 RETURNING id`;
      const result = await db.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Fehler beim Löschen des Geräts mit ID ${id}:`, error);
      throw error;
    }
  }
};

module.exports = DeviceModel;
