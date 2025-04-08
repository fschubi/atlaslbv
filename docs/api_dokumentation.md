# ATLAS API Dokumentation

Diese Dokumentation beschreibt die verfügbaren API-Endpunkte des ATLAS Asset Management Systems.

## Basis-URL

Alle API-Endpunkte sind relativ zur Basis-URL:

```
http://localhost:3001/api
```

In der Produktionsumgebung:

```
https://atlas.example.com/api
```

## Authentifizierung

Die meisten Endpunkte erfordern eine Authentifizierung. Senden Sie den JWT-Token im Authorization-Header mit dem Präfix "Bearer":

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## API-Endpunkte

### Geräte

#### Alle Geräte abrufen

```
GET /devices
```

Query-Parameter:
- `status`: Filtert nach Gerätestatus
- `category_id`: Filtert nach Kategorie-ID
- `user_id`: Filtert nach Benutzer-ID
- `location_id`: Filtert nach Standort-ID
- `search`: Sucht in Inventarnummer, Seriennummer und Modellname
- `sort_by`: Feldname für Sortierung (Standard: 'inventory_number')
- `sort_order`: 'asc' oder 'desc' (Standard: 'asc')
- `limit`: Maximale Anzahl an Ergebnissen
- `offset`: Offset für Paginierung

#### Gerät nach ID abrufen

```
GET /devices/:id
```

#### Neues Gerät erstellen

```
POST /devices
```

Erforderliche Felder:
- `inventory_number`: Inventarnummer des Geräts
- `status`: Status des Geräts
- `purchase_date`: Kaufdatum im Format YYYY-MM-DD

Optionale Felder:
- `serial_number`: Seriennummer
- `warranty_until`: Garantieende im Format YYYY-MM-DD
- `eol_date`: End-of-Life-Datum im Format YYYY-MM-DD
- `lbv_number`: LBV-Nummer
- `switch_id`: ID des Switches
- `switch_port`: Port am Switch
- `base_pc_number`: Basisrechner-Nummer
- `base_pc_inventory_number`: Inventarnummer des Basisrechners
- `mac_address`: MAC-Adresse
- `network_port_number`: Netzwerkanschluss-ID
- `category_id`: Kategorie-ID
- `device_model_id`: Gerätemodell-ID
- `room_id`: Raum-ID
- `user_id`: Benutzer-ID
- `supplier_id`: Lieferanten-ID

#### Gerät aktualisieren

```
PUT /devices/:id
```

Alle Felder sind optional.

#### Gerät löschen

```
DELETE /devices/:id
```

### Lizenzen

#### Alle Lizenzen abrufen

```
GET /licenses
```

Query-Parameter ähnlich wie bei Geräten.

#### Lizenz nach ID abrufen

```
GET /licenses/:id
```

#### Neue Lizenz erstellen

```
POST /licenses
```

Erforderliche Felder:
- `license_key`: Lizenzschlüssel
- `software_name`: Name der Software

Optionale Felder:
- `purchase_date`: Kaufdatum im Format YYYY-MM-DD
- `expiration_date`: Ablaufdatum im Format YYYY-MM-DD
- `assigned_to_user_id`: Zugewiesene Benutzer-ID
- `assigned_to_device_id`: Zugewiesene Geräte-ID
- `note`: Anmerkung

#### Lizenz aktualisieren

```
PUT /licenses/:id
```

Alle Felder sind optional.

#### Lizenz löschen

```
DELETE /licenses/:id
```

### Zertifikate

#### Alle Zertifikate abrufen

```
GET /certificates
```

#### Zertifikat nach ID abrufen

```
GET /certificates/:id
```

#### Neues Zertifikat erstellen

```
POST /certificates
```

Erforderliche Felder:
- `name`: Name des Zertifikats
- `expiration_date`: Ablaufdatum im Format YYYY-MM-DD

Optionale Felder:
- `service`: Dienst
- `domain`: Domain
- `issued_at`: Ausstellungsdatum im Format YYYY-MM-DD
- `assigned_to_device_id`: Zugewiesene Geräte-ID
- `note`: Anmerkung

