/**
 * API-Service für das ATLAS Asset Management System
 *
 * Dieser Service stellt Funktionen für den Zugriff auf die ATLAS-Backend-API bereit.
 * Alle API-Anfragen werden über diese zentrale Stelle verwaltet.
 */

interface Device {
  id: string;
  name: string;
  type: string;
  status: string;
  serialNumber: string;
  // ... weitere Eigenschaften
}

interface License {
  id: string;
  name: string;
  // ... weitere Eigenschaften
}

interface InventorySession {
  id: string;
  name: string;
  description: string;
  location: string;
  status: string;
  startDate: string;
  endDate: string | null;
  progress: number;
  totalDevices: number;
  checkedDevices: number;
}

interface SessionDevice {
  id: string;
  name: string;
  serialNumber: string;
  inventoryNumber: string;
  status: string;
  lastSeen: string;
  location: string;
  checked: boolean;
}

// API-Basis-URL aus Umgebungsvariablen
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:35002/api';

// Standard-Optionen für Fetch-Anfragen
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Cookies für Cross-Origin-Anfragen senden
  mode: 'cors' // Explizit CORS-Modus aktivieren
};

// Hilffunktion für das Hinzufügen des Auth-Tokens zu Anfragen
const withAuth = (options: RequestInit = {}): RequestInit => {
  const token = localStorage.getItem('token');

  if (!token) {
    return options;
  }

  return {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  };
};

