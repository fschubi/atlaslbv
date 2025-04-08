const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const DeviceController = require('../controllers/deviceController');

/**
 * @route   GET /api/devices
 * @desc    Alle Geräte abrufen
 * @access  Private
 */
router.get('/', DeviceController.getAllDevices);

/**
 * @route   GET /api/devices/:id
 * @desc    Gerät nach ID abrufen
 * @access  Private
 */
router.get('/:id', DeviceController.getDeviceById);

/**
 * @route   POST /api/devices
 * @desc    Neues Gerät erstellen
 * @access  Private
 */
router.post('/', [
  // Validierungsregeln
  body('inventory_number').notEmpty().withMessage('Inventarnummer ist erforderlich'),
  body('status').notEmpty().withMessage('Status ist erforderlich'),
  body('purchase_date').isDate().withMessage('Kaufdatum muss ein gültiges Datum sein'),
  body('category_id').optional().isInt().withMessage('Kategorie-ID muss eine Zahl sein'),
  body('device_model_id').optional().isInt().withMessage('Gerätemodell-ID muss eine Zahl sein')
], DeviceController.createDevice);

/**
 * @route   PUT /api/devices/:id
 * @desc    Gerät aktualisieren
 * @access  Private
 */
router.put('/:id', [
  // Validierungsregeln für Updates
  body('inventory_number').optional().notEmpty().withMessage('Inventarnummer darf nicht leer sein'),
  body('status').optional().notEmpty().withMessage('Status darf nicht leer sein'),
  body('purchase_date').optional().isDate().withMessage('Kaufdatum muss ein gültiges Datum sein'),
  body('category_id').optional().isInt().withMessage('Kategorie-ID muss eine Zahl sein'),
  body('device_model_id').optional().isInt().withMessage('Gerätemodell-ID muss eine Zahl sein')
], DeviceController.updateDevice);

/**
 * @route   DELETE /api/devices/:id
 * @desc    Gerät löschen
 * @access  Private
 */
router.delete('/:id', DeviceController.deleteDevice);

module.exports = router;