#### Zertifikat aktualisieren

```
PUT /certificates/:id
```

Alle Felder sind optional.

#### Zertifikat löschen

```
DELETE /certificates/:id
```

### Benutzer

#### Alle Benutzer abrufen

```
GET /users
```

#### Benutzer nach ID abrufen

```
GET /users/:id
```

#### Neuen Benutzer erstellen

```
POST /users
```

Erforderliche Felder:
- `first_name`: Vorname
- `last_name`: Nachname
- `email`: E-Mail-Adresse
- `username`: Benutzername
- `password`: Passwort
- `role`: Rolle ('admin', 'support', 'user', 'guest')

Optionale Felder:
- `title`: Titel/Anrede
- `phone`: Telefonnummer
- `address`: Adresse
- `postal_code`: Postleitzahl
- `city`: Stadt
- `department_id`: Abteilungs-ID

#### Benutzer aktualisieren

```
PUT /users/:id
```

Alle Felder sind optional. Passwort wird bei Angabe neu gehasht.

#### Benutzer löschen

```
DELETE /users/:id
```

### Todolisten

#### Alle Todo-Einträge abrufen

```
GET /todos
```

#### Todo-Eintrag nach ID abrufen

```
GET /todos/:id
```

#### Neuen Todo-Eintrag erstellen

```
POST /todos
```

Erforderliche Felder:
- `title`: Titel des Eintrags
- `status`: Status ('offen', 'in_bearbeitung', 'erledigt', 'abgebrochen')

Optionale Felder:
- `description`: Beschreibung
- `priority`: Priorität (1-5, wobei 1 die höchste ist)
- `due_date`: Fälligkeitsdatum im Format YYYY-MM-DD
- `assigned_to_user_id`: Zugewiesene Benutzer-ID
- `created_by_user_id`: Erstellende Benutzer-ID
- `category`: Kategorie

#### Todo-Eintrag aktualisieren

```
PUT /todos/:id
```

Alle Felder sind optional.

#### Todo-Eintrag löschen

```
DELETE /todos/:id
```

### Inventur

#### Alle Inventursitzungen abrufen

```
GET /inventory
```

#### Inventursitzung nach ID abrufen

```
GET /inventory/:id
```

#### Neue Inventursitzung erstellen

```
POST /inventory
```

Erforderliche Felder:
- `title`: Titel der Inventursitzung
- `start_date`: Startdatum im Format YYYY-MM-DD
- `is_active`: Status der Aktivität (true/false)

Optionale Felder:
- `end_date`: Enddatum im Format YYYY-MM-DD
- `notes`: Anmerkungen

#### Inventursitzung aktualisieren

```
PUT /inventory/:id
```

Alle Felder sind optional.

#### Inventursitzung löschen

```
DELETE /inventory/:id
```

### Tickets

#### Alle Tickets abrufen

```
GET /tickets
```

Query-Parameter:
- `page`: Seitennummer (Standard: 1)
- `limit`: Einträge pro Seite (Standard: 10)
- `status`: Filtert nach Status (offen, in_bearbeitung, wartend, geschlossen)
- `priority`: Filtert nach Priorität (niedrig, mittel, hoch)
- `category`: Filtert nach Kategorie
- `assigned_to`: Filtert nach zugewiesenem Benutzer
- `created_by`: Filtert nach Ersteller
- `search`: Suchbegriff für Titel oder Beschreibung
- `sort_by`: Sortierfeld (Standard: 't.created_at')
- `sort_direction`: Sortierrichtung (ASC, DESC)

Antwort enthält paginierte Tickets mit Kommentarzählung und Benutzerinformationen.

#### Ticket-Statistiken abrufen

```
GET /tickets/stats
```

Gibt Statistiken zu Tickets zurück, einschließlich:
- Anzahl der Tickets nach Status (offen, in Bearbeitung, wartend, geschlossen)
- Anzahl der Tickets nach Priorität (niedrig, mittel, hoch)
- Anzahl der überfälligen Tickets
- Aktuelle Tickets nach Kategorie

#### Ticket nach ID abrufen

```
GET /tickets/:id
```

