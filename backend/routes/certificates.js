const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const CertificateController = require('../controllers/certificateController');

/**
 * @route   GET /api/certificates
 * @desc    Alle Zertifikate abrufen
 * @access  Private
 */
router.get('/', CertificateController.getAllCertificates);

/**
 * @route   GET /api/certificates/expiring
 * @desc    Ablaufende Zertifikate abrufen
 * @access  Private
 */
router.get('/expiring', CertificateController.getExpiringCertificates);

/**
 * @route   GET /api/certificates/:id
 * @desc    Zertifikat nach ID abrufen
 * @access  Private
 */
router.get('/:id', CertificateController.getCertificateById);

/**
 * @route   POST /api/certificates
 * @desc    Neues Zertifikat erstellen
 * @access  Private
 */
router.post('/', [
  // Validierungsregeln
  body('name').notEmpty().withMessage('Name ist erforderlich'),
  body('expiration_date').notEmpty().isDate().withMessage('Ablaufdatum ist erforderlich und muss ein gültiges Datum sein'),
  body('issued_at').optional().isDate().withMessage('Ausstellungsdatum muss ein gültiges Datum sein'),
  body('assigned_to_device_id').optional().isInt().withMessage('Geräte-ID muss eine Zahl sein')
], CertificateController.createCertificate);

/**
 * @route   PUT /api/certificates/:id
 * @desc    Zertifikat aktualisieren
 * @access  Private
 */
router.put('/:id', [
  // Validierungsregeln für Updates
  body('name').optional().notEmpty().withMessage('Name darf nicht leer sein'),
  body('expiration_date').optional().isDate().withMessage('Ablaufdatum muss ein gültiges Datum sein'),
  body('issued_at').optional().isDate().withMessage('Ausstellungsdatum muss ein gültiges Datum sein'),
  body('assigned_to_device_id').optional().isInt().withMessage('Geräte-ID muss eine Zahl sein')
], CertificateController.updateCertificate);

/**
 * @route   DELETE /api/certificates/:id
 * @desc    Zertifikat löschen
 * @access  Private
 */
router.delete('/:id', CertificateController.deleteCertificate);

module.exports = router;
