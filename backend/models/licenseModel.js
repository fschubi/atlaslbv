const db = require('../db');

/**
 * Lizenzmodell - Stellt Datenbankabfragen und -manipulationen für Softwarelizenzen bereit
 */
const LicenseModel = {
  /**
   * Alle Lizenzen abrufen
   * @param {Object} filters - Optionale Filter für die Abfrage
   * @returns {Promise<Array>} - Array aller Lizenzen
   */
  getAllLicenses: async (filters = {}) => {
    try {
      let query = `
        SELECT sl.*,
          CONCAT(u.first_name, ' ', u.last_name) AS user_name,
          d.inventory_number AS device_inventory_number
        FROM software_licenses sl
        LEFT JOIN users u ON sl.assigned_to_user_id = u.id
        LEFT JOIN devices d ON sl.assigned_to_device_id = d.id
      `;

      const whereConditions = [];
      const queryParams = [];
      let paramIndex = 1;

      // Filter nach Software-Name
      if (filters.software_name) {
        whereConditions.push(`sl.software_name ILIKE $${paramIndex++}`);
        queryParams.push(`%${filters.software_name}%`);
      }

      // Filter nach Ablaufdatum (vor einem bestimmten Datum)
      if (filters.expiring_before) {
        whereConditions.push(`sl.expiration_date <= $${paramIndex++}`);
        queryParams.push(filters.expiring_before);
      }

      // Filter nach Ablaufdatum (nach einem bestimmten Datum)
      if (filters.expiring_after) {
        whereConditions.push(`sl.expiration_date >= $${paramIndex++}`);
        queryParams.push(filters.expiring_after);
      }

      // Filter nach zugewiesenem Benutzer
      if (filters.assigned_to_user_id) {
        whereConditions.push(`sl.assigned_to_user_id = $${paramIndex++}`);
        queryParams.push(filters.assigned_to_user_id);
      }

      // Filter nach zugewiesenem Gerät
      if (filters.assigned_to_device_id) {
        whereConditions.push(`sl.assigned_to_device_id = $${paramIndex++}`);
        queryParams.push(filters.assigned_to_device_id);
      }

      // Filter für nicht zugewiesene Lizenzen
      if (filters.unassigned === 'true') {
        whereConditions.push(`(sl.assigned_to_user_id IS NULL AND sl.assigned_to_device_id IS NULL)`);
      }

      // Suchfilter für Lizenzschlüssel oder Software-Name
      if (filters.search) {
        whereConditions.push(`(
          sl.license_key ILIKE $${paramIndex} OR
          sl.software_name ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${filters.search}%`);
        paramIndex++;
      }

      // WHERE-Klausel hinzufügen, falls Filter vorhanden
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      // Sortierung
      query += ` ORDER BY ${filters.sort_by || 'sl.software_name'} ${filters.sort_order || 'ASC'}`;

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
      console.error('Fehler beim Abrufen der Lizenzen:', error);
      throw error;
    }
  },

  /**
   * Lizenz nach ID abrufen
   * @param {number} id - Lizenz-ID
   * @returns {Promise<Object|null>} - Lizenzobjekt oder null
   */
  getLicenseById: async (id) => {
    try {
      const query = `
        SELECT sl.*,
          CONCAT(u.first_name, ' ', u.last_name) AS user_name,
          d.inventory_number AS device_inventory_number
        FROM software_licenses sl
        LEFT JOIN users u ON sl.assigned_to_user_id = u.id
        LEFT JOIN devices d ON sl.assigned_to_device_id = d.id
        WHERE sl.id = $1
      `;
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Fehler beim Abrufen der Lizenz mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Neue Lizenz erstellen
   * @param {Object} licenseData - Lizenzdaten
   * @returns {Promise<Object>} - Neu erstellte Lizenz
   */
  createLicense: async (licenseData) => {
    try {
      const {
        license_key,
        software_name,
        purchase_date,
        expiration_date,
        assigned_to_user_id,
        assigned_to_device_id,
        note
      } = licenseData;

      const query = `
        INSERT INTO software_licenses (
          license_key,
          software_name,
          purchase_date,
          expiration_date,
          assigned_to_user_id,
          assigned_to_device_id,
          note,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `;

      const values = [
        license_key,
        software_name,
        purchase_date,
        expiration_date,
        assigned_to_user_id,
        assigned_to_device_id,
        note
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Fehler beim Erstellen der Lizenz:', error);
      throw error;
    }
  },

  /**
   * Lizenz aktualisieren
   * @param {number} id - Lizenz-ID
   * @param {Object} licenseData - Aktualisierte Lizenzdaten
   * @returns {Promise<Object|null>} - Aktualisierte Lizenz oder null
   */
  updateLicense: async (id, licenseData) => {
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      // Dynamisches Erstellen des UPDATE-Strings basierend auf den vorhandenen Daten
      Object.keys(licenseData).forEach(key => {
        if (licenseData[key] !== undefined) {
          updateFields.push(`${key} = $${paramIndex++}`);
          values.push(licenseData[key]);
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
        UPDATE software_licenses
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren der Lizenz mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Lizenz löschen
   * @param {number} id - Lizenz-ID
   * @returns {Promise<boolean>} - true wenn erfolgreich gelöscht
   */
  deleteLicense: async (id) => {
    try {
      const query = `DELETE FROM software_licenses WHERE id = $1 RETURNING id`;
      const result = await db.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Fehler beim Löschen der Lizenz mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Ablaufende Lizenzen abrufen
   * @param {number} daysUntilExpiration - Anzahl der Tage bis zum Ablauf
   * @returns {Promise<Array>} - Array der ablaufenden Lizenzen
   */
  getExpiringLicenses: async (daysUntilExpiration = 30) => {
    try {
      const query = `
        SELECT sl.*,
          CONCAT(u.first_name, ' ', u.last_name) AS user_name,
          d.inventory_number AS device_inventory_number
        FROM software_licenses sl
        LEFT JOIN users u ON sl.assigned_to_user_id = u.id
        LEFT JOIN devices d ON sl.assigned_to_device_id = d.id
        WHERE sl.expiration_date IS NOT NULL
        AND sl.expiration_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '${daysUntilExpiration} days')
        ORDER BY sl.expiration_date ASC
      `;

      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error(`Fehler beim Abrufen ablaufender Lizenzen:`, error);
      throw error;
    }
  }
};

module.exports = LicenseModel;
