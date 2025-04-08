const DeviceModel = require('../models/deviceModel');
const { validationResult } = require('express-validator');

/**
 * Geräte-Controller für die Verwaltung von Geräten im ATLAS-System
 */
const DeviceController = {
  /**
   * Alle Geräte abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getAllDevices: async (req, res) => {
    try {
      // Filter aus Query-Parametern extrahieren
      const filters = {
        status: req.query.status,
        category_id: req.query.category_id ? parseInt(req.query.category_id, 10) : undefined,
        user_id: req.query.user_id ? parseInt(req.query.user_id, 10) : undefined,
        location_id: req.query.location_id ? parseInt(req.query.location_id, 10) : undefined,
        search: req.query.search,
        sort_by: req.query.sort_by || 'inventory_number',
        sort_order: req.query.sort_order === 'desc' ? 'DESC' : 'ASC',
        limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined
      };

      const devices = await DeviceModel.getAllDevices(filters);
      res.status(200).json({
        success: true,
        count: devices.length,
        data: devices
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Geräte:', error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Abrufen der Geräte',
        error: error.message
      });
    }
  },

  /**
   * Gerät nach ID abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getDeviceById: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Ungültige Geräte-ID'
        });
      }

      const device = await DeviceModel.getDeviceById(id);

      if (!device) {
        return res.status(404).json({
          success: false,
          message: `Gerät mit ID ${id} nicht gefunden`
        });
      }

      res.status(200).json({
        success: true,
        data: device
      });
    } catch (error) {
      console.error(`Fehler beim Abrufen des Geräts:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Abrufen des Geräts',
        error: error.message
      });
    }
  },

  /**
   * Neues Gerät erstellen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  createDevice: async (req, res) => {
    try {
      // Validierungsfehler prüfen
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const deviceData = req.body;
      const newDevice = await DeviceModel.createDevice(deviceData);

      res.status(201).json({
        success: true,
        message: 'Gerät erfolgreich erstellt',
        data: newDevice
      });
    } catch (error) {
      console.error('Fehler beim Erstellen des Geräts:', error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Erstellen des Geräts',
        error: error.message
      });
    }
  },

  /**
   * Gerät aktualisieren
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  updateDevice: async (req, res) => {
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
          message: 'Ungültige Geräte-ID'
        });
      }

      const deviceData = req.body;
      const updatedDevice = await DeviceModel.updateDevice(id, deviceData);

      if (!updatedDevice) {
        return res.status(404).json({
          success: false,
          message: `Gerät mit ID ${id} nicht gefunden`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Gerät erfolgreich aktualisiert',
        data: updatedDevice
      });
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Geräts:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Aktualisieren des Geräts',
        error: error.message
      });
    }
  },

  /**
   * Gerät löschen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  deleteDevice: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Ungültige Geräte-ID'
        });
      }

      const deleted = await DeviceModel.deleteDevice(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: `Gerät mit ID ${id} nicht gefunden`
        });
      }

      res.status(200).json({
        success: true,
        message: `Gerät mit ID ${id} erfolgreich gelöscht`
      });
    } catch (error) {
      console.error(`Fehler beim Löschen des Geräts:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Löschen des Geräts',
        error: error.message
      });
    }
  }
};

module.exports = DeviceController;