Gibt detaillierte Ticket-Informationen zurück, einschließlich:
- Ticket-Daten
- Kommentare mit Benutzerinformationen
- Anhänge

#### Neues Ticket erstellen

```
POST /tickets
```

Erforderliche Felder:
- `title`: Titel des Tickets
- `description`: Beschreibung des Problems
- `category`: Kategorie des Tickets

Optionale Felder:
- `status`: Status (Standard: offen)
- `priority`: Priorität (Standard: mittel)
- `assigned_to`: ID des zugewiesenen Benutzers
- `due_date`: Fälligkeitsdatum im Format YYYY-MM-DD

Bei Erstellung wird automatisch ein Kommentar hinzugefügt.

#### Ticket aktualisieren

```
PUT /tickets/:id
```

Felder wie bei der Erstellung. Bei Änderungen wird automatisch ein Kommentar mit den Änderungen hinzugefügt.

#### Ticket löschen

```
DELETE /tickets/:id
```

Löscht ein Ticket und alle zugehörigen Kommentare und Anhänge.

#### Kommentar zu einem Ticket hinzufügen

```
POST /tickets/:id/comments
```

Erforderliche Felder:
- `content`: Inhalt des Kommentars

#### Kommentar löschen

```
DELETE /tickets/comments/:commentId
```

Nur der Ersteller oder Administratoren können Kommentare löschen.

#### Dateianhang hochladen

```
POST /tickets/:id/attachments
```

Multipart/form-data mit Feld `attachment` für die Datei.
Erlaubte Dateitypen: .jpg, .jpeg, .png, .pdf, .doc, .docx, .xls, .xlsx, .txt, .zip
Maximale Dateigröße: 10 MB

#### Dateianhang herunterladen

```
GET /tickets/attachments/:attachmentId
```

Lädt die Datei mit dem originalen Dateinamen herunter.

#### Dateianhang löschen

```
DELETE /tickets/attachments/:attachmentId
```

#### Ticket-Status ändern

```
PATCH /tickets/:id/status
```

Erforderliche Felder:
- `status`: Neuer Status (offen, in_bearbeitung, wartend, geschlossen)

Bei Statusänderung wird automatisch ein Kommentar hinzugefügt.

#### Ticket zuweisen

```
PATCH /tickets/:id/assign
```

Erforderliche Felder:
- `assigned_to`: ID des Benutzers oder null für keine Zuweisung

Bei Zuweisungsänderung wird automatisch ein Kommentar hinzugefügt.

### Berichte

#### Standard-Berichte abrufen

```
GET /reports/devices-by-category
GET /reports/devices-by-location
GET /reports/expiring-licenses
GET /reports/expiring-certificates
```

### Einstellungen

Das ATLAS-System bietet umfangreiche Einstellungsmöglichkeiten, die über verschiedene Endpunkte verwaltet werden können.

### Kategorien

Kategorien dienen zur Klassifizierung von Geräten, Lizenzen, Zertifikaten und Zubehör.

#### `GET /api/settings/categories`
- **Beschreibung**: Listet alle verfügbaren Kategorien auf.
- **Zugriff**: Privat (angemeldeter Benutzer)
- **Parameter**: Keine
- **Erfolgsantwort**: Status 200, JSON mit allen Kategorien
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Desktop-PC",
        "description": "Standard Desktop Computer",
        "type": "device",
        "created_at": "2023-06-15T10:30:00Z",
        "updated_at": "2023-06-15T10:30:00Z"
      },
      ...
    ]
  }
  ```

#### `GET /api/settings/categories/:id`
- **Beschreibung**: Ruft eine spezifische Kategorie anhand ihrer ID ab.
- **Zugriff**: Privat (angemeldeter Benutzer)
- **Parameter**: Keine
- **Erfolgsantwort**: Status 200, JSON mit der Kategorie
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "name": "Desktop-PC",
      "description": "Standard Desktop Computer",
      "type": "device",
      "created_at": "2023-06-15T10:30:00Z",
      "updated_at": "2023-06-15T10:30:00Z"
    }
  }
  ```

