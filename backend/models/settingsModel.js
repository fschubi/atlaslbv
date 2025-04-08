const db = require('../db');

class SettingsModel {
  // Kategorien abfragen
  async getCategories() {
    try {
      const query = `
        SELECT * FROM categories
        ORDER BY name ASC
      `;
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error('Fehler beim Abrufen der Kategorien:', error);
      throw error;
    }
  }

  // Kategorie nach ID abfragen
  async getCategoryById(id) {
    try {
      const query = `
        SELECT * FROM categories
        WHERE id = $1
      `;
      const { rows } = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Fehler beim Abrufen der Kategorie nach ID:', error);
      throw error;
    }
  }

  // Neue Kategorie erstellen
  async createCategory(categoryData) {
    try {
      // Prüfen, ob die Kategorie bereits existiert
      const checkQuery = `
        SELECT id FROM categories
        WHERE name = $1
      `;
      const existingCategory = await db.query(checkQuery, [categoryData.name]);

      if (existingCategory.rows.length > 0) {
        throw new Error('Eine Kategorie mit diesem Namen existiert bereits');
      }

      const query = `
        INSERT INTO categories (name, description, type)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const values = [
        categoryData.name,
        categoryData.description || null,
        categoryData.type || 'gerät' // Standard-Typ
      ];

      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Fehler beim Erstellen der Kategorie:', error);
      throw error;
    }
  }

  // Kategorie aktualisieren
  async updateCategory(id, categoryData) {
    try {
      // Prüfen, ob ein anderer Eintrag bereits den Namen verwendet
      if (categoryData.name) {
        const checkQuery = `
          SELECT id FROM categories
          WHERE name = $1 AND id != $2
        `;
        const existingCategory = await db.query(checkQuery, [categoryData.name, id]);

        if (existingCategory.rows.length > 0) {
          throw new Error('Eine andere Kategorie mit diesem Namen existiert bereits');
        }
      }

      const query = `
        UPDATE categories
        SET
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          type = COALESCE($3, type),
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `;

      const values = [
        categoryData.name || null,
        categoryData.description || null,
        categoryData.type || null,
        id
      ];

      const { rows } = await db.query(query, values);

      if (rows.length === 0) {
        throw new Error('Kategorie nicht gefunden');
      }

      return rows[0];
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Kategorie:', error);
      throw error;
    }
  }

  // Kategorie löschen
  async deleteCategory(id) {
    try {
      // Prüfen, ob die Kategorie verwendet wird (vereinfacht)
      const checkQuery = `
        SELECT COUNT(*) as count FROM devices
        WHERE category_id = $1
      `;
      const usageCheck = await db.query(checkQuery, [id]);

      if (parseInt(usageCheck.rows[0].count) > 0) {
        throw new Error('Diese Kategorie wird von Geräten verwendet und kann nicht gelöscht werden');
      }

      const query = `
        DELETE FROM categories
        WHERE id = $1
        RETURNING *
      `;

      const { rows } = await db.query(query, [id]);

      if (rows.length === 0) {
        throw new Error('Kategorie nicht gefunden');
      }

      return rows[0];
    } catch (error) {
      console.error('Fehler beim Löschen der Kategorie:', error);
      throw error;
    }
  }

  // Standorte abfragen
  async getLocations() {
    try {
      const query = `
        SELECT * FROM locations
        ORDER BY name ASC
      `;
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error('Fehler beim Abrufen der Standorte:', error);
      throw error;
    }
  }

  // Standort nach ID abfragen
  async getLocationById(id) {
    try {
      const query = `
        SELECT * FROM locations
        WHERE id = $1
      `;
      const { rows } = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Fehler beim Abrufen des Standorts nach ID:', error);
      throw error;
    }
  }

  // Neuen Standort erstellen
  async createLocation(locationData) {
    try {
      // Prüfen, ob der Standort bereits existiert
      const checkQuery = `
        SELECT id FROM locations
        WHERE name = $1
      `;
      const existingLocation = await db.query(checkQuery, [locationData.name]);

      if (existingLocation.rows.length > 0) {
        throw new Error('Ein Standort mit diesem Namen existiert bereits');
      }

      const query = `
        INSERT INTO locations (name, address, zip_code, city, country, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        locationData.name,
        locationData.address || null,
        locationData.zip_code || null,
        locationData.city || null,
        locationData.country || 'Deutschland', // Standard-Land
        locationData.notes || null
      ];

      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Fehler beim Erstellen des Standorts:', error);
      throw error;
    }
  }

