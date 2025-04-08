const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const TodoController = require('../controllers/todoController');
const { authMiddleware } = require('../middleware/auth');

/**
 * @route   GET /api/todos
 * @desc    Alle Todos abrufen
 * @access  Private
 */
router.get('/', authMiddleware, TodoController.getAllTodos);

/**
 * @route   GET /api/todos/:id
 * @desc    Todo nach ID abrufen
 * @access  Private
 */
router.get('/:id', authMiddleware, TodoController.getTodoById);

/**
 * @route   GET /api/todos/user/:userId
 * @desc    Todos nach Benutzer abrufen
 * @access  Private
 */
router.get('/user/:userId', authMiddleware, TodoController.getTodosByUser);

/**
 * @route   GET /api/todos/device/:deviceId
 * @desc    Todos nach Gerät abrufen
 * @access  Private
 */
router.get('/device/:deviceId', authMiddleware, TodoController.getTodosByDevice);

/**
 * @route   GET /api/todos/overdue
 * @desc    Überfällige Todos abrufen
 * @access  Private
 */
router.get('/overdue', authMiddleware, TodoController.getOverdueTodos);

/**
 * @route   GET /api/todos/stats
 * @desc    Todo-Statistiken abrufen
 * @access  Private
 */
router.get('/stats', authMiddleware, TodoController.getTodoStats);

/**
 * @route   POST /api/todos
 * @desc    Neues Todo erstellen
 * @access  Private
 */
router.post('/', [
  authMiddleware,
  // Validierungsregeln
  body('title').notEmpty().withMessage('Titel ist erforderlich'),
  body('status')
    .optional()
    .isIn(['offen', 'in Bearbeitung', 'abgeschlossen'])
    .withMessage('Status muss offen, in Bearbeitung oder abgeschlossen sein'),
  body('priority')
    .optional()
    .isIn(['hoch', 'mittel', 'niedrig'])
    .withMessage('Priorität muss hoch, mittel oder niedrig sein'),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Fälligkeitsdatum muss ein gültiges Datum sein'),
  body('assigned_to_user_id')
    .optional()
    .isInt()
    .withMessage('Benutzer-ID muss eine Zahl sein'),
  body('related_device_id')
    .optional()
    .isInt()
    .withMessage('Geräte-ID muss eine Zahl sein'),
  body('related_license_id')
    .optional()
    .isInt()
    .withMessage('Lizenz-ID muss eine Zahl sein'),
  body('related_certificate_id')
    .optional()
    .isInt()
    .withMessage('Zertifikat-ID muss eine Zahl sein')
], TodoController.createTodo);

/**
 * @route   PUT /api/todos/:id
 * @desc    Todo aktualisieren
 * @access  Private
 */
router.put('/:id', [
  authMiddleware,
  // Validierungsregeln für Updates
  body('title')
    .optional()
    .notEmpty()
    .withMessage('Titel darf nicht leer sein'),
  body('status')
    .optional()
    .isIn(['offen', 'in Bearbeitung', 'abgeschlossen'])
    .withMessage('Status muss offen, in Bearbeitung oder abgeschlossen sein'),
  body('priority')
    .optional()
    .isIn(['hoch', 'mittel', 'niedrig'])
    .withMessage('Priorität muss hoch, mittel oder niedrig sein'),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Fälligkeitsdatum muss ein gültiges Datum sein'),
  body('assigned_to_user_id')
    .optional()
    .isInt()
    .withMessage('Benutzer-ID muss eine Zahl sein'),
  body('related_device_id')
    .optional()
    .isInt()
    .withMessage('Geräte-ID muss eine Zahl sein'),
  body('related_license_id')
    .optional()
    .isInt()
    .withMessage('Lizenz-ID muss eine Zahl sein'),
  body('related_certificate_id')
    .optional()
    .isInt()
    .withMessage('Zertifikat-ID muss eine Zahl sein')
], TodoController.updateTodo);

/**
 * @route   PATCH /api/todos/:id/status
 * @desc    Todo-Status aktualisieren
 * @access  Private
 */
router.patch('/:id/status', [
  authMiddleware,
  body('status')
    .notEmpty()
    .isIn(['offen', 'in Bearbeitung', 'abgeschlossen'])
    .withMessage('Status muss offen, in Bearbeitung oder abgeschlossen sein')
], TodoController.updateTodoStatus);

/**
 * @route   PATCH /api/todos/:id/complete
 * @desc    Todo als erledigt markieren
 * @access  Private
 */
router.patch('/:id/complete', authMiddleware, TodoController.completeTodo);

/**
 * @route   DELETE /api/todos/:id
 * @desc    Todo löschen
 * @access  Private
 */
router.delete('/:id', authMiddleware, TodoController.deleteTodo);

module.exports = router;