#### `POST /api/settings/categories`
- **Beschreibung**: Erstellt eine neue Kategorie.
- **Zugriff**: Privat (Admin, Manager)
- **Parameter**:
  - `name` (erforderlich): Name der Kategorie
  - `description` (optional): Beschreibung der Kategorie
  - `type` (erforderlich): Typ der Kategorie ('device', 'license', 'certificate', 'accessory')
- **Erfolgsantwort**: Status 201, JSON mit der erstellten Kategorie
  ```json
  {
    "success": true,
    "message": "Kategorie erfolgreich erstellt",
    "data": {
      "id": 28,
      "name": "Externe Festplatte",
      "description": "Externe Speichergeräte",
      "type": "accessory",
      "created_at": "2023-06-16T08:45:00Z",
      "updated_at": "2023-06-16T08:45:00Z"
    }
  }
  ```

#### `PUT /api/settings/categories/:id`
- **Beschreibung**: Aktualisiert eine bestehende Kategorie.
- **Zugriff**: Privat (Admin, Manager)
- **Parameter**:
  - `name` (erforderlich): Name der Kategorie
  - `description` (optional): Beschreibung der Kategorie
  - `type` (erforderlich): Typ der Kategorie ('device', 'license', 'certificate', 'accessory')
- **Erfolgsantwort**: Status 200, JSON mit der aktualisierten Kategorie
  ```json
  {
    "success": true,
    "message": "Kategorie erfolgreich aktualisiert",
    "data": {
      "id": 28,
      "name": "Externe Festplatte",
      "description": "Externe Speichergeräte und SSD",
      "type": "accessory",
      "created_at": "2023-06-16T08:45:00Z",
      "updated_at": "2023-06-16T09:15:00Z"
    }
  }
  ```

#### `DELETE /api/settings/categories/:id`
- **Beschreibung**: Löscht eine Kategorie.
- **Zugriff**: Privat (Admin)
- **Parameter**: Keine
- **Erfolgsantwort**: Status 200, JSON mit der gelöschten Kategorie
  ```json
  {
    "success": true,
    "message": "Kategorie erfolgreich gelöscht",
    "data": {
      "id": 28,
      "name": "Externe Festplatte",
      "description": "Externe Speichergeräte und SSD",
      "type": "accessory"
    }
  }
  ```

### Standorte

Standorte definieren die physischen Orte, an denen Geräte und Mitarbeiter angesiedelt sind.

#### `GET /api/settings/locations`
- **Beschreibung**: Listet alle verfügbaren Standorte auf.
- **Zugriff**: Privat (angemeldeter Benutzer)
- **Parameter**: Keine
- **Erfolgsantwort**: Status 200, JSON mit allen Standorten
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Hauptgebäude",
        "address": "Hauptstraße 1",
        "zip_code": "12345",
        "city": "Berlin",
        "country": "Deutschland",
        "notes": "Zentraler Standort",
        "created_at": "2023-06-15T10:30:00Z",
        "updated_at": "2023-06-15T10:30:00Z"
      },
      ...
    ]
  }
  ```

#### `GET /api/settings/locations/:id`
- **Beschreibung**: Ruft einen spezifischen Standort anhand seiner ID ab.
- **Zugriff**: Privat (angemeldeter Benutzer)
- **Parameter**: Keine
- **Erfolgsantwort**: Status 200, JSON mit dem Standort
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "name": "Hauptgebäude",
      "address": "Hauptstraße 1",
      "zip_code": "12345",
      "city": "Berlin",
      "country": "Deutschland",
      "notes": "Zentraler Standort",
      "created_at": "2023-06-15T10:30:00Z",
      "updated_at": "2023-06-15T10:30:00Z"
    }
  }
  ```

#### `POST /api/settings/locations`
- **Beschreibung**: Erstellt einen neuen Standort.
- **Zugriff**: Privat (Admin, Manager)
- **Parameter**:
  - `name` (erforderlich): Name des Standorts
  - `address` (optional): Adresse
  - `zip_code` (optional): Postleitzahl
  - `city` (erforderlich): Stadt
  - `country` (optional): Land
  - `notes` (optional): Notizen
