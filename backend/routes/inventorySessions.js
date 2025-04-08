const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const InventorySessionController = require('../controllers/inventorySessionController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

/**
 * @route   GET /api/inventory-sessions
 * @desc    Alle Inventursitzungen abrufen
 * @access  Private
 */
router.get('/', authMiddleware, InventorySessionController.getAllSessions);

/**
 * @route   GET /api/inventory-sessions/active
 * @desc    Aktive Inventursitzung abrufen
 * @access  Private
 */
router.get('/active', authMiddleware, InventorySessionController.getActiveSession);

/**
 * @route   GET /api/inventory-sessions/:id
 * @desc    Inventursitzung nach ID abrufen
 * @access  Private
 */
router.get('/:id', authMiddleware, InventorySessionController.getSessionById);

/**
 * @route   GET /api/inventory-sessions/:id/items
 * @desc    Inventureinträge für eine Sitzung abrufen
 * @access  Private
 */
router.get('/:id/items', authMiddleware, InventorySessionController.getSessionItems);

/**
 * @route   POST /api/inventory-sessions
 * @desc    Neue Inventursitzung erstellen
 * @access  Private (Admin, Manager, Inventory Manager)
 */
router.post('/', [
  authMiddleware,
  roleMiddleware(['admin', 'manager', 'inventory_manager']),
  // Validierungsregeln
  body('title').notEmpty().withMessage('Titel ist erforderlich'),
  body('start_date').optional().isISO8601().withMessage('Startdatum muss ein gültiges Datum sein'),
  body('end_date').optional().isISO8601().withMessage('Enddatum muss ein gültiges Datum sein'),
  body('is_active').optional().isBoolean().withMessage('Aktivstatus muss ein Boolean sein'),
  body('notes').optional().isString().withMessage('Notizen müssen ein Text sein')
], InventorySessionController.createSession);

/**
 * @route   POST /api/inventory-sessions/:id/items
 * @desc    Neuen Inventureintrag zu einer Sitzung hinzufügen
 * @access  Private (Admin, Manager, Inventory Manager)
 */
router.post('/:id/items', [
  authMiddleware,
  roleMiddleware(['admin', 'manager', 'inventory_manager']),
  // Validierungsregeln
  body('device_id').notEmpty().withMessage('Geräte-ID ist erforderlich').isInt().withMessage('Geräte-ID muss eine Zahl sein'),
  body('status').notEmpty().withMessage('Status ist erforderlich').isIn(['bestätigt', 'vermisst', 'beschädigt']).withMessage('Status muss bestätigt, vermisst oder beschädigt sein'),
  body('location').optional().isString().withMessage('Standort muss ein Text sein')
], InventorySessionController.addItemToSession);

/**
 * @route   PUT /api/inventory-sessions/:id
 * @desc    Inventursitzung aktualisieren
 * @access  Private (Admin, Manager, Inventory Manager)
 */
router.put('/:id', [
  authMiddleware,
  roleMiddleware(['admin', 'manager', 'inventory_manager']),
  // Validierungsregeln für Updates
  body('title').optional().notEmpty().withMessage('Titel darf nicht leer sein'),
  body('start_date').optional().isISO8601().withMessage('Startdatum muss ein gültiges Datum sein'),
  body('end_date').optional().isISO8601().withMessage('Enddatum muss ein gültiges Datum sein'),
  body('is_active').optional().isBoolean().withMessage('Aktivstatus muss ein Boolean sein'),
  body('notes').optional().isString().withMessage('Notizen müssen ein Text sein')
], InventorySessionController.updateSession);

/**
 * @route   PATCH /api/inventory-sessions/:id/end
 * @desc    Inventursitzung beenden
 * @access  Private (Admin, Manager, Inventory Manager)
 */
router.patch('/:id/end', [
  authMiddleware,
  roleMiddleware(['admin', 'manager', 'inventory_manager'])
], InventorySessionController.endSession);

/**
 * @route   DELETE /api/inventory-sessions/:id
 * @desc    Inventursitzung löschen
 * @access  Private (Admin, Inventory Manager)
 */
router.delete('/:id', [
  authMiddleware,
  roleMiddleware(['admin', 'inventory_manager'])
], InventorySessionController.deleteSession);

module.exports = router;
