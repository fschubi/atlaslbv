import { useState, useCallback } from 'react';

// Typendefinitionen
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  originalError?: any;
}

export interface ErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: ApiError) => void;
  isRetryable?: (error: any) => boolean;
}

// Einfache handleApiError-Funktion für direkten Import
export default function handleApiError(error: any): string {
  // Wenn der Fehler bereits in unserem Format ist
  if (error && typeof error === 'object' && 'message' in error) {
    return error.message;
  }

  // Wenn es ein String ist
  if (typeof error === 'string') {
    return error;
  }

  // Wenn es ein Axios-ähnlicher Fehler ist
  if (error && error.response && error.response.data) {
    return error.response.data.message || 'Ein Serverfehler ist aufgetreten';
  }

  // Standard-Fehler
  return 'Ein unbekannter Fehler ist aufgetreten';
}

// Standard-Werte für Wiederholungsversuche
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 Sekunde

/**
 * Prüft, ob ein Fehler als temporär eingestuft werden kann und ein Wiederholungsversuch sinnvoll ist
 */
export const isRetryableError = (error: any): boolean => {
  // Netzwerkfehler sind in der Regel temporär
  if (error instanceof TypeError && error.message.includes('network')) {
    return true;
  }

  // CORS-Fehler sind in der Regel nicht temporär
  if (error instanceof DOMException && error.name === 'NetworkError') {
    return false;
  }

  // Serverseitige Fehler (5xx) sind potenziell temporär
  if (error.status && error.status >= 500 && error.status < 600) {
    return true;
  }

  // Rate limiting (429) ist temporär
  if (error.status === 429) {
    return true;
  }

  // Alle anderen Fehler werden als nicht temporär eingestuft
  return false;
};

/**
 * Parst eine Fehlerantwort vom API-Server und extrahiert relevante Informationen
 */
export const parseApiError = (error: any): ApiError => {
  let apiError: ApiError = {
    message: 'Ein unbekannter Fehler ist aufgetreten',
    originalError: error
  };

  // Wenn der Fehler bereits ein ApiError ist, geben wir ihn direkt zurück
  if (error && error.message && error.code) {
    return error as ApiError;
  }

  try {
    // Fall 1: Fehler vom Fetch-API mit einer JSON-Antwort
    if (error.json && typeof error.json === 'function') {
      const errorData = error.json();
      if (errorData && errorData.message) {
        apiError.message = errorData.message;
        apiError.code = errorData.code || 'API_ERROR';
        apiError.details = errorData.details || null;
      }
    }
    // Fall 2: Fehler als Objekt mit einem 'response' Feld (axios-ähnlich)
    else if (error.response && error.response.data) {
      const { data } = error.response;
      apiError.message = data.message || 'Serverfehler';
      apiError.code = data.code || `HTTP_${error.response.status}`;
      apiError.details = data.details || null;
    }
    // Fall 3: Einfache Error-Instanz mit einer Nachricht
    else if (error instanceof Error) {
      apiError.message = error.message;
      apiError.code = 'JS_ERROR';
    }
    // Fall 4: Unbekannter Fehlertyp
    else if (typeof error === 'string') {
      apiError.message = error;
      apiError.code = 'UNKNOWN';
    }
  } catch (parseError) {
    // Fehler beim Parsen des Fehlers, Standard-Fehlerobjekt zurückgeben
    console.error('Fehler beim Parsen des API-Fehlers:', parseError);
  }

  return apiError;
};

/**
 * Hilfsfunktion, um einen Fehler benutzerfreundlich darzustellen
 */
