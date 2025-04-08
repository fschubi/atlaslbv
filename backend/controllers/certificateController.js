const CertificateModel = require('../models/certificateModel');
const { validationResult } = require('express-validator');

/**
 * Zertifikats-Controller für die Verwaltung von Zertifikaten im ATLAS-System
 */
const CertificateController = {
  /**
   * Alle Zertifikate abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getAllCertificates: async (req, res) => {
    try {
      // Filter aus Query-Parametern extrahieren
      const filters = {
        name: req.query.name,
        service: req.query.service,
        domain: req.query.domain,
        expiring_before: req.query.expiring_before,
        expiring_after: req.query.expiring_after,
        assigned_to_device_id: req.query.assigned_to_device_id ? parseInt(req.query.assigned_to_device_id, 10) : undefined,
        search: req.query.search,
        sort_by: req.query.sort_by || 'expiration_date',
        sort_order: req.query.sort_order === 'desc' ? 'DESC' : 'ASC',
        limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined
      };

      const certificates = await CertificateModel.getAllCertificates(filters);
      res.status(200).json({
        success: true,
        count: certificates.length,
        data: certificates
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Zertifikate:', error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Abrufen der Zertifikate',
        error: error.message
      });
    }
  },

  /**
   * Zertifikat nach ID abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getCertificateById: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Ungültige Zertifikats-ID'
        });
      }

      const certificate = await CertificateModel.getCertificateById(id);

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: `Zertifikat mit ID ${id} nicht gefunden`
        });
      }

      res.status(200).json({
        success: true,
        data: certificate
      });
    } catch (error) {
      console.error(`Fehler beim Abrufen des Zertifikats:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Abrufen des Zertifikats',
        error: error.message
      });
    }
  },

  /**
   * Neues Zertifikat erstellen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  createCertificate: async (req, res) => {
    try {
      // Validierungsfehler prüfen
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const certificateData = req.body;
      const newCertificate = await CertificateModel.createCertificate(certificateData);

      res.status(201).json({
        success: true,
        message: 'Zertifikat erfolgreich erstellt',
        data: newCertificate
      });
    } catch (error) {
      console.error('Fehler beim Erstellen des Zertifikats:', error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Erstellen des Zertifikats',
        error: error.message
      });
    }
  },

  /**
   * Zertifikat aktualisieren
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  updateCertificate: async (req, res) => {
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
          message: 'Ungültige Zertifikats-ID'
        });
      }

      const certificateData = req.body;
      const updatedCertificate = await CertificateModel.updateCertificate(id, certificateData);

      if (!updatedCertificate) {
        return res.status(404).json({
          success: false,
          message: `Zertifikat mit ID ${id} nicht gefunden`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Zertifikat erfolgreich aktualisiert',
        data: updatedCertificate
      });
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Zertifikats:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Aktualisieren des Zertifikats',
        error: error.message
      });
    }
  },

  /**
   * Zertifikat löschen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  deleteCertificate: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Ungültige Zertifikats-ID'
        });
      }

      const deleted = await CertificateModel.deleteCertificate(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: `Zertifikat mit ID ${id} nicht gefunden`
        });
      }

      res.status(200).json({
        success: true,
        message: `Zertifikat mit ID ${id} erfolgreich gelöscht`
      });
    } catch (error) {
      console.error(`Fehler beim Löschen des Zertifikats:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Löschen des Zertifikats',
        error: error.message
      });
    }
  },

  /**
   * Ablaufende Zertifikate abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getExpiringCertificates: async (req, res) => {
    try {
      const daysUntilExpiration = req.query.days ? parseInt(req.query.days, 10) : 30;

      if (isNaN(daysUntilExpiration) || daysUntilExpiration < 1) {
        return res.status(400).json({
          success: false,
          message: 'Ungültiger Wert für Tage bis zum Ablauf'
        });
      }

      const expiringCertificates = await CertificateModel.getExpiringCertificates(daysUntilExpiration);

      res.status(200).json({
        success: true,
        count: expiringCertificates.length,
        data: expiringCertificates
      });
    } catch (error) {
      console.error('Fehler beim Abrufen ablaufender Zertifikate:', error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Abrufen ablaufender Zertifikate',
        error: error.message
      });
    }
  }
};

module.exports = CertificateController;