// Hilffunktion für API-Anfragen
async function apiRequest<T>(
  endpoint: string,
  method: string = 'GET',
  data?: any,
  requiresAuth: boolean = true,
  retryOptions: {
    maxRetries?: number;
    retryDelay?: number;
    isRetryable?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    isRetryable = (error) => {
      // Standard-Logik für wiederholbare Fehler
      // Netzwerkfehler und 5xx Serverfehler werden wiederholt
      if (error instanceof TypeError && error.message.includes('network')) {
        return true;
      }
      if (error.status && error.status >= 500 && error.status < 600) {
        return true;
      }
      if (error.status === 429) { // Rate Limiting
        return true;
      }
      return false;
    }
  } = retryOptions;

  const url = `${API_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    ...defaultOptions,
    method,
  };

  // Daten hinzufügen, wenn vorhanden
  if (data) {
    options.body = JSON.stringify(data);
  }

  // Auth-Token hinzufügen, wenn erforderlich
  if (requiresAuth) {
    Object.assign(options, withAuth(options));
  }

  // Funktion für den API-Aufruf
  const executeRequest = async (attempt: number = 1): Promise<T> => {
    try {
      console.log(`API-Anfrage an: ${url} (Versuch ${attempt}/${maxRetries + 1})`);
      const response = await fetch(url, options);

      // HTTP-Fehler als Error werfen
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: 'Keine Details verfügbar' };
        }

        // Spezialfall: Authentifizierungsfehler
        if (response.status === 401) {
          // Token ist abgelaufen oder ungültig
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
        }

        // Strukturiertes Fehlerobjekt erstellen
        const error: any = new Error(errorData.message || `HTTP-Fehler ${response.status}`);
        error.status = response.status;
        error.statusText = response.statusText;
        error.data = errorData;
        error.code = errorData.code || `HTTP_${response.status}`;
        error.details = errorData.details || null;

        throw error;
      }

      // JSON-Antwort zurückgeben oder leeres Objekt, wenn keine Daten
      if (response.status !== 204) { // No Content
        const responseData = await response.json();
        return responseData;
      }

      return {} as T;
    } catch (error: any) {
      console.error(`API-Fehler (Versuch ${attempt}/${maxRetries + 1}):`, error);

      // Wiederholungsversuch, wenn der Fehler als wiederholbar eingestuft wird und Versuche übrig sind
      if (attempt <= maxRetries && isRetryable(error)) {
        console.info(`Wiederholungsversuch ${attempt}/${maxRetries} in ${retryDelay * Math.pow(2, attempt - 1)}ms...`);

        // Exponentielles Backoff für die Verzögerung zwischen Versuchen
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Rekursiver Aufruf für den nächsten Versuch
        return executeRequest(attempt + 1);
      }

      // Alle Wiederholungsversuche erschöpft oder Fehler nicht wiederholbar
      // Verbessertes Fehlerobjekt werfen
      const enhancedError: any = error instanceof Error ? error : new Error('Unbekannter API-Fehler');

      // Benutzerfreundliche Nachricht basierend auf Fehlercode
      if (error.code) {
        switch (error.code) {
          case 'HTTP_400':
            enhancedError.message = 'Ungültige Anfrage. Bitte überprüfen Sie Ihre Eingaben.';
            break;
          case 'HTTP_404':
            enhancedError.message = 'Die angeforderte Ressource wurde nicht gefunden.';
            break;
          case 'HTTP_429':
            enhancedError.message = 'Zu viele Anfragen. Bitte warten Sie einen Moment.';
            break;
          case 'HTTP_500':
          case 'HTTP_502':
          case 'HTTP_503':
          case 'HTTP_504':
            enhancedError.message = 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
            break;
        }
      }

      throw enhancedError;
    }
  };

  // Initiale Ausführung der Anfrage
  return executeRequest();
}

// Auth-Funktionen
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiRequest<{ token: string; user: any }>('/users/login', 'POST', credentials, false),

  register: (userData: any) =>
    apiRequest<{ token: string; user: any }>('/users/register', 'POST', userData, false),

  logout: () =>
    apiRequest<{ message: string }>('/users/logout', 'POST'),

  getCurrentUser: () =>
    apiRequest<{ user: any }>('/users/me', 'GET'),
};

// Geräte-Funktionen
export const devicesApi = {
  getAllDevices: (params?: any) =>
    apiRequest<{ data: any[]; pagination?: any }>('/devices' + (params ? `?${new URLSearchParams(params)}` : '')),

  getDeviceById: (id: string | number) =>
    apiRequest<{ data: any }>(`/devices/${id}`),

  createDevice: (deviceData: any) =>
    apiRequest<{ message: string; data: any }>('/devices', 'POST', deviceData),

  updateDevice: (id: string | number, deviceData: any) =>
    apiRequest<{ message: string; data: any }>(`/devices/${id}`, 'PUT', deviceData),

  deleteDevice: (id: string | number) =>
    apiRequest<{ message: string }>(`/devices/${id}`, 'DELETE'),

  // Geräte in einer Inventursitzung
  getSessionDevices: (sessionId: string) =>
    apiRequest<{ data: SessionDevice[] }>(`/inventory/sessions/${sessionId}/devices`),

  addDeviceToSession: (sessionId: string, deviceId: string) =>
    apiRequest<{ success: boolean; message: string }>(`/inventory/sessions/${sessionId}/devices`, 'POST', { deviceId }),

  removeDeviceFromSession: (sessionId: string, deviceId: string) =>
    apiRequest<{ success: boolean; message: string }>(`/inventory/sessions/${sessionId}/devices/${deviceId}`, 'DELETE'),

  markDeviceAsChecked: (sessionId: string, deviceId: string) =>
    apiRequest<{ success: boolean; message: string }>(`/inventory/sessions/${sessionId}/devices/${deviceId}/check`, 'PUT'),

  // Neue Funktion: Batch-Update für mehrere Geräte in einer Inventursitzung
  markDevicesBatchAsChecked: async (sessionId: string, deviceIds: string[]) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simuliere einige mögliche Fehler bei bestimmten Geräten
    const results = deviceIds.map(deviceId => {
      const success = Math.random() > 0.1; // 10% Fehlerrate simulieren
      return {
        deviceId,
        success,
        message: success ? undefined : 'Gerät konnte nicht aktualisiert werden'
      };
    });

    const allSuccessful = results.every(r => r.success);

    return {
      success: allSuccessful,
      message: allSuccessful
        ? `Alle ${deviceIds.length} Geräte wurden erfolgreich aktualisiert`
        : `${results.filter(r => r.success).length} von ${deviceIds.length} Geräten wurden aktualisiert`,
      results
    };
  },

  updateSessionProgress: async (sessionId: string) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simuliere unterschiedliche Fortschritte je nach Session
    let progress = 0;
    let checkedDevices = 0;
    let totalDevices = 0;

    if (sessionId === "inv-1") {
      // Abgeschlossene Sitzung
      progress = 100;
      totalDevices = 120;
      checkedDevices = 120;
    } else if (sessionId === "inv-2") {
      // Aktive Sitzung mit Fortschritt
      progress = 70; // Leichter Fortschritt im Vergleich zum ursprünglichen Wert (68%)
      totalDevices = 75;
      checkedDevices = Math.ceil(totalDevices * progress / 100);
    } else {
      // Andere Sitzungen mit geringem Fortschritt
      totalDevices = 45;
      // Zufälliger kleiner Fortschritt von max. 10%
      progress = Math.floor(Math.random() * 11);
      checkedDevices = Math.ceil(totalDevices * progress / 100);
    }

    return {
      progress,
      checkedDevices,
      totalDevices
    };
  },

  findMissingDevices: async (sessionId: string) => {
    // Simulierte Daten für das Frontend-Prototyping

    // Wenn Session 'inv-1', dann keine fehlenden Geräte, da abgeschlossen
    if (sessionId === "inv-1") {
      return [];
    }

    // Simuliere 3-5 fehlende Geräte für andere Sitzungen
    const deviceCount = Math.floor(Math.random() * 3) + 3; // 3-5 Geräte
    const deviceTypes = ["Laptop", "Monitor", "Server"];
    const locations = ["München 1.OG", "Berlin Hauptgebäude", "Hamburg Büro"];

    // Generiere die fehlenden Geräte
    const mockMissingDevices: SessionDevice[] = Array.from({ length: deviceCount }, (_, i) => {
      const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];

      return {
        id: `missing-${sessionId}-${i+1}`,
        name: `${deviceType} ${Math.floor(Math.random() * 900) + 100}`,
        serialNumber: `SN-${Math.floor(Math.random() * 90000) + 10000}`,
        inventoryNumber: `INV-${Math.floor(Math.random() * 90000) + 10000}`,
        status: "In Betrieb",
        lastSeen: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: location,
        checked: false
      };
    });

    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 800));

    return mockMissingDevices;
  },
};

// Lizenzen-Funktionen
export const licensesApi = {
  getAllLicenses: (params?: any) =>
    apiRequest<{ data: any[]; pagination?: any }>('/licenses' + (params ? `?${new URLSearchParams(params)}` : '')),

  getLicenseById: (id: string | number) =>
    apiRequest<{ data: any }>(`/licenses/${id}`),

  createLicense: (licenseData: any) =>
    apiRequest<{ message: string; data: any }>('/licenses', 'POST', licenseData),

  updateLicense: (id: string | number, licenseData: any) =>
    apiRequest<{ message: string; data: any }>(`/licenses/${id}`, 'PUT', licenseData),

  deleteLicense: (id: string | number) =>
    apiRequest<{ message: string }>(`/licenses/${id}`, 'DELETE'),
};

// Zertifikate-Funktionen
export const certificatesApi = {
  getAllCertificates: (params?: any) =>
    apiRequest<{ data: any[]; pagination?: any }>('/certificates' + (params ? `?${new URLSearchParams(params)}` : '')),

  getCertificateById: (id: string | number) =>
    apiRequest<{ data: any }>(`/certificates/${id}`),

  createCertificate: (certificateData: any) =>
    apiRequest<{ message: string; data: any }>('/certificates', 'POST', certificateData),

  updateCertificate: (id: string | number, certificateData: any) =>
    apiRequest<{ message: string; data: any }>(`/certificates/${id}`, 'PUT', certificateData),

  deleteCertificate: (id: string | number) =>
    apiRequest<{ message: string }>(`/certificates/${id}`, 'DELETE'),
};

// Zubehör-Funktionen
export const accessoriesApi = {
  getAllAccessories: (params?: any) =>
    apiRequest<{ data: any[]; pagination?: any }>('/accessories' + (params ? `?${new URLSearchParams(params)}` : '')),

  getAccessoryById: (id: string | number) =>
    apiRequest<{ data: any }>(`/accessories/${id}`),

  createAccessory: (accessoryData: any) =>
    apiRequest<{ message: string; data: any }>('/accessories', 'POST', accessoryData),

  updateAccessory: (id: string | number, accessoryData: any) =>
    apiRequest<{ message: string; data: any }>(`/accessories/${id}`, 'PUT', accessoryData),

  deleteAccessory: (id: string | number) =>
    apiRequest<{ message: string }>(`/accessories/${id}`, 'DELETE'),
};

// Benutzer-Funktionen
export const usersApi = {
  getAllUsers: (params?: any) =>
    apiRequest<{ data: any[]; pagination?: any }>('/users' + (params ? `?${new URLSearchParams(params)}` : '')),

  getUserById: (id: string | number) =>
    apiRequest<{ data: any }>(`/users/${id}`),

  createUser: (userData: any) =>
    apiRequest<{ message: string; data: any }>('/users', 'POST', userData),

  updateUser: (id: string | number, userData: any) =>
    apiRequest<{ message: string; data: any }>(`/users/${id}`, 'PUT', userData),

  deleteUser: (id: string | number) =>
    apiRequest<{ message: string }>(`/users/${id}`, 'DELETE'),
};

// Todos-Funktionen
export const todosApi = {
  getAllTodos: async (params?: any) => {
    // Mock-Daten für Todos zurückgeben
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 300));

    const mockTodos = [
      {
        id: '1',
        title: 'Laptop für neuen Mitarbeiter vorbereiten',
        description: 'Windows 11 installieren, Office einrichten, VPN konfigurieren',
        status: 'Offen',
        priority: 2, // Mittel
        createdAt: '2023-12-01T08:30:00Z',
        dueDate: '2023-12-05T17:00:00Z',
        assignedTo: 'Max Mustermann',
        createdBy: 'Admin',
        category: 'Gerät'
      },
      {
        id: '2',
        title: 'Software-Lizenzen erneuern',
        description: 'Adobe Creative Cloud Lizenzen müssen für die Design-Abteilung erneuert werden',
        status: 'In Bearbeitung',
        priority: 3, // Hoch
        createdAt: '2023-12-03T09:15:00Z',
        dueDate: '2023-12-15T17:00:00Z',
        assignedTo: 'Lisa Müller',
        createdBy: 'Thomas Schmidt',
        category: 'Software'
      },
      {
        id: '3',
        title: 'Server-Backup überprüfen',
        description: 'Routineüberprüfung der Backup-Systeme und Wiederherstellungstests',
        status: 'Erledigt',
        priority: 3, // Hoch
        createdAt: '2023-11-25T14:00:00Z',
        dueDate: '2023-11-30T17:00:00Z',
        assignedTo: 'Thomas Schmidt',
        createdBy: 'Admin',
        category: 'Infrastruktur'
      },
      {
        id: '4',
        title: 'Druckerpatrone wechseln',
        description: 'Im Drucker HP LaserJet im Empfangsbereich muss die schwarze Patrone gewechselt werden',
        status: 'Offen',
        priority: 1, // Niedrig
        createdAt: '2023-12-04T10:45:00Z',
        dueDate: '2023-12-06T17:00:00Z',
        assignedTo: 'Lisa Müller',
        createdBy: 'Max Mustermann',
        category: 'Gerät'
      },
      {
        id: '5',
        title: 'Netzwerkprobleme im 2. OG untersuchen',
        description: 'Mehrere Mitarbeiter berichten von langsamen Verbindungen im 2. Stock',
        status: 'In Bearbeitung',
        priority: 2, // Mittel
        createdAt: '2023-12-02T13:20:00Z',
        dueDate: '2023-12-04T17:00:00Z',
        assignedTo: 'Thomas Schmidt',
        createdBy: 'Admin',
        category: 'Netzwerk'
      }
    ];

    return {
      data: mockTodos,
      pagination: {
        total: mockTodos.length,
        page: 1,
        limit: 10,
        pages: 1
      }
    };
  },

  getTodoById: (id: string | number) =>
    apiRequest<{ data: any }>(`/todos/${id}`),

  createTodo: (todoData: any) =>
    apiRequest<{ message: string; data: any }>('/todos', 'POST', todoData),

  updateTodo: (id: string | number, todoData: any) =>
    apiRequest<{ message: string; data: any }>(`/todos/${id}`, 'PUT', todoData),

  deleteTodo: (id: string | number) =>
    apiRequest<{ message: string }>(`/todos/${id}`, 'DELETE'),

  completeTodo: (id: string | number) =>
    apiRequest<{ message: string; data: any }>(`/todos/${id}/complete`, 'PATCH'),
};

// Inventar-Funktionen
export const inventoryApi = {
  getAllInventoryEntries: (params?: any) =>
    apiRequest<{ data: any[]; pagination?: any }>('/inventory' + (params ? `?${new URLSearchParams(params)}` : '')),

  getInventoryEntryById: (id: string | number) =>
    apiRequest<{ data: any }>(`/inventory/${id}`),

  createInventoryEntry: (entryData: any) =>
    apiRequest<{ message: string; data: any }>('/inventory', 'POST', entryData),

  updateInventoryEntry: (id: string | number, entryData: any) =>
    apiRequest<{ message: string; data: any }>(`/inventory/${id}`, 'PUT', entryData),

  deleteInventoryEntry: (id: string | number) =>
    apiRequest<{ message: string }>(`/inventory/${id}`, 'DELETE'),

  // Inventar-Sessions
  getAllInventorySessions: async (params?: any) => {
    // Simulierte Daten für das Frontend-Prototyping
    const mockSessions = [
      {
        id: "inv-1",
        title: "Jahresinventur 2025",
        startDate: "2025-01-15",
        endDate: "2025-01-20",
        location: "München",
        status: "Abgeschlossen",
        progress: 100,
        responsibleUser: "Max Mustermann",
        devicesTotal: 120,
        devicesChecked: 120,
        notes: "Alle Geräte wurden gefunden und überprüft."
      },
      {
        id: "inv-2",
        title: "Quartalscheck Q1",
        startDate: "2025-03-01",
        endDate: null,
        location: "Berlin",
        status: "Aktiv",
        progress: 68,
        responsibleUser: "Lisa Müller",
        devicesTotal: 75,
        devicesChecked: 51,
        notes: "Noch Geräte im 2. Stock ausstehend."
      },
      {
        id: "inv-3",
        title: "IT-Umzug Vorbereitung",
        startDate: "2025-04-15",
        endDate: null,
        location: "Hamburg",
        status: "Geplant",
        progress: 0,
        responsibleUser: "Thomas Schmidt",
        devicesTotal: 45,
        devicesChecked: 0,
        notes: "Vor Umzug alle Geräte erfassen."
      }
    ];

    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 500));

    return { data: mockSessions };
  },

  getInventorySession: async (sessionId: string) => {
    // Simulierte Daten für das Frontend-Prototyping
    const mockSession = {
      id: sessionId,
      name: sessionId === "inv-1" ? "Jahresinventur 2025" :
            sessionId === "inv-2" ? "Quartalscheck Q1" : "IT-Umzug Vorbereitung",
      description: "Routine-Überprüfung aller registrierten Geräte im System",
      location: sessionId === "inv-1" ? "München" :
               sessionId === "inv-2" ? "Berlin" : "Hamburg",
      status: sessionId === "inv-1" ? "Abgeschlossen" :
              sessionId === "inv-2" ? "Aktiv" : "Geplant",
      startDate: sessionId === "inv-1" ? "2025-01-15" :
                sessionId === "inv-2" ? "2025-03-01" : "2025-04-15",
      endDate: sessionId === "inv-1" ? "2025-01-20" : null,
      progress: sessionId === "inv-1" ? 100 :
               sessionId === "inv-2" ? 68 : 0,
      totalDevices: sessionId === "inv-1" ? 120 :
                   sessionId === "inv-2" ? 75 : 45,
      checkedDevices: sessionId === "inv-1" ? 120 :
                     sessionId === "inv-2" ? 51 : 0
    };

    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 300));

    return mockSession;
  },

  // Gerätestatus in Inventursitzung ändern
  checkDevice: async (sessionId: string, deviceId: string, scanData?: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      success: true,
      message: `Gerät ${deviceId} erfolgreich als überprüft markiert in Sitzung ${sessionId}`,
      data: {
        sessionId,
        deviceId,
        checkedAt: new Date().toISOString(),
        scanInfo: scanData || {}
      }
    };
  },

  createInventorySession: async (sessionData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 800));

    // Neuer Inventar-ID generieren
    const newId = `inv-${Date.now()}`;

    return {
      success: true,
      message: "Inventursitzung erfolgreich erstellt",
      data: {
        id: newId,
        ...sessionData,
        progress: 0,
        devicesChecked: 0,
        createdAt: new Date().toISOString()
      }
    };
  },

  updateInventorySession: async (sessionId: string, sessionData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      success: true,
      message: "Inventursitzung erfolgreich aktualisiert",
      data: {
        id: sessionId,
        ...sessionData,
        updatedAt: new Date().toISOString()
      }
    };
  },

  deleteInventorySession: async (sessionId: string) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: "Inventursitzung erfolgreich gelöscht"
    };
  },

  completeInventorySession: async (sessionId: string) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      success: true,
      message: "Inventursitzung erfolgreich abgeschlossen",
      data: {
        id: sessionId,
        status: "Abgeschlossen",
        endDate: new Date().toISOString().split('T')[0],
        progress: 100,
        updatedAt: new Date().toISOString()
      }
    };
  },

  forceCompleteInventorySession: async (sessionId: string) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      message: "Inventursitzung erzwungen abgeschlossen, trotz fehlender Geräte",
      data: {
        id: sessionId,
        status: "Abgeschlossen (erzwungen)",
        endDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString()
      }
    };
  }
};

// Ticket-Funktionen
export const ticketsApi = {
  getAllTickets: async (params?: any) => {
    // Mock-Daten für Tickets zurückgeben
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 300));

    const mockTickets = [
      {
        id: '1',
        title: 'Server reagiert nicht',
        description: 'Der Hauptserver im Serverraum antwortet nicht mehr auf Anfragen.',
        category: 'Hardware',
        priority: 3, // Hoch
        status: 'Offen',
        device: 'SRV001',
        createdBy: 'Max Mustermann',
        assignedTo: 'Thomas Schmidt',
        createdAt: '2023-11-25T14:00:00Z',
        updatedAt: '2023-11-25T14:00:00Z'
      },
      {
        id: '2',
        title: 'Benutzer kann sich nicht anmelden',
        description: 'Ein Benutzer in der Buchhaltung kann sich nicht am System anmelden, trotz korrektem Passwort.',
        category: 'Zugriffsrechte',
        priority: 2, // Mittel
        status: 'In Bearbeitung',
        device: '',
        createdBy: 'Lisa Müller',
        assignedTo: 'Max Mustermann',
        createdAt: '2023-11-28T09:15:00Z',
        updatedAt: '2023-11-28T10:30:00Z'
      },
      {
        id: '3',
        title: 'Neue Software benötigt',
        description: 'Für die Marketingabteilung wird Adobe Creative Cloud auf 3 Workstations benötigt.',
        category: 'Software',
        priority: 1, // Niedrig
        status: 'Warten auf Antwort',
        device: '',
        createdBy: 'Thomas Schmidt',
        assignedTo: 'Lisa Müller',
        createdAt: '2023-11-30T11:45:00Z',
        updatedAt: '2023-11-30T13:20:00Z'
      },
      {
        id: '4',
        title: 'Netzwerkdrucker funktioniert nicht',
        description: 'Der Netzwerkdrucker im 2. OG druckt keine Dokumente mehr aus.',
        category: 'Hardware',
        priority: 2, // Mittel
        status: 'Gelöst',
        device: 'PRN002',
        createdBy: 'Max Mustermann',
        assignedTo: 'Thomas Schmidt',
        createdAt: '2023-12-01T08:30:00Z',
        updatedAt: '2023-12-01T10:45:00Z'
      },
      {
        id: '5',
        title: 'VPN-Verbindung instabil',
        description: 'Mehrere Mitarbeiter berichten von Problemen mit der VPN-Verbindung im Homeoffice.',
        category: 'Netzwerk',
        priority: 3, // Hoch
        status: 'In Bearbeitung',
        device: '',
        createdBy: 'Lisa Müller',
        assignedTo: 'Max Mustermann',
        createdAt: '2023-12-02T13:20:00Z',
        updatedAt: '2023-12-02T14:30:00Z'
      }
    ];

    return {
      data: mockTickets,
      pagination: {
        total: mockTickets.length,
        page: 1,
        limit: 10,
        pages: 1
      }
    };
  },

  getTicketById: (id: string | number) =>
    apiRequest<{ data: any }>(`/tickets/${id}`),

  createTicket: (ticketData: any) =>
    apiRequest<{ message: string; data: any }>('/tickets', 'POST', ticketData),

  updateTicket: (id: string | number, ticketData: any) =>
    apiRequest<{ message: string; data: any }>(`/tickets/${id}`, 'PUT', ticketData),

  deleteTicket: (id: string | number) =>
    apiRequest<{ message: string }>(`/tickets/${id}`, 'DELETE'),

  // Ticket-Kommentare
  addTicketComment: (ticketId: string | number, commentData: any) =>
    apiRequest<{ message: string; data: any }>(`/tickets/${ticketId}/comments`, 'POST', commentData),

  deleteTicketComment: (commentId: string | number) =>
    apiRequest<{ message: string }>(`/tickets/comments/${commentId}`, 'DELETE'),

  // Ticket-Status ändern
  updateTicketStatus: (id: string | number, status: string) =>
    apiRequest<{ message: string; data: any }>(`/tickets/${id}/status`, 'PATCH', { status }),

  // Ticket-Zuweisung
  assignTicket: (id: string | number, userId?: string | number) =>
    apiRequest<{ message: string; data: any }>(`/tickets/${id}/assign`, 'PATCH', { user_id: userId }),
};

// Report-Funktionen
export const reportsApi = {
  getAllReports: () =>
    apiRequest<{ data: any[] }>('/reports'),

  generateInventoryReport: (params?: any) =>
    apiRequest<{ message: string; data: any }>('/reports/inventory' + (params ? `?${new URLSearchParams(params)}` : '')),

  generateLicenseReport: (params?: any) =>
    apiRequest<{ message: string; data: any }>('/reports/licenses' + (params ? `?${new URLSearchParams(params)}` : '')),

  generateCertificateReport: (params?: any) =>
    apiRequest<{ message: string; data: any }>('/reports/certificates' + (params ? `?${new URLSearchParams(params)}` : '')),

  generateTicketReport: (params?: any) =>
    apiRequest<{ message: string; data: any }>('/reports/tickets' + (params ? `?${new URLSearchParams(params)}` : '')),

  // Neue Funktionen für Reports-Komponente
  getDashboardData: async () => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock-Daten für das Dashboard
    const deviceStats = {
      total: 234,
      byStatus: [
        { name: 'In Betrieb', count: 175, percentage: 74.8, color: '#4caf50' },
        { name: 'Lagernd', count: 32, percentage: 13.7, color: '#2196f3' },
        { name: 'Defekt', count: 18, percentage: 7.7, color: '#f44336' },
        { name: 'In Reparatur', count: 9, percentage: 3.8, color: '#ff9800' }
      ],
      byCategory: [
        { name: 'Laptop', count: 95, percentage: 40.6, color: '#3f51b5' },
        { name: 'Desktop', count: 45, percentage: 19.2, color: '#9c27b0' },
        { name: 'Monitor', count: 52, percentage: 22.2, color: '#009688' },
        { name: 'Drucker', count: 22, percentage: 9.4, color: '#607d8b' },
        { name: 'Sonstiges', count: 20, percentage: 8.6, color: '#795548' }
      ],
      byLocation: [
        { name: 'München', count: 120, percentage: 51.3, color: '#e91e63' },
        { name: 'Berlin', count: 75, percentage: 32.1, color: '#673ab7' },
        { name: 'Hamburg', count: 39, percentage: 16.6, color: '#ff5722' }
      ]
    };

    const licenseStats = {
      total: 156,
      byStatus: [
        { name: 'Aktiv', count: 126, percentage: 80.8, color: '#4caf50' },
        { name: 'Abgelaufen', count: 18, percentage: 11.5, color: '#f44336' },
        { name: 'Bald ablaufend', count: 12, percentage: 7.7, color: '#ff9800' }
      ],
      byType: [
        { name: 'Office 365', count: 85, percentage: 54.5, color: '#2196f3' },
        { name: 'Adobe CC', count: 28, percentage: 17.9, color: '#9c27b0' },
        { name: 'Windows', count: 25, percentage: 16.0, color: '#00bcd4' },
        { name: 'Antivirus', count: 18, percentage: 11.6, color: '#8bc34a' }
      ]
    };

    const ticketStats = {
      total: 42,
      byStatus: [
        { name: 'Offen', count: 15, percentage: 35.7, color: '#f44336' },
        { name: 'In Bearbeitung', count: 18, percentage: 42.9, color: '#ff9800' },
        { name: 'Gelöst', count: 9, percentage: 21.4, color: '#4caf50' }
      ],
      byCategory: [
        { name: 'Hardware', count: 17, percentage: 40.5, color: '#3f51b5' },
        { name: 'Software', count: 13, percentage: 31.0, color: '#9c27b0' },
        { name: 'Netzwerk', count: 8, percentage: 19.0, color: '#00bcd4' },
        { name: 'Zugriffsrechte', count: 4, percentage: 9.5, color: '#ffc107' }
      ],
      byPriority: [
        { name: 'Hoch', count: 8, percentage: 19.0, color: '#f44336' },
        { name: 'Mittel', count: 22, percentage: 52.4, color: '#ff9800' },
        { name: 'Niedrig', count: 12, percentage: 28.6, color: '#4caf50' }
      ]
    };

    const monthlyTickets = [
      { month: 'Jan', count: 24 },
      { month: 'Feb', count: 19 },
      { month: 'Mär', count: 27 },
      { month: 'Apr', count: 23 },
      { month: 'Mai', count: 18 },
      { month: 'Jun', count: 16 },
      { month: 'Jul', count: 15 },
      { month: 'Aug', count: 12 },
      { month: 'Sep', count: 19 },
      { month: 'Okt', count: 26 },
      { month: 'Nov', count: 28 },
      { month: 'Dez', count: 20 }
    ];

    return {
      data: {
        deviceStats,
        licenseStats,
        ticketStats,
        monthlyTickets
      }
    };
  },

  getDeviceReport: async (params?: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 400));

    // Filtere Geräte je nach Zeitraum
    let deviceStats;

    if (params?.timeRange === 'week') {
      deviceStats = {
        total: 52,
        byStatus: [
          { name: 'In Betrieb', count: 38, percentage: 73.1, color: '#4caf50' },
          { name: 'Lagernd', count: 8, percentage: 15.4, color: '#2196f3' },
          { name: 'Defekt', count: 4, percentage: 7.7, color: '#f44336' },
          { name: 'In Reparatur', count: 2, percentage: 3.8, color: '#ff9800' }
        ],
        byCategory: [
          { name: 'Laptop', count: 22, percentage: 42.3, color: '#3f51b5' },
          { name: 'Desktop', count: 12, percentage: 23.1, color: '#9c27b0' },
          { name: 'Monitor', count: 10, percentage: 19.2, color: '#009688' },
          { name: 'Drucker', count: 5, percentage: 9.6, color: '#607d8b' },
          { name: 'Sonstiges', count: 3, percentage: 5.8, color: '#795548' }
        ],
        byLocation: [
          { name: 'München', count: 28, percentage: 53.8, color: '#e91e63' },
          { name: 'Berlin', count: 15, percentage: 28.9, color: '#673ab7' },
          { name: 'Hamburg', count: 9, percentage: 17.3, color: '#ff5722' }
        ]
      };
    } else if (params?.timeRange === 'year') {
      deviceStats = {
        total: 450,
        byStatus: [
          { name: 'In Betrieb', count: 328, percentage: 72.9, color: '#4caf50' },
          { name: 'Lagernd', count: 65, percentage: 14.4, color: '#2196f3' },
          { name: 'Defekt', count: 38, percentage: 8.4, color: '#f44336' },
          { name: 'In Reparatur', count: 19, percentage: 4.3, color: '#ff9800' }
        ],
        byCategory: [
          { name: 'Laptop', count: 185, percentage: 41.1, color: '#3f51b5' },
          { name: 'Desktop', count: 88, percentage: 19.6, color: '#9c27b0' },
          { name: 'Monitor', count: 102, percentage: 22.7, color: '#009688' },
          { name: 'Drucker', count: 40, percentage: 8.9, color: '#607d8b' },
          { name: 'Sonstiges', count: 35, percentage: 7.7, color: '#795548' }
        ],
        byLocation: [
          { name: 'München', count: 238, percentage: 52.9, color: '#e91e63' },
          { name: 'Berlin', count: 132, percentage: 29.3, color: '#673ab7' },
          { name: 'Hamburg', count: 80, percentage: 17.8, color: '#ff5722' }
        ],
        byDepartment: [
          { name: 'IT-Abteilung', count: 68, percentage: 29.1, color: '#00bcd4' },
          { name: 'Buchhaltung', count: 45, percentage: 19.2, color: '#cddc39' },
          { name: 'Marketing', count: 36, percentage: 15.4, color: '#ff9800' },
          { name: 'Personalabteilung', count: 28, percentage: 12.0, color: '#9c27b0' },
          { name: 'Vertrieb', count: 42, percentage: 17.9, color: '#8bc34a' },
          { name: 'Geschäftsleitung', count: 15, percentage: 6.4, color: '#f44336' }
        ]
      };
    } else {
      // Monatsdaten (Standard)
      deviceStats = {
        total: 234,
        byStatus: [
          { name: 'In Betrieb', count: 175, percentage: 74.8, color: '#4caf50' },
          { name: 'Lagernd', count: 32, percentage: 13.7, color: '#2196f3' },
          { name: 'Defekt', count: 18, percentage: 7.7, color: '#f44336' },
          { name: 'In Reparatur', count: 9, percentage: 3.8, color: '#ff9800' }
        ],
        byCategory: [
          { name: 'Laptop', count: 95, percentage: 40.6, color: '#3f51b5' },
          { name: 'Desktop', count: 45, percentage: 19.2, color: '#9c27b0' },
          { name: 'Monitor', count: 52, percentage: 22.2, color: '#009688' },
          { name: 'Drucker', count: 22, percentage: 9.4, color: '#607d8b' },
          { name: 'Sonstiges', count: 20, percentage: 8.6, color: '#795548' }
        ],
        byLocation: [
          { name: 'München', count: 120, percentage: 51.3, color: '#e91e63' },
          { name: 'Berlin', count: 75, percentage: 32.1, color: '#673ab7' },
          { name: 'Hamburg', count: 39, percentage: 16.6, color: '#ff5722' }
        ],
        byDepartment: [
          { name: 'IT-Abteilung', count: 68, percentage: 29.1, color: '#00bcd4' },
          { name: 'Buchhaltung', count: 45, percentage: 19.2, color: '#cddc39' },
          { name: 'Marketing', count: 36, percentage: 15.4, color: '#ff9800' },
          { name: 'Personalabteilung', count: 28, percentage: 12.0, color: '#9c27b0' },
          { name: 'Vertrieb', count: 42, percentage: 17.9, color: '#8bc34a' },
          { name: 'Geschäftsleitung', count: 15, percentage: 6.4, color: '#f44336' }
        ]
      };
    }

    return {
      data: [deviceStats]
    };
  },

  getLicenseReport: async (params?: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 400));

    // Standard-Lizenzstats zurückgeben, unabhängig vom Zeitraum (vereinfacht)
    const licenseStats = {
      total: 156,
      byStatus: [
        { name: 'Aktiv', count: 126, percentage: 80.8, color: '#4caf50' },
        { name: 'Abgelaufen', count: 18, percentage: 11.5, color: '#f44336' },
        { name: 'Bald ablaufend', count: 12, percentage: 7.7, color: '#ff9800' }
      ],
      byType: [
        { name: 'Office 365', count: 85, percentage: 54.5, color: '#2196f3' },
        { name: 'Adobe CC', count: 28, percentage: 17.9, color: '#9c27b0' },
        { name: 'Windows', count: 25, percentage: 16.0, color: '#00bcd4' },
        { name: 'Antivirus', count: 18, percentage: 11.6, color: '#8bc34a' }
      ]
    };

    return {
      data: [licenseStats]
    };
  },

  // Neue Funktion: Gerätedaten für einen bestimmten Standort abrufen
  getDevicesByLocation: async (locationId: string) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock-Standortnamen basierend auf ID
    let locationName = "Unbekannt";
    switch (locationId) {
      case "loc-1": locationName = "München Zentrale"; break;
      case "loc-2": locationName = "Berlin Büro"; break;
      case "loc-3": locationName = "Hamburg Niederlassung"; break;
      case "loc-4": locationName = "Frankfurt Office"; break;
      default: locationName = `Standort ${locationId}`;
    }

    // Je nach Standort-ID unterschiedliche Daten zurückgeben
    const totalDevices = locationId === "loc-1" ? 182 :
                        locationId === "loc-2" ? 94 :
                        locationId === "loc-3" ? 63 :
                        locationId === "loc-4" ? 41 :
                        Math.floor(Math.random() * 100) + 50;

    return {
      data: {
        location: locationName,
        locationId: locationId,
        totalDevices: totalDevices,
        devicesByCategory: [
          { name: "PC", count: Math.floor(totalDevices * 0.4), percentage: 40, color: "#1976d2" },
          { name: "Laptop", count: Math.floor(totalDevices * 0.3), percentage: 30, color: "#00bcd4" },
          { name: "Monitor", count: Math.floor(totalDevices * 0.15), percentage: 15, color: "#4caf50" },
          { name: "Drucker", count: Math.floor(totalDevices * 0.08), percentage: 8, color: "#ff9800" },
          { name: "Server", count: Math.floor(totalDevices * 0.05), percentage: 5, color: "#f44336" },
          { name: "Sonstige", count: totalDevices - Math.floor(totalDevices * 0.98), percentage: 2, color: "#9c27b0" }
        ]
      }
    };
  },

  // Neue Funktion: Gerätedaten für eine bestimmte Abteilung abrufen
  getDevicesByDepartment: async (departmentId: string) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock-Abteilungsnamen basierend auf ID
    let departmentName = "Unbekannt";
    switch (departmentId) {
      case "dep-1": departmentName = "IT-Abteilung"; break;
      case "dep-2": departmentName = "Finanzen"; break;
      case "dep-3": departmentName = "Marketing"; break;
      case "dep-4": departmentName = "Vertrieb"; break;
      case "dep-5": departmentName = "Personal"; break;
      default: departmentName = `Abteilung ${departmentId}`;
    }

    // Je nach Abteilungs-ID unterschiedliche Daten zurückgeben
    const totalDevices = departmentId === "dep-1" ? 127 :
                        departmentId === "dep-2" ? 68 :
                        departmentId === "dep-3" ? 42 :
                        departmentId === "dep-4" ? 89 :
                        departmentId === "dep-5" ? 33 :
                        Math.floor(Math.random() * 70) + 30;

    return {
      data: {
        department: departmentName,
        departmentId: departmentId,
        totalDevices: totalDevices,
        devicesByCategory: [
          { name: "PC", count: Math.floor(totalDevices * 0.35), percentage: 35, color: "#1976d2" },
          { name: "Laptop", count: Math.floor(totalDevices * 0.45), percentage: 45, color: "#00bcd4" },
          { name: "Monitor", count: Math.floor(totalDevices * 0.12), percentage: 12, color: "#4caf50" },
          { name: "Drucker", count: Math.floor(totalDevices * 0.05), percentage: 5, color: "#ff9800" },
          { name: "Sonstige", count: Math.floor(totalDevices * 0.03), percentage: 3, color: "#9c27b0" }
        ],
        deviceStatus: [
          { name: "In Betrieb", count: Math.floor(totalDevices * 0.85), percentage: 85, color: "#4caf50" },
          { name: "Lagernd", count: Math.floor(totalDevices * 0.10), percentage: 10, color: "#ff9800" },
          { name: "Defekt", count: Math.floor(totalDevices * 0.03), percentage: 3, color: "#f44336" },
          { name: "In Reparatur", count: Math.floor(totalDevices * 0.02), percentage: 2, color: "#9c27b0" }
        ]
      }
    };
  },

  // Neue Funktion: Liste aller Standorte und Abteilungen abrufen
  getLocationsAndDepartments: async () => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      data: {
        locations: [
          { id: "loc-1", name: "München Zentrale", count: 182 },
          { id: "loc-2", name: "Berlin Büro", count: 94 },
          { id: "loc-3", name: "Hamburg Niederlassung", count: 63 },
          { id: "loc-4", name: "Frankfurt Office", count: 41 }
        ],
        departments: [
          { id: "dep-1", name: "IT-Abteilung", count: 127 },
          { id: "dep-2", name: "Finanzen", count: 68 },
          { id: "dep-3", name: "Marketing", count: 42 },
          { id: "dep-4", name: "Vertrieb", count: 89 },
          { id: "dep-5", name: "Personal", count: 33 }
        ]
      }
    };
  },
};

// Einstellungs-Funktionen
export const settingsApi = {
  // Kategorien
  getAllCategories: async () => {
    // Simulierte Daten für das Frontend-Prototyping
    const mockCategories = [
      {
        id: 1,
        name: 'Hardware',
        description: 'Physische Geräte und Komponenten',
        type: 'device',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Software',
        description: 'Programme und Anwendungen',
        type: 'license',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Netzwerk',
        description: 'Netzwerkkomponenten und -geräte',
        type: 'device',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 4,
        name: 'Desktop-Computer',
        description: 'Stationäre PC-Systeme',
        type: 'device',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 5,
        name: 'Laptops',
        description: 'Mobile Computer',
        type: 'device',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 6,
        name: 'Betriebssysteme',
        description: 'Verschiedene Betriebssysteme',
        type: 'license',
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 300));

    return { data: mockCategories };
  },

  getCategoryById: async (id: string | number) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 200));

    const mockCategory = {
      id: Number(id),
      name: id === 1 ? "Hardware" :
            id === 2 ? "Software" :
            id === 3 ? "Netzwerk" :
            id === 4 ? "Desktop-Computer" :
            id === 5 ? "Laptops" : "Betriebssysteme",
      description: `Beschreibung für Kategorie ${id}`,
      type: Number(id) % 2 === 0 ? "license" : "device",
      isActive: Number(id) !== 6,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { data: mockCategory };
  },

  createCategory: async (categoryData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 500));

    const newCategory = {
      id: Math.floor(Math.random() * 1000) + 10,
      ...categoryData,
      type: categoryData.type || 'device',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      message: "Kategorie erfolgreich erstellt",
      data: newCategory
    };
  },

  updateCategory: async (id: string | number, categoryData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 400));

    const updatedCategory = {
      id: Number(id),
      ...categoryData,
      type: categoryData.type || 'device',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      message: "Kategorie erfolgreich aktualisiert",
      data: updatedCategory
    };
  },

  deleteCategory: async (id: string | number) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      message: "Kategorie erfolgreich gelöscht"
    };
  },

  // Standorte
  getAllLocations: async () => {
    // Simulierte Daten für das Frontend-Prototyping
    const mockLocations = [
      { id: 1, name: "München", address: "Hauptstraße 1, 80331 München" },
      { id: 2, name: "Berlin", address: "Unter den Linden 10, 10117 Berlin" },
      { id: 3, name: "Hamburg", address: "Hafenstraße 22, 20095 Hamburg" },
      { id: 4, name: "Frankfurt", address: "Mainzer Landstraße 50, 60325 Frankfurt" }
    ];

    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 300));

    return { data: mockLocations };
  },

  getLocation: async (id: number) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 200));

    const mockLocation = {
      id: id,
      name: id === 1 ? "München" :
            id === 2 ? "Berlin" :
            id === 3 ? "Hamburg" : "Frankfurt",
      address: id === 1 ? "Hauptstraße 1, 80331 München" :
               id === 2 ? "Unter den Linden 10, 10117 Berlin" :
               id === 3 ? "Hafenstraße 22, 20095 Hamburg" : "Mainzer Landstraße 50, 60325 Frankfurt",
      rooms: id === 1 ? 45 : id === 2 ? 32 : id === 3 ? 28 : 20,
      devices: id === 1 ? 120 : id === 2 ? 75 : id === 3 ? 42 : 35
    };

    return { data: mockLocation };
  },

  createLocation: async (locationData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulierte Rückgabe eines neu erstellten Standorts
    const newLocation = {
      id: Math.floor(Math.random() * 1000) + 10, // Zufällige ID für neuen Standort
      ...locationData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      message: "Standort erfolgreich erstellt",
      data: newLocation
    };
  },

  updateLocation: async (id: number, locationData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 400));

    // Simulierte Rückgabe des aktualisierten Standorts
    const updatedLocation = {
      id: id,
      ...locationData,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // Ein Tag zuvor
      updatedAt: new Date().toISOString()
    };

    return {
      message: "Standort erfolgreich aktualisiert",
      data: updatedLocation
    };
  },

  deleteLocation: async (id: number) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      message: "Standort erfolgreich gelöscht"
    };
  },

  // Lieferanten
  getAllSuppliers: async () => {
    // Simulierte Daten für das Frontend-Prototyping
    const mockSuppliers = [
      {
        id: 1,
        name: "IT-Großhandel GmbH",
        description: "IT-Großhändler für Hardware und Zubehör",
        website: "https://www.it-grosshandel.de",
        contactPerson: "Max Müller",
        contactEmail: "max.mueller@it-grosshandel.de",
        contactPhone: "+49 123 4567890",
        contractNumber: "V-2023-001",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: "Software Solutions AG",
        description: "Anbieter für Softwarelizenzen und Cloud-Services",
        isActive: true
      },
      {
        id: 3,
        name: "Netzwerktechnik GmbH",
        description: "Spezialist für Netzwerkkomponenten",
        isActive: true
      }
    ];

    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 400));

    return { data: mockSuppliers };
  },

  getSupplierById: async (id: number) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 200));

    const mockSupplier = {
      id: id,
      name: id === 1 ? "IT-Großhandel GmbH" : id === 2 ? "Software Solutions AG" : "Netzwerktechnik GmbH",
      description: "Beispielbeschreibung für Lieferant " + id,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { data: mockSupplier };
  },

  createSupplier: async (supplierData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 500));

    const newSupplier = {
      id: Math.floor(Math.random() * 1000) + 10,
      ...supplierData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      message: "Lieferant erfolgreich erstellt",
      data: newSupplier
    };
  },

  updateSupplier: async (id: number, supplierData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 400));

    const updatedSupplier = {
      id: id,
      ...supplierData,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      message: "Lieferant erfolgreich aktualisiert",
      data: updatedSupplier
    };
  },

  deleteSupplier: async (id: number) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      message: "Lieferant erfolgreich gelöscht"
    };
  },

  // Hersteller
  getAllManufacturers: async () => {
    // Simulierte Daten für das Frontend-Prototyping
    const mockManufacturers = [
      {
        id: 1,
        name: "Dell Technologies",
        description: "US-amerikanischer Hersteller von PCs, Servern und Speichersystemen",
        website: "https://www.dell.com",
        contactPerson: "Michael Dell",
        contactEmail: "contact@dell.com",
        contactPhone: "+1 800-624-9896",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      },
      {
        id: 2,
        name: "HP Inc.",
        description: "Hersteller von PCs, Druckern und anderen Peripheriegeräten",
        website: "https://www.hp.com",
        contactPerson: "Enrique Lores",
        contactEmail: "contact@hp.com",
        contactPhone: "+1 650-857-1501",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      },
      {
        id: 3,
        name: "Cisco Systems",
        description: "Hersteller von Netzwerkgeräten und -lösungen",
        website: "https://www.cisco.com",
        contactPerson: "Chuck Robbins",
        contactEmail: "contact@cisco.com",
        contactPhone: "+1 408-526-4000",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      }
    ];

    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 400));

    return { data: mockManufacturers };
  },

  getManufacturerById: async (id: number) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 200));

    const mockManufacturer = {
      id: id,
      name: id === 1 ? "Dell Technologies" : id === 2 ? "HP Inc." : "Cisco Systems",
      description: "Beispielbeschreibung für Hersteller " + id,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { data: mockManufacturer };
  },

  createManufacturer: async (manufacturerData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 500));

    const newManufacturer = {
      id: Math.floor(Math.random() * 1000) + 10,
      ...manufacturerData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      message: "Hersteller erfolgreich erstellt",
      data: newManufacturer
    };
  },

  updateManufacturer: async (id: number, manufacturerData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 400));

    const updatedManufacturer = {
      id: id,
      ...manufacturerData,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      message: "Hersteller erfolgreich aktualisiert",
      data: updatedManufacturer
    };
  },

  deleteManufacturer: async (id: number) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      message: "Hersteller erfolgreich gelöscht"
    };
  },

  // Switches
  getAllSwitches: async () => {
    // Simulierte Daten für das Frontend-Prototyping
    const mockSwitches = [
      {
        id: 1,
        name: "Core-Switch-01",
        description: "Primärer Core-Switch im Hauptrechenzentrum",
        ipAddress: "192.168.1.1",
        manufacturerId: 1,
        locationId: 1,
        isActive: true
      },
      {
        id: 2,
        name: "Edge-Switch-02",
        description: "Edge-Switch für Büroräume EG",
        ipAddress: "192.168.1.2",
        manufacturerId: 2,
        locationId: 1,
        isActive: true
      },
      {
        id: 3,
        name: "Access-Switch-03",
        description: "Access-Switch für Büroräume 1. OG",
        ipAddress: "192.168.1.3",
        manufacturerId: 3,
        locationId: 2,
        isActive: true
      }
    ];

    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 400));

    return { data: mockSwitches };
  },

  getSwitchById: async (id: number) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 200));

    const mockSwitch = {
      id: id,
      name: `Switch-${id}`,
      description: `Beschreibung für Switch ${id}`,
      ipAddress: `192.168.1.${id}`,
      manufacturerId: id % 3 + 1,
      locationId: id % 2 + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { data: mockSwitch };
  },

  createSwitch: async (switchData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 500));

    const newSwitch = {
      id: Math.floor(Math.random() * 1000) + 10,
      ...switchData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      message: "Switch erfolgreich erstellt",
      data: newSwitch
    };
  },

  updateSwitch: async (id: number, switchData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 400));

    const updatedSwitch = {
      id: id,
      ...switchData,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      message: "Switch erfolgreich aktualisiert",
      data: updatedSwitch
    };
  },

  deleteSwitch: async (id: number) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      message: "Switch erfolgreich gelöscht"
    };
  },

  // Netzwerkdosen
  getAllNetworkOutlets: async () => {
    // Simulierte Daten für das Frontend-Prototyping
    const mockNetworkOutlets = [
      {
        id: 1,
        name: "ND-101-01",
        description: "Netzwerkdose im Büro 101",
        locationId: 1,
        roomId: 1,
        isActive: true
      },
      {
        id: 2,
        name: "ND-102-01",
        description: "Netzwerkdose im Büro 102",
        locationId: 1,
        roomId: 2,
        isActive: true
      },
      {
        id: 3,
        name: "ND-201-01",
        description: "Netzwerkdose im Büro 201",
        locationId: 2,
        roomId: 3,
        isActive: true
      }
    ];

    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 400));

    return { data: mockNetworkOutlets };
  },

  getNetworkOutletById: async (id: number) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 200));

    const mockNetworkOutlet = {
      id: id,
      name: `ND-${id}`,
      description: `Netzwerkdose ${id}`,
      locationId: id % 2 + 1,
      roomId: id % 3 + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { data: mockNetworkOutlet };
  },

  createNetworkOutlet: async (outletData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 500));

    const newOutlet = {
      id: Math.floor(Math.random() * 1000) + 10,
      ...outletData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      message: "Netzwerkdose erfolgreich erstellt",
      data: newOutlet
    };
  },

  updateNetworkOutlet: async (id: number, outletData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 400));

    const updatedOutlet = {
      id: id,
      ...outletData,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      message: "Netzwerkdose erfolgreich aktualisiert",
      data: updatedOutlet
    };
  },

  deleteNetworkOutlet: async (id: number) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      message: "Netzwerkdose erfolgreich gelöscht"
    };
  },

  // Ports
  getAllPorts: async () => {
    // Simulierte Daten für das Frontend-Prototyping
    const mockPorts = [
      {
        id: 1,
        name: "Port-01",
        description: "Port 1 am Core-Switch",
        switchId: 1,
        networkOutletId: 1,
        isActive: true
      },
      {
        id: 2,
        name: "Port-02",
        description: "Port 2 am Core-Switch",
        switchId: 1,
        networkOutletId: 2,
        isActive: true
      },
      {
        id: 3,
        name: "Port-01",
        description: "Port 1 am Edge-Switch",
        switchId: 2,
        networkOutletId: 3,
        isActive: true
      }
    ];

    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 400));

    return { data: mockPorts };
  },

  getPortById: async (id: number) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 200));

    const mockPort = {
      id: id,
      name: `Port-${id}`,
      description: `Beschreibung für Port ${id}`,
      switchId: id % 3 + 1,
      networkOutletId: id % 3 + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { data: mockPort };
  },

  createPort: async (portData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 500));

    const newPort = {
      id: Math.floor(Math.random() * 1000) + 10,
      ...portData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      message: "Port erfolgreich erstellt",
      data: newPort
    };
  },

  updatePort: async (id: number, portData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 400));

    const updatedPort = {
      id: id,
      ...portData,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      message: "Port erfolgreich aktualisiert",
      data: updatedPort
    };
  },

  deletePort: async (id: number) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      message: "Port erfolgreich gelöscht"
    };
  },

  // Gerätemodelle
  getAllDeviceModels: async () => {
    // Simulierte Daten für das Frontend-Prototyping
    const mockDeviceModels = [
      {
        id: 1,
        name: "MacBook Pro 16\"",
        description: "Apple MacBook Pro mit 16\" Display",
        manufacturerId: 1,
        categoryId: 1,
        isActive: true
      },
      {
        id: 2,
        name: "Dell Latitude 7420",
        description: "Dell Business Laptop",
        manufacturerId: 2,
        categoryId: 1,
        isActive: true
      },
      {
        id: 3,
        name: "iPhone 14 Pro",
        description: "Apple Smartphone",
        manufacturerId: 1,
        categoryId: 2,
        isActive: true
      }
    ];

    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 400));

    return { data: mockDeviceModels };
  },

  getDeviceModelById: async (id: number) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 200));

    const mockDeviceModel = {
      id: id,
      name: id === 1 ? "MacBook Pro 16\"" : id === 2 ? "Dell Latitude 7420" : "iPhone 14 Pro",
      description: `Beschreibung für Gerätemodell ${id}`,
      manufacturerId: id % 2 + 1,
      categoryId: id % 2 + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { data: mockDeviceModel };
  },

  createDeviceModel: async (modelData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 500));

    const newModel = {
      id: Math.floor(Math.random() * 1000) + 10,
      ...modelData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      message: "Gerätemodell erfolgreich erstellt",
      data: newModel
    };
  },

  updateDeviceModel: async (id: number, modelData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 400));

    const updatedModel = {
      id: id,
      ...modelData,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      message: "Gerätemodell erfolgreich aktualisiert",
      data: updatedModel
    };
  },

  deleteDeviceModel: async (id: number) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      message: "Gerätemodell erfolgreich gelöscht"
    };
  },

  // Abteilungen
  getAllDepartments: async () => {
    // Simulierte Daten für das Frontend-Prototyping
    const mockDepartments = [
      {
        id: 1,
        name: 'IT-Abteilung',
        description: 'Zuständig für alle IT-Belange',
        locationId: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Buchhaltung',
        description: 'Finanzen und Controlling',
        locationId: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Marketing',
        description: 'Werbung und Öffentlichkeitsarbeit',
        locationId: 2,
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 4,
        name: 'Vertrieb',
        description: 'Kundenbetreuung und Verkauf',
        locationId: 2,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 5,
        name: 'Entwicklung',
        description: 'Softwareentwicklung',
        locationId: 3,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 300));

    return { data: mockDepartments };
  },

  getDepartmentById: async (id: string | number) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 200));

    const mockDepartment = {
      id: Number(id),
      name: id === 1 ? "IT-Abteilung" :
            id === 2 ? "Buchhaltung" :
            id === 3 ? "Marketing" :
            id === 4 ? "Vertrieb" : "Entwicklung",
      description: `Beschreibung für Abteilung ${id}`,
      locationId: Number(id) <= 2 ? 1 : Number(id) <= 4 ? 2 : 3,
      isActive: Number(id) !== 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { data: mockDepartment };
  },

  createDepartment: async (departmentData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 500));

    const newDepartment = {
      id: Math.floor(Math.random() * 1000) + 10,
      ...departmentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      message: "Abteilung erfolgreich erstellt",
      data: newDepartment
    };
  },

  updateDepartment: async (id: string | number, departmentData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 400));

    const updatedDepartment = {
      id: Number(id),
      ...departmentData,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      message: "Abteilung erfolgreich aktualisiert",
      data: updatedDepartment
    };
  },

  deleteDepartment: async (id: string | number) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      message: "Abteilung erfolgreich gelöscht"
    };
  },

  // Räume
  getAllRooms: () =>
    apiRequest<{ data: any[] }>('/settings/rooms'),

  getRoomById: (id: string | number) =>
    apiRequest<{ data: any }>(`/settings/rooms/${id}`),

  createRoom: (roomData: any) =>
    apiRequest<{ message: string; data: any }>('/settings/rooms', 'POST', roomData),

  updateRoom: (id: string | number, roomData: any) =>
    apiRequest<{ message: string; data: any }>(`/settings/rooms/${id}`, 'PUT', roomData),

  deleteRoom: (id: string | number) =>
    apiRequest<{ message: string }>(`/settings/rooms/${id}`, 'DELETE'),

  // Systemeinstellungen
  getSystemSettings: () =>
    apiRequest<{ data: any }>('/settings/system'),

  updateSystemSettings: (settingsData: any) =>
    apiRequest<{ message: string; data: any }>('/settings/system', 'PUT', settingsData),
};

// Übergabeprotokolle-Funktionen
export const handoverApi = {
  getAllHandoverProtocols: async () => {
    // Simulierte Daten für das Frontend-Prototyping
    const mockProtocols = [
      {
        id: "handover-1",
        deviceId: "device-123",
        deviceName: "MacBook Pro 16\"",
        deviceType: "Laptop",
        deviceSerialNumber: "MP16-2023-2847",
        deviceInventoryNumber: "INV-2023-0042",
        userId: "user-1",
        userName: "Max Mustermann",
        userDepartment: "IT-Abteilung",
        userEmail: "max.mustermann@firma.de",
        date: "2023-12-10",
        status: "Übergeben",
        notes: "Gerät wurde in einwandfreiem Zustand übergeben.",
        signatureUrl: "https://example.com/signatures/sign1.png",
        confirmedByUser: true,
        attachments: [
          { id: "att-1", name: "Übergabeformular.pdf", type: "application/pdf" }
        ],
        checklistItems: [
          { id: "check-1", text: "Gerät ist funktionsfähig", checked: true },
          { id: "check-2", text: "Ladekabel vorhanden", checked: true },
          { id: "check-3", text: "Keine sichtbaren Schäden", checked: true },
          { id: "check-4", text: "Zugangsdaten übergeben", checked: true }
        ]
      },
      {
        id: "handover-2",
        deviceId: "device-456",
        deviceName: "Dell XPS 15",
        deviceType: "Laptop",
        deviceSerialNumber: "DX15-2022-1139",
        deviceInventoryNumber: "INV-2022-0127",
        userId: "user-2",
        userName: "Lisa Müller",
        userDepartment: "Marketing",
        userEmail: "lisa.mueller@firma.de",
        date: "2024-01-15",
        status: "Entwurf",
        notes: "",
        confirmedByUser: false,
        attachments: [],
        checklistItems: [
          { id: "check-1", text: "Gerät ist funktionsfähig", checked: false },
          { id: "check-2", text: "Ladekabel vorhanden", checked: false }
        ]
      },
      {
        id: "handover-3",
        deviceId: "device-789",
        deviceName: "iPhone 14 Pro",
        deviceType: "Smartphone",
        deviceSerialNumber: "IP14-2023-7755",
        deviceInventoryNumber: "INV-2023-0199",
        userId: "user-3",
        userName: "Thomas Schmidt",
        userDepartment: "Vertrieb",
        userEmail: "thomas.schmidt@firma.de",
        date: "2024-02-20",
        status: "Rückgabe beantragt",
        notes: "Benutzer wechselt zum neuen iPhone 15.",
        confirmedByUser: true,
        signatureUrl: "https://example.com/signatures/sign3.png",
        attachments: [
          { id: "att-3", name: "Rückgabeantrag.pdf", type: "application/pdf" }
        ],
        checklistItems: [
          { id: "check-1", text: "Gerät ist funktionsfähig", checked: true },
          { id: "check-2", text: "Ladekabel vorhanden", checked: false },
          { id: "check-3", text: "Keine sichtbaren Schäden", checked: true }
        ]
      }
    ];

    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 500));

    return { data: mockProtocols };
  },

  getHandoverProtocolById: async (id: string | undefined) => {
    // Prüfen, ob eine ID übergeben wurde
    if (!id) {
      throw new Error("Keine Protokoll-ID angegeben");
    }

    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 300));

    // Standard-Checklisten-Items
    const standardChecklistItems = [
      { id: "check-1", text: "Gerät ist funktionsfähig", checked: true },
      { id: "check-2", text: "Ladekabel vorhanden", checked: true },
      { id: "check-3", text: "Keine sichtbaren Schäden", checked: true },
      { id: "check-4", text: "Zugangsdaten übergeben", checked: true }
    ];

    // Protokoll basierend auf ID generieren
    if (id === "handover-1") {
      return {
        id: "handover-1",
        deviceId: "device-123",
        deviceName: "MacBook Pro 16\"",
        deviceType: "Laptop",
        deviceSerialNumber: "MP16-2023-2847",
        deviceInventoryNumber: "INV-2023-0042",
        userId: "user-1",
        userName: "Max Mustermann",
        userDepartment: "IT-Abteilung",
        userEmail: "max.mustermann@firma.de",
        date: "2023-12-10",
        status: "Übergeben",
        transferType: "Übergabe",
        notes: "Gerät wurde in einwandfreiem Zustand übergeben.",
        signatureUrl: "https://example.com/signatures/sign1.png",
        confirmedByUser: true,
        location: "Hauptgebäude, 2. OG",
        attachments: [
          { id: "att-1", name: "Übergabeformular.pdf", type: "application/pdf" }
        ],
        checklistItems: standardChecklistItems
      };
    } else if (id === "handover-2") {
      return {
        id: "handover-2",
        deviceId: "device-456",
        deviceName: "Dell XPS 15",
        deviceType: "Laptop",
        deviceSerialNumber: "DX15-2022-1139",
        deviceInventoryNumber: "INV-2022-0127",
        userId: "user-2",
        userName: "Lisa Müller",
        userDepartment: "Marketing",
        userEmail: "lisa.mueller@firma.de",
        date: "2024-01-15",
        status: "Entwurf",
        transferType: "Übergabe",
        notes: "",
        confirmedByUser: false,
        location: "Niederlassung Nord, EG",
        attachments: [],
        checklistItems: standardChecklistItems.map(item => ({ ...item, checked: false }))
      };
    } else if (id === "handover-3") {
      return {
        id: "handover-3",
        deviceId: "device-789",
        deviceName: "iPhone 14 Pro",
        deviceType: "Smartphone",
        deviceSerialNumber: "IP14-2023-7755",
        deviceInventoryNumber: "INV-2023-0199",
        userId: "user-3",
        userName: "Thomas Schmidt",
        userDepartment: "Vertrieb",
        userEmail: "thomas.schmidt@firma.de",
        date: "2024-02-20",
        status: "Rückgabe beantragt",
        transferType: "Rückgabe",
        notes: "Benutzer wechselt zum neuen iPhone 15.",
        confirmedByUser: true,
        signatureUrl: "https://example.com/signatures/sign3.png",
        location: "Home Office",
        attachments: [
          { id: "att-3", name: "Rückgabeantrag.pdf", type: "application/pdf" }
        ],
        checklistItems: [
          { id: "check-1", text: "Gerät ist funktionsfähig", checked: true },
          { id: "check-2", text: "Ladekabel vorhanden", checked: false },
          { id: "check-3", text: "Keine sichtbaren Schäden", checked: true }
        ]
      };
    } else {
      // Allgemeiner Fehler bei nicht existierender ID
      throw new Error("Übergabeprotokoll nicht gefunden");
    }
  },

  createHandoverProtocol: async (protocolData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 800));

    // Neue Protokoll-ID generieren
    const newId = `handover-${Date.now()}`;

    return {
      success: true,
      message: "Übergabeprotokoll erfolgreich erstellt",
      data: {
        id: newId,
        ...protocolData,
        status: protocolData.status || 'Entwurf',
        createdAt: new Date().toISOString()
      }
    };
  },

  updateHandoverProtocol: async (id: string, protocolData: any) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      success: true,
      message: "Übergabeprotokoll erfolgreich aktualisiert",
      data: {
        id,
        ...protocolData,
        updatedAt: new Date().toISOString()
      }
    };
  },

  deleteHandoverProtocol: async (id: string) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: "Übergabeprotokoll erfolgreich gelöscht"
    };
  },

  addSignature: async (id: string, signatureData: string) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 700));

    return {
      success: true,
      message: "Unterschrift erfolgreich hinzugefügt",
      data: {
        id,
        signatureUrl: signatureData,
        confirmedByUser: true,
        updatedAt: new Date().toISOString()
      }
    };
  },

  generatePDF: async (id: string) => {
    // Verzögerung simulieren
    await new Promise(resolve => setTimeout(resolve, 1200));

    return {
      success: true,
      message: "PDF erfolgreich generiert",
      data: {
        id,
        pdfUrl: `https://example.com/handover/${id}.pdf`,
        generatedAt: new Date().toISOString()
      }
    };
  }
};

// Exportiere alle API-Funktionen
export default {
  auth: authApi,
  devices: devicesApi,
  licenses: licensesApi,
  certificates: certificatesApi,
  accessories: accessoriesApi,
  users: usersApi,
  todos: todosApi,
  inventory: inventoryApi,
  tickets: ticketsApi,
  reports: reportsApi,
  settings: settingsApi,
  handover: handoverApi,
};