export const getUserFriendlyErrorMessage = (error: ApiError): string => {
  // Vordefinierte benutzerfreundliche Nachrichten für bekannte Fehlercodes
  const errorMessages: Record<string, string> = {
    'UNAUTHORIZED': 'Zugriff verweigert. Bitte melden Sie sich erneut an.',
    'FORBIDDEN': 'Sie haben keine Berechtigung für diese Aktion.',
    'NOT_FOUND': 'Die angeforderte Ressource wurde nicht gefunden.',
    'VALIDATION_ERROR': 'Die übermittelten Daten sind ungültig.',
    'NETWORK_ERROR': 'Verbindungsprobleme. Bitte überprüfen Sie Ihre Internetverbindung.',
    'SERVER_ERROR': 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
    'TIMEOUT': 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es später erneut.',
    'RATE_LIMIT': 'Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.',
    'DUPLICATE_ENTRY': 'Ein Eintrag mit diesen Daten existiert bereits.'
  };

  // Wenn ein bekannter Fehlercode vorliegt, verwenden wir die vordefinierte Nachricht
  if (error.code && errorMessages[error.code]) {
    return errorMessages[error.code];
  }

  // HTTP-Statuscodes als Fehlercode
  if (error.code && error.code.startsWith('HTTP_')) {
    const statusCode = error.code.split('_')[1];
    switch (statusCode) {
      case '400': return 'Ungültige Anfrage. Bitte überprüfen Sie Ihre Eingaben.';
      case '401': return 'Zugriff verweigert. Bitte melden Sie sich erneut an.';
      case '403': return 'Sie haben keine Berechtigung für diese Aktion.';
      case '404': return 'Die angeforderte Ressource wurde nicht gefunden.';
      case '422': return 'Die übermittelten Daten sind ungültig.';
      case '429': return 'Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.';
      case '500': return 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
      case '502':
      case '503':
      case '504': return 'Der Server ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.';
      default: return `Ein Fehler ist aufgetreten (Code ${statusCode}).`;
    }
  }

  // Fallback: Die originale Fehlermeldung zurückgeben
  return error.message;
};

/**
 * Ein Hook für die API-Fehlerbehandlung mit Wiederholungsversuchen
 */
export const useApiErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    onError,
    isRetryable = isRetryableError
  } = options;

  // Zustand für die aktuellen Fehler
  const [error, setError] = useState<ApiError | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [isResolving, setIsResolving] = useState<boolean>(false);

  /**
   * Fehlerbehandlungsfunktion mit Wiederholungsversuchen
   */
  const handleApiError = useCallback(async (
    error: any,
    operation: () => Promise<any>,
    currentAttempt: number = 1
  ): Promise<any> => {
    const apiError = parseApiError(error);

    // Wenn Wiederholungsversuche aktiviert sind und der Fehler als temporär eingestuft wird
    if (currentAttempt <= maxRetries && isRetryable(error)) {
      setIsResolving(true);

      // Exponentielles Backoff für Wiederholungsversuche
      const delay = retryDelay * Math.pow(2, currentAttempt - 1);
      console.info(`Wiederholungsversuch ${currentAttempt}/${maxRetries} in ${delay}ms...`);

      // Nach der Verzögerung einen neuen Versuch starten
      return new Promise(resolve => {
        setTimeout(async () => {
          try {
            const result = await operation();
            setIsResolving(false);
            setError(null);
            setErrorDetails(null);
            resolve(result);
          } catch (retryError) {
            // Rekursiver Aufruf für den nächsten Wiederholungsversuch
            resolve(handleApiError(retryError, operation, currentAttempt + 1));
          }
        }, delay);
      });
    }

    // Wenn keine weiteren Wiederholungsversuche möglich sind oder der Fehler nicht temporär ist
    setIsResolving(false);
    setError(apiError);
    setErrorDetails(apiError.details || null);

    // Optional: Callback für die Fehlerbehandlung auf höherer Ebene
    if (onError) {
      onError(apiError);
    }

    // Fehler weiterwerfen für die weitere Behandlung
    throw apiError;
  }, [maxRetries, retryDelay, isRetryable, onError]);

  /**
   * Funktion zum Ausführen einer Operation mit automatischer Fehlerbehandlung
   */
  const withErrorHandling = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      return handleApiError(error, operation) as Promise<T>;
    }
  }, [handleApiError]);

  /**
   * Fehlerbehandlung zurücksetzen
   */
  const resetError = useCallback(() => {
    setError(null);
    setErrorDetails(null);
    setIsResolving(false);
  }, []);

  return {
    error,
    errorDetails,
    isResolving,
    handleApiError,
    withErrorHandling,
    resetError,
    getUserFriendlyErrorMessage: (err: ApiError = error!) => getUserFriendlyErrorMessage(err)
  };
};
