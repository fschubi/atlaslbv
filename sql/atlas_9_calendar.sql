-- ATLAS Kalender- und Erinnerungsfunktionen
-- Version: 1.0.0
-- Datum: 2024-04-07
-- Teil 9: Kalender- und Erinnerungsfunktionen

-- Bestehende Tabellen löschen (in umgekehrter Reihenfolge wegen Fremdschlüsseln)
DROP TABLE IF EXISTS reminder_notifications CASCADE;
DROP TABLE IF EXISTS reminder_recipients CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS calendar_categories CASCADE;

-- Kalenderkategorien
CREATE TABLE calendar_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(20),
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Kalenderereignisse
CREATE TABLE calendar_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES calendar_categories(id) ON DELETE SET NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    location VARCHAR(255),
    url VARCHAR(255),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule VARCHAR(255), -- iCal RRULE Format
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Erinnerungen
CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    priority VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'cancelled', 'overdue'
    reminder_type VARCHAR(50) NOT NULL, -- 'maintenance', 'certificate', 'inventory', 'license', 'todo'
    reference_type VARCHAR(50), -- 'device', 'license', 'certificate', 'inventory', 'ticket'
    reference_id INTEGER,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Erinnerungsempfänger
CREATE TABLE reminder_recipients (
    id SERIAL PRIMARY KEY,
    reminder_id INTEGER REFERENCES reminders(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'email', 'in_app', 'sms'
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reminder_id, user_id, notification_type)
);

-- Erinnerungsbenachrichtigungen
CREATE TABLE reminder_notifications (
    id SERIAL PRIMARY KEY,
    reminder_id INTEGER REFERENCES reminders(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES reminder_recipients(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'email', 'in_app', 'sms'
    status VARCHAR(20) NOT NULL, -- 'pending', 'sent', 'failed', 'read'
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger für Aktualisierung der Zeitstempel
CREATE TRIGGER update_calendar_categories_timestamp
    BEFORE UPDATE ON calendar_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_calendar_events_timestamp
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_reminders_timestamp
    BEFORE UPDATE ON reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_reminder_notifications_timestamp
    BEFORE UPDATE ON reminder_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- Audit-Logging Trigger
CREATE TRIGGER calendar_categories_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON calendar_categories
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER calendar_events_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER reminders_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reminders
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER reminder_recipients_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reminder_recipients
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER reminder_notifications_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reminder_notifications
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

-- Indizes für effiziente Abfragen
CREATE INDEX idx_calendar_events_category_id ON calendar_events(category_id);
CREATE INDEX idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_end_date ON calendar_events(end_date);
CREATE INDEX idx_reminders_due_date ON reminders(due_date);
CREATE INDEX idx_reminders_status ON reminders(status);
CREATE INDEX idx_reminders_reminder_type ON reminders(reminder_type);
CREATE INDEX idx_reminders_reference_type_reference_id ON reminders(reference_type, reference_id);
CREATE INDEX idx_reminders_created_by ON reminders(created_by);
CREATE INDEX idx_reminders_assigned_to ON reminders(assigned_to);
CREATE INDEX idx_reminder_recipients_reminder_id ON reminder_recipients(reminder_id);
CREATE INDEX idx_reminder_recipients_user_id ON reminder_recipients(user_id);
CREATE INDEX idx_reminder_notifications_reminder_id ON reminder_notifications(reminder_id);
CREATE INDEX idx_reminder_notifications_recipient_id ON reminder_notifications(recipient_id);
CREATE INDEX idx_reminder_notifications_status ON reminder_notifications(status);

-- Standard-Kalenderkategorien einfügen
INSERT INTO calendar_categories (name, description, color, icon) VALUES
('Wartung', 'Wartungstermine und Service', '#FF0000', 'build'),
('Zertifikate', 'Zertifikatsabläufe und Verlängerungen', '#00FF00', 'badge'),
('Inventur', 'Inventurtermine und -planungen', '#0000FF', 'inventory'),
('Lizenzen', 'Lizenzabläufe und Verlängerungen', '#FFFF00', 'key'),
('ToDos', 'Aufgaben und Erinnerungen', '#FF00FF', 'check_circle'),
('Meetings', 'Besprechungen und Termine', '#00FFFF', 'people'),
('Schulungen', 'Schulungen und Trainings', '#FFA500', 'school'),
('Feiertage', 'Feiertage und freie Tage', '#808080', 'event'),
('Sonstiges', 'Sonstige Termine', '#800080', 'event_note')
ON CONFLICT (name) DO NOTHING;
