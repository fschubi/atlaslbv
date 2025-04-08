-- ATLAS Reporting und Export
-- Version: 1.0.0
-- Datum: 2024-04-07
-- Teil 12: Reporting und Export

-- Bestehende Tabellen löschen (in umgekehrter Reihenfolge wegen Fremdschlüsseln)
DROP TABLE IF EXISTS report_schedules CASCADE;
DROP TABLE IF EXISTS report_recipients CASCADE;
DROP TABLE IF EXISTS report_exports CASCADE;
DROP TABLE IF EXISTS report_templates CASCADE;

-- Report-Templates
CREATE TABLE report_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    query TEXT NOT NULL,
    parameters JSONB,
    format VARCHAR(50) NOT NULL, -- 'csv', 'excel', 'pdf', 'json'
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report-Exporte
CREATE TABLE report_exports (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES report_templates(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    parameters JSONB,
    format VARCHAR(50) NOT NULL, -- 'csv', 'excel', 'pdf', 'json'
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    file_path VARCHAR(255),
    file_size INTEGER,
    error_message TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report-Empfänger
CREATE TABLE report_recipients (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES report_templates(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    notification_type VARCHAR(50) NOT NULL, -- 'email', 'in_app'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_id, user_id, notification_type)
);

-- Report-Zeitpläne
CREATE TABLE report_schedules (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES report_templates(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    schedule_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'custom'
    schedule_rule VARCHAR(255) NOT NULL, -- Cron-Format für benutzerdefinierte Zeitpläne
    parameters JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger für Aktualisierung der Zeitstempel
CREATE TRIGGER update_report_templates_timestamp
    BEFORE UPDATE ON report_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_report_exports_timestamp
    BEFORE UPDATE ON report_exports
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_report_recipients_timestamp
    BEFORE UPDATE ON report_recipients
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_report_schedules_timestamp
    BEFORE UPDATE ON report_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- Audit-Logging Trigger
CREATE TRIGGER report_templates_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON report_templates
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER report_exports_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON report_exports
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER report_recipients_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON report_recipients
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER report_schedules_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON report_schedules
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

-- Indizes für effiziente Abfragen
CREATE INDEX idx_report_templates_format ON report_templates(format);
CREATE INDEX idx_report_exports_template_id ON report_exports(template_id);
CREATE INDEX idx_report_exports_status ON report_exports(status);
CREATE INDEX idx_report_exports_created_by ON report_exports(created_by);
CREATE INDEX idx_report_recipients_report_id ON report_recipients(report_id);
CREATE INDEX idx_report_recipients_user_id ON report_recipients(user_id);
CREATE INDEX idx_report_schedules_report_id ON report_schedules(report_id);
CREATE INDEX idx_report_schedules_schedule_type ON report_schedules(schedule_type);
CREATE INDEX idx_report_schedules_next_run_at ON report_schedules(next_run_at);

-- Standard-Report-Templates einfügen
INSERT INTO report_templates (name, description, query, format) VALUES
('Gerätebestand', 'Übersicht aller Geräte mit Details', 'SELECT * FROM devices ORDER BY name', 'excel'),
('Lizenzübersicht', 'Übersicht aller Lizenzen mit Status', 'SELECT * FROM licenses ORDER BY name', 'excel'),
('Inventurbericht', 'Detaillierter Inventurbericht', 'SELECT * FROM inventory_items ORDER BY name', 'pdf'),
('Audit-Log', 'System-Audit-Log der letzten 30 Tage', 'SELECT * FROM audit_log WHERE created_at >= NOW() - INTERVAL ''30 days'' ORDER BY created_at DESC', 'csv'),
('Benutzeraktivität', 'Übersicht der Benutzeraktivitäten', 'SELECT * FROM user_activities ORDER BY created_at DESC', 'excel'),
('Wartungshistorie', 'Historie aller Wartungstermine', 'SELECT * FROM maintenance_records ORDER BY maintenance_date DESC', 'pdf')
ON CONFLICT (name) DO NOTHING;
