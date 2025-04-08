const db = require('../db');

/**
 * Zertifikatsmodell - Stellt Datenbankabfragen und -manipulationen für Zertifikate bereit
 */
const CertificateModel = {
  /**
   * Alle Zertifikate abrufen
   * @param {Object} filters - Optionale Filter für die Abfrage
   * @returns {Promise<Array>} - Array aller Zertifikate
   */
  getAllCertificates: async (filters = {}) => {
    try {
      let query = `
        SELECT c.*,
          d.inventory_number AS device_inventory_number
        FROM certificates c
        LEFT JOIN devices d ON c.assigned_to_device_id = d.id
      `;

      const whereConditions = [];
      const queryParams = [];
      let paramIndex = 1;

      // Filter nach Name
      if (filters.name) {
        whereConditions.push(`c.name ILIKE $${paramIndex++}`);
        queryParams.push(`%${filters.name}%`);
      }

      // Filter nach Service
      if (filters.service) {
        whereConditions.push(`c.service ILIKE $${paramIndex++}`);
        queryParams.push(`%${filters.service}%`);
      }

      // Filter nach Domain
      if (filters.domain) {
        whereConditions.push(`c.domain ILIKE $${paramIndex++}`);
        queryParams.push(`%${filters.domain}%`);
      }

      // Filter nach Ablaufdatum (vor einem bestimmten Datum)
      if (filters.expiring_before) {
        whereConditions.push(`c.expiration_date <= $${paramIndex++}`);
        queryParams.push(filters.expiring_before);
      }

      // Filter nach Ablaufdatum (nach einem bestimmten Datum)
      if (filters.expiring_after) {
        whereConditions.push(`c.expiration_date >= $${paramIndex++}`);
        queryParams.push(filters.expiring_after);
      }

      // Filter nach zugewiesenem Gerät
      if (filters.assigned_to_device_id) {
        whereConditions.push(`c.assigned_to_device_id = $${paramIndex++}`);
        queryParams.push(filters.assigned_to_device_id);
      }

      // Suchfilter für Name, Service oder Domain
      if (filters.search) {
        whereConditions.push(`(
          c.name ILIKE $${paramIndex} OR
          c.service ILIKE $${paramIndex} OR
          c.domain ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${filters.search}%`);
        paramIndex++;
      }

      // WHERE-Klausel hinzufügen, falls Filter vorhanden
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      // Sortierung
      query += ` ORDER BY ${filters.sort_by || 'c.expiration_date'} ${filters.sort_order || 'ASC'}`;

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
      console.error('Fehler beim Abrufen der Zertifikate:', error);
      throw error;
    }
  },

  /**
   * Zertifikat nach ID abrufen
   * @param {number} id - Zertifikats-ID
   * @returns {Promise<Object|null>} - Zertifikatsobjekt oder null
   */
  getCertificateById: async (id) => {
    try {
      const query = `
        SELECT c.*,
          d.inventory_number AS device_inventory_number
        FROM certificates c
        LEFT JOIN devices d ON c.assigned_to_device_id = d.id
        WHERE c.id = $1
      `;
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Zertifikats mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Neues Zertifikat erstellen
   * @param {Object} certificateData - Zertifikatsdaten
   * @returns {Promise<Object>} - Neu erstelltes Zertifikat
   */
  createCertificate: async (certificateData) => {
    try {
      const {
        name,
        service,
        domain,
        issued_at,
        expiration_date,
        assigned_to_device_id,
        note
      } = certificateData;

      const query = `
        INSERT INTO certificates (
          name,
          service,
          domain,
          issued_at,
          expiration_date,
          assigned_to_device_id,
          note,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `;

      const values = [
        name,
        service,
        domain,
        issued_at,
        expiration_date,
        assigned_to_device_id,
        note
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Fehler beim Erstellen des Zertifikats:', error);
      throw error;
    }
  },

  /**
   * Zertifikat aktualisieren
   * @param {number} id - Zertifikats-ID
   * @param {Object} certificateData - Aktualisierte Zertifikatsdaten
   * @returns {Promise<Object|null>} - Aktualisiertes Zertifikat oder null
   */
  updateCertificate: async (id, certificateData) => {
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      // Dynamisches Erstellen des UPDATE-Strings basierend auf den vorhandenen Daten
      Object.keys(certificateData).forEach(key => {
        if (certificateData[key] !== undefined) {
          updateFields.push(`${key} = $${paramIndex++}`);
          values.push(certificateData[key]);
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
        UPDATE certificates
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Zertifikats mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Zertifikat löschen
   * @param {number} id - Zertifikats-ID
   * @returns {Promise<boolean>} - true wenn erfolgreich gelöscht
   */
  deleteCertificate: async (id) => {
    try {
      const query = `DELETE FROM certificates WHERE id = $1 RETURNING id`;
      const result = await db.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Fehler beim Löschen des Zertifikats mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Ablaufende Zertifikate abrufen
   * @param {number} daysUntilExpiration - Anzahl der Tage bis zum Ablauf
   * @returns {Promise<Array>} - Array der ablaufenden Zertifikate
   */
  getExpiringCertificates: async (daysUntilExpiration = 30) => {
    try {
      const query = `
        SELECT c.*,
          d.inventory_number AS device_inventory_number
        FROM certificates c
        LEFT JOIN devices d ON c.assigned_to_device_id = d.id
        WHERE c.expiration_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '${daysUntilExpiration} days')
        ORDER BY c.expiration_date ASC
      `;

      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error(`Fehler beim Abrufen ablaufender Zertifikate:`, error);
      throw error;
    }
  }
};

module.exports = CertificateModel;
