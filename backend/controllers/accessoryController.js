const AccessoryModel = require('../models/accessoryModel');
const { validationResult } = require('express-validator');

/**
 * Zubehör-Controller für die Verwaltung von Zubehör im ATLAS-System
 */
const AccessoryController = {
  /**
   * Alles Zubehör abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getAllAccessories: async (req, res) => {
    try {
      // Filter aus Query-Parametern extrahieren
      const filters = {
        name: req.query.name,
        assigned_to_user_id: req.query.assigned_to_user_id ? parseInt(req.query.assigned_to_user_id, 10) : undefined,
        assigned_to_device_id: req.query.assigned_to_device_id ? parseInt(req.query.assigned_to_device_id, 10) : undefined,
        unassigned: req.query.unassigned,
        search: req.query.search,
        sort_by: req.query.sort_by || 'name',
        sort_order: req.query.sort_order === 'desc' ? 'DESC' : 'ASC',
        limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined
      };

      const accessories = await AccessoryModel.getAllAccessories(filters);
      res.status(200).json({
        success: true,
        count: accessories.length,
        data: accessories
      });
    } catch (error) {
      console.error('Fehler beim Abrufen des Zubehörs:', error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Abrufen des Zubehörs',
        error: error.message
      });
    }
  },

  /**
   * Zubehör nach ID abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getAccessoryById: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Ungültige Zubehör-ID'
        });
      }

      const accessory = await AccessoryModel.getAccessoryById(id);

      if (!accessory) {
        return res.status(404).json({
          success: false,
          message: `Zubehör mit ID ${id} nicht gefunden`
        });
      }

      res.status(200).json({
        success: true,
        data: accessory
      });
    } catch (error) {
      console.error(`Fehler beim Abrufen des Zubehörs:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Abrufen des Zubehörs',
        error: error.message
      });
    }
  },

  /**
   * Neues Zubehör erstellen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  createAccessory: async (req, res) => {
    try {
      // Validierungsfehler prüfen
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const accessoryData = req.body;
      const newAccessory = await AccessoryModel.createAccessory(accessoryData);

      res.status(201).json({
        success: true,
        message: 'Zubehör erfolgreich erstellt',
        data: newAccessory
      });
    } catch (error) {
      console.error('Fehler beim Erstellen des Zubehörs:', error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Erstellen des Zubehörs',
        error: error.message
      });
    }
  },

  /**
   * Zubehör aktualisieren
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  updateAccessory: async (req, res) => {
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
          message: 'Ungültige Zubehör-ID'
        });
      }

      const accessoryData = req.body;
      const updatedAccessory = await AccessoryModel.updateAccessory(id, accessoryData);

      if (!updatedAccessory) {
        return res.status(404).json({
          success: false,
          message: `Zubehör mit ID ${id} nicht gefunden`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Zubehör erfolgreich aktualisiert',
        data: updatedAccessory
      });
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Zubehörs:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Aktualisieren des Zubehörs',
        error: error.message
      });
    }
  },

  /**
   * Zubehör löschen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  deleteAccessory: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Ungültige Zubehör-ID'
        });
      }

      const deleted = await AccessoryModel.deleteAccessory(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: `Zubehör mit ID ${id} nicht gefunden`
        });
      }

      res.status(200).json({
        success: true,
        message: `Zubehör mit ID ${id} erfolgreich gelöscht`
      });
    } catch (error) {
      console.error(`Fehler beim Löschen des Zubehörs:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Löschen des Zubehörs',
        error: error.message
      });
    }
  },

  /**
   * Zubehör nach Gerät abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getAccessoriesByDevice: async (req, res) => {
    try {
      const deviceId = parseInt(req.params.deviceId, 10);

      if (isNaN(deviceId)) {
        return res.status(400).json({
          success: false,
          message: 'Ungültige Geräte-ID'
        });
      }

      const accessories = await AccessoryModel.getAccessoriesByDevice(deviceId);

      res.status(200).json({
        success: true,
        count: accessories.length,
        data: accessories
      });
    } catch (error) {
      console.error(`Fehler beim Abrufen des Zubehörs für das Gerät:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Abrufen des Zubehörs für das Gerät',
        error: error.message
      });
    }
  },

  /**
   * Zubehör nach Benutzer abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getAccessoriesByUser: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Ungültige Benutzer-ID'
        });
      }

      const accessories = await AccessoryModel.getAccessoriesByUser(userId);

      res.status(200).json({
        success: true,
        count: accessories.length,
        data: accessories
      });
    } catch (error) {
      console.error(`Fehler beim Abrufen des Zubehörs für den Benutzer:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Abrufen des Zubehörs für den Benutzer',
        error: error.message
      });
    }
  }
};

module.exports = AccessoryController;