- **Erfolgsantwort**: Status 201, JSON mit dem erstellten Standort
  ```json
  {
    "success": true,
    "message": "Standort erfolgreich erstellt",
    "data": {
      "id": 4,
      "name": "Niederlassung Nord",
      "address": "Hafenstraße 42",
      "zip_code": "20095",
      "city": "Hamburg",
      "country": "Deutschland",
      "notes": "Neue Niederlassung seit 2023",
      "created_at": "2023-06-16T08:45:00Z",
      "updated_at": "2023-06-16T08:45:00Z"
    }
  }
  ```

#### `PUT /api/settings/locations/:id`
- **Beschreibung**: Aktualisiert einen bestehenden Standort.
- **Zugriff**: Privat (Admin, Manager)
- **Parameter**:
  - `name` (erforderlich): Name des Standorts
  - `address` (optional): Adresse
  - `zip_code` (optional): Postleitzahl
  - `city` (erforderlich): Stadt
  - `country` (optional): Land
  - `notes` (optional): Notizen
- **Erfolgsantwort**: Status 200, JSON mit dem aktualisierten Standort
  ```json
  {
    "success": true,
    "message": "Standort erfolgreich aktualisiert",
    "data": {
      "id": 4,
      "name": "Niederlassung Nord",
      "address": "Hafenstraße 50",
      "zip_code": "20095",
      "city": "Hamburg",
      "country": "Deutschland",
      "notes": "Neue Niederlassung seit 2023, neues Gebäude",
      "created_at": "2023-06-16T08:45:00Z",
      "updated_at": "2023-06-16T09:15:00Z"
    }
  }
  ```

#### `DELETE /api/settings/locations/:id`
- **Beschreibung**: Löscht einen Standort.
- **Zugriff**: Privat (Admin)
- **Parameter**: Keine
- **Erfolgsantwort**: Status 200, JSON mit dem gelöschten Standort
  ```json
  {
    "success": true,
    "message": "Standort erfolgreich gelöscht",
    "data": {
      "id": 4,
      "name": "Niederlassung Nord",
      "city": "Hamburg"
    }
  }
  ```

### Abteilungen

Abteilungen organisieren die Unternehmensstruktur und können Benutzern und Geräten zugewiesen werden.

#### `GET /api/settings/departments`
- **Beschreibung**: Listet alle verfügbaren Abteilungen auf.
- **Zugriff**: Privat (angemeldeter Benutzer)
- **Parameter**: Keine
- **Erfolgsantwort**: Status 200, JSON mit allen Abteilungen
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "IT-Abteilung",
        "description": "Zuständig für IT-Infrastruktur",
        "location_id": 1,
        "location_name": "Hauptgebäude",
        "manager_id": 3,
        "manager_name": "Max Mustermann",
        "created_at": "2023-06-15T10:30:00Z",
        "updated_at": "2023-06-15T10:30:00Z"
      },
      ...
    ]
  }
  ```

#### `GET /api/settings/departments/:id`
- **Beschreibung**: Ruft eine spezifische Abteilung anhand ihrer ID ab.
- **Zugriff**: Privat (angemeldeter Benutzer)
- **Parameter**: Keine
- **Erfolgsantwort**: Status 200, JSON mit der Abteilung
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "name": "IT-Abteilung",
      "description": "Zuständig für IT-Infrastruktur",
      "location_id": 1,
      "location_name": "Hauptgebäude",
      "manager_id": 3,
      "manager_name": "Max Mustermann",
      "created_at": "2023-06-15T10:30:00Z",
      "updated_at": "2023-06-15T10:30:00Z"
    }
  }
  ```

#### `POST /api/settings/departments`
- **Beschreibung**: Erstellt eine neue Abteilung.
- **Zugriff**: Privat (Admin, Manager)
- **Parameter**:
  - `name` (erforderlich): Name der Abteilung
  - `description` (optional): Beschreibung
  - `location_id` (erforderlich): ID des zugehörigen Standorts
  - `manager_id` (optional): ID des Abteilungsleiters
