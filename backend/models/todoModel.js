const db = require('../db');
const logger = require('../utils/logger');

// Simulierte Daten für das Frontend-Prototyping
const mockTodos = [
  {
    id: 1,
    title: 'Laptop für neuen Mitarbeiter vorbereiten',
    description: 'Windows 11 installieren, Office einrichten, VPN konfigurieren',
    status: 'Offen',
    priority: 2, // Mittel
    created_at: '2023-12-01T08:30:00Z',
    due_date: '2023-12-05T17:00:00Z',
    assigned_to: 'Max Mustermann',
    created_by: 'Admin',
    category: 'Gerät'
  },
  {
    id: 2,
    title: 'Software-Lizenzen erneuern',
    description: 'Adobe Creative Cloud Lizenzen müssen für die Design-Abteilung erneuert werden',
    status: 'In Bearbeitung',
    priority: 3, // Hoch
    created_at: '2023-12-03T09:15:00Z',
    due_date: '2023-12-15T17:00:00Z',
    assigned_to: 'Lisa Müller',
    created_by: 'Thomas Schmidt',
    category: 'Software'
  },
  {
    id: 3,
    title: 'Server-Backup überprüfen',
    description: 'Routineüberprüfung der Backup-Systeme und Wiederherstellungstests',
    status: 'Erledigt',
    priority: 3, // Hoch
    created_at: '2023-11-25T14:00:00Z',
    due_date: '2023-11-30T17:00:00Z',
    assigned_to: 'Thomas Schmidt',
    created_by: 'Admin',
    category: 'Infrastruktur'
  },
  {
    id: 4,
    title: 'Druckerpatrone wechseln',
    description: 'Im Drucker HP LaserJet im Empfangsbereich muss die schwarze Patrone gewechselt werden',
    status: 'Offen',
    priority: 1, // Niedrig
    created_at: '2023-12-04T10:45:00Z',
    due_date: '2023-12-06T17:00:00Z',
    assigned_to: 'Lisa Müller',
    created_by: 'Max Mustermann',
    category: 'Gerät'
  },
  {
    id: 5,
    title: 'Netzwerkprobleme im 2. OG untersuchen',
    description: 'Mehrere Mitarbeiter berichten von langsamen Verbindungen im 2. Stock',
    status: 'In Bearbeitung',
    priority: 2, // Mittel
    created_at: '2023-12-02T13:20:00Z',
    due_date: '2023-12-04T17:00:00Z',
    assigned_to: 'Thomas Schmidt',
    created_by: 'Admin',
    category: 'Netzwerk'
  }
];

