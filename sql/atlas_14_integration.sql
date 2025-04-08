-- ATLAS Externe Systemintegrationen
-- Version: 1.0.0
-- Datum: 2024-04-07
-- Teil 14: Externe Systemintegrationen

-- Bestehende Tabellen löschen (in umgekehrter Reihenfolge wegen Fremdschlüsseln)
DROP TABLE IF EXISTS integration_sync_logs CASCADE;
DROP TABLE IF EXISTS integration_mappings CASCADE;
DROP TABLE IF EXISTS integration_configs CASCADE;

-- Integrations-Konfigurationen
CREATE TABLE integration_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    system_type VARCHAR(50) NOT NULL, -- 'active_directory', 'email', 'ldap', 'sso', 'api'
    config_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sync_interval INTEGER, -- in Minuten
    last_sync_at TIMESTAMP WITH TIME ZONE,
    next_sync_at TIMESTAMP WITH TIME ZONE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Integrations-Mappings
CREATE TABLE integration_mappings (
    id SERIAL PRIMARY KEY,
    config_id INTEGER REFERENCES integration_configs(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL, -- 'user', 'group', 'device', 'license'
    source_id VARCHAR(255) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'user', 'group', 'device', 'license'
    target_id INTEGER NOT NULL,
    mapping_data JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(config_id, source_type, source_id)
);

-- Integrations-Synchronisations-Logs
CREATE TABLE integration_sync_logs (
    id SERIAL PRIMARY KEY,
    config_id INTEGER REFERENCES integration_configs(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'manual'
    status VARCHAR(20) NOT NULL, -- 'started', 'completed', 'failed'
    items_processed INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger für Aktualisierung der Zeitstempel
CREATE TRIGGER update_integration_configs_timestamp
    BEFORE UPDATE ON integration_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_integration_mappings_timestamp
    BEFORE UPDATE ON integration_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_integration_sync_logs_timestamp
    BEFORE UPDATE ON integration_sync_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- Audit-Logging Trigger
CREATE TRIGGER integration_configs_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON integration_configs
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER integration_mappings_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON integration_mappings
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER integration_sync_logs_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON integration_sync_logs
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

-- Indizes für effiziente Abfragen
CREATE INDEX idx_integration_configs_system_type ON integration_configs(system_type);
CREATE INDEX idx_integration_configs_last_sync_at ON integration_configs(last_sync_at);
CREATE INDEX idx_integration_configs_next_sync_at ON integration_configs(next_sync_at);
CREATE INDEX idx_integration_mappings_config_id ON integration_mappings(config_id);
CREATE INDEX idx_integration_mappings_source_type_source_id ON integration_mappings(source_type, source_id);
CREATE INDEX idx_integration_mappings_target_type_target_id ON integration_mappings(target_type, target_id);
CREATE INDEX idx_integration_sync_logs_config_id ON integration_sync_logs(config_id);
CREATE INDEX idx_integration_sync_logs_sync_type ON integration_sync_logs(sync_type);
CREATE INDEX idx_integration_sync_logs_status ON integration_sync_logs(status);
CREATE INDEX idx_integration_sync_logs_started_at ON integration_sync_logs(started_at);

-- Funktionen für Systemintegrationen

-- Funktion zum Aktualisieren des nächsten Synchronisationszeitpunkts
CREATE OR REPLACE FUNCTION update_next_sync_time(
    p_config_id INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE integration_configs
    SET
        next_sync_at = CURRENT_TIMESTAMP + (sync_interval || ' minutes')::INTERVAL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_config_id
    AND sync_interval IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Funktion zum Erstellen eines Synchronisations-Logs
CREATE OR REPLACE FUNCTION create_integration_sync_log(
    p_config_id INTEGER,
    p_sync_type VARCHAR,
    p_status VARCHAR,
    p_items_processed INTEGER DEFAULT 0,
    p_items_failed INTEGER DEFAULT 0,
    p_error_message TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_log_id INTEGER;
BEGIN
    INSERT INTO integration_sync_logs (
        config_id,
        sync_type,
        status,
        items_processed,
        items_failed,
        error_message,
        started_at,
        completed_at
    ) VALUES (
        p_config_id,
        p_sync_type,
        p_status,
        p_items_processed,
        p_items_failed,
        p_error_message,
        CASE WHEN p_status = 'started' THEN CURRENT_TIMESTAMP ELSE NULL END,
        CASE WHEN p_status IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE NULL END
    )
    RETURNING id INTO v_log_id;

    -- Aktualisiere last_sync_at in integration_configs
    UPDATE integration_configs
    SET last_sync_at = CURRENT_TIMESTAMP
    WHERE id = p_config_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Standard-Integrations-Konfigurationen einfügen
INSERT INTO integration_configs (name, description, system_type, config_data) VALUES
('Active Directory', 'Integration mit Active Directory für Benutzer und Gruppen', 'active_directory', '{"server": "ldap://dc.example.com", "base_dn": "DC=example,DC=com", "sync_users": true, "sync_groups": true}'),
('E-Mail-Server', 'Integration mit Exchange/Office 365', 'email', '{"server": "outlook.office365.com", "protocol": "imap", "sync_contacts": true, "sync_calendar": true}'),
('SSO-Provider', 'Integration mit Single Sign-On Provider', 'sso', '{"provider": "azure_ad", "tenant_id": "example-tenant", "client_id": "example-client"}'),
('API-Integration', 'Integration mit externen APIs', 'api', '{"base_url": "https://api.example.com", "auth_type": "oauth2", "endpoints": ["users", "devices"]}')
ON CONFLICT (name) DO NOTHING;
