const db = require('../db');
const logger = require('../utils/logger');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');

/**
 * Report-Modell - Stellt Funktionen für die Generierung von Berichten bereit
 */
const ReportModel = {
  /**
   * Geräte-Bericht erstellen
   * @param {Object} filters - Filterparameter für den Bericht
   * @returns {Promise<Array>} - Array mit Berichtsdaten
   */
  getDevicesReport: async (filters = {}) => {
    try {
      // Basisabfrage mit Joins für alle relevanten Informationen
      let query = `
        SELECT
          d.id,
          d.inventory_number,
          d.serial_number,
          d.status,
          d.purchase_date,
          d.warranty_until,
          d.eol_date,
          d.lbv_number,
          d.mac_address,
          c.name AS category_name,
          dm.model_name,
          m.name AS manufacturer,
          CASE
            WHEN d.warranty_until < CURRENT_DATE THEN 'Ja'
            ELSE 'Nein'
          END AS warranty_expired,
          r.room_number,
          l.name AS location,
          CONCAT(u.first_name, ' ', u.last_name) AS assigned_user,
          u.email AS user_email,
          s.name AS supplier,
          (
            SELECT MAX(i.last_checked_date)
            FROM inventory i
            WHERE i.device_id = d.id
          ) AS last_inventory_check,
          COALESCE(
            (SELECT STRING_AGG(sl.software_name, ', ')
             FROM software_licenses sl
             WHERE sl.assigned_to_device_id = d.id),
            ''
          ) AS assigned_licenses
        FROM
          devices d
        LEFT JOIN
          categories c ON d.category_id = c.id
        LEFT JOIN
          device_models dm ON d.device_model_id = dm.id
        LEFT JOIN
          manufacturers m ON dm.manufacturer_id = m.id
        LEFT JOIN
          rooms r ON d.room_id = r.id
        LEFT JOIN
          locations l ON r.location_id = l.id
        LEFT JOIN
          users u ON d.user_id = u.id
        LEFT JOIN
          suppliers s ON d.supplier_id = s.id
      `;

      // Parameter für die prepared Statements
      const queryParams = [];
      let paramIndex = 1;
      const whereConditions = [];

      // Filter anwenden
      if (filters.status) {
        whereConditions.push(`d.status = $${paramIndex++}`);
        queryParams.push(filters.status);
      }

      if (filters.category_id) {
        whereConditions.push(`d.category_id = $${paramIndex++}`);
        queryParams.push(filters.category_id);
      }

      if (filters.manufacturer_id) {
        whereConditions.push(`dm.manufacturer_id = $${paramIndex++}`);
        queryParams.push(filters.manufacturer_id);
      }

      if (filters.location_id) {
        whereConditions.push(`r.location_id = $${paramIndex++}`);
        queryParams.push(filters.location_id);
      }

      if (filters.user_id) {
        whereConditions.push(`d.user_id = $${paramIndex++}`);
        queryParams.push(filters.user_id);
      }

      if (filters.purchased_from) {
        whereConditions.push(`d.purchase_date >= $${paramIndex++}`);
        queryParams.push(filters.purchased_from);
      }

      if (filters.purchased_to) {
        whereConditions.push(`d.purchase_date <= $${paramIndex++}`);
        queryParams.push(filters.purchased_to);
      }

      if (filters.warranty_expired === true) {
        whereConditions.push(`d.warranty_until < CURRENT_DATE`);
      } else if (filters.warranty_expired === false) {
        whereConditions.push(`d.warranty_until >= CURRENT_DATE`);
      }

      if (filters.not_inventoried_since) {
        whereConditions.push(`
          NOT EXISTS (
            SELECT 1 FROM inventory i
            WHERE i.device_id = d.id
            AND i.last_checked_date >= $${paramIndex++}
          )
        `);
        queryParams.push(filters.not_inventoried_since);
      }

      // WHERE-Klausel zur Abfrage hinzufügen, falls Filter vorhanden
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      // Sortierung
      query += ` ORDER BY ${filters.sort_by || 'd.inventory_number'} ${filters.sort_order || 'ASC'}`;

      // Ausführung der Abfrage
      const result = await db.query(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Fehler beim Generieren des Geräte-Berichts:', error);
      throw error;
    }
  },

  /**
   * Lizenz-Bericht erstellen
   * @param {Object} filters - Filterparameter für den Bericht
   * @returns {Promise<Array>} - Array mit Berichtsdaten
   */
  getLicensesReport: async (filters = {}) => {
    try {
      // Basisabfrage
      let query = `
        SELECT
          sl.id,
          sl.license_key,
          sl.software_name,
          sl.purchase_date,
          sl.expiration_date,
          CASE
            WHEN sl.expiration_date IS NULL THEN 'Unbegrenzt'
            WHEN sl.expiration_date < CURRENT_DATE THEN 'Abgelaufen'
            WHEN sl.expiration_date < CURRENT_DATE + INTERVAL '30 day' THEN 'Läuft bald ab'
            ELSE 'Aktiv'
          END AS license_status,
          CASE
            WHEN sl.expiration_date IS NULL THEN NULL
            ELSE EXTRACT(DAY FROM sl.expiration_date - CURRENT_DATE)::INTEGER
          END AS days_until_expiration,
          CONCAT(u.first_name, ' ', u.last_name) AS assigned_user,
          u.email AS user_email,
          d.inventory_number AS device_inventory_number,
          d.serial_number AS device_serial_number,
          sl.note
        FROM
          software_licenses sl
        LEFT JOIN
          users u ON sl.assigned_to_user_id = u.id
        LEFT JOIN
          devices d ON sl.assigned_to_device_id = d.id
      `;

      // Parameter für die prepared Statements
      const queryParams = [];
      let paramIndex = 1;
      const whereConditions = [];

      // Filter anwenden
      if (filters.software_name) {
        whereConditions.push(`sl.software_name ILIKE $${paramIndex++}`);
        queryParams.push(`%${filters.software_name}%`);
      }

      if (filters.license_status) {
        if (filters.license_status === 'active') {
          whereConditions.push(`(sl.expiration_date IS NULL OR sl.expiration_date >= CURRENT_DATE)`);
        } else if (filters.license_status === 'expired') {
          whereConditions.push(`sl.expiration_date < CURRENT_DATE`);
        } else if (filters.license_status === 'expiring_soon') {
          whereConditions.push(`
            sl.expiration_date < CURRENT_DATE + INTERVAL '30 day'
            AND sl.expiration_date >= CURRENT_DATE
          `);
        }
      }

      if (filters.user_id) {
        whereConditions.push(`sl.assigned_to_user_id = $${paramIndex++}`);
        queryParams.push(filters.user_id);
      }

      if (filters.device_id) {
        whereConditions.push(`sl.assigned_to_device_id = $${paramIndex++}`);
        queryParams.push(filters.device_id);
      }

      if (filters.purchase_from) {
        whereConditions.push(`sl.purchase_date >= $${paramIndex++}`);
        queryParams.push(filters.purchase_from);
      }

      if (filters.purchase_to) {
        whereConditions.push(`sl.purchase_date <= $${paramIndex++}`);
        queryParams.push(filters.purchase_to);
      }

      if (filters.expiration_from) {
        whereConditions.push(`sl.expiration_date >= $${paramIndex++}`);
        queryParams.push(filters.expiration_from);
      }

      if (filters.expiration_to) {
        whereConditions.push(`sl.expiration_date <= $${paramIndex++}`);
        queryParams.push(filters.expiration_to);
      }

      // WHERE-Klausel zur Abfrage hinzufügen, falls Filter vorhanden
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      // Sortierung
      query += ` ORDER BY ${filters.sort_by || 'sl.software_name'} ${filters.sort_order || 'ASC'}`;

      // Ausführung der Abfrage
      const result = await db.query(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Fehler beim Generieren des Lizenz-Berichts:', error);
      throw error;
    }
  },

  /**
   * Zertifikat-Bericht erstellen
   * @param {Object} filters - Filterparameter für den Bericht
   * @returns {Promise<Array>} - Array mit Berichtsdaten
   */
  getCertificatesReport: async (filters = {}) => {
    try {
      // Basisabfrage
      let query = `
        SELECT
          c.id,
          c.name,
          c.service,
          c.domain,
          c.issued_at,
          c.expiration_date,
          CASE
            WHEN c.expiration_date < CURRENT_DATE THEN 'Abgelaufen'
            WHEN c.expiration_date < CURRENT_DATE + INTERVAL '30 day' THEN 'Läuft bald ab'
            ELSE 'Aktiv'
          END AS certificate_status,
          EXTRACT(DAY FROM c.expiration_date - CURRENT_DATE)::INTEGER AS days_until_expiration,
          d.inventory_number AS device_inventory_number,
          d.serial_number AS device_serial_number,
          c.note
        FROM
          certificates c
        LEFT JOIN
          devices d ON c.assigned_to_device_id = d.id
      `;

      // Parameter für die prepared Statements
      const queryParams = [];
      let paramIndex = 1;
      const whereConditions = [];

      // Filter anwenden
      if (filters.name) {
        whereConditions.push(`c.name ILIKE $${paramIndex++}`);
        queryParams.push(`%${filters.name}%`);
      }

      if (filters.domain) {
        whereConditions.push(`c.domain ILIKE $${paramIndex++}`);
        queryParams.push(`%${filters.domain}%`);
      }

      if (filters.service) {
        whereConditions.push(`c.service ILIKE $${paramIndex++}`);
        queryParams.push(`%${filters.service}%`);
      }

      if (filters.certificate_status) {
        if (filters.certificate_status === 'active') {
          whereConditions.push(`c.expiration_date >= CURRENT_DATE`);
        } else if (filters.certificate_status === 'expired') {
          whereConditions.push(`c.expiration_date < CURRENT_DATE`);
        } else if (filters.certificate_status === 'expiring_soon') {
          whereConditions.push(`
            c.expiration_date < CURRENT_DATE + INTERVAL '30 day'
            AND c.expiration_date >= CURRENT_DATE
          `);
        }
      }

      if (filters.device_id) {
        whereConditions.push(`c.assigned_to_device_id = $${paramIndex++}`);
        queryParams.push(filters.device_id);
      }

      if (filters.issued_from) {
        whereConditions.push(`c.issued_at >= $${paramIndex++}`);
        queryParams.push(filters.issued_from);
      }

      if (filters.issued_to) {
        whereConditions.push(`c.issued_at <= $${paramIndex++}`);
        queryParams.push(filters.issued_to);
      }

      if (filters.expiration_from) {
        whereConditions.push(`c.expiration_date >= $${paramIndex++}`);
        queryParams.push(filters.expiration_from);
      }

      if (filters.expiration_to) {
        whereConditions.push(`c.expiration_date <= $${paramIndex++}`);
        queryParams.push(filters.expiration_to);
      }

      // WHERE-Klausel zur Abfrage hinzufügen, falls Filter vorhanden
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      // Sortierung
      query += ` ORDER BY ${filters.sort_by || 'c.expiration_date'} ${filters.sort_order || 'ASC'}`;

      // Ausführung der Abfrage
      const result = await db.query(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Fehler beim Generieren des Zertifikat-Berichts:', error);
      throw error;
    }
  },

  /**
   * Benutzer-Inventar-Bericht erstellen
   * @param {Object} filters - Filterparameter für den Bericht
   * @returns {Promise<Array>} - Array mit Berichtsdaten
   */
  getUserInventoryReport: async (filters = {}) => {
    try {
      // Basisabfrage
      let query = `
        SELECT
          u.id AS user_id,
          u.first_name,
          u.last_name,
          u.email,
          u.username,
          departments.name AS department,
          COUNT(d.id) AS device_count,
          COUNT(a.id) AS accessory_count,
          COUNT(sl.id) AS license_count,
          ARRAY_REMOVE(ARRAY_AGG(DISTINCT d.inventory_number), NULL) AS device_inventory_numbers,
          ARRAY_REMOVE(ARRAY_AGG(DISTINCT d.status), NULL) AS device_statuses,
          ARRAY_REMOVE(ARRAY_AGG(DISTINCT a.name), NULL) AS accessory_names,
          ARRAY_REMOVE(ARRAY_AGG(DISTINCT sl.software_name), NULL) AS software_names,
          (
            SELECT MAX(i.last_checked_date)
            FROM inventory i
            JOIN devices dev ON i.device_id = dev.id
            WHERE dev.user_id = u.id
          ) AS last_inventory_check
        FROM
          users u
        LEFT JOIN
          departments ON u.department_id = departments.id
        LEFT JOIN
          devices d ON u.id = d.user_id
        LEFT JOIN
          accessories a ON u.id = a.assigned_to_user_id
        LEFT JOIN
          software_licenses sl ON u.id = sl.assigned_to_user_id
      `;

      // Parameter für die prepared Statements
      const queryParams = [];
      let paramIndex = 1;
      const whereConditions = [];

      // Filter anwenden
      if (filters.user_id) {
        whereConditions.push(`u.id = $${paramIndex++}`);
        queryParams.push(filters.user_id);
      }

      if (filters.department_id) {
        whereConditions.push(`u.department_id = $${paramIndex++}`);
        queryParams.push(filters.department_id);
      }

      if (filters.with_devices === true) {
        whereConditions.push(`d.id IS NOT NULL`);
      } else if (filters.with_devices === false) {
        whereConditions.push(`d.id IS NULL`);
      }

      if (filters.with_accessories === true) {
        whereConditions.push(`a.id IS NOT NULL`);
      } else if (filters.with_accessories === false) {
        whereConditions.push(`a.id IS NULL`);
      }

      if (filters.with_licenses === true) {
        whereConditions.push(`sl.id IS NOT NULL`);
      } else if (filters.with_licenses === false) {
        whereConditions.push(`sl.id IS NULL`);
      }

      if (filters.not_inventoried_since) {
        whereConditions.push(`
          NOT EXISTS (
            SELECT 1 FROM inventory i
            JOIN devices dev ON i.device_id = dev.id
            WHERE dev.user_id = u.id
            AND i.last_checked_date >= $${paramIndex++}
          )
        `);
        queryParams.push(filters.not_inventoried_since);
      }

      // WHERE-Klausel zur Abfrage hinzufügen, falls Filter vorhanden
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      // Gruppierung
      query += ` GROUP BY u.id, departments.name`;

      // Sortierung
      query += ` ORDER BY ${filters.sort_by || 'u.last_name'} ${filters.sort_order || 'ASC'}`;

      // Ausführung der Abfrage
      const result = await db.query(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Fehler beim Generieren des Benutzer-Inventar-Berichts:', error);
      throw error;
    }
  },

  /**
   * Inventur-Bericht erstellen
   * @param {Object} filters - Filterparameter für den Bericht
   * @returns {Promise<Array>} - Array mit Berichtsdaten
   */
  getInventoryReport: async (filters = {}) => {
    try {
      // Basisabfrage
      let query = `
        SELECT
          i.id,
          i.last_checked_date,
          i.status,
          i.location,
          i.notes,
          d.inventory_number AS device_inventory_number,
          d.serial_number AS device_serial_number,
          c.name AS category_name,
          dm.model_name,
          m.name AS manufacturer,
          r.room_number,
          l.name AS location_name,
          CONCAT(u.first_name, ' ', u.last_name) AS assigned_user,
          CONCAT(cu.first_name, ' ', cu.last_name) AS checked_by_user,
          s.title AS session_title,
          s.start_date AS session_start_date,
          s.end_date AS session_end_date
        FROM
          inventory i
        LEFT JOIN
          devices d ON i.device_id = d.id
        LEFT JOIN
          categories c ON d.category_id = c.id
        LEFT JOIN
          device_models dm ON d.device_model_id = dm.id
        LEFT JOIN
          manufacturers m ON dm.manufacturer_id = m.id
        LEFT JOIN
          rooms r ON d.room_id = r.id
        LEFT JOIN
          locations l ON r.location_id = l.id
        LEFT JOIN
          users u ON d.user_id = u.id
        LEFT JOIN
          users cu ON i.checked_by_user_id = cu.id
        LEFT JOIN
          inventory_sessions s ON i.session_id = s.id
      `;

      // Parameter für die prepared Statements
      const queryParams = [];
      let paramIndex = 1;
      const whereConditions = [];

      // Filter anwenden
      if (filters.session_id) {
        whereConditions.push(`i.session_id = $${paramIndex++}`);
        queryParams.push(filters.session_id);
      }

      if (filters.device_id) {
        whereConditions.push(`i.device_id = $${paramIndex++}`);
        queryParams.push(filters.device_id);
      }

      if (filters.status) {
        whereConditions.push(`i.status = $${paramIndex++}`);
        queryParams.push(filters.status);
      }

      if (filters.checked_by_user_id) {
        whereConditions.push(`i.checked_by_user_id = $${paramIndex++}`);
        queryParams.push(filters.checked_by_user_id);
      }

      if (filters.location) {
        whereConditions.push(`i.location ILIKE $${paramIndex++}`);
        queryParams.push(`%${filters.location}%`);
      }

      if (filters.checked_from) {
        whereConditions.push(`i.last_checked_date >= $${paramIndex++}`);
        queryParams.push(filters.checked_from);
      }

      if (filters.checked_to) {
        whereConditions.push(`i.last_checked_date <= $${paramIndex++}`);
        queryParams.push(filters.checked_to);
      }

      if (filters.category_id) {
        whereConditions.push(`d.category_id = $${paramIndex++}`);
        queryParams.push(filters.category_id);
      }

      if (filters.location_id) {
        whereConditions.push(`r.location_id = $${paramIndex++}`);
        queryParams.push(filters.location_id);
      }

      if (filters.assigned_user_id) {
        whereConditions.push(`d.user_id = $${paramIndex++}`);
        queryParams.push(filters.assigned_user_id);
      }

      // WHERE-Klausel zur Abfrage hinzufügen, falls Filter vorhanden
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      // Sortierung
      query += ` ORDER BY ${filters.sort_by || 'i.last_checked_date'} ${filters.sort_order || 'DESC'}`;

      // Ausführung der Abfrage
      const result = await db.query(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Fehler beim Generieren des Inventur-Berichts:', error);
      throw error;
    }
  },

  /**
   * Dashboard-Daten abrufen
   * @returns {Promise<Object>} - Objekt mit Dashboard-Daten
   */
  getDashboardData: async () => {
    try {
      // Geräte nach Status
      const devicesQuery = `
        SELECT
          status,
          COUNT(*) as count
        FROM
          devices
        GROUP BY
          status
        ORDER BY
          count DESC
      `;

      // Geräte nach Kategorie
      const categoriesQuery = `
        SELECT
          c.name,
          COUNT(*) as count
        FROM
          devices d
        JOIN
          categories c ON d.category_id = c.id
        GROUP BY
          c.name
        ORDER BY
          count DESC
      `;

      // Geräte nach Standort
      const locationsQuery = `
        SELECT
          l.name,
          COUNT(*) as count
        FROM
          devices d
        JOIN
          rooms r ON d.room_id = r.id
        JOIN
          locations l ON r.location_id = l.id
        GROUP BY
          l.name
        ORDER BY
          count DESC
      `;

      // Ablaufende Lizenzen
      const expiringLicensesQuery = `
        SELECT
          id,
          software_name,
          license_key,
          expiration_date,
          EXTRACT(DAY FROM expiration_date - CURRENT_DATE)::INTEGER AS days_until_expiration
        FROM
          software_licenses
        WHERE
          expiration_date IS NOT NULL
          AND expiration_date > CURRENT_DATE
          AND expiration_date <= CURRENT_DATE + INTERVAL '90 day'
        ORDER BY
          expiration_date ASC
        LIMIT 10
      `;

      // Ablaufende Zertifikate
      const expiringCertificatesQuery = `
        SELECT
          id,
          name,
          domain,
          service,
          expiration_date,
          EXTRACT(DAY FROM expiration_date - CURRENT_DATE)::INTEGER AS days_until_expiration
        FROM
          certificates
        WHERE
          expiration_date > CURRENT_DATE
          AND expiration_date <= CURRENT_DATE + INTERVAL '90 day'
        ORDER BY
          expiration_date ASC
        LIMIT 10
      `;

      // Inventur-Statistik
      const inventoryStatsQuery = `
        SELECT
          COUNT(*) AS total_checks,
          COUNT(DISTINCT device_id) AS checked_devices,
          MAX(last_checked_date) AS latest_check,
          COUNT(*) FILTER (WHERE status = 'bestätigt') AS confirmed_count,
          COUNT(*) FILTER (WHERE status = 'vermisst') AS missing_count,
          COUNT(*) FILTER (WHERE status = 'beschädigt') AS damaged_count
        FROM
          inventory
      `;

      // Aktive Inventursitzungen
      const activeSessionsQuery = `
        SELECT
          COUNT(*) AS active_sessions
        FROM
          inventory_sessions
        WHERE
          is_active = true
      `;

      // Alle Abfragen parallel ausführen
      const [
        devicesResult,
        categoriesResult,
        locationsResult,
        expiringLicensesResult,
        expiringCertificatesResult,
        inventoryStatsResult,
        activeSessionsResult
      ] = await Promise.all([
        db.query(devicesQuery),
        db.query(categoriesQuery),
        db.query(locationsQuery),
        db.query(expiringLicensesQuery),
        db.query(expiringCertificatesQuery),
        db.query(inventoryStatsQuery),
        db.query(activeSessionsQuery)
      ]);

      // Gesamtanzahl der Geräte berechnen
      const totalDevices = devicesResult.rows.reduce((sum, item) => sum + parseInt(item.count), 0);

      // Ergebnis zusammenstellen
      return {
        devices_by_status: devicesResult.rows,
        total_devices: totalDevices,
        devices_by_category: categoriesResult.rows,
        devices_by_location: locationsResult.rows,
        expiring_licenses: expiringLicensesResult.rows,
        expiring_certificates: expiringCertificatesResult.rows,
        inventory_stats: inventoryStatsResult.rows[0],
        active_sessions: parseInt(activeSessionsResult.rows[0].active_sessions)
      };
    } catch (error) {
      logger.error('Fehler beim Abrufen der Dashboard-Daten:', error);
      throw error;
    }
  },

  // Stellen Sie sicher, dass das Upload-Verzeichnis existiert
  ensureReportDirExists: () => {
    const reportsDir = path.join(__dirname, '..', 'uploads', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    return reportsDir;
  },

  // CSV Export für einen Bericht
  exportToCSV: async (data, reportType) => {
    try {
      const reportsDir = ReportModel.ensureReportDirExists();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${reportType}_report_${timestamp}.csv`;
      const filePath = path.join(reportsDir, filename);

      let headers = [];

      // Header-Definitionen je nach Berichtstyp
      switch (reportType) {
        case 'devices':
          headers = [
            {id: 'inventory_number', title: 'Inventarnummer'},
            {id: 'serial_number', title: 'Seriennummer'},
            {id: 'name', title: 'Gerätename'},
            {id: 'model', title: 'Modell'},
            {id: 'manufacturer', title: 'Hersteller'},
            {id: 'purchase_date', title: 'Kaufdatum'},
            {id: 'warranty_end', title: 'Garantieende'},
            {id: 'status', title: 'Status'},
            {id: 'category', title: 'Kategorie'},
            {id: 'location', title: 'Standort'},
            {id: 'assigned_to', title: 'Zugewiesen an'},
            {id: 'notes', title: 'Notizen'},
            {id: 'last_updated', title: 'Letztes Update'}
          ];
          break;
        case 'licenses':
          headers = [
            {id: 'name', title: 'Name'},
            {id: 'publisher', title: 'Hersteller'},
            {id: 'purchase_date', title: 'Kaufdatum'},
            {id: 'expiry_date', title: 'Ablaufdatum'},
            {id: 'license_key', title: 'Lizenzschlüssel'},
            {id: 'license_type', title: 'Lizenztyp'},
            {id: 'seats_total', title: 'Gesamt Plätze'},
            {id: 'seats_used', title: 'Genutzte Plätze'},
            {id: 'seats_available', title: 'Verfügbare Plätze'},
            {id: 'cost', title: 'Kosten'},
            {id: 'status', title: 'Status'},
            {id: 'notes', title: 'Notizen'},
            {id: 'last_updated', title: 'Letztes Update'}
          ];
          break;
        case 'certificates':
          headers = [
            {id: 'name', title: 'Name'},
            {id: 'issuer', title: 'Aussteller'},
            {id: 'issued_date', title: 'Ausstellungsdatum'},
            {id: 'expiry_date', title: 'Ablaufdatum'},
            {id: 'certificate_type', title: 'Zertifikatstyp'},
            {id: 'status', title: 'Status'},
            {id: 'domain', title: 'Domain'},
            {id: 'notes', title: 'Notizen'},
            {id: 'last_updated', title: 'Letztes Update'}
          ];
          break;
        case 'user-inventory':
          headers = [
            {id: 'username', title: 'Benutzername'},
            {id: 'email', title: 'E-Mail'},
            {id: 'department', title: 'Abteilung'},
            {id: 'inventory_number', title: 'Inventarnummer'},
            {id: 'device_name', title: 'Gerätename'},
            {id: 'model', title: 'Modell'},
            {id: 'category', title: 'Kategorie'},
            {id: 'status', title: 'Status'}
          ];
          break;
        case 'inventory':
          headers = [
            {id: 'session_name', title: 'Inventurname'},
            {id: 'start_date', title: 'Startdatum'},
            {id: 'end_date', title: 'Enddatum'},
            {id: 'inventory_number', title: 'Inventarnummer'},
            {id: 'device_name', title: 'Gerätename'},
            {id: 'serial_number', title: 'Seriennummer'},
            {id: 'model', title: 'Modell'},
            {id: 'category', title: 'Kategorie'},
            {id: 'assigned_to', title: 'Zugewiesen an'},
            {id: 'status', title: 'Inventurstatus'},
            {id: 'location', title: 'Fundort'},
            {id: 'scanned_by', title: 'Erfasst von'},
            {id: 'scanned_at', title: 'Erfasst am'},
            {id: 'notes', title: 'Notizen'}
          ];
          break;
        default:
          throw new Error(`Unbekannter Berichtstyp: ${reportType}`);
      }

      const csvWriter = createCsvWriter({
        path: filePath,
        header: headers,
        fieldDelimiter: ';'
      });

      await csvWriter.writeRecords(data);

      return {
        filename,
        path: filePath,
        records: data.length
      };
    } catch (error) {
      logger.error(`Fehler beim CSV-Export (${reportType}):`, error);
      throw error;
    }
  }
};

module.exports = ReportModel;
