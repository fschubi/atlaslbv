-- ATLAS Inventar- und Ticket-System
-- Version: 1.0.0
-- Datum: 2024-04-07
-- Teil 3: Inventar und Tickets

-- Bestehende Tabellen löschen
DROP TABLE IF EXISTS ticket_attachments CASCADE;
DROP TABLE IF EXISTS ticket_comments CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS inventory_checks CASCADE;
DROP TABLE IF EXISTS inventory_sessions CASCADE;
DROP TABLE IF EXISTS todos CASCADE;

-- Inventar-Session Tabelle
CREATE TABLE inventory_sessions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    notes TEXT,
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventarprüfung Tabelle
CREATE TABLE inventory_checks (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
    device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
    accessory_id INTEGER REFERENCES accessories(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, -- 'verified', 'missing', 'damaged', etc.
    location VARCHAR(100),
    checked_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    check_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_device_or_accessory CHECK (
        (device_id IS NOT NULL AND accessory_id IS NULL) OR
        (device_id IS NULL AND accessory_id IS NOT NULL)
    )
);

-- Aufgaben/Todos Tabelle
CREATE TABLE todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    due_date DATE,
    assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
    accessory_id INTEGER REFERENCES accessories(id) ON DELETE SET NULL,
    license_id INTEGER REFERENCES licenses(id) ON DELETE SET NULL,
    certificate_id INTEGER REFERENCES certificates(id) ON DELETE SET NULL,
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tickets Tabelle
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    type VARCHAR(50) NOT NULL,  -- 'problem', 'request', 'maintenance', etc.
    device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
    accessory_id INTEGER REFERENCES accessories(id) ON DELETE SET NULL,
    license_id INTEGER REFERENCES licenses(id) ON DELETE SET NULL,
    certificate_id INTEGER REFERENCES certificates(id) ON DELETE SET NULL,
    assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ticket-Kommentare Tabelle
CREATE TABLE ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ticket-Anhänge Tabelle
CREATE TABLE ticket_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100),
    uploaded_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger für Inventar und Tickets
CREATE TRIGGER update_inventory_sessions_timestamp
    BEFORE UPDATE ON inventory_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_inventory_checks_timestamp
    BEFORE UPDATE ON inventory_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_todos_timestamp
    BEFORE UPDATE ON todos
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_tickets_timestamp
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_ticket_comments_timestamp
    BEFORE UPDATE ON ticket_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- Audit-Logging für Inventar und Tickets
CREATE TRIGGER inventory_sessions_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON inventory_sessions
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER inventory_checks_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON inventory_checks
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER todos_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON todos
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER tickets_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

-- Indizes für Inventar und Tickets
CREATE INDEX idx_inventory_sessions_status ON inventory_sessions(status);
CREATE INDEX idx_inventory_sessions_dates ON inventory_sessions(start_date, end_date);
CREATE INDEX idx_inventory_sessions_created_by ON inventory_sessions(created_by_user_id);

CREATE INDEX idx_inventory_checks_session ON inventory_checks(session_id);
CREATE INDEX idx_inventory_checks_device ON inventory_checks(device_id);
CREATE INDEX idx_inventory_checks_accessory ON inventory_checks(accessory_id);
CREATE INDEX idx_inventory_checks_status ON inventory_checks(status);
CREATE INDEX idx_inventory_checks_location ON inventory_checks(location);
CREATE INDEX idx_inventory_checks_checked_by ON inventory_checks(checked_by_user_id);
CREATE INDEX idx_inventory_checks_date ON inventory_checks(check_date);

CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_assigned_to ON todos(assigned_to_user_id);
CREATE INDEX idx_todos_device ON todos(device_id);
CREATE INDEX idx_todos_accessory ON todos(accessory_id);
CREATE INDEX idx_todos_license ON todos(license_id);
CREATE INDEX idx_todos_certificate ON todos(certificate_id);
CREATE INDEX idx_todos_created_by ON todos(created_by_user_id);

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_type ON tickets(type);
CREATE INDEX idx_tickets_device ON tickets(device_id);
CREATE INDEX idx_tickets_accessory ON tickets(accessory_id);
CREATE INDEX idx_tickets_license ON tickets(license_id);
CREATE INDEX idx_tickets_certificate ON tickets(certificate_id);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to_user_id);
CREATE INDEX idx_tickets_created_by ON tickets(created_by_user_id);
CREATE INDEX idx_tickets_due_date ON tickets(due_date);

CREATE INDEX idx_ticket_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_user ON ticket_comments(user_id);

CREATE INDEX idx_ticket_attachments_ticket ON ticket_attachments(ticket_id);
CREATE INDEX idx_ticket_attachments_uploaded_by ON ticket_attachments(uploaded_by_user_id);
