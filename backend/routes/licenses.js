const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const LicenseController = require('../controllers/licenseController');

/**
 * @route   GET /api/licenses
 * @desc    Alle Lizenzen abrufen
 * @access  Private
 */
router.get('/', LicenseController.getAllLicenses);

/**
 * @route   GET /api/licenses/expiring
 * @desc    Ablaufende Lizenzen abrufen
 * @access  Private
 */
router.get('/expiring', LicenseController.getExpiringLicenses);

/**
 * @route   GET /api/licenses/:id
 * @desc    Lizenz nach ID abrufen
 * @access  Private
 */
router.get('/:id', LicenseController.getLicenseById);

/**
 * @route   POST /api/licenses
 * @desc    Neue Lizenz erstellen
 * @access  Private
 */
router.post('/', [
  // Validierungsregeln
  body('license_key').notEmpty().withMessage('Lizenzschlüssel ist erforderlich'),
  body('software_name').notEmpty().withMessage('Software-Name ist erforderlich'),
  body('purchase_date').optional().isDate().withMessage('Kaufdatum muss ein gültiges Datum sein'),
  body('expiration_date').optional().isDate().withMessage('Ablaufdatum muss ein gültiges Datum sein'),
  body('assigned_to_user_id').optional().isInt().withMessage('Benutzer-ID muss eine Zahl sein'),
  body('assigned_to_device_id').optional().isInt().withMessage('Geräte-ID muss eine Zahl sein')
], LicenseController.createLicense);

/**
 * @route   PUT /api/licenses/:id
 * @desc    Lizenz aktualisieren
 * @access  Private
 */
router.put('/:id', [
  // Validierungsregeln für Updates
  body('license_key').optional().notEmpty().withMessage('Lizenzschlüssel darf nicht leer sein'),
  body('software_name').optional().notEmpty().withMessage('Software-Name darf nicht leer sein'),
  body('purchase_date').optional().isDate().withMessage('Kaufdatum muss ein gültiges Datum sein'),
  body('expiration_date').optional().isDate().withMessage('Ablaufdatum muss ein gültiges Datum sein'),
  body('assigned_to_user_id').optional().isInt().withMessage('Benutzer-ID muss eine Zahl sein'),
  body('assigned_to_device_id').optional().isInt().withMessage('Geräte-ID muss eine Zahl sein')
], LicenseController.updateLicense);

/**
 * @route   DELETE /api/licenses/:id
 * @desc    Lizenz löschen
 * @access  Private
 */
router.delete('/:id', LicenseController.deleteLicense);

module.exports = router;
