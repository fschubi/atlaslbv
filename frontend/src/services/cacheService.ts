import { useCache } from '../hooks/useCache';

// Cache-Schlüssel-Präfixe
export const CACHE_KEYS = {
  DEVICES: 'devices',
  DEVICE_DETAILS: 'device_details',
  LICENSES: 'licenses',
  LICENSE_DETAILS: 'license_details',
  CERTIFICATES: 'certificates',
  CERTIFICATE_DETAILS: 'certificate_details',
  ACCESSORIES: 'accessories',
  ACCESSORY_DETAILS: 'accessory_details',
  USERS: 'users',
  SETTINGS: 'settings',
  LOCATIONS: 'locations',
  ROOMS: 'rooms',
  DEPARTMENTS: 'departments'
};

// Cache-TTL-Konfigurationen (Time to Live)
export const CACHE_TTL = {
  // Dynamische Daten (5 Minuten)
  DYNAMIC: 5 * 60 * 1000,
  // Statischere Daten (30 Minuten)
  STATIC: 30 * 60 * 1000,
  // Sehr statische Referenzdaten (2 Stunden)
  REFERENCE: 2 * 60 * 60 * 1000
};

/**
 * Zentrale Caching-Service für die ATLAS-Anwendung
 * Verwendet die PostgreSQL-Datenbank als Datenquelle
 */