const TodoModel = {
  /**
   * Alle Todos abrufen
   * @param {Object} filters - Filter für die Abfrage
   * @param {number} page - Aktuelle Seite
   * @param {number} limit - Anzahl der Einträge pro Seite
   * @param {string} sortBy - Sortierfeld
   * @param {string} sortOrder - Sortierreihenfolge (asc/desc)
   * @param {string} search - Suchbegriff
   * @returns {Promise<Object>} - Todos und Metadaten
   */
  getAllTodos: async (filters = {}, page = 1, limit = 10, sortBy = 'due_date', sortOrder = 'asc', search = '') => {
    try {
      logger.info('Mock: TodoModel.getAllTodos aufgerufen');

      // Verzögerung simulieren
      await new Promise(resolve => setTimeout(resolve, 300));

      // Filtere die Todos nach dem Suchbegriff
      let filteredTodos = [...mockTodos];

      if (search) {
        const searchLower = search.toLowerCase();
        filteredTodos = filteredTodos.filter(todo =>
          todo.title.toLowerCase().includes(searchLower) ||
          todo.description.toLowerCase().includes(searchLower)
        );
      }

      // Anwendung der Filter
      if (filters.status) {
        filteredTodos = filteredTodos.filter(todo => todo.status === filters.status);
      }

      if (filters.priority) {
        filteredTodos = filteredTodos.filter(todo => todo.priority === parseInt(filters.priority));
      }

      if (filters.category) {
        filteredTodos = filteredTodos.filter(todo => todo.category === filters.category);
      }

      // Sortierung
      filteredTodos.sort((a, b) => {
        if (sortBy === 'due_date') {
          return sortOrder === 'asc'
            ? new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
            : new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
        } else if (sortBy === 'priority') {
          return sortOrder === 'asc' ? a.priority - b.priority : b.priority - a.priority;
        } else if (sortBy === 'created_at') {
          return sortOrder === 'asc'
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        // Standardsortierung nach Titel
        return sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      });

      // Paginierung
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTodos = filteredTodos.slice(startIndex, endIndex);

      return {
        data: paginatedTodos,
        pagination: {
          total: filteredTodos.length,
          page,
          limit,
          pages: Math.ceil(filteredTodos.length / limit)
        }
      };
    } catch (error) {
      logger.error('Fehler in TodoModel.getAllTodos:', error);
      throw error;
    }
  },

  /**
   * Todo nach ID abrufen
   * @param {number} id - Todo-ID
   * @returns {Promise<Object|null>} - Todo oder null
   */
  getTodoById: async (id) => {
    try {
      logger.info(`Mock: TodoModel.getTodoById aufgerufen mit ID ${id}`);

      // Verzögerung simulieren
      await new Promise(resolve => setTimeout(resolve, 200));

      const todo = mockTodos.find(t => t.id === id);
      return todo || null;
    } catch (error) {
      logger.error(`Fehler in TodoModel.getTodoById für ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Todos für einen Benutzer abrufen
   * @param {number} userId - Benutzer-ID
   * @param {Object} options - Zusätzliche Optionen (status, overdue, limit)
   * @returns {Promise<Array>} - Todos des Benutzers
   */
  getTodosByUser: async (userId, options = {}) => {
    try {
      logger.info(`Mock: TodoModel.getTodosByUser aufgerufen für Benutzer ${userId}`);

      // Verzögerung simulieren
      await new Promise(resolve => setTimeout(resolve, 200));

      // In Mock-Daten einfach nach Namen filtern (in realer DB würde man nach ID filtern)
      const userName = userId === 1 ? 'Max Mustermann' : userId === 2 ? 'Lisa Müller' : 'Thomas Schmidt';

      let userTodos = mockTodos.filter(todo => todo.assigned_to === userName);

      // Status-Filter anwenden
      if (options.status) {
        userTodos = userTodos.filter(todo => todo.status === options.status);
      }

      // Limit anwenden
      if (options.limit) {
        userTodos = userTodos.slice(0, options.limit);
      }

      return userTodos;
    } catch (error) {
      logger.error(`Fehler in TodoModel.getTodosByUser für Benutzer ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Todos für ein Gerät abrufen
   * @param {number} deviceId - Geräte-ID
   * @returns {Promise<Array>} - Todos des Geräts
   */
  getTodosByDevice: async (deviceId) => {
    try {
      logger.info(`Mock: TodoModel.getTodosByDevice aufgerufen für Gerät ${deviceId}`);

      // Verzögerung simulieren
      await new Promise(resolve => setTimeout(resolve, 200));

      // In Mock-Daten nur Geräte-Todos zurückgeben
      const deviceTodos = mockTodos.filter(todo => todo.category === 'Gerät');

      return deviceTodos;
    } catch (error) {
      logger.error(`Fehler in TodoModel.getTodosByDevice für Gerät ${deviceId}:`, error);
      throw error;
    }
  },

  /**
   * Überfällige Todos abrufen
   * @param {number} limit - Maximalzahl zurückzugebender Todos
   * @returns {Promise<Array>} - Überfällige Todos
   */
  getOverdueTodos: async (limit = 10) => {
    try {
      logger.info(`Mock: TodoModel.getOverdueTodos aufgerufen mit Limit ${limit}`);

      // Verzögerung simulieren
      await new Promise(resolve => setTimeout(resolve, 200));

      // Überfällig = Fälligkeitsdatum in der Vergangenheit und Status nicht "Erledigt"
      const now = new Date();
      const overdueTodos = mockTodos.filter(todo =>
        new Date(todo.due_date) < now && todo.status !== 'Erledigt'
      ).slice(0, limit);

      return overdueTodos;
    } catch (error) {
      logger.error('Fehler in TodoModel.getOverdueTodos:', error);
      throw error;
    }
  },

  /**
   * Neues Todo erstellen
   * @param {Object} todoData - Daten für das neue Todo
   * @returns {Promise<Object>} - Erstelltes Todo
   */
  createTodo: async (todoData) => {
    try {
      logger.info('Mock: TodoModel.createTodo aufgerufen');

      // Verzögerung simulieren
      await new Promise(resolve => setTimeout(resolve, 300));

      // ID generieren (simuliert die Auto-Increment-Funktion der Datenbank)
      const maxId = mockTodos.length > 0
        ? Math.max(...mockTodos.map(t => parseInt(t.id)))
        : 0;

      const newTodo = {
        id: (maxId + 1).toString(),
        title: todoData.title,
        description: todoData.description || '',
        status: todoData.status || 'Offen',
        priority: todoData.priority || 2,
        created_at: new Date().toISOString(),
        due_date: todoData.due_date || null,
        assigned_to: todoData.assigned_to || null,
        created_by: todoData.created_by || 'Admin',
        category: todoData.category || 'Sonstiges'
      };

      // Todo zum Array hinzufügen (in einer echten Datenbank würde hier ein INSERT-Statement verwendet)
      mockTodos.push(newTodo);

      return newTodo;
    } catch (error) {
      logger.error('Fehler in TodoModel.createTodo:', error);
      throw error;
    }
  },

  /**
   * Todo aktualisieren
   * @param {number} id - Todo-ID
   * @param {Object} todoData - Aktualisierte Daten
   * @returns {Promise<Object|null>} - Aktualisiertes Todo oder null
   */
  updateTodo: async (id, todoData) => {
    try {
      logger.info(`Mock: TodoModel.updateTodo aufgerufen für ID ${id}`);

      // Verzögerung simulieren
      await new Promise(resolve => setTimeout(resolve, 200));

      const todoIndex = mockTodos.findIndex(t => t.id === id.toString());

      if (todoIndex === -1) {
        return null;
      }

      // Vorhandenes Todo aktualisieren
      const updatedTodo = {
        ...mockTodos[todoIndex],
        title: todoData.title !== undefined ? todoData.title : mockTodos[todoIndex].title,
        description: todoData.description !== undefined ? todoData.description : mockTodos[todoIndex].description,
        status: todoData.status !== undefined ? todoData.status : mockTodos[todoIndex].status,
        priority: todoData.priority !== undefined ? todoData.priority : mockTodos[todoIndex].priority,
        due_date: todoData.due_date !== undefined ? todoData.due_date : mockTodos[todoIndex].due_date,
        assigned_to: todoData.assigned_to !== undefined ? todoData.assigned_to : mockTodos[todoIndex].assigned_to,
        category: todoData.category !== undefined ? todoData.category : mockTodos[todoIndex].category
      };

      // Todo im Array ersetzen
      mockTodos[todoIndex] = updatedTodo;

      return updatedTodo;
    } catch (error) {
      logger.error(`Fehler in TodoModel.updateTodo für ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Status eines Todos aktualisieren
   * @param {number} id - Todo-ID
   * @param {string} status - Neuer Status
   * @returns {Promise<Object|null>} - Aktualisiertes Todo oder null
   */
  updateTodoStatus: async (id, status) => {
    try {
      logger.info(`Mock: TodoModel.updateTodoStatus aufgerufen für ID ${id} mit Status ${status}`);

      // Verzögerung simulieren
      await new Promise(resolve => setTimeout(resolve, 300));

      return await TodoModel.updateTodo(id, { status });
    } catch (error) {
      logger.error(`Fehler in TodoModel.updateTodoStatus für ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Todo löschen
   * @param {number} id - Todo-ID
   * @returns {Promise<boolean>} - true wenn erfolgreich gelöscht
   */
  deleteTodo: async (id) => {
    try {
      logger.info(`Mock: TodoModel.deleteTodo aufgerufen für ID ${id}`);

      // Verzögerung simulieren
      await new Promise(resolve => setTimeout(resolve, 200));

      const initialLength = mockTodos.length;
      const idStr = id.toString();

      // Todo aus dem Array entfernen
      const filteredTodos = mockTodos.filter(t => t.id !== idStr);

      // Array aktualisieren
      mockTodos.length = 0;
      mockTodos.push(...filteredTodos);

      // Erfolg melden, wenn ein Todo entfernt wurde
      return mockTodos.length < initialLength;
    } catch (error) {
      logger.error(`Fehler in TodoModel.deleteTodo für ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Todo als erledigt markieren
   * @param {number} id - Todo-ID
   * @returns {Promise<Object|null>} - Aktualisiertes Todo oder null
   */
  completeTodo: async (id) => {
    try {
      logger.info(`Mock: TodoModel.completeTodo aufgerufen für ID ${id}`);

      // Verzögerung simulieren
      await new Promise(resolve => setTimeout(resolve, 150));

      const todoIndex = mockTodos.findIndex(t => t.id === id.toString());

      if (todoIndex === -1) {
        return null;
      }

      // Status auf "Erledigt" setzen
      mockTodos[todoIndex].status = 'Erledigt';

      return mockTodos[todoIndex];
    } catch (error) {
      logger.error(`Fehler in TodoModel.completeTodo für ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Todo-Statistiken für das Dashboard abrufen
   * @returns {Promise<Object>} - Statistiken zu Todos
   */
  getTodoStats: async () => {
    try {
      logger.info('Mock: TodoModel.getTodoStats aufgerufen');

      // Verzögerung simulieren
      await new Promise(resolve => setTimeout(resolve, 200));

      const now = new Date();

      const totalTodos = mockTodos.length;
      const openTodos = mockTodos.filter(todo => todo.status === 'Offen').length;
      const inProgressTodos = mockTodos.filter(todo => todo.status === 'In Bearbeitung').length;
      const completedTodos = mockTodos.filter(todo => todo.status === 'Erledigt').length;
      const overdueTodos = mockTodos.filter(todo =>
        new Date(todo.due_date) < now && todo.status !== 'Erledigt'
      ).length;
      const highPriorityTodos = mockTodos.filter(todo => todo.priority === 3).length;

      return {
        total: totalTodos,
        openTodos,
        inProgressTodos,
        completedTodos,
        overdueTodos,
        highPriorityTodos,
        byCategory: {
          Gerät: mockTodos.filter(todo => todo.category === 'Gerät').length,
          Netzwerk: mockTodos.filter(todo => todo.category === 'Netzwerk').length,
          Software: mockTodos.filter(todo => todo.category === 'Software').length,
          Infrastruktur: mockTodos.filter(todo => todo.category === 'Infrastruktur').length,
          Sonstiges: mockTodos.filter(todo => todo.category === 'Sonstiges').length
        }
      };
    } catch (error) {
      logger.error('Fehler in TodoModel.getTodoStats:', error);
      throw error;
    }
  }
};

module.exports = TodoModel;
