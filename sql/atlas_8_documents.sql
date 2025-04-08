-- ATLAS Dokumentenverwaltung
-- Version: 1.0.0
-- Datum: 2024-04-07
-- Teil 8: Dokumentenverwaltung

-- Bestehende Tabellen löschen (in umgekehrter Reihenfolge wegen Fremdschlüsseln)
DROP TABLE IF EXISTS document_versions CASCADE;
DROP TABLE IF EXISTS document_attachments CASCADE;
DROP TABLE IF EXISTS document_categories CASCADE;
DROP TABLE IF EXISTS documents CASCADE;

-- Dokumentenkategorien
CREATE TABLE document_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dokumente
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES document_categories(id) ON DELETE SET NULL,
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL, -- in Bytes
    mime_type VARCHAR(100) NOT NULL,
    hash VARCHAR(64), -- SHA-256 Hash für Integritätsprüfung
    is_public BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dokumentanhänge (Verbindung zu Assets)
CREATE TABLE document_attachments (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL, -- 'device', 'license', 'certificate', 'accessory'
    asset_id INTEGER NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, asset_type, asset_id)
);

-- Dokumentversionen
CREATE TABLE document_versions (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL, -- in Bytes
    hash VARCHAR(64), -- SHA-256 Hash für Integritätsprüfung
    change_description TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, version_number)
);

-- Trigger für Aktualisierung der Zeitstempel
CREATE TRIGGER update_document_categories_timestamp
    BEFORE UPDATE ON document_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_documents_timestamp
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_document_attachments_timestamp
    BEFORE UPDATE ON document_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- Audit-Logging Trigger
CREATE TRIGGER document_categories_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON document_categories
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER documents_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER document_attachments_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON document_attachments
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER document_versions_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON document_versions
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

-- Indizes für effiziente Abfragen
CREATE INDEX idx_documents_category_id ON documents(category_id);
CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_document_attachments_document_id ON document_attachments(document_id);
CREATE INDEX idx_document_attachments_asset_type_asset_id ON document_attachments(asset_type, asset_id);
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);

-- Standard-Dokumentenkategorien einfügen
INSERT INTO document_categories (name, description, icon, color) VALUES
('Rechnungen', 'Rechnungen und Belege', 'receipt', '#FF0000'),
('Lieferscheine', 'Lieferscheine und Lieferbestätigungen', 'local_shipping', '#00FF00'),
('Handbücher', 'Benutzerhandbücher und Dokumentationen', 'menu_book', '#0000FF'),
('Garantien', 'Garantie- und Gewährleistungsunterlagen', 'verified', '#FFFF00'),
('Verträge', 'Verträge und Vereinbarungen', 'description', '#FF00FF'),
('Zertifikate', 'Zertifikate und Bescheinigungen', 'badge', '#00FFFF'),
('Lizenzen', 'Lizenzunterlagen und Aktivierungscodes', 'key', '#FFA500'),
('Wartung', 'Wartungsunterlagen und Serviceberichte', 'build', '#808080'),
('Schulungen', 'Schulungsunterlagen und Schulungszertifikate', 'school', '#800080'),
('Sonstiges', 'Sonstige Dokumente', 'folder', '#008080')
ON CONFLICT (name) DO NOTHING;
