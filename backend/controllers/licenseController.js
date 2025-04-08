const LicenseModel = require('../models/licenseModel');
const { validationResult } = require('express-validator');

/**
 * Lizenz-Controller für die Verwaltung von Softwarelizenzen im ATLAS-System
 */
const LicenseController = {
  /**
   * Alle Lizenzen abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getAllLicenses: async (req, res) => {
    try {
      // Filter aus Query-Parametern extrahieren
      const filters = {
        software_name: req.query.software_name,
        expiring_before: req.query.expiring_before,
        expiring_after: req.query.expiring_after,
        assigned_to_user_id: req.query.assigned_to_user_id ? parseInt(req.query.assigned_to_user_id, 10) : undefined,
        assigned_to_device_id: req.query.assigned_to_device_id ? parseInt(req.query.assigned_to_device_id, 10) : undefined,
        unassigned: req.query.unassigned,
        search: req.query.search,
        sort_by: req.query.sort_by || 'software_name',
        sort_order: req.query.sort_order === 'desc' ? 'DESC' : 'ASC',
        limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined
      };

      const licenses = await LicenseModel.getAllLicenses(filters);
      res.status(200).json({
        success: true,
        count: licenses.length,
        data: licenses
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Lizenzen:', error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Abrufen der Lizenzen',
        error: error.message
      });
    }
  },

  /**
   * Lizenz nach ID abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getLicenseById: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Ungültige Lizenz-ID'
        });
      }

      const license = await LicenseModel.getLicenseById(id);

      if (!license) {
        return res.status(404).json({
          success: false,
          message: `Lizenz mit ID ${id} nicht gefunden`
        });
      }

      res.status(200).json({
        success: true,
        data: license
      });
    } catch (error) {
      console.error(`Fehler beim Abrufen der Lizenz:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Abrufen der Lizenz',
        error: error.message
      });
    }
  },

  /**
   * Neue Lizenz erstellen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  createLicense: async (req, res) => {
    try {
      // Validierungsfehler prüfen
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const licenseData = req.body;
      const newLicense = await LicenseModel.createLicense(licenseData);

      res.status(201).json({
        success: true,
        message: 'Lizenz erfolgreich erstellt',
        data: newLicense
      });
    } catch (error) {
      console.error('Fehler beim Erstellen der Lizenz:', error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Erstellen der Lizenz',
        error: error.message
      });
    }
  },

  /**
   * Lizenz aktualisieren
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  updateLicense: async (req, res) => {
    try {
      // Validierungsfehler prüfen
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Ungültige Lizenz-ID'
        });
      }

      const licenseData = req.body;
      const updatedLicense = await LicenseModel.updateLicense(id, licenseData);

      if (!updatedLicense) {
        return res.status(404).json({
          success: false,
          message: `Lizenz mit ID ${id} nicht gefunden`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Lizenz erfolgreich aktualisiert',
        data: updatedLicense
      });
    } catch (error) {
      console.error(`Fehler beim Aktualisieren der Lizenz:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Aktualisieren der Lizenz',
        error: error.message
      });
    }
  },

  /**
   * Lizenz löschen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  deleteLicense: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Ungültige Lizenz-ID'
        });
      }

      const deleted = await LicenseModel.deleteLicense(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: `Lizenz mit ID ${id} nicht gefunden`
        });
      }

      res.status(200).json({
        success: true,
        message: `Lizenz mit ID ${id} erfolgreich gelöscht`
      });
    } catch (error) {
      console.error(`Fehler beim Löschen der Lizenz:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Löschen der Lizenz',
        error: error.message
      });
    }
  },

  /**
   * Ablaufende Lizenzen abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getExpiringLicenses: async (req, res) => {
    try {
      const daysUntilExpiration = req.query.days ? parseInt(req.query.days, 10) : 30;

      if (isNaN(daysUntilExpiration) || daysUntilExpiration < 1) {
        return res.status(400).json({
          success: false,
          message: 'Ungültiger Wert für Tage bis zum Ablauf'
        });
      }

      const expiringLicenses = await LicenseModel.getExpiringLicenses(daysUntilExpiration);

      res.status(200).json({
        success: true,
        count: expiringLicenses.length,
        data: expiringLicenses
      });
    } catch (error) {
      console.error('Fehler beim Abrufen ablaufender Lizenzen:', error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Abrufen ablaufender Lizenzen',
        error: error.message
      });
    }
  }
};

module.exports = LicenseController;