  // Standort aktualisieren
  async updateLocation(id, locationData) {
    try {
      // Prüfen, ob ein anderer Eintrag bereits den Namen verwendet
      if (locationData.name) {
        const checkQuery = `
          SELECT id FROM locations
          WHERE name = $1 AND id != $2
        `;
        const existingLocation = await db.query(checkQuery, [locationData.name, id]);

        if (existingLocation.rows.length > 0) {
          throw new Error('Ein anderer Standort mit diesem Namen existiert bereits');
        }
      }

      const query = `
        UPDATE locations
        SET
          name = COALESCE($1, name),
          address = COALESCE($2, address),
          zip_code = COALESCE($3, zip_code),
          city = COALESCE($4, city),
          country = COALESCE($5, country),
          notes = COALESCE($6, notes),
          updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `;

      const values = [
        locationData.name || null,
        locationData.address || null,
        locationData.zip_code || null,
        locationData.city || null,
        locationData.country || null,
        locationData.notes || null,
        id
      ];

      const { rows } = await db.query(query, values);

      if (rows.length === 0) {
        throw new Error('Standort nicht gefunden');
      }

      return rows[0];
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Standorts:', error);
      throw error;
    }
  }

  // Standort löschen
  async deleteLocation(id) {
    try {
      // Prüfen, ob der Standort verwendet wird (vereinfacht)
      const checkQuery = `
        SELECT COUNT(*) as count FROM devices
        WHERE location_id = $1
      `;
      const usageCheck = await db.query(checkQuery, [id]);

      if (parseInt(usageCheck.rows[0].count) > 0) {
        throw new Error('Dieser Standort wird von Geräten verwendet und kann nicht gelöscht werden');
      }

      const query = `
        DELETE FROM locations
        WHERE id = $1
        RETURNING *
      `;

      const { rows } = await db.query(query, [id]);

      if (rows.length === 0) {
        throw new Error('Standort nicht gefunden');
      }

      return rows[0];
    } catch (error) {
      console.error('Fehler beim Löschen des Standorts:', error);
      throw error;
    }
  }

  // Abteilungen abfragen
  async getDepartments() {
    try {
      const query = `
        SELECT * FROM departments
        ORDER BY name ASC
      `;
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error('Fehler beim Abrufen der Abteilungen:', error);
      throw error;
    }
  }

  // Abteilung nach ID abfragen
  async getDepartmentById(id) {
    try {
      const query = `
        SELECT * FROM departments
        WHERE id = $1
      `;
      const { rows } = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Fehler beim Abrufen der Abteilung nach ID:', error);
      throw error;
    }
  }

