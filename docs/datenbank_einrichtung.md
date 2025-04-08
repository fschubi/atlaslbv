# Einrichtung der PostgreSQL-Datenbank für ATLAS

Diese Anleitung beschreibt die Schritte zur Einrichtung der PostgreSQL-Datenbank für das ATLAS-Projekt.

## Voraussetzungen

- PostgreSQL 17.4 oder höher
- pgAdmin oder ein anderes PostgreSQL-Verwaltungstool (optional)

## 1. PostgreSQL installieren

Falls PostgreSQL noch nicht installiert ist, laden Sie es von der offiziellen Website herunter und installieren Sie es:

- [PostgreSQL Download](https://www.postgresql.org/download/)

## 2. Datenbank erstellen

Nach der Installation von PostgreSQL können Sie die Datenbank mit folgenden Schritten erstellen:

### Mit psql (Kommandozeile)

```bash
# Als PostgreSQL-Benutzer anmelden
psql -U postgres

# Datenbank erstellen
CREATE DATABASE atlas_db;

# Datenbank auswählen
\c atlas_db

# SQL-Dump importieren
\i /pfad/zu/sql/atlas_dump.sql
```

### Mit pgAdmin

1. Öffnen Sie pgAdmin
2. Verbinden Sie sich mit dem PostgreSQL-Server
3. Rechtsklick auf "Databases" → "Create" → "Database"
4. Geben Sie "atlas_db" als Datenbanknamen ein
5. Klicken Sie auf "Save"
6. Rechtsklick auf die neue Datenbank → "Query Tool"
7. Öffnen Sie die Datei `sql/atlas_dump.sql` und führen Sie sie aus

## 3. Benutzer und Berechtigungen einrichten

Erstellen Sie einen Benutzer mit den entsprechenden Berechtigungen:

```sql
-- Benutzer erstellen
CREATE USER atlas_user WITH PASSWORD 'atlas_db_password';

-- Berechtigungen gewähren
GRANT ALL PRIVILEGES ON DATABASE atlas_db TO atlas_user;

-- Verbinden Sie sich mit der Datenbank
\c atlas_db

-- Berechtigungen für alle Tabellen gewähren
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO atlas_user;

-- Berechtigungen für alle Sequenzen gewähren
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO atlas_user;
```

## 4. Umgebungsvariablen konfigurieren

Stellen Sie sicher, dass die Umgebungsvariablen in der `.env`-Datei korrekt gesetzt sind:

```
# Datenbank-Konfiguration
DB_HOST=localhost
DB_PORT=5432
DB_USER=atlas_user
DB_PASSWORD=M@ster2023
DB_NAME=atlas_db
```

## 5. Datenbankverbindung testen

Um die Datenbankverbindung zu testen, starten Sie den Backend-Server:

```bash
cd backend
npm run dev
```

Wenn keine Fehler auftreten, wurde die Datenbankverbindung erfolgreich hergestellt.

## 6. Daten importieren

Wenn Sie Testdaten importieren möchten, können Sie die SQL-Dateien im Verzeichnis `sql/` verwenden:

```bash
psql -U atlas_user -d atlas_db -f /pfad/zu/sql/atlas_dump.sql
```

## Fehlerbehebung

### Verbindungsfehler

Wenn Sie einen Verbindungsfehler erhalten, überprüfen Sie Folgendes:

1. PostgreSQL-Dienst läuft
2. Benutzername und Passwort sind korrekt
3. Datenbank existiert
4. Benutzer hat die entsprechenden Berechtigungen

### Berechtigungsfehler

Wenn Sie einen Berechtigungsfehler erhalten, überprüfen Sie Folgendes:

1. Benutzer hat die entsprechenden Berechtigungen
2. Datenbank existiert
3. Tabellen existieren

## Nützliche Befehle

```bash
# PostgreSQL-Dienst starten
sudo service postgresql start

# PostgreSQL-Dienst stoppen
sudo service postgresql stop

# PostgreSQL-Dienst neu starten
sudo service postgresql restart

# PostgreSQL-Status überprüfen
sudo service postgresql status
```
