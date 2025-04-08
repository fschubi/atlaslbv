const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const InventoryController = require('../controllers/inventoryController');
const { authMiddleware, checkRole } = require('../middleware/auth');

/**
 * @route   GET /api/inventory
 * @desc    Alle Inventureinträge abrufen
 * @access  Private
 */
router.get('/', authMiddleware, InventoryController.getAllInventoryItems);

/**
 * @route   GET /api/inventory/stats
 * @desc    Statistiken für die Inventur abrufen
 * @access  Private
 */
router.get('/stats', authMiddleware, InventoryController.getInventoryStats);

/**
 * @route   GET /api/inventory/devices/not-checked
 * @desc    Geräte abrufen, die seit einem bestimmten Datum nicht geprüft wurden
 * @access  Private
 */
router.get('/devices/not-checked', [
  authMiddleware,
  checkRole(['admin', 'manager', 'inventory_manager'])
], InventoryController.getDevicesNotCheckedSince);

/**
 * @route   GET /api/inventory/device/:deviceId
 * @desc    Inventureinträge für ein bestimmtes Gerät abrufen
 * @access  Private
 */
router.get('/device/:deviceId', authMiddleware, InventoryController.getInventoryItemsByDevice);

/**
 * @route   GET /api/inventory/:id
 * @desc    Inventureintrag nach ID abrufen
 * @access  Private
 */
router.get('/:id', authMiddleware, InventoryController.getInventoryItemById);

/**
 * @route   POST /api/inventory
 * @desc    Neuen Inventureintrag erstellen
 * @access  Private (Admin, Manager, Inventory Manager)
 */
router.post('/', [
  authMiddleware,
  checkRole(['admin', 'manager', 'inventory_manager']),
  // Validierungsregeln
  body('device_id').notEmpty().withMessage('Geräte-ID ist erforderlich').isInt().withMessage('Geräte-ID muss eine Zahl sein'),
  body('status').notEmpty().withMessage('Status ist erforderlich').isIn(['bestätigt', 'vermisst', 'beschädigt']).withMessage('Status muss bestätigt, vermisst oder beschädigt sein'),
  body('location').optional().isString().withMessage('Standort muss ein Text sein')
], InventoryController.createInventoryItem);

/**
 * @route   PUT /api/inventory/:id
 * @desc    Inventureintrag aktualisieren
 * @access  Private (Admin, Manager, Inventory Manager)
 */
router.put('/:id', [
  authMiddleware,
  checkRole(['admin', 'manager', 'inventory_manager']),
  // Validierungsregeln für Updates
  body('device_id').optional().isInt().withMessage('Geräte-ID muss eine Zahl sein'),
  body('checked_by_user_id').optional().isInt().withMessage('Benutzer-ID muss eine Zahl sein'),
  body('status').optional().isIn(['bestätigt', 'vermisst', 'beschädigt']).withMessage('Status muss bestätigt, vermisst oder beschädigt sein'),
  body('location').optional().isString().withMessage('Standort muss ein Text sein'),
  body('last_checked_date').optional().isISO8601().withMessage('Letztes Prüfdatum muss ein gültiges Datum sein')
], InventoryController.updateInventoryItem);

/**
 * @route   DELETE /api/inventory/:id
 * @desc    Inventureintrag löschen
 * @access  Private (Admin, Inventory Manager)
 */
router.delete('/:id', [
  authMiddleware,
  checkRole(['admin', 'inventory_manager'])
], InventoryController.deleteInventoryItem);

module.exports = router;
