import { useState, useEffect, useCallback } from 'react';

// Definition der Cache-Eintrags-Struktur
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

// Cache-Konfigurationsoptionen
interface CacheOptions {
  // Gültigkeitsdauer in Millisekunden (Standard: 5 Minuten)
  ttl?: number;
  // Maximale Anzahl von Einträgen im Cache (Standard: 100)
  maxEntries?: number;
  // Speicherort im localStorage (Standard: 'atlas_cache')
  storageKey?: string;
  // Ob der Cache bei Browser-Aktualisierung persistiert werden soll
  persist?: boolean;
}

// Standardwerte für Cache-Optionen
const DEFAULT_TTL = 5 * 60 * 1000; // 5 Minuten
const DEFAULT_MAX_ENTRIES = 100;
const DEFAULT_STORAGE_KEY = 'atlas_cache';

/**
 * Hook für ein einfaches, aber effektives Cache-System
 * Unterstützt TTL (Time to Live), Persistenz und automatisches Invalidieren
 */
export const useCache = (options: CacheOptions = {}) => {
  const {
    ttl = DEFAULT_TTL,
    maxEntries = DEFAULT_MAX_ENTRIES,
    storageKey = DEFAULT_STORAGE_KEY,
    persist = true
  } = options;

  // In-Memory-Cache
  const [cache, setCache] = useState<Record<string, CacheEntry<any>>>({});
  // Flag für initialen Ladevorgang aus dem localStorage
  const [initialized, setInitialized] = useState(false);

  // Beim ersten Rendern den Cache aus dem localStorage laden, falls aktiviert
  useEffect(() => {
    if (persist && !initialized) {
      try {
        const storedCache = localStorage.getItem(storageKey);
        if (storedCache) {
          const parsedCache = JSON.parse(storedCache);
          // Abgelaufene Einträge beim Laden direkt entfernen
          const now = Date.now();
          const validEntries = Object.entries(parsedCache).reduce(
            (acc, [key, entry]) => {
              const typedEntry = entry as CacheEntry<any>;
              if (now - typedEntry.timestamp < ttl) {
                acc[key] = typedEntry;
              }
              return acc;
            },
            {} as Record<string, CacheEntry<any>>
          );
          setCache(validEntries);
        }
      } catch (error) {
        console.error('Fehler beim Laden des Caches aus dem localStorage:', error);
        // Bei Fehlern Cache zurücksetzen
        localStorage.removeItem(storageKey);
      }
      setInitialized(true);
    }
  }, [persist, storageKey, ttl, initialized]);

  // Änderungen am Cache im localStorage speichern
  useEffect(() => {
    if (persist && initialized && Object.keys(cache).length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(cache));
      } catch (error) {
        console.error('Fehler beim Speichern des Caches im localStorage:', error);
      }
    }
  }, [cache, persist, storageKey, initialized]);

  /**
   * Prüft, ob ein Cache-Eintrag existiert und noch gültig ist
   */
  const isValid = useCallback(
    (key: string): boolean => {
      const entry = cache[key];
      if (!entry) return false;

      const now = Date.now();
      return now - entry.timestamp < ttl;
    },
    [cache, ttl]
  );

  /**
   * Fügt einen Eintrag zum Cache hinzu
   */
  const set = useCallback(
    <T>(key: string, data: T): void => {
      setCache((prevCache) => {
        // Cache bereinigen, wenn die maximale Größe erreicht ist
        let newCache = { ...prevCache };
        const cacheKeys = Object.keys(newCache);

        if (cacheKeys.length >= maxEntries) {
          // Die ältesten Einträge entfernen (LRU-Strategie)
          const sortedEntries = cacheKeys
            .map((k) => ({ key: k, timestamp: newCache[k].timestamp }))
            .sort((a, b) => a.timestamp - b.timestamp);

          // 20% der ältesten Einträge entfernen
          const entriesToRemove = Math.max(1, Math.floor(maxEntries * 0.2));
          for (let i = 0; i < entriesToRemove; i++) {
            if (sortedEntries[i]) {
              delete newCache[sortedEntries[i].key];
            }
          }
        }

        // Neuen Eintrag hinzufügen
        return {
          ...newCache,
          [key]: {
            data,
            timestamp: Date.now(),
            key
          }
        };
      });
    },
    [maxEntries]
  );

  /**
   * Ruft einen Eintrag aus dem Cache ab
   */
  const get = useCallback(
    <T>(key: string): T | null => {
      if (!isValid(key)) {
        return null;
      }
      return cache[key].data as T;
    },
    [cache, isValid]
  );

  /**
   * Entfernt einen Eintrag aus dem Cache
   */
  const remove = useCallback((key: string): void => {
    setCache((prevCache) => {
      const newCache = { ...prevCache };
      delete newCache[key];
      return newCache;
    });
  }, []);

  /**
   * Leert den gesamten Cache
   */
  const clear = useCallback((): void => {
    setCache({});
    if (persist) {
      localStorage.removeItem(storageKey);
    }
  }, [persist, storageKey]);

  /**
   * Entfernt alle abgelaufenen Einträge aus dem Cache
   */
  const cleanup = useCallback((): void => {
    const now = Date.now();
    setCache((prevCache) => {
      const newCache = { ...prevCache };
      Object.keys(newCache).forEach((key) => {
        if (now - newCache[key].timestamp >= ttl) {
          delete newCache[key];
        }
      });
      return newCache;
    });
  }, [ttl]);

  /**
   * Führt eine Funktion aus und speichert das Ergebnis im Cache,
   * wenn der Wert nicht bereits im Cache existiert oder abgelaufen ist
   */
  const withCache = useCallback(
    async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
      // Prüfen, ob der Wert bereits im Cache existiert und gültig ist
      const cachedValue = get<T>(key);
      if (cachedValue !== null) {
        return cachedValue;
      }

      // Wert nicht im Cache oder abgelaufen, Funktion ausführen
      try {
        const result = await fn();
        set<T>(key, result);
        return result;
      } catch (error) {
        // Bei Fehlern den Fehler weiterwerfen
        throw error;
      }
    },
    [get, set]
  );

  /**
   * Überwacht Änderungen an einem bestimmten Cache-Bereich und invalidiert alle damit verbundenen Einträge
   */
  const invalidateByPrefix = useCallback(
    (prefix: string): void => {
      setCache((prevCache) => {
        const newCache = { ...prevCache };
        Object.keys(newCache).forEach((key) => {
          if (key.startsWith(prefix)) {
            delete newCache[key];
          }
        });
        return newCache;
      });
    },
    []
  );

  // Automatische regelmäßige Cache-Bereinigung
  useEffect(() => {
    const cleanupInterval = setInterval(cleanup, ttl / 2);
    return () => clearInterval(cleanupInterval);
  }, [cleanup, ttl]);

  return {
    get,
    set,
    remove,
    clear,
    cleanup,
    withCache,
    invalidateByPrefix,
    isValid,
    cacheSize: Object.keys(cache).length
  };
};

export default useCache;
