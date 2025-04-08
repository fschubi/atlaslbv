const db = require('../db');
const logger = require('../utils/logger');

const RoleModel = {
  /**
   * Alle Rollen abrufen
   * @returns {Promise<Array>} - Array von Rollen
   */
  getAllRoles: async () => {
    try {
      const query = `
        SELECT * FROM roles
        ORDER BY name
      `;

      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      logger.error('Fehler beim Abrufen aller Rollen:', error);
      throw error;
    }
  },

  /**
   * Rolle nach ID abrufen
   * @param {number} id - Rollen-ID
   * @returns {Promise<Object>} - Rolle
   */
  getRoleById: async (id) => {
    try {
      const query = `
        SELECT * FROM roles
        WHERE id = $1
      `;

      const { rows } = await db.query(query, [id]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Rolle mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Rolle nach Namen abrufen
   * @param {string} name - Rollenname
   * @returns {Promise<Object>} - Rolle
   */
  getRoleByName: async (name) => {
    try {
      const query = `
        SELECT * FROM roles
        WHERE name = $1
      `;

      const { rows } = await db.query(query, [name]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Rolle mit Namen ${name}:`, error);
      throw error;
    }
  },

  /**
   * Neue Rolle erstellen
   * @param {Object} roleData - Rollendaten
   * @returns {Promise<Object>} - Erstellte Rolle
   */
  createRole: async (roleData) => {
    try {
      const { name, description, is_system } = roleData;

      const query = `
        INSERT INTO roles (name, description, is_system)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const { rows } = await db.query(query, [name, description, is_system || false]);
      return rows[0];
    } catch (error) {
      logger.error('Fehler beim Erstellen der Rolle:', error);
      throw error;
    }
  },

  /**
   * Rolle aktualisieren
   * @param {number} id - Rollen-ID
   * @param {Object} roleData - Rollendaten
   * @returns {Promise<Object>} - Aktualisierte Rolle
   */
  updateRole: async (id, roleData) => {
    try {
      const { name, description, is_system } = roleData;

      const query = `
        UPDATE roles
        SET name = $1, description = $2, is_system = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;

      const { rows } = await db.query(query, [name, description, is_system, id]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren der Rolle mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Rolle löschen
   * @param {number} id - Rollen-ID
   * @returns {Promise<boolean>} - Erfolg
   */
  deleteRole: async (id) => {
    try {
      // Prüfen, ob es sich um eine Systemrolle handelt
      const role = await RoleModel.getRoleById(id);
      if (role && role.is_system) {
        throw new Error('Systemrollen können nicht gelöscht werden');
      }

      const query = `
        DELETE FROM roles
        WHERE id = $1
        RETURNING id
      `;

      const { rows } = await db.query(query, [id]);
      return rows.length > 0;
    } catch (error) {
      logger.error(`Fehler beim Löschen der Rolle mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Alle Berechtigungen abrufen
   * @returns {Promise<Array>} - Array von Berechtigungen
   */
  getAllPermissions: async () => {
    try {
      const query = `
        SELECT * FROM permissions
        ORDER BY module, action
      `;

      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      logger.error('Fehler beim Abrufen aller Berechtigungen:', error);
      throw error;
    }
  },

  /**
   * Berechtigungen nach Modul abrufen
   * @param {string} module - Modulname
   * @returns {Promise<Array>} - Array von Berechtigungen
   */
  getPermissionsByModule: async (module) => {
    try {
      const query = `
        SELECT * FROM permissions
        WHERE module = $1
        ORDER BY action
      `;

      const { rows } = await db.query(query, [module]);
      return rows;
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Berechtigungen für Modul ${module}:`, error);
      throw error;
    }
  },

  /**
   * Berechtigungen einer Rolle abrufen
   * @param {number} roleId - Rollen-ID
   * @returns {Promise<Array>} - Array von Berechtigungen
   */
  getRolePermissions: async (roleId) => {
    try {
      const query = `
        SELECT p.*
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = $1
        ORDER BY p.module, p.action
      `;

      const { rows } = await db.query(query, [roleId]);
      return rows;
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Berechtigungen für Rolle ${roleId}:`, error);
      throw error;
    }
  },

  /**
   * Berechtigung einer Rolle zuweisen
   * @param {number} roleId - Rollen-ID
   * @param {number} permissionId - Berechtigungs-ID
   * @returns {Promise<Object>} - Zugewiesene Berechtigung
   */
  assignPermissionToRole: async (roleId, permissionId) => {
    try {
      const query = `
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT (role_id, permission_id) DO NOTHING
        RETURNING *
      `;

      const { rows } = await db.query(query, [roleId, permissionId]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Zuweisen der Berechtigung ${permissionId} zur Rolle ${roleId}:`, error);
      throw error;
    }
  },

  /**
   * Berechtigung von einer Rolle entfernen
   * @param {number} roleId - Rollen-ID
   * @param {number} permissionId - Berechtigungs-ID
   * @returns {Promise<boolean>} - Erfolg
   */
  removePermissionFromRole: async (roleId, permissionId) => {
    try {
      const query = `
        DELETE FROM role_permissions
        WHERE role_id = $1 AND permission_id = $2
        RETURNING id
      `;

      const { rows } = await db.query(query, [roleId, permissionId]);
      return rows.length > 0;
    } catch (error) {
      logger.error(`Fehler beim Entfernen der Berechtigung ${permissionId} von der Rolle ${roleId}:`, error);
      throw error;
    }
  },

  /**
   * Rollenhierarchie abrufen
   * @returns {Promise<Array>} - Array von Rollenhierarchien
   */
  getRoleHierarchy: async () => {
    try {
      const query = `
        SELECT
          rh.id,
          parent.id AS parent_id,
          parent.name AS parent_name,
          child.id AS child_id,
          child.name AS child_name
        FROM role_hierarchy rh
        JOIN roles parent ON rh.parent_role_id = parent.id
        JOIN roles child ON rh.child_role_id = child.id
        ORDER BY parent.name, child.name
      `;

      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      logger.error('Fehler beim Abrufen der Rollenhierarchie:', error);
      throw error;
    }
  },

  /**
   * Übergeordnete Rolle einer Rolle abrufen
   * @param {number} roleId - Rollen-ID
   * @returns {Promise<Array>} - Array von übergeordneten Rollen
   */
  getParentRoles: async (roleId) => {
    try {
      const query = `
        SELECT r.*
        FROM roles r
        JOIN role_hierarchy rh ON r.id = rh.parent_role_id
        WHERE rh.child_role_id = $1
        ORDER BY r.name
      `;

      const { rows } = await db.query(query, [roleId]);
      return rows;
    } catch (error) {
      logger.error(`Fehler beim Abrufen der übergeordneten Rollen für Rolle ${roleId}:`, error);
      throw error;
    }
  },

  /**
   * Untergeordnete Rollen einer Rolle abrufen
   * @param {number} roleId - Rollen-ID
   * @returns {Promise<Array>} - Array von untergeordneten Rollen
   */
  getChildRoles: async (roleId) => {
    try {
      const query = `
        SELECT r.*
        FROM roles r
        JOIN role_hierarchy rh ON r.id = rh.child_role_id
        WHERE rh.parent_role_id = $1
        ORDER BY r.name
      `;

      const { rows } = await db.query(query, [roleId]);
      return rows;
    } catch (error) {
      logger.error(`Fehler beim Abrufen der untergeordneten Rollen für Rolle ${roleId}:`, error);
      throw error;
    }
  },

  /**
   * Rollenhierarchie erstellen
   * @param {number} parentRoleId - ID der übergeordneten Rolle
   * @param {number} childRoleId - ID der untergeordneten Rolle
   * @returns {Promise<Object>} - Erstellte Rollenhierarchie
   */
  createRoleHierarchy: async (parentRoleId, childRoleId) => {
    try {
      const query = `
        INSERT INTO role_hierarchy (parent_role_id, child_role_id)
        VALUES ($1, $2)
        ON CONFLICT (parent_role_id, child_role_id) DO NOTHING
        RETURNING *
      `;

      const { rows } = await db.query(query, [parentRoleId, childRoleId]);
      return rows[0];
    } catch (error) {
      logger.error(`Fehler beim Erstellen der Rollenhierarchie zwischen ${parentRoleId} und ${childRoleId}:`, error);
      throw error;
    }
  },

  /**
   * Rollenhierarchie löschen
   * @param {number} parentRoleId - ID der übergeordneten Rolle
   * @param {number} childRoleId - ID der untergeordneten Rolle
   * @returns {Promise<boolean>} - Erfolg
   */
  deleteRoleHierarchy: async (parentRoleId, childRoleId) => {
    try {
      const query = `
        DELETE FROM role_hierarchy
        WHERE parent_role_id = $1 AND child_role_id = $2
        RETURNING id
      `;

      const { rows } = await db.query(query, [parentRoleId, childRoleId]);
      return rows.length > 0;
    } catch (error) {
      logger.error(`Fehler beim Löschen der Rollenhierarchie zwischen ${parentRoleId} und ${childRoleId}:`, error);
      throw error;
    }
  },

  /**
   * Berechtigungen eines Benutzers abrufen
   * @param {number} userId - Benutzer-ID
   * @returns {Promise<Array>} - Array von Berechtigungen
   */
  getUserPermissions: async (userId) => {
    try {
      const query = `
        SELECT * FROM get_user_permissions($1)
      `;

      const { rows } = await db.query(query, [userId]);
      return rows;
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Berechtigungen für Benutzer ${userId}:`, error);
      throw error;
    }
  }
};

module.exports = RoleModel;
