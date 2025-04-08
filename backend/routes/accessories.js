const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AccessoryController = require('../controllers/accessoryController');

/**
 * @route   GET /api/accessories
 * @desc    Alles Zubehör abrufen
 * @access  Private
 */
router.get('/', AccessoryController.getAllAccessories);

/**
 * @route   GET /api/accessories/:id
 * @desc    Zubehör nach ID abrufen
 * @access  Private
 */
router.get('/:id', AccessoryController.getAccessoryById);

/**
 * @route   GET /api/accessories/device/:deviceId
 * @desc    Zubehör nach Gerät abrufen
 * @access  Private
 */
router.get('/device/:deviceId', AccessoryController.getAccessoriesByDevice);

/**
 * @route   GET /api/accessories/user/:userId
 * @desc    Zubehör nach Benutzer abrufen
 * @access  Private
 */
router.get('/user/:userId', AccessoryController.getAccessoriesByUser);

/**
 * @route   POST /api/accessories
 * @desc    Neues Zubehör erstellen
 * @access  Private
 */
router.post('/', [
  // Validierungsregeln
  body('name').notEmpty().withMessage('Name ist erforderlich'),
  body('assigned_to_user_id').optional().isInt().withMessage('Benutzer-ID muss eine Zahl sein'),
  body('assigned_to_device_id').optional().isInt().withMessage('Geräte-ID muss eine Zahl sein')
], AccessoryController.createAccessory);

/**
 * @route   PUT /api/accessories/:id
 * @desc    Zubehör aktualisieren
 * @access  Private
 */
router.put('/:id', [
  // Validierungsregeln für Updates
  body('name').optional().notEmpty().withMessage('Name darf nicht leer sein'),
  body('assigned_to_user_id').optional().isInt().withMessage('Benutzer-ID muss eine Zahl sein'),
  body('assigned_to_device_id').optional().isInt().withMessage('Geräte-ID muss eine Zahl sein')
], AccessoryController.updateAccessory);

/**
 * @route   DELETE /api/accessories/:id
 * @desc    Zubehör löschen
 * @access  Private
 */
router.delete('/:id', AccessoryController.deleteAccessory);

module.exports = router;
