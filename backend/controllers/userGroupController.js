const UserGroupModel = require('../models/userGroupModel');
const logger = require('../utils/logger');

const UserGroupController = {
  /**
   * Alle Benutzergruppen abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getAllGroups: async (req, res) => {
    try {
      const groups = await UserGroupModel.getAllGroups();
      res.status(200).json({
        success: true,
        data: groups
      });
    } catch (error) {
      logger.error('Fehler beim Abrufen aller Benutzergruppen:', error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Abrufen der Benutzergruppen',
        error: error.message
      });
    }
  },

  /**
   * Benutzergruppe nach ID abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getGroupById: async (req, res) => {
    try {
      const { id } = req.params;
      const group = await UserGroupModel.getGroupById(id);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: `Benutzergruppe mit ID ${id} nicht gefunden`
        });
      }

      res.status(200).json({
        success: true,
        data: group
      });
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Benutzergruppe mit ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Abrufen der Benutzergruppe',
        error: error.message
      });
    }
  },

  /**
   * Benutzergruppe nach Namen abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getGroupByName: async (req, res) => {
    try {
      const { name } = req.params;
      const group = await UserGroupModel.getGroupByName(name);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: `Benutzergruppe mit Namen "${name}" nicht gefunden`
        });
      }

      res.status(200).json({
        success: true,
        data: group
      });
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Benutzergruppe mit Namen ${req.params.name}:`, error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Abrufen der Benutzergruppe',
        error: error.message
      });
    }
  },

  /**
   * Neue Benutzergruppe erstellen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  createGroup: async (req, res) => {
    try {
      const { name, description } = req.body;

      // Validierung
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Gruppenname ist erforderlich'
        });
      }

      // Prüfen, ob Gruppe bereits existiert
      const existingGroup = await UserGroupModel.getGroupByName(name);
      if (existingGroup) {
        return res.status(409).json({
          success: false,
          message: `Benutzergruppe mit Namen "${name}" existiert bereits`
        });
      }

      // Gruppe erstellen
      const groupData = {
        name,
        description,
        created_by: req.user.id // Benutzer-ID aus dem Authentifizierungstoken
      };

      const newGroup = await UserGroupModel.createGroup(groupData);

      res.status(201).json({
        success: true,
        message: 'Benutzergruppe erfolgreich erstellt',
        data: newGroup
      });
    } catch (error) {
      logger.error('Fehler beim Erstellen der Benutzergruppe:', error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Erstellen der Benutzergruppe',
        error: error.message
      });
    }
  },

  /**
   * Benutzergruppe aktualisieren
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  updateGroup: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Validierung
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Gruppenname ist erforderlich'
        });
      }

      // Prüfen, ob Gruppe existiert
      const existingGroup = await UserGroupModel.getGroupById(id);
      if (!existingGroup) {
        return res.status(404).json({
          success: false,
          message: `Benutzergruppe mit ID ${id} nicht gefunden`
        });
      }

      // Prüfen, ob neuer Name bereits existiert (außer bei der gleichen Gruppe)
      if (name !== existingGroup.name) {
        const groupWithName = await UserGroupModel.getGroupByName(name);
        if (groupWithName) {
          return res.status(409).json({
            success: false,
            message: `Benutzergruppe mit Namen "${name}" existiert bereits`
          });
        }
      }

      // Gruppe aktualisieren
      const groupData = { name, description };
      const updatedGroup = await UserGroupModel.updateGroup(id, groupData);

      res.status(200).json({
        success: true,
        message: 'Benutzergruppe erfolgreich aktualisiert',
        data: updatedGroup
      });
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren der Benutzergruppe mit ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Aktualisieren der Benutzergruppe',
        error: error.message
      });
    }
  },

  /**
   * Benutzergruppe löschen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  deleteGroup: async (req, res) => {
    try {
      const { id } = req.params;

      // Prüfen, ob Gruppe existiert
      const existingGroup = await UserGroupModel.getGroupById(id);
      if (!existingGroup) {
        return res.status(404).json({
          success: false,
          message: `Benutzergruppe mit ID ${id} nicht gefunden`
        });
      }

      // Gruppe löschen
      const success = await UserGroupModel.deleteGroup(id);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Benutzergruppe erfolgreich gelöscht'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Fehler beim Löschen der Benutzergruppe'
        });
      }
    } catch (error) {
      logger.error(`Fehler beim Löschen der Benutzergruppe mit ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Löschen der Benutzergruppe',
        error: error.message
      });
    }
  },

  /**
   * Mitglieder einer Benutzergruppe abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getGroupMembers: async (req, res) => {
    try {
      const { id } = req.params;

      // Prüfen, ob Gruppe existiert
      const existingGroup = await UserGroupModel.getGroupById(id);
      if (!existingGroup) {
        return res.status(404).json({
          success: false,
          message: `Benutzergruppe mit ID ${id} nicht gefunden`
        });
      }

      // Mitglieder abrufen
      const members = await UserGroupModel.getGroupMembers(id);

      res.status(200).json({
        success: true,
        data: members
      });
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Mitglieder für Gruppe ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Abrufen der Gruppenmitglieder',
        error: error.message
      });
    }
  },

  /**
   * Benutzer zu einer Gruppe hinzufügen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  addUserToGroup: async (req, res) => {
    try {
      const { groupId, userId } = req.params;

      // Prüfen, ob Gruppe existiert
      const existingGroup = await UserGroupModel.getGroupById(groupId);
      if (!existingGroup) {
        return res.status(404).json({
          success: false,
          message: `Benutzergruppe mit ID ${groupId} nicht gefunden`
        });
      }

      // Benutzer zur Gruppe hinzufügen
      const addedBy = req.user.id; // Benutzer-ID aus dem Authentifizierungstoken
      const result = await UserGroupModel.addUserToGroup(groupId, userId, addedBy);

      if (result) {
        res.status(201).json({
          success: true,
          message: 'Benutzer erfolgreich zur Gruppe hinzugefügt',
          data: result
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Benutzer konnte nicht zur Gruppe hinzugefügt werden'
        });
      }
    } catch (error) {
      logger.error(`Fehler beim Hinzufügen des Benutzers ${req.params.userId} zur Gruppe ${req.params.groupId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Hinzufügen des Benutzers zur Gruppe',
        error: error.message
      });
    }
  },

  /**
   * Benutzer aus einer Gruppe entfernen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  removeUserFromGroup: async (req, res) => {
    try {
      const { groupId, userId } = req.params;

      // Prüfen, ob Gruppe existiert
      const existingGroup = await UserGroupModel.getGroupById(groupId);
      if (!existingGroup) {
        return res.status(404).json({
          success: false,
          message: `Benutzergruppe mit ID ${groupId} nicht gefunden`
        });
      }

      // Benutzer aus der Gruppe entfernen
      const success = await UserGroupModel.removeUserFromGroup(groupId, userId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Benutzer erfolgreich aus der Gruppe entfernt'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Benutzer ist kein Mitglied dieser Gruppe'
        });
      }
    } catch (error) {
      logger.error(`Fehler beim Entfernen des Benutzers ${req.params.userId} aus der Gruppe ${req.params.groupId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Entfernen des Benutzers aus der Gruppe',
        error: error.message
      });
    }
  },

  /**
   * Gruppen eines Benutzers abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getUserGroups: async (req, res) => {
    try {
      const { userId } = req.params;
      const groups = await UserGroupModel.getUserGroups(userId);

      res.status(200).json({
        success: true,
        data: groups
      });
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Gruppen für Benutzer ${req.params.userId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Abrufen der Benutzergruppen',
        error: error.message
      });
    }
  },

  /**
   * Benutzer einer Gruppe abrufen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  getGroupUsers: async (req, res) => {
    try {
      const { id } = req.params;
      const users = await UserGroupModel.getGroupUsers(id);

      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Benutzer für Gruppe ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Abrufen der Gruppenbenutzer',
        error: error.message
      });
    }
  },

  /**
   * Mehrere Benutzer zu einer Gruppe hinzufügen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  addUsersToGroup: async (req, res) => {
    try {
      const { id } = req.params;
      const { userIds } = req.body;

      // Validierung
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Benutzer-IDs müssen als Array übergeben werden'
        });
      }

      // Prüfen, ob Gruppe existiert
      const existingGroup = await UserGroupModel.getGroupById(id);
      if (!existingGroup) {
        return res.status(404).json({
          success: false,
          message: `Benutzergruppe mit ID ${id} nicht gefunden`
        });
      }

      // Benutzer zur Gruppe hinzufügen
      const addedBy = req.user.id; // Benutzer-ID aus dem Authentifizierungstoken
      const results = await UserGroupModel.addUsersToGroup(id, userIds, addedBy);

      res.status(201).json({
        success: true,
        message: `${results.length} Benutzer erfolgreich zur Gruppe hinzugefügt`,
        data: results
      });
    } catch (error) {
      logger.error(`Fehler beim Hinzufügen mehrerer Benutzer zur Gruppe ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Hinzufügen der Benutzer zur Gruppe',
        error: error.message
      });
    }
  },

  /**
   * Mehrere Benutzer aus einer Gruppe entfernen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  removeUsersFromGroup: async (req, res) => {
    try {
      const { id } = req.params;
      const { userIds } = req.body;

      // Validierung
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Benutzer-IDs müssen als Array übergeben werden'
        });
      }

      // Prüfen, ob Gruppe existiert
      const existingGroup = await UserGroupModel.getGroupById(id);
      if (!existingGroup) {
        return res.status(404).json({
          success: false,
          message: `Benutzergruppe mit ID ${id} nicht gefunden`
        });
      }

      // Benutzer aus der Gruppe entfernen
      const removedCount = await UserGroupModel.removeUsersFromGroup(id, userIds);

      res.status(200).json({
        success: true,
        message: `${removedCount} Benutzer erfolgreich aus der Gruppe entfernt`
      });
    } catch (error) {
      logger.error(`Fehler beim Entfernen mehrerer Benutzer aus der Gruppe ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Entfernen der Benutzer aus der Gruppe',
        error: error.message
      });
    }
  },

  /**
   * Benutzergruppen suchen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  searchGroups: async (req, res) => {
    try {
      const { searchTerm } = req.query;

      // Validierung
      if (!searchTerm || searchTerm.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Suchbegriff ist erforderlich'
        });
      }

      // Gruppen suchen
      const groups = await UserGroupModel.searchGroups(searchTerm);

      res.status(200).json({
        success: true,
        data: groups
      });
    } catch (error) {
      logger.error(`Fehler bei der Suche nach Benutzergruppen mit Begriff "${req.query.searchTerm}":`, error);
      res.status(500).json({
        success: false,
        message: 'Fehler bei der Suche nach Benutzergruppen',
        error: error.message
      });
    }
  },

  /**
   * Mitglieder einer Gruppe suchen
   * @param {Object} req - Express Request-Objekt
   * @param {Object} res - Express Response-Objekt
   */
  searchGroupMembers: async (req, res) => {
    try {
      const { id } = req.params;
      const { searchTerm } = req.query;

      // Validierung
      if (!searchTerm || searchTerm.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Suchbegriff ist erforderlich'
        });
      }

      // Prüfen, ob Gruppe existiert
      const existingGroup = await UserGroupModel.getGroupById(id);
      if (!existingGroup) {
        return res.status(404).json({
          success: false,
          message: `Benutzergruppe mit ID ${id} nicht gefunden`
        });
      }

      // Mitglieder suchen
      const members = await UserGroupModel.searchGroupMembers(id, searchTerm);

      res.status(200).json({
        success: true,
        data: members
      });
    } catch (error) {
      logger.error(`Fehler bei der Suche nach Gruppenmitgliedern mit Begriff "${req.query.searchTerm}":`, error);
      res.status(500).json({
        success: false,
        message: 'Fehler bei der Suche nach Gruppenmitgliedern',
        error: error.message
      });
    }
  }
};

module.exports = UserGroupController;
