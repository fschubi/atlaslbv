-- ATLAS Onboarding und Übergabe
-- Version: 1.0.0
-- Datum: 2024-04-07
-- Teil 11: Onboarding und Übergabe

-- Bestehende Tabellen löschen (in umgekehrter Reihenfolge wegen Fremdschlüsseln)
DROP TABLE IF EXISTS onboarding_checklist_items CASCADE;
DROP TABLE IF EXISTS onboarding_checklists CASCADE;
DROP TABLE IF EXISTS onboarding_protocol_items CASCADE;
DROP TABLE IF EXISTS onboarding_protocols CASCADE;
DROP TABLE IF EXISTS onboarding_templates CASCADE;

-- Onboarding-Templates
CREATE TABLE onboarding_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'new_employee', 'device_handover', 'license_transfer', 'access_handover'
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding-Protokolle
CREATE TABLE onboarding_protocols (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    template_id INTEGER REFERENCES onboarding_templates(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'new_employee', 'device_handover', 'license_transfer', 'access_handover'
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'in_progress', 'completed', 'cancelled'
    initiator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    recipient_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding-Protokollpositionen
CREATE TABLE onboarding_protocol_items (
    id SERIAL PRIMARY KEY,
    protocol_id INTEGER REFERENCES onboarding_protocols(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    item_type VARCHAR(50) NOT NULL, -- 'device', 'license', 'access', 'document', 'training'
    item_id INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'skipped'
    completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding-Checklisten
CREATE TABLE onboarding_checklists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    template_id INTEGER REFERENCES onboarding_templates(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'new_employee', 'device_handover', 'license_transfer', 'access_handover'
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding-Checklistpositionen
CREATE TABLE onboarding_checklist_items (
    id SERIAL PRIMARY KEY,
    checklist_id INTEGER REFERENCES onboarding_checklists(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    item_type VARCHAR(50) NOT NULL, -- 'device', 'license', 'access', 'document', 'training'
    is_required BOOLEAN DEFAULT TRUE,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger für Aktualisierung der Zeitstempel
CREATE TRIGGER update_onboarding_templates_timestamp
    BEFORE UPDATE ON onboarding_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_onboarding_protocols_timestamp
    BEFORE UPDATE ON onboarding_protocols
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_onboarding_protocol_items_timestamp
    BEFORE UPDATE ON onboarding_protocol_items
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_onboarding_checklists_timestamp
    BEFORE UPDATE ON onboarding_checklists
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_onboarding_checklist_items_timestamp
    BEFORE UPDATE ON onboarding_checklist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- Audit-Logging Trigger
CREATE TRIGGER onboarding_templates_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON onboarding_templates
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER onboarding_protocols_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON onboarding_protocols
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER onboarding_protocol_items_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON onboarding_protocol_items
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER onboarding_checklists_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON onboarding_checklists
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER onboarding_checklist_items_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON onboarding_checklist_items
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

-- Indizes für effiziente Abfragen
CREATE INDEX idx_onboarding_templates_type ON onboarding_templates(type);
CREATE INDEX idx_onboarding_protocols_template_id ON onboarding_protocols(template_id);
CREATE INDEX idx_onboarding_protocols_type ON onboarding_protocols(type);
CREATE INDEX idx_onboarding_protocols_status ON onboarding_protocols(status);
CREATE INDEX idx_onboarding_protocols_initiator_id ON onboarding_protocols(initiator_id);
CREATE INDEX idx_onboarding_protocols_recipient_id ON onboarding_protocols(recipient_id);
CREATE INDEX idx_onboarding_protocol_items_protocol_id ON onboarding_protocol_items(protocol_id);
CREATE INDEX idx_onboarding_protocol_items_item_type_item_id ON onboarding_protocol_items(item_type, item_id);
CREATE INDEX idx_onboarding_checklists_template_id ON onboarding_checklists(template_id);
CREATE INDEX idx_onboarding_checklists_type ON onboarding_checklists(type);
CREATE INDEX idx_onboarding_checklist_items_checklist_id ON onboarding_checklist_items(checklist_id);
CREATE INDEX idx_onboarding_checklist_items_order_index ON onboarding_checklist_items(order_index);

-- Standard-Onboarding-Templates einfügen
INSERT INTO onboarding_templates (name, description, type) VALUES
('Neuer Mitarbeiter', 'Onboarding-Prozess für neue Mitarbeiter', 'new_employee'),
('Geräteübergabe', 'Protokoll für die Übergabe von Geräten', 'device_handover'),
('Lizenzübertragung', 'Protokoll für die Übertragung von Lizenzen', 'license_transfer'),
('Zugangsübergabe', 'Protokoll für die Übergabe von Systemzugängen', 'access_handover')
ON CONFLICT (name) DO NOTHING;