- **Erfolgsantwort**: Status 201, JSON mit der erstellten Abteilung
  ```json
  {
    "success": true,
    "message": "Abteilung erfolgreich erstellt",
    "data": {
      "id": 5,
      "name": "Buchhaltung",
      "description": "Finanzbuchhaltung",
      "location_id": 1,
      "manager_id": 7,
      "created_at": "2023-06-16T08:45:00Z",
      "updated_at": "2023-06-16T08:45:00Z"
    }
  }
  ```

#### `PUT /api/settings/departments/:id`
- **Beschreibung**: Aktualisiert eine bestehende Abteilung.
- **Zugriff**: Privat (Admin, Manager)
- **Parameter**:
  - `name` (erforderlich): Name der Abteilung
  - `description` (optional): Beschreibung
  - `location_id` (erforderlich): ID des zugehörigen Standorts
  - `manager_id` (optional): ID des Abteilungsleiters
- **Erfolgsantwort**: Status 200, JSON mit der aktualisierten Abteilung
  ```json
  {
    "success": true,
    "message": "Abteilung erfolgreich aktualisiert",
    "data": {
      "id": 5,
      "name": "Finanzabteilung",
      "description": "Finanzbuchhaltung und Controlling",
      "location_id": 1,
      "manager_id": 7,
      "created_at": "2023-06-16T08:45:00Z",
      "updated_at": "2023-06-16T09:15:00Z"
    }
  }
  ```

#### `DELETE /api/settings/departments/:id`
- **Beschreibung**: Löscht eine Abteilung.
- **Zugriff**: Privat (Admin)
- **Parameter**: Keine
- **Erfolgsantwort**: Status 200, JSON mit der gelöschten Abteilung
  ```json
  {
    "success": true,
    "message": "Abteilung erfolgreich gelöscht",
    "data": {
      "id": 5,
      "name": "Finanzabteilung"
    }
  }
  ```

### Räume

Räume definieren spezifische Bereiche innerhalb eines Standorts und können Geräten zugewiesen werden.

#### `GET /api/settings/rooms`
- **Beschreibung**: Listet alle verfügbaren Räume auf.
- **Zugriff**: Privat (angemeldeter Benutzer)
- **Parameter**: Keine
- **Erfolgsantwort**: Status 200, JSON mit allen Räumen
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Serverraum",
        "floor": "EG",
        "room_number": "012",
        "description": "Hauptserverraum",
        "location_id": 1,
        "location_name": "Hauptgebäude",
        "created_at": "2023-06-15T10:30:00Z",
        "updated_at": "2023-06-15T10:30:00Z"
      },
      ...
    ]
  }
  ```

#### `GET /api/settings/rooms/:id`
- **Beschreibung**: Ruft einen spezifischen Raum anhand seiner ID ab.
- **Zugriff**: Privat (angemeldeter Benutzer)
- **Parameter**: Keine
- **Erfolgsantwort**: Status 200, JSON mit dem Raum
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "name": "Serverraum",
      "floor": "EG",
      "room_number": "012",
      "description": "Hauptserverraum",
      "location_id": 1,
      "location_name": "Hauptgebäude",
      "created_at": "2023-06-15T10:30:00Z",
      "updated_at": "2023-06-15T10:30:00Z"
    }
  }
  ```

#### `POST /api/settings/rooms`
- **Beschreibung**: Erstellt einen neuen Raum.
- **Zugriff**: Privat (Admin, Manager)
- **Parameter**:
  - `name` (erforderlich): Name des Raums
  - `floor` (optional): Stockwerk
  - `room_number` (optional): Raumnummer
  - `description` (optional): Beschreibung
  - `location_id` (erforderlich): ID des zugehörigen Standorts
- **Erfolgsantwort**: Status 201, JSON mit dem erstellten Raum
  ```json
  {
    "success": true,
    "message": "Raum erfolgreich erstellt",
    "data": {
      "id": 10,
      "name": "Konferenzraum Groß",
      "floor": "1. OG",
      "room_number": "101",
      "description": "Großer Konferenzraum mit Präsentationstechnik",
      "location_id": 1,
      "created_at": "2023-06-16T08:45:00Z",
      "updated_at": "2023-06-16T08:45:00Z"
    }
  }
  ```

