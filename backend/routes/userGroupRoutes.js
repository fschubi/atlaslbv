const express = require('express');
const router = express.Router();
const UserGroupController = require('../controllers/userGroupController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');

/**
 * @route   GET /api/user-groups
 * @desc    Alle Benutzergruppen abrufen
 * @access  Private (Benötigt Berechtigung: user_management.view)
 */
router.get('/',
  authMiddleware.authenticate,
  permissionMiddleware.checkPermission('user_management.view'),
  UserGroupController.getAllGroups
);

/**
 * @route   GET /api/user-groups/search
 * @desc    Benutzergruppen suchen
 * @access  Private (Benötigt Berechtigung: user_management.view)
 */
router.get('/search',
  authMiddleware.authenticate,
  permissionMiddleware.checkPermission('user_management.view'),
  UserGroupController.searchGroups
);

/**
 * @route   GET /api/user-groups/:id
 * @desc    Benutzergruppe nach ID abrufen
 * @access  Private (Benötigt Berechtigung: user_management.view)
 */
router.get('/:id',
  authMiddleware.authenticate,
  permissionMiddleware.checkPermission('user_management.view'),
  UserGroupController.getGroupById
);

/**
 * @route   GET /api/user-groups/name/:name
 * @desc    Benutzergruppe nach Namen abrufen
 * @access  Private (Benötigt Berechtigung: user_management.view)
 */
router.get('/name/:name',
  authMiddleware.authenticate,
  permissionMiddleware.checkPermission('user_management.view'),
  UserGroupController.getGroupByName
);

/**
 * @route   POST /api/user-groups
 * @desc    Neue Benutzergruppe erstellen
 * @access  Private (Benötigt Berechtigung: user_management.create)
 */
router.post('/',
  authMiddleware.authenticate,
  permissionMiddleware.checkPermission('user_management.create'),
  UserGroupController.createGroup
);

/**
 * @route   PUT /api/user-groups/:id
 * @desc    Benutzergruppe aktualisieren
 * @access  Private (Benötigt Berechtigung: user_management.update)
 */
router.put('/:id',
  authMiddleware.authenticate,
  permissionMiddleware.checkPermission('user_management.update'),
  UserGroupController.updateGroup
);

/**
 * @route   DELETE /api/user-groups/:id
 * @desc    Benutzergruppe löschen
 * @access  Private (Benötigt Berechtigung: user_management.delete)
 */
router.delete('/:id',
  authMiddleware.authenticate,
  permissionMiddleware.checkPermission('user_management.delete'),
  UserGroupController.deleteGroup
);

/**
 * @route   GET /api/user-groups/:id/members
 * @desc    Mitglieder einer Benutzergruppe abrufen
 * @access  Private (Benötigt Berechtigung: user_management.view)
 */
router.get('/:id/members',
  authMiddleware.authenticate,
  permissionMiddleware.checkPermission('user_management.view'),
  UserGroupController.getGroupMembers
);

/**
 * @route   GET /api/user-groups/:id/members/search
 * @desc    Mitglieder einer Benutzergruppe suchen
 * @access  Private (Benötigt Berechtigung: user_management.view)
 */
router.get('/:id/members/search',
  authMiddleware.authenticate,
  permissionMiddleware.checkPermission('user_management.view'),
  UserGroupController.searchGroupMembers
);

/**
 * @route   POST /api/user-groups/:groupId/users/:userId
 * @desc    Benutzer zu einer Gruppe hinzufügen
 * @access  Private (Benötigt Berechtigung: user_management.update)
 */
router.post('/:groupId/users/:userId',
  authMiddleware.authenticate,
  permissionMiddleware.checkPermission('user_management.update'),
  UserGroupController.addUserToGroup
);

/**
 * @route   DELETE /api/user-groups/:groupId/users/:userId
 * @desc    Benutzer aus einer Gruppe entfernen
 * @access  Private (Benötigt Berechtigung: user_management.update)
 */
router.delete('/:groupId/users/:userId',
  authMiddleware.authenticate,
  permissionMiddleware.checkPermission('user_management.update'),
  UserGroupController.removeUserFromGroup
);

/**
 * @route   GET /api/users/:userId/groups
 * @desc    Gruppen eines Benutzers abrufen
 * @access  Private (Benötigt Berechtigung: user_management.view)
 */
router.get('/users/:userId/groups',
  authMiddleware.authenticate,
  permissionMiddleware.checkPermission('user_management.view'),
  UserGroupController.getUserGroups
);

/**
 * @route   GET /api/user-groups/:id/users
 * @desc    Benutzer einer Gruppe abrufen
 * @access  Private (Benötigt Berechtigung: user_management.view)
 */
router.get('/:id/users',
  authMiddleware.authenticate,
  permissionMiddleware.checkPermission('user_management.view'),
  UserGroupController.getGroupUsers
);

/**
 * @route   POST /api/user-groups/:id/users
 * @desc    Mehrere Benutzer zu einer Gruppe hinzufügen
 * @access  Private (Benötigt Berechtigung: user_management.update)
 */
router.post('/:id/users',
  authMiddleware.authenticate,
  permissionMiddleware.checkPermission('user_management.update'),
  UserGroupController.addUsersToGroup
);

/**
 * @route   DELETE /api/user-groups/:id/users
 * @desc    Mehrere Benutzer aus einer Gruppe entfernen
 * @access  Private (Benötigt Berechtigung: user_management.update)
 */
router.delete('/:id/users',
  authMiddleware.authenticate,
  permissionMiddleware.checkPermission('user_management.update'),
  UserGroupController.removeUsersFromGroup
);

module.exports = router;
