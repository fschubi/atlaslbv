const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const UserController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');
const { checkRole } = require('../middleware/auth');

/**
 * @route   POST /api/users/login
 * @desc    Benutzeranmeldung
 * @access  Public
 */
router.post('/login', [
  body('username').notEmpty().withMessage('Benutzername oder E-Mail ist erforderlich'),
  body('password').notEmpty().withMessage('Passwort ist erforderlich')
], UserController.login);

/**
 * @route   GET /api/users/profile
 * @desc    Aktuelles Benutzerprofil abrufen
 * @access  Private
 */
router.get('/profile', authMiddleware, UserController.getProfile);

/**
 * @route   PUT /api/users/change-password
 * @desc    Passwort ändern
 * @access  Private
 */
router.put('/change-password', [
  authMiddleware,
  body('currentPassword').notEmpty().withMessage('Aktuelles Passwort ist erforderlich'),
  body('newPassword')
    .notEmpty().withMessage('Neues Passwort ist erforderlich')
    .isLength({ min: 8 }).withMessage('Passwort muss mindestens 8 Zeichen lang sein')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)
    .withMessage('Passwort muss mindestens einen Buchstaben und eine Zahl enthalten')
], UserController.changePassword);

/**
 * @route   GET /api/users/roles
 * @desc    Alle Benutzerrollen abrufen
 * @access  Private (Admin)
 */
router.get('/roles', [authMiddleware, checkRole(['admin'])], UserController.getUserRoles);

/**
 * @route   GET /api/users/departments
 * @desc    Alle Abteilungen abrufen
 * @access  Private
 */
router.get('/departments', authMiddleware, UserController.getDepartments);

/**
 * @route   GET /api/users
 * @desc    Alle Benutzer abrufen
 * @access  Private (Admin)
 */
router.get('/', [authMiddleware, checkRole(['admin'])], UserController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Benutzer nach ID abrufen
 * @access  Private (Admin)
 */
router.get('/:id', [authMiddleware, checkRole(['admin'])], UserController.getUserById);

/**
 * @route   POST /api/users
 * @desc    Neuen Benutzer erstellen
 * @access  Private (Admin)
 */
router.post('/', [
  authMiddleware,
  checkRole(['admin']),
  // Validierungsregeln
  body('username')
    .notEmpty().withMessage('Benutzername ist erforderlich')
    .isLength({ min: 3 }).withMessage('Benutzername muss mindestens 3 Zeichen lang sein'),
  body('email')
    .notEmpty().withMessage('E-Mail ist erforderlich')
    .isEmail().withMessage('Ungültiges E-Mail-Format'),
  body('password')
    .notEmpty().withMessage('Passwort ist erforderlich')
    .isLength({ min: 8 }).withMessage('Passwort muss mindestens 8 Zeichen lang sein')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)
    .withMessage('Passwort muss mindestens einen Buchstaben und eine Zahl enthalten'),
  body('first_name').notEmpty().withMessage('Vorname ist erforderlich'),
  body('last_name').notEmpty().withMessage('Nachname ist erforderlich'),
  body('role').notEmpty().withMessage('Rolle ist erforderlich')
], UserController.createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Benutzer aktualisieren
 * @access  Private (Admin)
 */
router.put('/:id', [
  authMiddleware,
  checkRole(['admin']),
  // Validierungsregeln für Updates
  body('username')
    .optional()
    .isLength({ min: 3 }).withMessage('Benutzername muss mindestens 3 Zeichen lang sein'),
  body('email')
    .optional()
    .isEmail().withMessage('Ungültiges E-Mail-Format'),
  body('password')
    .optional()
    .isLength({ min: 8 }).withMessage('Passwort muss mindestens 8 Zeichen lang sein')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)
    .withMessage('Passwort muss mindestens einen Buchstaben und eine Zahl enthalten')
], UserController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Benutzer löschen
 * @access  Private (Admin)
 */
router.delete('/:id', [authMiddleware, checkRole(['admin'])], UserController.deleteUser);

module.exports = router;
