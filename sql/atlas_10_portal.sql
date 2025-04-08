-- ATLAS Self-Service-Portal
-- Version: 1.0.0
-- Datum: 2024-04-07
-- Teil 10: Self-Service-Portal

-- Bestehende Tabellen löschen (in umgekehrter Reihenfolge wegen Fremdschlüsseln)
DROP TABLE IF EXISTS portal_ticket_comments CASCADE;
DROP TABLE IF EXISTS portal_ticket_attachments CASCADE;
DROP TABLE IF EXISTS portal_tickets CASCADE;
DROP TABLE IF EXISTS portal_request_items CASCADE;
DROP TABLE IF EXISTS portal_requests CASCADE;
DROP TABLE IF EXISTS portal_categories CASCADE;

-- Portal-Kategorien
CREATE TABLE portal_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    parent_id INTEGER REFERENCES portal_categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Portal-Anfragen
CREATE TABLE portal_requests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES portal_categories(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Portal-Anfragepositionen
CREATE TABLE portal_request_items (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES portal_requests(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- 'device', 'license', 'accessory'
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Portal-Tickets
CREATE TABLE portal_tickets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES portal_categories(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'waiting', 'resolved', 'closed'
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Portal-Ticket-Anhänge
CREATE TABLE portal_ticket_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES portal_tickets(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Portal-Ticket-Kommentare
CREATE TABLE portal_ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES portal_tickets(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger für Aktualisierung der Zeitstempel
CREATE TRIGGER update_portal_categories_timestamp
    BEFORE UPDATE ON portal_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_portal_requests_timestamp
    BEFORE UPDATE ON portal_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_portal_request_items_timestamp
    BEFORE UPDATE ON portal_request_items
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_portal_tickets_timestamp
    BEFORE UPDATE ON portal_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_portal_ticket_attachments_timestamp
    BEFORE UPDATE ON portal_ticket_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_portal_ticket_comments_timestamp
    BEFORE UPDATE ON portal_ticket_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- Audit-Logging Trigger
CREATE TRIGGER portal_categories_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON portal_categories
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER portal_requests_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON portal_requests
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER portal_request_items_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON portal_request_items
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER portal_tickets_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON portal_tickets
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER portal_ticket_attachments_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON portal_ticket_attachments
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER portal_ticket_comments_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON portal_ticket_comments
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

-- Indizes für effiziente Abfragen
CREATE INDEX idx_portal_categories_parent_id ON portal_categories(parent_id);
CREATE INDEX idx_portal_requests_category_id ON portal_requests(category_id);
CREATE INDEX idx_portal_requests_status ON portal_requests(status);
CREATE INDEX idx_portal_requests_requested_by ON portal_requests(requested_by);
CREATE INDEX idx_portal_requests_approved_by ON portal_requests(approved_by);
CREATE INDEX idx_portal_request_items_request_id ON portal_request_items(request_id);
CREATE INDEX idx_portal_request_items_item_type_item_id ON portal_request_items(item_type, item_id);
CREATE INDEX idx_portal_tickets_category_id ON portal_tickets(category_id);
CREATE INDEX idx_portal_tickets_status ON portal_tickets(status);
CREATE INDEX idx_portal_tickets_created_by ON portal_tickets(created_by);
CREATE INDEX idx_portal_tickets_assigned_to ON portal_tickets(assigned_to);
CREATE INDEX idx_portal_ticket_attachments_ticket_id ON portal_ticket_attachments(ticket_id);
CREATE INDEX idx_portal_ticket_comments_ticket_id ON portal_ticket_comments(ticket_id);
CREATE INDEX idx_portal_ticket_comments_created_by ON portal_ticket_comments(created_by);

-- Standard-Portal-Kategorien einfügen
INSERT INTO portal_categories (name, description, icon) VALUES
('Geräteanfragen', 'Anfragen für neue Geräte oder Zubehör', 'devices'),
('Lizenzanfragen', 'Anfragen für Software-Lizenzen', 'key'),
('Support', 'Technischer Support und Hilfe', 'help'),
('Zugangsanfragen', 'Anfragen für Systemzugänge', 'lock'),
('Schulungen', 'Anfragen für Schulungen und Trainings', 'school'),
('Sonstiges', 'Sonstige Anfragen und Support', 'more_horiz')
ON CONFLICT (name) DO NOTHING;
