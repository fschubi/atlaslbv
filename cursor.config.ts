
import { defineWorkspace } from 'cursor'

export default defineWorkspace({
  name: 'ATLAS System',
  description: 'Zentrales IT-Asset Management für Hardware, Software und Netzwerkverwaltung mit React, Node.js und PostgreSQL.',
  ignore: [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/.vite/**',
    '**/uploads/**',
    '**/build/**',
    '**/*.log',
    '**/*.lock',
  ],
  rules: [
    {
      pattern: 'frontend/src/pages/**/*.tsx',
      description: 'Jede Datei in "pages" ist eine Hauptseite mit Layout-Einbindung und zuständig für eine bestimmte Ansicht.',
    },
    {
      pattern: 'frontend/src/components/**/*.tsx',
      description: 'Wiederverwendbare UI-Komponenten wie Tabellen, Modale, Header, Sidebar, Buttons etc.',
    },
    {
      pattern: 'frontend/src/layout/**/*.tsx',
      description: 'Globale Layout-Komponenten wie MainLayout mit Sidebar und Header.',
    },
    {
      pattern: 'frontend/src/api/**/*.ts',
      description: 'Zentrale Schnittstelle für API-Kommunikation mit dem Node.js Backend.',
    },
    {
      pattern: 'backend/routes/**/*.js',
      description: 'REST API-Routen des Node.js Backends, z. B. /api/devices.',
    },
    {
      pattern: 'backend/controllers/**/*.js',
      description: 'Geschäftslogik der jeweiligen API-Endpunkte, ausgelagert aus den Routen.',
    },
    {
      pattern: 'backend/models/**/*.js',
      description: 'SQL-Abfragen oder ORMs zur Kommunikation mit PostgreSQL.',
    },
    {
      pattern: 'sql/**/*.sql',
      description: 'Alle SQL-Datenbankskripte: CREATE, INSERT, BACKUP etc.',
    },
    {
      pattern: 'docs/**/*.md',
      description: 'Projekt-Dokumentation, Feature-Planung, ER-Diagramm, MVP-Übersicht.',
    },
    {
      pattern: '**/*.test.tsx',
      description: 'Testdateien für Komponenten oder Hooks.',
    },
    {
      pattern: 'frontend/src/hooks/**/*.ts',
      description: 'Eigene React Hooks, z. B. useDevices, useModal, useAuth.',
    },
  ]
})