#### `PUT /api/settings/rooms/:id`
- **Beschreibung**: Aktualisiert einen bestehenden Raum.
- **Zugriff**: Privat (Admin, Manager)
- **Parameter**:
  - `name` (erforderlich): Name des Raums
  - `floor` (optional): Stockwerk
  - `room_number` (optional): Raumnummer
  - `description` (optional): Beschreibung
  - `location_id` (erforderlich): ID des zugehörigen Standorts
- **Erfolgsantwort**: Status 200, JSON mit dem aktualisierten Raum
  ```json
  {
    "success": true,
    "message": "Raum erfolgreich aktualisiert",
    "data": {
      "id": 10,
      "name": "Konferenzraum Groß",
      "floor": "1. OG",
      "room_number": "101A",
      "description": "Großer Konferenzraum mit moderner Präsentationstechnik",
      "location_id": 1,
      "created_at": "2023-06-16T08:45:00Z",
      "updated_at": "2023-06-16T09:15:00Z"
    }
  }
  ```

#### `DELETE /api/settings/rooms/:id`
- **Beschreibung**: Löscht einen Raum.
- **Zugriff**: Privat (Admin)
- **Parameter**: Keine
- **Erfolgsantwort**: Status 200, JSON mit dem gelöschten Raum
  ```json
  {
    "success": true,
    "message": "Raum erfolgreich gelöscht",
    "data": {
      "id": 10,
      "name": "Konferenzraum Groß",
      "room_number": "101A"
    }
  }
  ```

### Systemeinstellungen

Globale Einstellungen für das gesamte ATLAS-System.

#### `GET /api/settings/system`
- **Beschreibung**: Ruft alle Systemeinstellungen ab.
- **Zugriff**: Privat (Admin)
- **Parameter**: Keine
- **Erfolgsantwort**: Status 200, JSON mit den Systemeinstellungen
  ```json
  {
    "success": true,
    "data": {
      "company_name": "ATLAS GmbH",
      "inventory_check_interval": "365",
      "license_expiry_warning": "30",
      "certificate_expiry_warning": "60",
      "default_ticket_priority": "medium",
      "max_upload_size": "10",
      "enable_email_notifications": "true",
      "smtp_host": "smtp.example.com",
      "smtp_port": "587",
      "smtp_user": "noreply@example.com",
      "smtp_from_email": "noreply@atlas-system.de",
      "smtp_from_name": "ATLAS System"
    }
  }
  ```

#### `PUT /api/settings/system`
- **Beschreibung**: Aktualisiert Systemeinstellungen.
- **Zugriff**: Privat (Admin)
- **Parameter**: Key-Value-Paare der zu aktualisierenden Einstellungen
- **Erfolgsantwort**: Status 200, JSON mit den aktualisierten Einstellungen
  ```json
  {
    "success": true,
    "message": "Systemeinstellungen erfolgreich aktualisiert",
    "data": {
      "company_name": "ATLAS International GmbH",
      "smtp_host": "smtp.neuemail.com",
      "smtp_port": "465"
    }
  }
  ```

## 7. Inventar

### Inventareinträge

#### Alle Inventareinträge abrufen
```
GET /inventory
```

Parameter:
- `device_id`: Filter nach Gerät
- `checked_by_user_id`: Filter nach Prüfer
- `status`: Filter nach Status (bestätigt, vermisst, beschädigt)
- `location`: Filter nach Standort
- `checked_from`: Filter nach Prüfdatum (von)
- `checked_to`: Filter nach Prüfdatum (bis)
- `search`: Suchbegriff
- `page`: Seitennummer für Paginierung
- `limit`: Anzahl der Einträge pro Seite
- `sort_by`: Feld für Sortierung
- `sort_order`: Sortierreihenfolge (asc/desc)

#### Inventareintrag nach ID abrufen
```
GET /inventory/:id
```

#### Inventareinträge für ein Gerät abrufen
```
GET /inventory/device/:deviceId
```