  // Neue Abteilung erstellen
  async createDepartment(departmentData) {
    try {
      // Prüfen, ob die Abteilung bereits existiert
      const checkQuery = `
        SELECT id FROM departments
        WHERE name = $1
      `;
      const existingDepartment = await db.query(checkQuery, [departmentData.name]);

      if (existingDepartment.rows.length > 0) {
        throw new Error('Eine Abteilung mit diesem Namen existiert bereits');
      }

      const query = `
        INSERT INTO departments (name, description, location_id, manager_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const values = [
        departmentData.name,
        departmentData.description || null,
        departmentData.location_id || null,
        departmentData.manager_id || null
      ];

      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Fehler beim Erstellen der Abteilung:', error);
      throw error;
    }
  }

  // Abteilung aktualisieren
  async updateDepartment(id, departmentData) {
    try {
      // Prüfen, ob ein anderer Eintrag bereits den Namen verwendet
      if (departmentData.name) {
        const checkQuery = `
          SELECT id FROM departments
          WHERE name = $1 AND id != $2
        `;
        const existingDepartment = await db.query(checkQuery, [departmentData.name, id]);

        if (existingDepartment.rows.length > 0) {
          throw new Error('Eine andere Abteilung mit diesem Namen existiert bereits');
        }
      }

      const query = `
        UPDATE departments
        SET
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          location_id = COALESCE($3, location_id),
          manager_id = COALESCE($4, manager_id),
          updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `;

      const values = [
        departmentData.name || null,
        departmentData.description || null,
        departmentData.location_id || null,
        departmentData.manager_id || null,
        id
      ];

      const { rows } = await db.query(query, values);

      if (rows.length === 0) {
        throw new Error('Abteilung nicht gefunden');
      }

      return rows[0];
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Abteilung:', error);
      throw error;
    }
  }

  // Abteilung löschen
  async deleteDepartment(id) {
    try {
      // Prüfen, ob die Abteilung verwendet wird (vereinfacht)
      const checkQuery = `
        SELECT COUNT(*) as count FROM users
        WHERE department_id = $1
      `;
      const usageCheck = await db.query(checkQuery, [id]);

      if (parseInt(usageCheck.rows[0].count) > 0) {
        throw new Error('Diese Abteilung wird von Benutzern verwendet und kann nicht gelöscht werden');
      }

      const query = `
        DELETE FROM departments
        WHERE id = $1
        RETURNING *
      `;

      const { rows } = await db.query(query, [id]);

      if (rows.length === 0) {
        throw new Error('Abteilung nicht gefunden');
      }

      return rows[0];
    } catch (error) {
      console.error('Fehler beim Löschen der Abteilung:', error);
      throw error;
    }
  }

  // Räume abfragen
  async getRooms() {
    try {
      const query = `
        SELECT r.*, l.name as location_name
        FROM rooms r
        LEFT JOIN locations l ON r.location_id = l.id
        ORDER BY r.name ASC
      `;
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error('Fehler beim Abrufen der Räume:', error);
      throw error;
    }
  }

  // Raum nach ID abfragen
  async getRoomById(id) {
    try {
      const query = `
        SELECT r.*, l.name as location_name
        FROM rooms r
        LEFT JOIN locations l ON r.location_id = l.id
        WHERE r.id = $1
      `;
      const { rows } = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Fehler beim Abrufen des Raums nach ID:', error);
      throw error;
    }
  }

  // Neuen Raum erstellen
  async createRoom(roomData) {
    try {
      // Prüfen, ob der Raum bereits existiert
      const checkQuery = `
        SELECT id FROM rooms
        WHERE name = $1 AND location_id = $2
      `;
      const existingRoom = await db.query(checkQuery, [roomData.name, roomData.location_id]);

      if (existingRoom.rows.length > 0) {
        throw new Error('Ein Raum mit diesem Namen existiert bereits am selben Standort');
      }

      const query = `
        INSERT INTO rooms (name, floor, room_number, description, location_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const values = [
        roomData.name,
        roomData.floor || null,
        roomData.room_number || null,
        roomData.description || null,
        roomData.location_id
      ];

      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Fehler beim Erstellen des Raums:', error);
      throw error;
    }
  }

  // Raum aktualisieren
  async updateRoom(id, roomData) {
    try {
      // Prüfen, ob ein anderer Eintrag bereits den Namen verwendet
      if (roomData.name && roomData.location_id) {
        const checkQuery = `
          SELECT id FROM rooms
          WHERE name = $1 AND location_id = $2 AND id != $3
        `;
        const existingRoom = await db.query(checkQuery, [roomData.name, roomData.location_id, id]);

        if (existingRoom.rows.length > 0) {
          throw new Error('Ein anderer Raum mit diesem Namen existiert bereits am selben Standort');
        }
      }

      const query = `
        UPDATE rooms
        SET
          name = COALESCE($1, name),
          floor = COALESCE($2, floor),
          room_number = COALESCE($3, room_number),
          description = COALESCE($4, description),
          location_id = COALESCE($5, location_id),
          updated_at = NOW()
        WHERE id = $6
        RETURNING *
      `;

      const values = [
        roomData.name || null,
        roomData.floor || null,
        roomData.room_number || null,
        roomData.description || null,
        roomData.location_id || null,
        id
      ];

      const { rows } = await db.query(query, values);

      if (rows.length === 0) {
        throw new Error('Raum nicht gefunden');
      }

      return rows[0];
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Raums:', error);
      throw error;
    }
  }

  // Raum löschen
  async deleteRoom(id) {
    try {
      // Prüfen, ob der Raum verwendet wird (vereinfacht)
      const checkQuery = `
        SELECT COUNT(*) as count FROM devices
        WHERE room_id = $1
      `;
      const usageCheck = await db.query(checkQuery, [id]);

      if (parseInt(usageCheck.rows[0].count) > 0) {
        throw new Error('Dieser Raum wird von Geräten verwendet und kann nicht gelöscht werden');
      }

      const query = `
        DELETE FROM rooms
        WHERE id = $1
        RETURNING *
      `;

      const { rows } = await db.query(query, [id]);

      if (rows.length === 0) {
        throw new Error('Raum nicht gefunden');
      }

      return rows[0];
    } catch (error) {
      console.error('Fehler beim Löschen des Raums:', error);
      throw error;
    }
  }

  // Globale Systemeinstellungen
  async getSystemSettings() {
    try {
      const query = `
        SELECT * FROM system_settings
        ORDER BY key ASC
      `;
      const { rows } = await db.query(query);

      // Formatiere Einstellungen als Key-Value-Objekt
      const settings = {};
      rows.forEach(row => {
        settings[row.key] = row.value;
      });

      return settings;
    } catch (error) {
      console.error('Fehler beim Abrufen der Systemeinstellungen:', error);
      throw error;
    }
  }

  // Systemeinstellungen aktualisieren
  async updateSystemSettings(settingsData) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Einstellungen einzeln aktualisieren oder erstellen
      const result = {};

      for (const [key, value] of Object.entries(settingsData)) {
        const query = `
          INSERT INTO system_settings (key, value, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (key)
          DO UPDATE SET value = $2, updated_at = NOW()
          RETURNING *
        `;

        const { rows } = await client.query(query, [key, value]);
        result[key] = rows[0].value;
      }

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Fehler beim Aktualisieren der Systemeinstellungen:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new SettingsModel();
