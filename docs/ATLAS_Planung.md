
# 🧭 ATLAS – Advanced Tracking and Logistics Asset System

**Version: Projektplanung – Stand vor der Entwicklung**

ATLAS ist ein vollumfängliches System zur Verwaltung von Geräten, Lizenzen, Zubehör, Benutzern, Zertifikaten, Verträgen, Netzwerkdaten, Inventuren und vielem mehr. Ziel ist es, eine zentrale, sichere und visuell ansprechende Lösung zur Verfügung zu stellen, mit der die gesamte IT-Infrastruktur digital verwaltet werden kann.

---

## ⚙️ Technische Architektur

| Komponente   | Technologie                 |
|--------------|-----------------------------|
| **Frontend** | React + Vite + Material UI (MUI) |
| **Styling**  | Material UI (Dark Mode Standard) |
| **Backend**  | Node.js + Express.js        |
| **Datenbank**| PostgreSQL (lokal & Hetzner)|
| **Deployment** | Hetzner Cloud (Ubuntu 22.04, NGINX, SSL via Let's Encrypt) |
| **Versionierung** | Git + GitHub           |
| **Backup**   | pg_dump & Hetzner Snapshots |
| **Monitoring** | Uptime Kuma (optional Prometheus + Grafana) |

---

## 🌐 Projektstruktur (geplant)

```plaintext
/atlas
├── backend/          # Node.js API (Express)
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── db.js
├── frontend/         # React + Vite + MUI
│   ├── src/
│   │   ├── components/       # Reusable UI Components (Header, Sidebar, etc.)
│   │   ├── pages/            # Geräte, Lizenzen, Zertifikate etc.
│   │   ├── layout/           # MainLayout mit Header + Sidebar
│   │   └── App.jsx
├── uploads/          # PDF-Dokumente, Bilder
├── sql/              # Datenbankstruktur & Imports
├── nginx/            # Reverse Proxy mit SSL
├── docker-compose.yml
└── .env              # Konfiguration (Passwörter etc.)
```

---

## 🧱 Datenmodell – Tabellenübersicht

[Inhalt wie im vorherigen Markdown mit vollständiger `devices` Tabelle + andere Tabellen]

---

## 🎯 Geplante Hauptfunktionen

### 1. **Geräteverwaltung**
- Gerätedetails mit Status, Standort, Benutzer, Netzwerk
- QR-Code Labeling + Scan
- PDF-Upload für Lieferscheine

### 2. **Zubehörverwaltung**
- Verwaltung von Zubehör mit Zuweisung zu Geräten
- Verlustmeldung

### 3. **Lizenzverwaltung**
- Verfügbarkeit, Ablaufdatum, Erinnerungsfunktion
- Lizenzberichte

### 4. **Zertifikatsverwaltung**
- Übersicht über alle ablaufenden Zertifikate
- Automatische Farbcodierung (grün → gelb → rot)

### 5. **Inventurmodul**
- Sperrung von Bearbeitung während aktiver Inventur
- Fortschrittsanzeige, Homeoffice-Abfragen

### 6. **Ticketsystem & ToDos**
- Kanban-Ansicht für Aufgaben
- Ticketverwaltung mit Volltextsuche

### 7. **Dashboards & Berichte**
- Auswertungen:
  - Geräte nach Kategorie/Standort
  - Lizenzstatus
  - Abgelaufene Zertifikate
- Export als CSV, Excel, PDF

### 8. **Benutzerverwaltung**
- Rollen: Admin, Support, Nutzer, Gast
- MFA geplant
- Nur Zugriff auf zugewiesene Assets

### 9. **Selbstbedienungsportal (optional später)**
- Geräteanforderung
- Lizenzbedarf melden
- Defekte melden

### 10. **Onboarding & Übergabe**
- Digitale Übergabeprotokolle
- Checklisten
- Bilddokumentation (via Kamera)

---

## 📊 Dashboard (Startseite)

- Geräte nach Status (Tortendiagramm)
- Verfügbare vs. vergebene Lizenzen (Tortendiagramm)
- Tabelle Geräte pro Kategorie
- Tabelle Geräte pro Standort
- Tabelle ablaufende Zertifikate
- Tabelle ablaufende Lizenzen

---

## 🖥 Layoutstruktur

### 🔹 Header
- Links: ATLAS Logo
- Mitte: Volltextsuche + Scan-Button (blau)
- Rechts: Avatar, Username, Logout

### 🔹 Sidebar
- Ein-/ausklappbar (Hamburger Menü)
- Hauptpunkte:
  1. Geräte
  2. ToDo
  3. Ticketsystem
  4. User
  5. Zubehör
  6. Lizenzen
  7. Zertifikate
  8. Inventur
  9. Berichte
  10. Einstellungen (Dropdown):
     - Abteilungen
     - Kategorien
     - Hersteller
     - Lieferanten
     - Räume
     - Standorte
     - **Systemeinstellungen (immer ganz unten)**

### 🔹 Tabellenansicht (für alle Seiten)
- Spalten ein-/ausblendbar
- Sortierbar pro Spalte
- Export als CSV, Excel, PDF
- Anzeige: 25/50/75/100/500 Zeilen

---

## 📱 Mobile & Performance

- Responsive Design für Desktop, Tablet, Smartphone
- Mobile Web-App
- Optionale native App später möglich

---

## 📎 Dokumentenverwaltung

- Upload von PDF-Rechnungen, Handbüchern, Lieferscheinen
- Versionierung & Änderungsverlauf
- Zuordnung zu Geräten & Lizenzen

---

## 🚦 Statusverwaltung & Sicherheit

- Geräte-Status: In Betrieb, Lager, Reparatur, Defekt, Entsorgt
- Berechtigungssystem (Feingranular für IT-Teams)
- Protokollierung aller Änderungen (Audit-Log)

---

## 📅 Kalender- & Erinnerungsfunktionen

- Für:
  - Wartung
  - Zertifikatsabläufe
  - Inventuren
  - Lizenzen
  - ToDos

---

## 🔐 Zugriff & Sicherheit

- Zugriff nur für registrierte Benutzer
- Rollenbasiert
- MFA
- Serverhärtung mit Fail2Ban, SSH-Key
- SSL über Let's Encrypt

---

*Letzte Anpassung der Projektübersicht: 04.04.2025*
