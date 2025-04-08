const settingsModel = require('../models/settingsModel');
const { validationResult } = require('express-validator');

class SettingsController {
  // Kategorien abfragen
  async getCategories(req, res) {
    try {
      const categories = await settingsModel.getCategories();

      return res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Kategorien:', error);
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Abrufen der Kategorien',
        error: error.message
      });
    }
  }

  // Kategorie nach ID abfragen
  async getCategoryById(req, res) {
    try {
      const categoryId = req.params.id;
      const category = await settingsModel.getCategoryById(categoryId);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Kategorie nicht gefunden'
        });
      }

      return res.json({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Kategorie:', error);
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Abrufen der Kategorie',
        error: error.message
      });
    }
  }

  // Neue Kategorie erstellen
  async createCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const categoryData = {
        name: req.body.name,
        description: req.body.description,
        type: req.body.type
      };

      const newCategory = await settingsModel.createCategory(categoryData);

      return res.status(201).json({
        success: true,
        message: 'Kategorie erfolgreich erstellt',
        data: newCategory
      });
    } catch (error) {
      console.error('Fehler beim Erstellen der Kategorie:', error);

      // Spezifische Fehlermeldung bei Duplikaten
      if (error.message.includes('existiert bereits')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Fehler beim Erstellen der Kategorie',
        error: error.message
      });
    }
  }

  // Kategorie aktualisieren
  async updateCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const categoryId = req.params.id;
      const categoryData = {
        name: req.body.name,
        description: req.body.description,
        type: req.body.type
      };

      const updatedCategory = await settingsModel.updateCategory(categoryId, categoryData);

      return res.json({
        success: true,
        message: 'Kategorie erfolgreich aktualisiert',
        data: updatedCategory
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Kategorie:', error);

      // Unterschiedliche Statuscodes je nach Fehlertyp
      if (error.message === 'Kategorie nicht gefunden') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('existiert bereits')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Fehler beim Aktualisieren der Kategorie',
        error: error.message
      });
    }
  }

  // Kategorie löschen
  async deleteCategory(req, res) {
    try {
      const categoryId = req.params.id;

      const deletedCategory = await settingsModel.deleteCategory(categoryId);

      return res.json({
        success: true,
        message: 'Kategorie erfolgreich gelöscht',
        data: deletedCategory
      });
    } catch (error) {
      console.error('Fehler beim Löschen der Kategorie:', error);

      // Unterschiedliche Statuscodes je nach Fehlertyp
      if (error.message === 'Kategorie nicht gefunden') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('wird von')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Fehler beim Löschen der Kategorie',
        error: error.message
      });
    }
  }

  // Standorte abfragen
  async getLocations(req, res) {
    try {
      const locations = await settingsModel.getLocations();

      return res.json({
        success: true,
        data: locations
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Standorte:', error);
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Abrufen der Standorte',
        error: error.message
      });
    }
  }

  // Standort nach ID abfragen
  async getLocationById(req, res) {
    try {
      const locationId = req.params.id;
      const location = await settingsModel.getLocationById(locationId);

      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Standort nicht gefunden'
        });
      }

      return res.json({
        success: true,
        data: location
      });
    } catch (error) {
      console.error('Fehler beim Abrufen des Standorts:', error);
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Abrufen des Standorts',
        error: error.message
      });
    }
  }

  // Neuen Standort erstellen
  async createLocation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const locationData = {
        name: req.body.name,
        address: req.body.address,
        zip_code: req.body.zip_code,
        city: req.body.city,
        country: req.body.country,
        notes: req.body.notes
      };

      const newLocation = await settingsModel.createLocation(locationData);

      return res.status(201).json({
        success: true,
        message: 'Standort erfolgreich erstellt',
        data: newLocation
      });
    } catch (error) {
      console.error('Fehler beim Erstellen des Standorts:', error);

      if (error.message.includes('existiert bereits')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Fehler beim Erstellen des Standorts',
        error: error.message
      });
    }
  }

  // Standort aktualisieren
  async updateLocation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const locationId = req.params.id;
      const locationData = {
        name: req.body.name,
        address: req.body.address,
        zip_code: req.body.zip_code,
        city: req.body.city,
        country: req.body.country,
        notes: req.body.notes
      };

      const updatedLocation = await settingsModel.updateLocation(locationId, locationData);

      return res.json({
        success: true,
        message: 'Standort erfolgreich aktualisiert',
        data: updatedLocation
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Standorts:', error);

      if (error.message === 'Standort nicht gefunden') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('existiert bereits')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Fehler beim Aktualisieren des Standorts',
        error: error.message
      });
    }
  }

  // Standort löschen
  async deleteLocation(req, res) {
    try {
      const locationId = req.params.id;

      const deletedLocation = await settingsModel.deleteLocation(locationId);

      return res.json({
        success: true,
        message: 'Standort erfolgreich gelöscht',
        data: deletedLocation
      });
    } catch (error) {
      console.error('Fehler beim Löschen des Standorts:', error);

      if (error.message === 'Standort nicht gefunden') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('wird von')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Fehler beim Löschen des Standorts',
        error: error.message
      });
    }
  }

  // Abteilungen abfragen
  async getDepartments(req, res) {
    try {
      const departments = await settingsModel.getDepartments();

      return res.json({
        success: true,
        data: departments
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Abteilungen:', error);
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Abrufen der Abteilungen',
        error: error.message
      });
    }
  }

  // Abteilung nach ID abfragen
  async getDepartmentById(req, res) {
    try {
      const departmentId = req.params.id;
      const department = await settingsModel.getDepartmentById(departmentId);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Abteilung nicht gefunden'
        });
      }

      return res.json({
        success: true,
        data: department
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Abteilung:', error);
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Abrufen der Abteilung',
        error: error.message
      });
    }
  }

  // Neue Abteilung erstellen
  async createDepartment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const departmentData = {
        name: req.body.name,
        description: req.body.description,
        location_id: req.body.location_id,
        manager_id: req.body.manager_id
      };

      const newDepartment = await settingsModel.createDepartment(departmentData);

      return res.status(201).json({
        success: true,
        message: 'Abteilung erfolgreich erstellt',
        data: newDepartment
      });
    } catch (error) {
      console.error('Fehler beim Erstellen der Abteilung:', error);

      if (error.message.includes('existiert bereits')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Fehler beim Erstellen der Abteilung',
        error: error.message
      });
    }
  }

  // Abteilung aktualisieren
  async updateDepartment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const departmentId = req.params.id;
      const departmentData = {
        name: req.body.name,
        description: req.body.description,
        location_id: req.body.location_id,
        manager_id: req.body.manager_id
      };

      const updatedDepartment = await settingsModel.updateDepartment(departmentId, departmentData);

      return res.json({
        success: true,
        message: 'Abteilung erfolgreich aktualisiert',
        data: updatedDepartment
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Abteilung:', error);

      if (error.message === 'Abteilung nicht gefunden') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('existiert bereits')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Fehler beim Aktualisieren der Abteilung',
        error: error.message
      });
    }
  }

  // Abteilung löschen
  async deleteDepartment(req, res) {
    try {
      const departmentId = req.params.id;

      const deletedDepartment = await settingsModel.deleteDepartment(departmentId);

      return res.json({
        success: true,
        message: 'Abteilung erfolgreich gelöscht',
        data: deletedDepartment
      });
    } catch (error) {
      console.error('Fehler beim Löschen der Abteilung:', error);

      if (error.message === 'Abteilung nicht gefunden') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('wird von')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Fehler beim Löschen der Abteilung',
        error: error.message
      });
    }
  }

  // Räume abfragen
  async getRooms(req, res) {
    try {
      const rooms = await settingsModel.getRooms();

      return res.json({
        success: true,
        data: rooms
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Räume:', error);
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Abrufen der Räume',
        error: error.message
      });
    }
  }

  // Raum nach ID abfragen
  async getRoomById(req, res) {
    try {
      const roomId = req.params.id;
      const room = await settingsModel.getRoomById(roomId);

      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Raum nicht gefunden'
        });
      }

      return res.json({
        success: true,
        data: room
      });
    } catch (error) {
      console.error('Fehler beim Abrufen des Raums:', error);
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Abrufen des Raums',
        error: error.message
      });
    }
  }

  // Neuen Raum erstellen
  async createRoom(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const roomData = {
        name: req.body.name,
        floor: req.body.floor,
        room_number: req.body.room_number,
        description: req.body.description,
        location_id: req.body.location_id
      };

      const newRoom = await settingsModel.createRoom(roomData);

      return res.status(201).json({
        success: true,
        message: 'Raum erfolgreich erstellt',
        data: newRoom
      });
    } catch (error) {
      console.error('Fehler beim Erstellen des Raums:', error);

      if (error.message.includes('existiert bereits')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Fehler beim Erstellen des Raums',
        error: error.message
      });
    }
  }

  // Raum aktualisieren
  async updateRoom(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const roomId = req.params.id;
      const roomData = {
        name: req.body.name,
        floor: req.body.floor,
        room_number: req.body.room_number,
        description: req.body.description,
        location_id: req.body.location_id
      };

      const updatedRoom = await settingsModel.updateRoom(roomId, roomData);

      return res.json({
        success: true,
        message: 'Raum erfolgreich aktualisiert',
        data: updatedRoom
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Raums:', error);

      if (error.message === 'Raum nicht gefunden') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('existiert bereits')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Fehler beim Aktualisieren des Raums',
        error: error.message
      });
    }
  }

  // Raum löschen
  async deleteRoom(req, res) {
    try {
      const roomId = req.params.id;

      const deletedRoom = await settingsModel.deleteRoom(roomId);

      return res.json({
        success: true,
        message: 'Raum erfolgreich gelöscht',
        data: deletedRoom
      });
    } catch (error) {
      console.error('Fehler beim Löschen des Raums:', error);

      if (error.message === 'Raum nicht gefunden') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('wird von')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Fehler beim Löschen des Raums',
        error: error.message
      });
    }
  }

  // Systemeinstellungen abrufen
  async getSystemSettings(req, res) {
    try {
      const settings = await settingsModel.getSystemSettings();

      return res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Systemeinstellungen:', error);
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Abrufen der Systemeinstellungen',
        error: error.message
      });
    }
  }

  // Systemeinstellungen aktualisieren
  async updateSystemSettings(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const settingsData = req.body;

      // Minimal validieren
      if (typeof settingsData !== 'object' || Object.keys(settingsData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Keine gültigen Einstellungen angegeben'
        });
      }

      const updatedSettings = await settingsModel.updateSystemSettings(settingsData);

      return res.json({
        success: true,
        message: 'Systemeinstellungen erfolgreich aktualisiert',
        data: updatedSettings
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Systemeinstellungen:', error);
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Aktualisieren der Systemeinstellungen',
        error: error.message
      });
    }
  }
}

module.exports = new SettingsController();
