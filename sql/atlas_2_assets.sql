-- ATLAS Asset-Management-Struktur
-- Version: 1.0.0
-- Datum: 2024-04-07
-- Teil 2: Asset-Management

-- Bestehende Asset-Tabellen löschen
DROP TABLE IF EXISTS accessory_history CASCADE;
DROP TABLE IF EXISTS accessories CASCADE;
DROP TABLE IF EXISTS device_history CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS licenses CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Kategorien Tabelle
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL, -- 'device', 'license', 'certificate', 'accessory'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Standorte Tabelle
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    zip_code VARCHAR(20),
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'Deutschland',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Abteilungen Tabelle
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location_id INTEGER REFERENCES locations(id),
    manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Räume Tabelle
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    floor VARCHAR(50),
    room_number VARCHAR(50),
    description TEXT,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Geräte Tabelle
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    location VARCHAR(100),
    purchase_date DATE,
    warranty_end DATE,
    notes TEXT,
    assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    last_checked_date TIMESTAMP WITH TIME ZONE,
    category_id INTEGER REFERENCES categories(id),
    room_id INTEGER REFERENCES rooms(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lizenzen Tabelle
CREATE TABLE licenses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    key_code VARCHAR(255) UNIQUE,
    vendor VARCHAR(100),
    purchase_date DATE,
    expiry_date DATE,
    seats INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    notes TEXT,
    category_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Zertifikate Tabelle
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    issuer VARCHAR(100),
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    notes TEXT,
    category_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Zubehör Tabelle
CREATE TABLE accessories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    location VARCHAR(100),
    purchase_date DATE,
    notes TEXT,
    assigned_to_device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
    assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Gerätehistorie Tabelle
CREATE TABLE device_history (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL,  -- zugewiesen, zurückgegeben, etc.
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    performed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Zubehörhistorie Tabelle
CREATE TABLE accessory_history (
    id SERIAL PRIMARY KEY,
    accessory_id INTEGER NOT NULL REFERENCES accessories(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL,  -- zugewiesen, zurückgegeben, etc.
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    performed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Trigger für Asset-Tabellen
CREATE TRIGGER update_categories_timestamp
    BEFORE UPDATE ON categories
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

CREATE TRIGGER update_devices_timestamp
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_licenses_timestamp
    BEFORE UPDATE ON licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_certificates_timestamp
    BEFORE UPDATE ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_accessories_timestamp
    BEFORE UPDATE ON accessories
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- Audit-Logging für Asset-Tabellen
CREATE TRIGGER devices_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER licenses_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON licenses
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER certificates_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER accessories_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON accessories
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

-- Indizes für Asset-Tabellen
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_departments_location ON departments(location_id);
CREATE INDEX idx_rooms_location ON rooms(location_id);
CREATE INDEX idx_rooms_location_number ON rooms(location_id, room_number, floor);

CREATE INDEX idx_devices_name ON devices(name);
CREATE INDEX idx_devices_type ON devices(type);
CREATE INDEX idx_devices_serial_number ON devices(serial_number);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_location ON devices(location);
CREATE INDEX idx_devices_assigned_to_user_id ON devices(assigned_to_user_id);
CREATE INDEX idx_devices_category_id ON devices(category_id);
CREATE INDEX idx_devices_room_id ON devices(room_id);

CREATE INDEX idx_licenses_name ON licenses(name);
CREATE INDEX idx_licenses_type ON licenses(type);
CREATE INDEX idx_licenses_key_code ON licenses(key_code);
CREATE INDEX idx_licenses_vendor ON licenses(vendor);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_expiry_date ON licenses(expiry_date);
CREATE INDEX idx_licenses_category_id ON licenses(category_id);

CREATE INDEX idx_certificates_name ON certificates(name);
CREATE INDEX idx_certificates_type ON certificates(type);
CREATE INDEX idx_certificates_issuer ON certificates(issuer);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_valid_to ON certificates(valid_to);
CREATE INDEX idx_certificates_category_id ON certificates(category_id);

CREATE INDEX idx_accessories_name ON accessories(name);
CREATE INDEX idx_accessories_type ON accessories(type);
CREATE INDEX idx_accessories_serial_number ON accessories(serial_number);
CREATE INDEX idx_accessories_status ON accessories(status);
CREATE INDEX idx_accessories_location ON accessories(location);
CREATE INDEX idx_accessories_assigned_to_device_id ON accessories(assigned_to_device_id);
CREATE INDEX idx_accessories_assigned_to_user_id ON accessories(assigned_to_user_id);
CREATE INDEX idx_accessories_category_id ON accessories(category_id);

-- Standardkategorien
INSERT INTO categories (name, description, type) VALUES
    ('Desktop-PC', 'Standard Desktop Computer', 'device'),
    ('Laptop', 'Mobile Computer', 'device'),
    ('Server', 'Server', 'device'),
    ('Monitor', 'Bildschirme', 'device'),
    ('Drucker', 'Drucker und Multifunktionsgeräte', 'device'),
    ('Netzwerkgerät', 'Router, Switches, Access Points', 'device'),
    ('Smartphone', 'Mobiltelefone', 'device'),
    ('Tablet', 'Tablet-Computer', 'device'),

    ('Betriebssystem', 'Windows, Linux, macOS', 'license'),
    ('Office-Paket', 'Microsoft Office, LibreOffice', 'license'),
    ('Entwicklungsumgebung', 'Visual Studio, IntelliJ', 'license'),
    ('Grafikdesign', 'Adobe Creative Cloud, CorelDRAW', 'license'),
    ('Antivirenprogramm', 'Antivirensoftware', 'license'),
    ('Datenbanksystem', 'Oracle, SQL Server, MySQL', 'license'),

    ('SSL-Zertifikat', 'Webserver-Zertifikate', 'certificate'),
    ('Code-Signing', 'Zertifikate zum Signieren von Code', 'certificate'),
    ('S/MIME', 'E-Mail-Verschlüsselungszertifikate', 'certificate'),
    ('VPN', 'Zertifikate für VPN-Zugang', 'certificate'),

    ('Tastatur', 'Externe Tastaturen', 'accessory'),
    ('Maus', 'Externe Mäuse', 'accessory'),
    ('Headset', 'Kopfhörer mit Mikrofon', 'accessory'),
    ('Webcam', 'Externe Kameras', 'accessory'),
    ('Dockingstation', 'Laptop-Dockingstations', 'accessory'),
    ('USB-Stick', 'Speichermedien', 'accessory'),
    ('Kabeladapter', 'Verschiedene Kabeladapter', 'accessory')
ON CONFLICT DO NOTHING;
