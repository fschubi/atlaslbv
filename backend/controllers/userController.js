/**
 * Benutzer-Controller für das ATLAS-System
 */

const { pool } = require('../db');
const logger = require('../utils/logger');
const { getAllUsers: getAllUsersModel, getUserById: getUserByIdModel, getUserRoles: getUserRolesModel, getDepartments: getDepartmentsModel } = require('../models/userModel');

/**
 * Login-Handler
 */
const login = async (req, res) => {
  res.status(501).json({ message: 'Noch nicht implementiert' });
};

/**
 * Benutzerprofil abrufen
 */
const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    const user = await getUserByIdModel(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Benutzerprofil nicht gefunden' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Fehler beim Abrufen des Benutzerprofils:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen des Benutzerprofils' });
  }
};

/**
 * Passwort ändern
 */
const changePassword = async (req, res) => {
  res.status(501).json({ message: 'Noch nicht implementiert' });
};

/**
 * Alle Benutzerrollen abrufen
 */
const getUserRoles = async (req, res) => {
  try {
    const roles = await getUserRolesModel();
    res.json(roles);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Benutzerrollen:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Benutzerrollen' });
  }
};

/**
 * Alle Abteilungen abrufen
 */
const getDepartments = async (req, res) => {
  try {
    const departments = await getDepartmentsModel();
    res.json(departments);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Abteilungen:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Abteilungen' });
  }
};

/**
 * Alle Benutzer abrufen
 */
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'id';
    const sortOrder = req.query.sortOrder || 'asc';

    const filters = {
      name: req.query.name,
      department: req.query.department,
      role: req.query.role,
      email: req.query.email
    };

    const result = await getAllUsersModel(filters, page, limit, sortBy, sortOrder, search);
    res.json(result);
  } catch (error) {
    logger.error('Fehler beim Abrufen der Benutzer:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Benutzer' });
  }
};

/**
 * Benutzer nach ID abrufen
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await getUserByIdModel(id);

    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    res.json(user);
  } catch (error) {
    logger.error(`Fehler beim Abrufen des Benutzers mit ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen des Benutzers' });
  }
};

/**
 * Neuen Benutzer erstellen
 */
const createUser = async (req, res) => {
  res.status(501).json({ message: 'Noch nicht implementiert' });
};

/**
 * Benutzer aktualisieren
 */
const updateUser = async (req, res) => {
  res.status(501).json({ message: 'Noch nicht implementiert' });
};

/**
 * Benutzer löschen
 */
const deleteUser = async (req, res) => {
  res.status(501).json({ message: 'Noch nicht implementiert' });
};

module.exports = {
  login,
  getProfile,
  changePassword,
  getUserRoles,
  getDepartments,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
