# Einstellungsmodul - ATLAS Asset Management System

## Implementierte Komponenten

Das Einstellungsmodul wurde vollständig implementiert und bietet umfangreiche Funktionen zur Verwaltung von systemweiten Konfigurationen. Folgende Komponenten wurden erstellt:

### 1. Modell (backend/models/settingsModel.js)
- Umfassende Datenbankoperationen für Kategorien, Standorte, Abteilungen, Räume und Systemeinstellungen
- Implementierung der CRUD-Funktionen (Create, Read, Update, Delete) für alle Entitäten
- Prüfung auf Duplikate und Referenzen bei Löschoperationen
- JOIN-Operationen für aussagekräftige Datenrückgabe (z.B. Standortnamen bei Räumen)

### 2. Controller (backend/controllers/settingsController.js)
- Endpunktlogik für alle API-Routen im Einstellungsbereich
- Validierung von Eingabedaten mittels express-validator
- Detaillierte Fehlerbehandlung mit spezifischen Fehlermeldungen und passenden HTTP-Statuscodes
- Einheitliche Antwortstruktur für alle API-Anfragen

### 3. Routen (backend/routes/settings.js)
- Definition aller API-Endpunkte für das Einstellungsmodul
- Zugriffsschutz durch Authentication- und Authorization-Middleware
- Validierungsregeln für Eingabedaten bei POST- und PUT-Anfragen
- Rollenbasierte Zugriffskontrolle (Admin, Manager, reguläre Benutzer)

### 4. Datenbankschema (sql/create_settings_tables.sql)
- Tabellendefinitionen für Kategorien, Standorte, Abteilungen, Räume und Systemeinstellungen
- Fremdschlüsselbeziehungen und Constraints zur Datenintegrität
- Indizes für optimierte Abfragen
- Trigger für automatische Zeitstempelaktualisierung
- Standarddaten für Kategorien und Systemeinstellungen

### 5. API-Dokumentation (docs/api_dokumentation.md)
- Detaillierte Dokumentation aller Endpunkte
- Erklärung der Parameter und Zugriffsrechte
- Beispielantworten im JSON-Format
- Fehlerbehandlung und erwartete Statuscode-Rückgaben

## Funktionen des Einstellungsmoduls

Das Einstellungsmodul stellt folgende Funktionen bereit:

1. **Kategorieverwaltung**
   - Verschiedene Kategorien für Geräte, Lizenzen, Zertifikate und Zubehör
   - Typisierung nach Verwendungszweck
   - Vermeidung von Duplikaten

2. **Standortverwaltung**
   - Erfassung von Firmenstandorten mit Adressinformationen
   - Grundlage für die räumliche Organisation der Assets

3. **Abteilungsverwaltung**
   - Organisationseinheiten mit Standortzuordnung
   - Zuordnung von Abteilungsleitern (Manager)

4. **Raumverwaltung**
   - Detaillierte Angaben zu Räumen innerhalb von Standorten
   - Stockwerke und Raumnummern
   - Basis für präzise Inventarisierung

5. **Systemeinstellungen**
   - Globale Konfigurationen für das gesamte ATLAS-System
   - E-Mail-Benachrichtigungseinstellungen (SMTP)
   - Warnzeiträume für ablaufende Lizenzen und Zertifikate
   - Unternehmensname und weitere organisationsweite Einstellungen

## Integration im Gesamtsystem

Das Einstellungsmodul wurde vollständig in das ATLAS-Backend integriert:

- Die Routen wurden im Hauptserver (server.js) registriert
- Einstellungsoptionen sind über `/api/settings/...` Endpunkte erreichbar
- Zugriffsbeschränkungen wurden gemäß den Benutzerrollen implementiert

## Verwendung in anderen Modulen

Die im Einstellungsmodul verwalteten Daten werden in folgenden anderen Modulen verwendet:

1. **Gerätemanagement**: Kategorien, Standorte, Räume
2. **Lizenzmanagement**: Kategorien
3. **Zertifikatsmanagement**: Kategorien
4. **Zubehörmanagement**: Kategorien
5. **Benutzerveraltung**: Abteilungen, Standorte
6. **Inventarisierung**: Räume, Standorte
7. **Ticketsystem**: Standardprioritäten aus Systemeinstellungen

Die Implementierung bildet damit die zentrale Konfigurationsbasis für das gesamte ATLAS Asset Management System.
