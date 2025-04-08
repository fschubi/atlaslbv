const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/auth');

// Report-Controller importieren
const reportController = require('../controllers/reportController');

// GET /api/reports - Alle verfügbaren Berichte abrufen
router.get('/', [
  authMiddleware,
  checkRole(['admin', 'manager'])
], reportController.getAllReports);

// GET /api/reports/inventory - Inventarbericht generieren
router.get('/inventory', [
  authMiddleware,
  checkRole(['admin', 'manager'])
], reportController.generateInventoryReport);

// GET /api/reports/licenses - Lizenzbericht generieren
router.get('/licenses', [
  authMiddleware,
  checkRole(['admin', 'manager'])
], reportController.generateLicenseReport);

// GET /api/reports/certificates - Zertifikatsbericht generieren
router.get('/certificates', [
  authMiddleware,
  checkRole(['admin', 'manager'])
], reportController.generateCertificateReport);

// GET /api/reports/tickets - Ticketbericht generieren
router.get('/tickets', [
  authMiddleware,
  checkRole(['admin', 'manager', 'support'])
], reportController.generateTicketReport);

module.exports = router;