export const useCacheService = () => {
  // Dynamischer Cache für häufig ändernde Daten (z.B. Geräte, Lizenzen)
  const dynamicCache = useCache({
    ttl: CACHE_TTL.DYNAMIC,
    maxEntries: 200,
    storageKey: 'atlas_dynamic_cache'
  });

  // Statischer Cache für selten ändernde Daten (z.B. Einstellungen, Benutzer)
  const staticCache = useCache({
    ttl: CACHE_TTL.STATIC,
    maxEntries: 100,
    storageKey: 'atlas_static_cache'
  });

  // Referenz-Cache für sehr statische Daten (z.B. Standorte, Räume)
  const referenceCache = useCache({
    ttl: CACHE_TTL.REFERENCE,
    maxEntries: 50,
    storageKey: 'atlas_reference_cache'
  });

  /**
   * Erzeugt einen vollständigen Cache-Schlüssel aus Präfix und ID oder anderen Parametern
   */
  const createCacheKey = (prefix: string, id?: string | null, params?: Record<string, any>): string => {
    let key = prefix;

    if (id) {
      key += `:${id}`;
    }

    if (params) {
      const paramString = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join('&');

      if (paramString) {
        key += `:${paramString}`;
      }
    }

    return key;
  };

  /**
   * Geräte-spezifische Cache-Funktionen
   */
  const devices = {
    /**
     * Führt eine Funktion aus, die alle Geräte abruft, mit Caching
     */
    getAll: async <T>(fn: () => Promise<T>, params?: Record<string, any>): Promise<T> => {
      const cacheKey = createCacheKey(CACHE_KEYS.DEVICES, null, params);
      return dynamicCache.withCache<T>(cacheKey, fn);
    },

    /**
     * Führt eine Funktion aus, die ein einzelnes Gerät abruft, mit Caching
     */
    getById: async <T>(id: string, fn: () => Promise<T>): Promise<T> => {
      const cacheKey = createCacheKey(CACHE_KEYS.DEVICE_DETAILS, id);
      return dynamicCache.withCache<T>(cacheKey, fn);
    },

    /**
     * Invalidiert alle Geräte-bezogenen Cache-Einträge
     */
    invalidateAll: (): void => {
      dynamicCache.invalidateByPrefix(CACHE_KEYS.DEVICES);
      dynamicCache.invalidateByPrefix(CACHE_KEYS.DEVICE_DETAILS);
    },

    /**
     * Invalidiert den Cache für ein bestimmtes Gerät
     */
    invalidateById: (id: string): void => {
      dynamicCache.invalidateByPrefix(`${CACHE_KEYS.DEVICE_DETAILS}:${id}`);
      // Auch die Gesamtliste invalidieren, da sie möglicherweise das geänderte Gerät enthält
      dynamicCache.invalidateByPrefix(CACHE_KEYS.DEVICES);
    }
  };

  /**
   * Lizenz-spezifische Cache-Funktionen
   */
  const licenses = {
    getAll: async <T>(fn: () => Promise<T>, params?: Record<string, any>): Promise<T> => {
      const cacheKey = createCacheKey(CACHE_KEYS.LICENSES, null, params);
      return dynamicCache.withCache<T>(cacheKey, fn);
    },

    getById: async <T>(id: string, fn: () => Promise<T>): Promise<T> => {
      const cacheKey = createCacheKey(CACHE_KEYS.LICENSE_DETAILS, id);
      return dynamicCache.withCache<T>(cacheKey, fn);
    },

    invalidateAll: (): void => {
      dynamicCache.invalidateByPrefix(CACHE_KEYS.LICENSES);
      dynamicCache.invalidateByPrefix(CACHE_KEYS.LICENSE_DETAILS);
    },

    invalidateById: (id: string): void => {
      dynamicCache.invalidateByPrefix(`${CACHE_KEYS.LICENSE_DETAILS}:${id}`);
      dynamicCache.invalidateByPrefix(CACHE_KEYS.LICENSES);
    }
  };

  /**
   * Zertifikat-spezifische Cache-Funktionen
   */
  const certificates = {
    getAll: async <T>(fn: () => Promise<T>, params?: Record<string, any>): Promise<T> => {
      const cacheKey = createCacheKey(CACHE_KEYS.CERTIFICATES, null, params);
      return dynamicCache.withCache<T>(cacheKey, fn);
    },

    getById: async <T>(id: string, fn: () => Promise<T>): Promise<T> => {
      const cacheKey = createCacheKey(CACHE_KEYS.CERTIFICATE_DETAILS, id);
      return dynamicCache.withCache<T>(cacheKey, fn);
    },

    invalidateAll: (): void => {
      dynamicCache.invalidateByPrefix(CACHE_KEYS.CERTIFICATES);
      dynamicCache.invalidateByPrefix(CACHE_KEYS.CERTIFICATE_DETAILS);
    },

    invalidateById: (id: string): void => {
      dynamicCache.invalidateByPrefix(`${CACHE_KEYS.CERTIFICATE_DETAILS}:${id}`);
      dynamicCache.invalidateByPrefix(CACHE_KEYS.CERTIFICATES);
    }
  };

  /**
   * Zubehör-spezifische Cache-Funktionen
   */
  const accessories = {
    getAll: async <T>(fn: () => Promise<T>, params?: Record<string, any>): Promise<T> => {
      const cacheKey = createCacheKey(CACHE_KEYS.ACCESSORIES, null, params);
      return dynamicCache.withCache<T>(cacheKey, fn);
    },

    getById: async <T>(id: string, fn: () => Promise<T>): Promise<T> => {
      const cacheKey = createCacheKey(CACHE_KEYS.ACCESSORY_DETAILS, id);
      return dynamicCache.withCache<T>(cacheKey, fn);
    },

    invalidateAll: (): void => {
      dynamicCache.invalidateByPrefix(CACHE_KEYS.ACCESSORIES);
      dynamicCache.invalidateByPrefix(CACHE_KEYS.ACCESSORY_DETAILS);
    },

    invalidateById: (id: string): void => {
      dynamicCache.invalidateByPrefix(`${CACHE_KEYS.ACCESSORY_DETAILS}:${id}`);
      dynamicCache.invalidateByPrefix(CACHE_KEYS.ACCESSORIES);
    }
  };

  /**
   * Referenzdaten-spezifische Cache-Funktionen
   */
  const references = {
    /**
     * Führt eine Funktion aus, die Standorte abruft, mit Caching
     */
    getLocations: async <T>(fn: () => Promise<T>): Promise<T> => {
      return referenceCache.withCache<T>(CACHE_KEYS.LOCATIONS, fn);
    },

    /**
     * Führt eine Funktion aus, die Räume abruft, mit Caching
     */
    getRooms: async <T>(fn: () => Promise<T>, locationId?: string): Promise<T> => {
      const cacheKey = createCacheKey(CACHE_KEYS.ROOMS, locationId);
      return referenceCache.withCache<T>(cacheKey, fn);
    },

    /**
     * Führt eine Funktion aus, die Abteilungen abruft, mit Caching
     */
    getDepartments: async <T>(fn: () => Promise<T>): Promise<T> => {
      return referenceCache.withCache<T>(CACHE_KEYS.DEPARTMENTS, fn);
    },

    /**
     * Führt eine Funktion aus, die Benutzer abruft, mit Caching
     */
    getUsers: async <T>(fn: () => Promise<T>): Promise<T> => {
      return staticCache.withCache<T>(CACHE_KEYS.USERS, fn);
    },

    /**
     * Invalidiert alle Referenzdaten im Cache
     */
    invalidateAll: (): void => {
      referenceCache.invalidateByPrefix(CACHE_KEYS.LOCATIONS);
      referenceCache.invalidateByPrefix(CACHE_KEYS.ROOMS);
      referenceCache.invalidateByPrefix(CACHE_KEYS.DEPARTMENTS);
      staticCache.invalidateByPrefix(CACHE_KEYS.USERS);
    }
  };

  /**
   * Globale Cache-Operationen
   */
  const global = {
    // Alle Caches komplett leeren
    clearAll: (): void => {
      dynamicCache.clear();
      staticCache.clear();
      referenceCache.clear();
    },

    // Cache-Statistiken abrufen
    getStats: () => ({
      dynamic: dynamicCache.cacheSize,
      static: staticCache.cacheSize,
      reference: referenceCache.cacheSize,
      total: dynamicCache.cacheSize + staticCache.cacheSize + referenceCache.cacheSize
    })
  };

  return {
    devices,
    licenses,
    certificates,
    accessories,
    references,
    global,
    // Rohe Cache-Instanzen für fortgeschrittene Anwendungsfälle
    raw: {
      dynamic: dynamicCache,
      static: staticCache,
      reference: referenceCache
    }
  };
};

export default useCacheService;
