-- ATLAS Einstellungen und Verwaltungsdaten
-- Version: 1.0.0
-- Datum: 2024-04-07
-- Teil 6: Einstellungen

-- Bestehende Tabellen löschen (in umgekehrter Reihenfolge wegen Fremdschlüsseln)
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS manufacturers CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS asset_tags CASCADE;
DROP TABLE IF EXISTS asset_custom_fields CASCADE;
DROP TABLE IF EXISTS asset_custom_field_values CASCADE;

-- Kategorien für verschiedene Asset-Typen
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'device', 'license', 'certificate', 'accessory'
    icon VARCHAR(50),
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hersteller von Geräten und Zubehör
CREATE TABLE manufacturers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    website VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    logo_path VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lieferanten von Lizenzen und Zertifikaten
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    website VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    logo_path VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lieferanten von Geräten und Zubehör
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    website VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Standorte (Gebäude, Niederlassungen)
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Abteilungen
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    budget_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Räume
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    room_number VARCHAR(50),
    floor VARCHAR(50),
    building VARCHAR(100),
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    capacity INTEGER,
    room_type VARCHAR(50), -- 'office', 'meeting', 'server', 'storage', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(location_id, room_number)
);

-- Asset-Tags für verschiedene Asset-Typen
CREATE TABLE asset_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Benutzerdefinierte Felder für Assets
CREATE TABLE asset_custom_fields (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'date', 'boolean', 'select'
    options JSONB, -- Für Auswahlfelder
    is_required BOOLEAN DEFAULT FALSE,
    asset_type VARCHAR(50) NOT NULL, -- 'device', 'license', 'certificate', 'accessory'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, asset_type)
);

-- Werte für benutzerdefinierte Felder
CREATE TABLE asset_custom_field_values (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL,
    asset_type VARCHAR(50) NOT NULL, -- 'device', 'license', 'certificate', 'accessory'
    field_id INTEGER NOT NULL REFERENCES asset_custom_fields(id) ON DELETE CASCADE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(asset_id, asset_type, field_id)
);

-- Systemeinstellungen
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) NOT NULL, -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger für Aktualisierung der Zeitstempel
CREATE TRIGGER update_categories_timestamp
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_manufacturers_timestamp
    BEFORE UPDATE ON manufacturers
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_vendors_timestamp
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_suppliers_timestamp
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_locations_timestamp
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_departments_timestamp
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_rooms_timestamp
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_asset_tags_timestamp
    BEFORE UPDATE ON asset_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_asset_custom_fields_timestamp
    BEFORE UPDATE ON asset_custom_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_asset_custom_field_values_timestamp
    BEFORE UPDATE ON asset_custom_field_values
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_system_settings_timestamp
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- Audit-Logging Trigger
CREATE TRIGGER categories_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER manufacturers_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON manufacturers
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER vendors_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER suppliers_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER locations_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER departments_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER rooms_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER asset_tags_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON asset_tags
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER asset_custom_fields_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON asset_custom_fields
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER asset_custom_field_values_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON asset_custom_field_values
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER system_settings_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

-- Indizes für effiziente Abfragen
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_locations_city ON locations(city);
CREATE INDEX idx_departments_location_id ON departments(location_id);
CREATE INDEX idx_rooms_location_id ON rooms(location_id);
CREATE INDEX idx_rooms_department_id ON rooms(department_id);
CREATE INDEX idx_asset_custom_fields_asset_type ON asset_custom_fields(asset_type);
CREATE INDEX idx_asset_custom_field_values_asset_id ON asset_custom_field_values(asset_id, asset_type);
CREATE INDEX idx_asset_custom_field_values_field_id ON asset_custom_field_values(field_id);
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

-- Standardkategorien einfügen
INSERT INTO categories (name, description, type, icon, color) VALUES
-- Gerätekategorien
('Laptop', 'Tragbare Computer', 'device', 'laptop', '#4CAF50'),
('Desktop', 'Stationäre Computer', 'device', 'desktop', '#2196F3'),
('Tablet', 'Tablet-Computer', 'device', 'tablet', '#9C27B0'),
('Smartphone', 'Mobile Telefone', 'device', 'smartphone', '#FF9800'),
('Server', 'Server-Systeme', 'device', 'server', '#795548'),
('Netzwerk', 'Netzwerkgeräte', 'device', 'network', '#607D8B'),
('Drucker', 'Drucker und Scanner', 'device', 'printer', '#E91E63'),
('Monitor', 'Bildschirme', 'device', 'monitor', '#00BCD4'),
('Peripherie', 'Tastaturen, Mäuse, etc.', 'device', 'keyboard', '#FFEB3B'),
('Sonstiges', 'Andere Geräte', 'device', 'devices', '#9E9E9E'),

