# ATLAS - Advanced Tracking and Logistics Asset System

ATLAS ist ein modernes Asset-Management-System für die Verwaltung von Geräten, Lizenzen, Zertifikaten und Zubehör.

## Technologien

### Frontend
- React mit Vite
- Material-UI (MUI)
- TypeScript
- React Router
- Axios

### Backend
- Node.js mit Express
- PostgreSQL
- JWT für Authentifizierung
- Express Validator
- Morgan für Logging
- Helmet für Sicherheit

## Installation

### Voraussetzungen
- Node.js (v18 oder höher)
- PostgreSQL (v14 oder höher)
- npm oder yarn

### Backend einrichten

1. Ins Backend-Verzeichnis wechseln:
```bash
cd backend
```

2. Abhängigkeiten installieren:
```bash
npm install
```

3. Umgebungsvariablen konfigurieren:
```bash
cp .env.example .env
```
Dann die Werte in der .env-Datei anpassen.

4. Datenbank einrichten:
```bash
# PostgreSQL-Datenbank erstellen
createdb atlas

# SQL-Skripte ausführen
psql -d atlas -f sql/create_tables.sql
psql -d atlas -f sql/seed_data.sql
```

5. Server starten:
```bash
npm run dev
```

### Frontend einrichten

1. Ins Frontend-Verzeichnis wechseln:
```bash
cd frontend
```

2. Abhängigkeiten installieren:
```bash
npm install
```

3. Entwicklungsserver starten:
```bash
npm run dev
```

## Funktionen

- Benutzerauthentifizierung und -autorisierung
- Geräteverwaltung
- Lizenzverwaltung
- Zertifikatsverwaltung
- Zubehörverwaltung
- Inventurverwaltung
- Aufgabenverwaltung
- Ticket-System
- Berichtswesen
- Dokumentenverwaltung

## Entwicklung

### Code-Stil
- ESLint für JavaScript/TypeScript
- Prettier für Code-Formatierung
- MUI-Komponenten für UI
- Dark Theme als Standard

### Ordnerstruktur

#### Frontend
```
frontend/
├── src/
│   ├── components/     # Wiederverwendbare UI-Komponenten
│   ├── pages/         # Seitenkomponenten
│   ├── layout/        # Layout-Komponenten
│   ├── context/       # React Context
│   ├── hooks/         # Custom Hooks
│   ├── utils/         # Hilfsfunktionen
│   └── theme/         # MUI Theme
```

#### Backend
```
backend/
├── routes/           # API-Routen
├── controllers/      # Route-Controller
├── models/          # Datenbankmodelle
├── middleware/      # Express-Middleware
├── utils/           # Hilfsfunktionen
├── config/          # Konfiguration
└── sql/            # SQL-Skripte
```

## Lizenz

MIT