#### Geräte abrufen, die seit einem bestimmten Datum nicht geprüft wurden
```
GET /inventory/devices/not-checked?date=YYYY-MM-DD
```

#### Inventarstatistiken abrufen
```
GET /inventory/stats
```

#### Neuen Inventareintrag erstellen
```
POST /inventory
```

Erforderliche Felder:
- `device_id`: ID des Geräts
- `status`: Status (bestätigt, vermisst, beschädigt)

Optionale Felder:
- `checked_by_user_id`: ID des Prüfers (Standard: eingeloggter Benutzer)
- `location`: Standort
- `notes`: Anmerkungen
- `last_checked_date`: Prüfdatum (Standard: aktuelles Datum/Uhrzeit)
- `session_id`: ID der Inventursitzung

#### Inventareintrag aktualisieren
```
PUT /inventory/:id
```

#### Inventareintrag löschen
```
DELETE /inventory/:id
```

### Inventursitzungen

#### Alle Inventursitzungen abrufen
```
GET /inventory-sessions
```

Parameter:
- `title`: Filter nach Titel
- `is_active`: Filter nach Aktivstatus (true/false)
- `start_date_from`: Filter nach Startdatum (von)
- `start_date_to`: Filter nach Startdatum (bis)
- `end_date_from`: Filter nach Enddatum (von)
- `end_date_to`: Filter nach Enddatum (bis)
- `created_by_user_id`: Filter nach Ersteller
- `search`: Suchbegriff
- `page`: Seitennummer für Paginierung
- `limit`: Anzahl der Einträge pro Seite
- `sort_by`: Feld für Sortierung
- `sort_order`: Sortierreihenfolge (asc/desc)

#### Aktive Inventursitzung abrufen
```
GET /inventory-sessions/active
```

#### Inventursitzung nach ID abrufen
```
GET /inventory-sessions/:id
```

#### Inventureinträge für eine Sitzung abrufen
```
GET /inventory-sessions/:id/items
```

Parameter:
- `status`: Filter nach Status
- `location`: Filter nach Standort
- `search`: Suchbegriff
- `page`: Seitennummer für Paginierung
- `limit`: Anzahl der Einträge pro Seite
- `sort_by`: Feld für Sortierung
- `sort_order`: Sortierreihenfolge (asc/desc)

#### Neue Inventursitzung erstellen
```
POST /inventory-sessions
```

Erforderliche Felder:
- `title`: Titel der Sitzung

Optionale Felder:
- `start_date`: Startdatum (Standard: aktuelles Datum/Uhrzeit)
- `end_date`: Enddatum
- `is_active`: Aktivstatus (Standard: true)
- `notes`: Anmerkungen
- `created_by_user_id`: ID des Erstellers (Standard: eingeloggter Benutzer)

#### Neuen Inventureintrag zu einer Sitzung hinzufügen
```
POST /inventory-sessions/:id/items
```

Erforderliche Felder:
- `device_id`: ID des Geräts
- `status`: Status (bestätigt, vermisst, beschädigt)

Optionale Felder:
- `checked_by_user_id`: ID des Prüfers (Standard: eingeloggter Benutzer)
- `location`: Standort
- `notes`: Anmerkungen

#### Inventursitzung aktualisieren
```
PUT /inventory-sessions/:id
```

#### Inventursitzung beenden
```
PATCH /inventory-sessions/:id/end
```

#### Inventursitzung löschen
```
DELETE /inventory-sessions/:id
```

## Fehlercodes

- 200: Erfolgreiche Anfrage
- 201: Ressource erfolgreich erstellt
- 400: Ungültige Anfrage (z.B. fehlende erforderliche Felder)
- 401: Nicht authentifiziert
- 403: Nicht berechtigt
- 404: Ressource nicht gefunden
- 500: Interner Serverfehler

## Antwortformat

Alle API-Antworten haben das folgende Format:

Erfolgreiche Antwort:
```json
{
  "success": true,
  "data": [...],
  "count": 123  // bei Listen
}
```

Fehlerantwort:
```json
{
  "success": false,
  "message": "Fehlermeldung",
  "errors": [...]  // bei Validierungsfehlern
}
```