-- Lizenzkategorien
('Betriebssystem', 'Betriebssystem-Lizenzen', 'license', 'os', '#4CAF50'),
('Office', 'Office-Anwendungen', 'license', 'office', '#2196F3'),
('Entwicklung', 'Entwicklungstools', 'license', 'code', '#9C27B0'),
('Design', 'Design- und Grafiksoftware', 'license', 'palette', '#FF9800'),
('Sicherheit', 'Sicherheitssoftware', 'license', 'security', '#795548'),
('Datenbank', 'Datenbanklizenzen', 'license', 'database', '#607D8B'),
('Cloud', 'Cloud-Dienste', 'license', 'cloud', '#E91E63'),
('Sonstiges', 'Andere Lizenzen', 'license', 'key', '#9E9E9E'),

-- Zertifikatskategorien
('SSL', 'SSL-Zertifikate', 'certificate', 'ssl', '#4CAF50'),
('Code-Signing', 'Code-Signierung', 'certificate', 'code', '#2196F3'),
('Client', 'Client-Zertifikate', 'certificate', 'user', '#9C27B0'),
('Server', 'Server-Zertifikate', 'certificate', 'server', '#FF9800'),
('Sonstiges', 'Andere Zertifikate', 'certificate', 'certificate', '#9E9E9E'),

-- Zubehörkategorien
('Ladegerät', 'Netzteile und Ladegeräte', 'accessory', 'power', '#4CAF50'),
('Docking Station', 'Docking-Stationen', 'accessory', 'dock', '#2196F3'),
('Tasche', 'Taschen und Hüllen', 'accessory', 'bag', '#9C27B0'),
('Maus', 'Mäuse und Zeigegeräte', 'accessory', 'mouse', '#FF9800'),
('Tastatur', 'Tastaturen', 'accessory', 'keyboard', '#795548'),
('Monitorhalterung', 'Halterungen für Monitore', 'accessory', 'mount', '#607D8B'),
('Sonstiges', 'Anderes Zubehör', 'accessory', 'accessory', '#9E9E9E')
ON CONFLICT (name) DO NOTHING;

-- Standardstandorte einfügen
INSERT INTO locations (name, description, city, country) VALUES
('Hauptsitz', 'Hauptsitz der Firma', 'Berlin', 'Deutschland'),
('Niederlassung Hamburg', 'Niederlassung in Hamburg', 'Hamburg', 'Deutschland'),
('Niederlassung München', 'Niederlassung in München', 'München', 'Deutschland'),
('Ausland Niederlassung', 'Auslandsniederlassung', 'Wien', 'Österreich')
ON CONFLICT (name) DO NOTHING;

-- Standardabteilungen einfügen
INSERT INTO departments (name, description) VALUES
('IT', 'Informationstechnologie'),
('HR', 'Personalwesen'),
('Finanzen', 'Finanzabteilung'),
('Marketing', 'Marketing und Kommunikation'),
('Vertrieb', 'Vertrieb und Verkauf'),
('Entwicklung', 'Softwareentwicklung'),
('Support', 'Technischer Support'),
('Verwaltung', 'Allgemeine Verwaltung')
ON CONFLICT (name) DO NOTHING;

-- Standardhersteller einfügen
INSERT INTO manufacturers (name, description, website) VALUES
('Dell', 'Dell Technologies', 'https://www.dell.com'),
('HP', 'Hewlett Packard', 'https://www.hp.com'),
('Lenovo', 'Lenovo Group', 'https://www.lenovo.com'),
('Apple', 'Apple Inc.', 'https://www.apple.com'),
('Microsoft', 'Microsoft Corporation', 'https://www.microsoft.com'),
('Samsung', 'Samsung Electronics', 'https://www.samsung.com'),
('Cisco', 'Cisco Systems', 'https://www.cisco.com'),
('Logitech', 'Logitech International', 'https://www.logitech.com')
ON CONFLICT (name) DO NOTHING;

