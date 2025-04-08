/**
 * Authentifizierungs-Routes für das ATLAS-System
 *
 * Definiert die Endpunkte für Login, Logout, Token-Refresh
 * und Passwort-Reset-Funktionalität.
 */

const express = require('express');
const { body } = require('express-validator');
const { login, logout, validateToken, refreshToken, requestPasswordReset, resetPassword } = require('../controllers/authController');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Benutzer-Login
 * @access  Public
 */
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Benutzername ist erforderlich'),
    body('password').trim().notEmpty().withMessage('Passwort ist erforderlich')
  ],
  validateRequest,
  login
);

/**
 * @route   POST /api/auth/logout
 * @desc    Benutzer-Logout
 * @access  Private
 */
router.post('/logout', logout);

/**
 * @route   GET /api/auth/validate
 * @desc    Token-Validierung
 * @access  Private
 */
router.get('/validate', validateToken);

/**
 * @route   POST /api/auth/refresh
 * @desc    Access-Token mit Refresh-Token erneuern
 * @access  Public
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/auth/request-password-reset
 * @desc    Passwort zurücksetzen anfordern
 * @access  Public
 */
router.post('/request-password-reset', requestPasswordReset);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Passwort zurücksetzen
 * @access  Public
 */
router.post('/reset-password', resetPassword);

module.exports = router;
