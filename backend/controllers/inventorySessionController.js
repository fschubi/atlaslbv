const { validationResult } = require('express-validator');
const InventorySessionModel = require('../models/inventorySessionModel');
const InventoryModel = require('../models/inventoryModel');
const logger = require('../utils/logger');

/**
 * Controller für Inventursitzungen - Verwaltet die API-Endpunkte für Inventursitzungen
 */
const InventorySessionController = {
  /**
   * Alle Inventursitzungen abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getAllSessions: async (req, res) => {
    try {
      // Filter aus Query-Parametern extrahieren
      const {
        title, is_active, start_date_from, start_date_to,
        end_date_from, end_date_to, created_by_user_id, search,
        page = 1, limit = 10,
        sort_by = 'start_date', sort_order = 'desc'
      } = req.query;

      // Parameter konvertieren
      const filters = {
        title,
        is_active,
        start_date_from,
        start_date_to,
        end_date_from,
        end_date_to,
        created_by_user_id: created_by_user_id ? parseInt(created_by_user_id) : undefined,
        search
      };

      // Daten aus der Datenbank abrufen
      const result = await InventorySessionModel.getAllSessions(
        filters,
        parseInt(page),
        parseInt(limit),
        sort_by,
        sort_order
      );

      res.status(200).json(result);
    } catch (error) {
      logger.error('Fehler beim Abrufen der Inventursitzungen:', error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Abrufen der Inventursitzungen',
        error: error.message
      });
    }
  },

  /**
   * Inventursitzung nach ID abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getSessionById: async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Ungültige Sitzungs-ID'
        });
      }

      const session = await InventorySessionModel.getSessionById(id);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: `Inventursitzung mit ID ${id} nicht gefunden`
        });
      }

      res.status(200).json({
        success: true,
        data: session
      });
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Inventursitzung mit ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Abrufen der Inventursitzung',
        error: error.message
      });
    }
  },

  /**
   * Aktive Inventursitzung abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getActiveSession: async (req, res) => {
    try {
      const session = await InventorySessionModel.getActiveSession();

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Keine aktive Inventursitzung gefunden'
        });
      }

      res.status(200).json({
        success: true,
        data: session
      });
    } catch (error) {
      logger.error('Fehler beim Abrufen der aktiven Inventursitzung:', error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Abrufen der aktiven Inventursitzung',
        error: error.message
      });
    }
  },

  /**
   * Neue Inventursitzung erstellen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  createSession: async (req, res) => {
    try {
      // Validierung der Anforderungsdaten
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      // Aktiven Benutzer als Ersteller setzen, wenn nicht angegeben
      if (!req.body.created_by_user_id && req.user) {
        req.body.created_by_user_id = req.user.id;
      }

      // Neue Sitzung erstellen
      const newSession = await InventorySessionModel.createSession(req.body);

      res.status(201).json({
        success: true,
        message: 'Inventursitzung erfolgreich erstellt',
        data: newSession
      });
    } catch (error) {
      logger.error('Fehler beim Erstellen der Inventursitzung:', error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Erstellen der Inventursitzung',
        error: error.message
      });
    }
  },

  /**
   * Inventursitzung aktualisieren
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  updateSession: async (req, res) => {
    try {
      // Validierung der Anforderungsdaten
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Ungültige Sitzungs-ID'
        });
      }

      // Prüfen, ob die Sitzung existiert
      const existingSession = await InventorySessionModel.getSessionById(id);
      if (!existingSession) {
        return res.status(404).json({
          success: false,
          message: `Inventursitzung mit ID ${id} nicht gefunden`
        });
      }

      // Sitzung aktualisieren
      const updatedSession = await InventorySessionModel.updateSession(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Inventursitzung erfolgreich aktualisiert',
        data: updatedSession
      });
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren der Inventursitzung mit ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Aktualisieren der Inventursitzung',
        error: error.message
      });
    }
  },

  /**
   * Inventursitzung beenden
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  endSession: async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Ungültige Sitzungs-ID'
        });
      }

      // Prüfen, ob die Sitzung existiert und aktiv ist
      const existingSession = await InventorySessionModel.getSessionById(id);
      if (!existingSession) {
        return res.status(404).json({
          success: false,
          message: `Inventursitzung mit ID ${id} nicht gefunden`
        });
      }

      if (!existingSession.is_active) {
        return res.status(400).json({
          success: false,
          message: `Inventursitzung mit ID ${id} ist bereits beendet`
        });
      }

      // Sitzung beenden
      const endedSession = await InventorySessionModel.endSession(id);

      res.status(200).json({
        success: true,
        message: 'Inventursitzung erfolgreich beendet',
        data: endedSession
      });
    } catch (error) {
      logger.error(`Fehler beim Beenden der Inventursitzung mit ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Beenden der Inventursitzung',
        error: error.message
      });
    }
  },

  /**
   * Inventursitzung löschen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  deleteSession: async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Ungültige Sitzungs-ID'
        });
      }

      // Prüfen, ob die Sitzung existiert
      const existingSession = await InventorySessionModel.getSessionById(id);
      if (!existingSession) {
        return res.status(404).json({
          success: false,
          message: `Inventursitzung mit ID ${id} nicht gefunden`
        });
      }

      try {
        // Versuchen, die Sitzung zu löschen
        const deleted = await InventorySessionModel.deleteSession(id);

        if (deleted) {
          res.status(200).json({
            success: true,
            message: `Inventursitzung mit ID ${id} erfolgreich gelöscht`
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Fehler beim Löschen der Inventursitzung'
          });
        }
      } catch (deleteError) {
        // Wenn die Sitzung Inventureinträge enthält
        if (deleteError.message.includes('verknüpfte Inventureinträge')) {
          return res.status(400).json({
            success: false,
            message: deleteError.message
          });
        }
        throw deleteError;
      }
    } catch (error) {
      logger.error(`Fehler beim Löschen der Inventursitzung mit ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Löschen der Inventursitzung',
        error: error.message
      });
    }
  },

  /**
   * Inventureinträge für eine Sitzung abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getSessionItems: async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);

      if (isNaN(sessionId)) {
        return res.status(400).json({
          success: false,
          message: 'Ungültige Sitzungs-ID'
        });
      }

      // Prüfen, ob die Sitzung existiert
      const session = await InventorySessionModel.getSessionById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: `Inventursitzung mit ID ${sessionId} nicht gefunden`
        });
      }

      // Filter für Inventureinträge
      const {
        status, location, search,
        page = 1, limit = 10,
        sort_by = 'last_checked_date', sort_order = 'desc'
      } = req.query;

      const filters = {
        status,
        location,
        search
      };

      // Inventureinträge abrufen
      const result = await InventorySessionModel.getSessionItems(
        sessionId,
        filters,
        parseInt(page),
        parseInt(limit),
        sort_by,
        sort_order
      );

      res.status(200).json(result);
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Inventureinträge für Sitzung ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Abrufen der Inventureinträge für die Sitzung',
        error: error.message
      });
    }
  },

  /**
   * Neuen Inventureintrag zu einer Sitzung hinzufügen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  addItemToSession: async (req, res) => {
    try {
      // Validierung der Anforderungsdaten
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const sessionId = parseInt(req.params.id);

      if (isNaN(sessionId)) {
        return res.status(400).json({
          success: false,
          message: 'Ungültige Sitzungs-ID'
        });
      }

      // Prüfen, ob die Sitzung existiert und aktiv ist
      const session = await InventorySessionModel.getSessionById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: `Inventursitzung mit ID ${sessionId} nicht gefunden`
        });
      }

      if (!session.is_active) {
        return res.status(400).json({
          success: false,
          message: `Inventursitzung mit ID ${sessionId} ist nicht aktiv`
        });
      }

      // Sitzungs-ID zum Inventureintrag hinzufügen
      req.body.session_id = sessionId;

      // Wenn kein Prüfer angegeben ist, den aktuellen Benutzer verwenden
      if (!req.body.checked_by_user_id && req.user) {
        req.body.checked_by_user_id = req.user.id;
      }

      // Inventureintrag erstellen
      const newItem = await InventoryModel.createInventoryItem(req.body);

      res.status(201).json({
        success: true,
        message: 'Inventureintrag erfolgreich zur Sitzung hinzugefügt',
        data: newItem
      });
    } catch (error) {
      logger.error(`Fehler beim Hinzufügen eines Inventureintrags zur Sitzung ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Interner Serverfehler beim Hinzufügen des Inventureintrags',
        error: error.message
      });
    }
  }
};

module.exports = InventorySessionController;