-- Standardlieferanten einfügen
INSERT INTO vendors (name, description, website) VALUES
('Microsoft', 'Microsoft Corporation', 'https://www.microsoft.com'),
('Adobe', 'Adobe Inc.', 'https://www.adobe.com'),
('Autodesk', 'Autodesk Inc.', 'https://www.autodesk.com'),
('Oracle', 'Oracle Corporation', 'https://www.oracle.com'),
('VMware', 'VMware Inc.', 'https://www.vmware.com'),
('Symantec', 'Symantec Corporation', 'https://www.symantec.com'),
('Red Hat', 'Red Hat Inc.', 'https://www.redhat.com'),
('SAP', 'SAP SE', 'https://www.sap.com')
ON CONFLICT (name) DO NOTHING;

-- Standardlieferanten einfügen
INSERT INTO suppliers (name, description, website) VALUES
('CDW', 'CDW Corporation', 'https://www.cdw.com'),
('Ingram Micro', 'Ingram Micro Inc.', 'https://www.ingrammicro.com'),
('Tech Data', 'Tech Data Corporation', 'https://www.techdata.com'),
('Synnex', 'Synnex Corporation', 'https://www.synnex.com'),
('Arrow Electronics', 'Arrow Electronics Inc.', 'https://www.arrow.com'),
('Avnet', 'Avnet Inc.', 'https://www.avnet.com'),
('Dell EMC', 'Dell EMC', 'https://www.dellemc.com'),
('HP Inc.', 'HP Inc.', 'https://www.hp.com')
ON CONFLICT (name) DO NOTHING;

-- Standard-Asset-Tags einfügen
INSERT INTO asset_tags (name, color, description) VALUES
('Wichtig', '#FF0000', 'Wichtige Assets mit hoher Priorität'),
('Neu', '#00FF00', 'Neu angeschaffte Assets'),
('Alt', '#0000FF', 'Ältere Assets'),
('Leihgerät', '#FFFF00', 'Ausgeliehene Assets'),
('Reserve', '#FF00FF', 'Reserve-Assets'),
('Defekt', '#00FFFF', 'Defekte Assets'),
('Wartung', '#FFA500', 'Assets in Wartung'),
('Entsorgt', '#808080', 'Zu entsorgende Assets')
ON CONFLICT (name) DO NOTHING;

-- Standard-Systemeinstellungen einfügen
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('system.name', 'ATLAS', 'string', 'Name des Systems', true),
('system.version', '1.0.0', 'string', 'Version des Systems', true),
('system.company', 'Meine Firma GmbH', 'string', 'Name der Firma', true),
('system.logo', '/assets/logo.png', 'string', 'Pfad zum Logo', true),
('system.theme', 'dark', 'string', 'Standard-Theme (dark/light)', true),
('system.language', 'de', 'string', 'Standardsprache', true),
('system.timezone', 'Europe/Berlin', 'string', 'Standardzeitzone', true),
('system.date_format', 'DD.MM.YYYY', 'string', 'Datumsformat', true),
('system.time_format', 'HH:mm', 'string', 'Zeitformat', true),
('system.currency', 'EUR', 'string', 'Standardwährung', true),
('system.license_expiry_warning_days', '30', 'number', 'Tage vor Ablauf der Lizenz für Warnung', true),
('system.certificate_expiry_warning_days', '30', 'number', 'Tage vor Ablauf des Zertifikats für Warnung', true),
('system.inventory_reminder_days', '7', 'number', 'Tage vor Inventur für Erinnerung', true),
('system.enable_email_notifications', 'true', 'boolean', 'E-Mail-Benachrichtigungen aktivieren', true),
('system.enable_sms_notifications', 'false', 'boolean', 'SMS-Benachrichtigungen aktivieren', true),
('system.enable_audit_logging', 'true', 'boolean', 'Audit-Logging aktivieren', false),
('system.max_login_attempts', '5', 'number', 'Maximale Anzahl von Anmeldeversuchen', false),
('system.password_expiry_days', '90', 'number', 'Tage bis zum Ablauf des Passworts', false),
('system.require_two_factor', 'false', 'boolean', 'Zwei-Faktor-Authentifizierung erforderlich', false),
('system.maintenance_mode', 'false', 'boolean', 'Wartungsmodus aktivieren', true)
ON CONFLICT (setting_key) DO NOTHING;
