const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const settingsController = require('../controllers/settingsController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

// Kategorien Routen
router.get('/categories', authMiddleware, settingsController.getCategories);
router.get('/categories/:id', authMiddleware, settingsController.getCategoryById);

router.post(
  '/categories',
  authMiddleware,
  checkRole(['admin', 'manager']),
  [
    check('name', 'Name ist erforderlich').not().isEmpty(),
    check('name', 'Name darf maximal 100 Zeichen haben').isLength({ max: 100 }),
    check('type', 'Typ ist erforderlich').not().isEmpty(),
    check('type', 'Typ muss ein gültiger Wert sein').isIn(['device', 'license', 'certificate', 'accessory'])
  ],
  settingsController.createCategory
);

router.put(
  '/categories/:id',
  authMiddleware,
  checkRole(['admin', 'manager']),
  [
    check('name', 'Name ist erforderlich').not().isEmpty(),
    check('name', 'Name darf maximal 100 Zeichen haben').isLength({ max: 100 }),
    check('type', 'Typ ist erforderlich').not().isEmpty(),
    check('type', 'Typ muss ein gültiger Wert sein').isIn(['device', 'license', 'certificate', 'accessory'])
  ],
  settingsController.updateCategory
);

router.delete(
  '/categories/:id',
  authMiddleware,
  checkRole(['admin']),
  settingsController.deleteCategory
);

// Standorte Routen
router.get('/locations', authMiddleware, settingsController.getLocations);
router.get('/locations/:id', authMiddleware, settingsController.getLocationById);

router.post(
  '/locations',
  authMiddleware,
  checkRole(['admin', 'manager']),
  [
    check('name', 'Name ist erforderlich').not().isEmpty(),
    check('name', 'Name darf maximal 100 Zeichen haben').isLength({ max: 100 }),
    check('city', 'Stadt ist erforderlich').not().isEmpty()
  ],
  settingsController.createLocation
);

router.put(
  '/locations/:id',
  authMiddleware,
  checkRole(['admin', 'manager']),
  [
    check('name', 'Name ist erforderlich').not().isEmpty(),
    check('name', 'Name darf maximal 100 Zeichen haben').isLength({ max: 100 }),
    check('city', 'Stadt ist erforderlich').not().isEmpty()
  ],
  settingsController.updateLocation
);

router.delete(
  '/locations/:id',
  authMiddleware,
  checkRole(['admin']),
  settingsController.deleteLocation
);

// Abteilungen Routen
router.get('/departments', authMiddleware, settingsController.getDepartments);
router.get('/departments/:id', authMiddleware, settingsController.getDepartmentById);

router.post(
  '/departments',
  authMiddleware,
  checkRole(['admin', 'manager']),
  [
    check('name', 'Name ist erforderlich').not().isEmpty(),
    check('name', 'Name darf maximal 100 Zeichen haben').isLength({ max: 100 }),
    check('location_id', 'Standort-ID ist erforderlich').isNumeric()
  ],
  settingsController.createDepartment
);

router.put(
  '/departments/:id',
  authMiddleware,
  checkRole(['admin', 'manager']),
  [
    check('name', 'Name ist erforderlich').not().isEmpty(),
    check('name', 'Name darf maximal 100 Zeichen haben').isLength({ max: 100 }),
    check('location_id', 'Standort-ID ist erforderlich').isNumeric()
  ],
  settingsController.updateDepartment
);

router.delete(
  '/departments/:id',
  authMiddleware,
  checkRole(['admin']),
  settingsController.deleteDepartment
);

// Räume Routen
router.get('/rooms', authMiddleware, settingsController.getRooms);
router.get('/rooms/:id', authMiddleware, settingsController.getRoomById);

router.post(
  '/rooms',
  authMiddleware,
  checkRole(['admin', 'manager']),
  [
    check('name', 'Name ist erforderlich').not().isEmpty(),
    check('name', 'Name darf maximal 100 Zeichen haben').isLength({ max: 100 }),
    check('location_id', 'Standort-ID ist erforderlich').isNumeric()
  ],
  settingsController.createRoom
);

router.put(
  '/rooms/:id',
  authMiddleware,
  checkRole(['admin', 'manager']),
  [
    check('name', 'Name ist erforderlich').not().isEmpty(),
    check('name', 'Name darf maximal 100 Zeichen haben').isLength({ max: 100 }),
    check('location_id', 'Standort-ID ist erforderlich').isNumeric()
  ],
  settingsController.updateRoom
);

router.delete(
  '/rooms/:id',
  authMiddleware,
  checkRole(['admin']),
  settingsController.deleteRoom
);

// Systemeinstellungen Routen
router.get(
  '/system',
  authMiddleware,
  checkRole(['admin']),
  settingsController.getSystemSettings
);

router.put(
  '/system',
  authMiddleware,
  checkRole(['admin']),
  [
    check('*', 'Systemeinstellungen müssen gültige Werte enthalten').optional()
  ],
  settingsController.updateSystemSettings
);

module.exports = router;
