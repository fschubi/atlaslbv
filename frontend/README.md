# ATLAS Frontend

Das Frontend für das ATLAS (Advanced Tracking and Logistics Asset System) basiert auf React, Vite und Material-UI.

## Überblick

ATLAS ist ein umfassendes Asset-Management-System, das Unternehmen bei der Verwaltung ihrer IT-Assets unterstützt, einschließlich Geräten, Lizenzen, Zertifikaten und Zubehör.

Das Frontend bietet eine intuitive Benutzeroberfläche im Dark Mode, die den Zugriff auf alle Funktionen des Systems ermöglicht:

- Geräte-, Lizenz-, Zertifikats- und Zubehörverwaltung
- Benutzerverwaltung
- Aufgabenverwaltung (Todos)
- Inventarisierung
- Ticketsystem
- Berichtswesen
- Systemeinstellungen

## Technologie-Stack

- React 18
- TypeScript
- Vite
- Material-UI (MUI)
- React Router
- Axios
- React Virtuoso
- HTML5 QR Code Scanner

## Voraussetzungen

- Node.js (Version 16 oder höher)
- npm oder yarn

## Installation

1. Repository klonen:
```bash
git clone https://github.com/your-org/atlas.git
cd atlas/frontend
```

2. Abhängigkeiten installieren:
```bash
npm install
# oder
yarn install
```

3. Entwicklungsserver starten:
```bash
npm run dev
# oder
yarn dev
```

Die Anwendung ist dann unter `http://localhost:3000` erreichbar.

## Build

Für einen Produktions-Build:

```bash
npm run build
# oder
yarn build
```

## Projektstruktur

```
frontend/
├── src/
│   ├── components/     # Wiederverwendbare UI-Komponenten
│   ├── layout/         # Layout-Komponenten (Header, Sidebar)
│   ├── pages/          # Seitenkomponenten
│   ├── services/       # API-Services
│   ├── hooks/          # Custom React Hooks
│   ├── types/          # TypeScript Definitionen
│   └── utils/          # Hilfsfunktionen
├── public/             # Statische Assets
└── ...                 # Konfigurationsdateien
```

## Konventionen

- Komponenten verwenden PascalCase
- Hooks beginnen mit "use"
- Services sind in camelCase
- Alle UI-Komponenten nutzen MUI
- Tabellen verwenden react-virtuoso
- Styling erfolgt über MUI's sx prop

## Lizenz

Proprietär - Alle Rechte vorbehalten
