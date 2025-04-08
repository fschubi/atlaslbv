/**
 * JWT-Konfiguration für das ATLAS-System
 *
 * Diese Datei enthält die Konfiguration für die JWT-basierte Authentifizierung.
 * Die Werte sollten in der Produktionsumgebung über Umgebungsvariablen gesetzt werden.
 */

const dotenv = require('dotenv');

dotenv.config();

// JWT Secret Key aus Umgebungsvariablen oder Fallback für Entwicklung
const JWT_SECRET = process.env.JWT_SECRET || 'atlas-dev-secret-key';

// Token Ablaufzeiten
const JWT_EXPIRES_IN = '1d'; // 1 Tag
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7 Tage

// Cookie-Optionen
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Tage in Millisekunden
};

// Refresh-Cookie-Optionen
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Tage in Millisekunden
};

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  cookieOptions,
  refreshCookieOptions
};
