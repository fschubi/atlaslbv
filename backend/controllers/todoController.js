const { validationResult } = require('express-validator');
const TodoModel = require('../models/todoModel');
const logger = require('../utils/logger');

const TodoController = {
  /**
   * Alle Todos abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getAllTodos: async (req, res) => {
    try {
      const {
        title, assigned_to_user_id, status, due_date_before, due_date_after,
        priority, related_device_id, related_license_id, related_certificate_id,
        unassigned, overdue, search,
        page = 1,
        limit = 10,
        sortBy = 'due_date',
        sortOrder = 'asc'
      } = req.query;

      // Parameter konvertieren, wenn sie als Strings ankommen
      const filters = {
        title,
        assigned_to_user_id: assigned_to_user_id ? parseInt(assigned_to_user_id) : undefined,
        status,
        due_date_before: due_date_before || undefined,
        due_date_after: due_date_after || undefined,
        priority,
        related_device_id: related_device_id ? parseInt(related_device_id) : undefined,
        related_license_id: related_license_id ? parseInt(related_license_id) : undefined,
        related_certificate_id: related_certificate_id ? parseInt(related_certificate_id) : undefined,
        unassigned: unassigned === 'true',
        overdue: overdue === 'true'
      };

      const result = await TodoModel.getAllTodos(
        filters,
        parseInt(page),
        parseInt(limit),
        sortBy,
        sortOrder,
        search
      );

      res.json(result);
    } catch (error) {
      logger.error('Fehler beim Abrufen aller Todos:', error);
      res.status(500).json({ message: 'Serverfehler beim Abrufen der Todos', error: error.message });
    }
  },

  /**
   * Todo nach ID abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getTodoById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'Ungültige Todo-ID' });
      }

      const todo = await TodoModel.getTodoById(parseInt(id));

      if (!todo) {
        return res.status(404).json({ message: 'Todo nicht gefunden' });
      }

      res.json(todo);
    } catch (error) {
      logger.error(`Fehler beim Abrufen des Todos mit ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Serverfehler beim Abrufen des Todos', error: error.message });
    }
  },

  /**
   * Todos für einen Benutzer abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getTodosByUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const { status, overdue, limit } = req.query;

      if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ message: 'Ungültige Benutzer-ID' });
      }

      const options = {
        status,
        overdue: overdue === 'true',
        limit: limit ? parseInt(limit) : undefined
      };

      const todos = await TodoModel.getTodosByUser(parseInt(userId), options);

      res.json(todos);
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Todos für Benutzer ${req.params.userId}:`, error);
      res.status(500).json({ message: 'Serverfehler beim Abrufen der Todos', error: error.message });
    }
  },

  /**
   * Todos für ein Gerät abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getTodosByDevice: async (req, res) => {
    try {
      const { deviceId } = req.params;
      const { status, limit } = req.query;

      if (!deviceId || isNaN(parseInt(deviceId))) {
        return res.status(400).json({ message: 'Ungültige Geräte-ID' });
      }

      const options = {
        status,
        limit: limit ? parseInt(limit) : undefined
      };

      const todos = await TodoModel.getTodosByDevice(parseInt(deviceId), options);

      res.json(todos);
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Todos für Gerät ${req.params.deviceId}:`, error);
      res.status(500).json({ message: 'Serverfehler beim Abrufen der Todos', error: error.message });
    }
  },

  /**
   * Überfällige Todos abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getOverdueTodos: async (req, res) => {
    try {
      const { limit } = req.query;
      const todos = await TodoModel.getOverdueTodos(limit ? parseInt(limit) : undefined);

      res.json(todos);
    } catch (error) {
      logger.error('Fehler beim Abrufen überfälliger Todos:', error);
      res.status(500).json({ message: 'Serverfehler beim Abrufen überfälliger Todos', error: error.message });
    }
  },

  /**
   * Neues Todo erstellen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  createTodo: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validierungsfehler', errors: errors.array() });
      }

      // Wenn kein created_by_user_id angegeben wird, verwenden wir die ID des authentifizierten Benutzers
      if (!req.body.created_by_user_id && req.user) {
        req.body.created_by_user_id = req.user.id;
      }

      const todo = await TodoModel.createTodo(req.body);

      res.status(201).json({
        message: 'Todo erfolgreich erstellt',
        todo
      });
    } catch (error) {
      logger.error('Fehler beim Erstellen des Todos:', error);
      res.status(500).json({ message: 'Serverfehler beim Erstellen des Todos', error: error.message });
    }
  },

  /**
   * Todo aktualisieren
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  updateTodo: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validierungsfehler', errors: errors.array() });
      }

      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'Ungültige Todo-ID' });
      }

      // Prüfen, ob Todo existiert
      const todo = await TodoModel.getTodoById(parseInt(id));
      if (!todo) {
        return res.status(404).json({ message: 'Todo nicht gefunden' });
      }

      const updatedTodo = await TodoModel.updateTodo(parseInt(id), req.body);

      res.json({
        message: 'Todo erfolgreich aktualisiert',
        todo: updatedTodo
      });
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren des Todos mit ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Todos', error: error.message });
    }
  },

  /**
   * Todo-Status aktualisieren
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  updateTodoStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'Ungültige Todo-ID' });
      }

      if (!status || !['offen', 'in Bearbeitung', 'abgeschlossen'].includes(status)) {
        return res.status(400).json({ message: 'Ungültiger Status. Erlaubte Werte: offen, in Bearbeitung, abgeschlossen' });
      }

      // Prüfen, ob Todo existiert
      const todo = await TodoModel.getTodoById(parseInt(id));
      if (!todo) {
        return res.status(404).json({ message: 'Todo nicht gefunden' });
      }

      const updatedTodo = await TodoModel.updateTodoStatus(parseInt(id), status);

      res.json({
        message: 'Todo-Status erfolgreich aktualisiert',
        todo: updatedTodo
      });
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren des Status für Todo mit ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Todo-Status', error: error.message });
    }
  },

  /**
   * Todo löschen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  deleteTodo: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'Ungültige Todo-ID' });
      }

      // Prüfen, ob Todo existiert
      const todo = await TodoModel.getTodoById(parseInt(id));
      if (!todo) {
        return res.status(404).json({ message: 'Todo nicht gefunden' });
      }

      const deleted = await TodoModel.deleteTodo(parseInt(id));

      if (deleted) {
        res.json({ message: 'Todo erfolgreich gelöscht' });
      } else {
        res.status(500).json({ message: 'Fehler beim Löschen des Todos' });
      }
    } catch (error) {
      logger.error(`Fehler beim Löschen des Todos mit ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Serverfehler beim Löschen des Todos', error: error.message });
    }
  },

  /**
   * Todo-Statistiken für das Dashboard abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getTodoStats: async (req, res) => {
    try {
      const stats = await TodoModel.getTodoStats();

      res.json(stats);
    } catch (error) {
      logger.error('Fehler beim Abrufen der Todo-Statistiken:', error);
      res.status(500).json({ message: 'Serverfehler beim Abrufen der Todo-Statistiken', error: error.message });
    }
  },

  /**
   * Todo als erledigt markieren
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  completeTodo: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'Ungültige Todo-ID' });
      }

      // Todo als erledigt markieren
      const completedTodo = await TodoModel.completeTodo(parseInt(id));

      if (!completedTodo) {
        return res.status(404).json({ message: 'Todo nicht gefunden' });
      }

      res.json({
        message: 'Todo als erledigt markiert',
        todo: completedTodo
      });
    } catch (error) {
      logger.error(`Fehler beim Markieren des Todos mit ID ${req.params.id} als erledigt:`, error);
      res.status(500).json({ message: 'Serverfehler beim Markieren des Todos als erledigt', error: error.message });
    }
  }
};

module.exports = TodoController;
