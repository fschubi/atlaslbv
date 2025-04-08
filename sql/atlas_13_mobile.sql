-- ATLAS Mobile Funktionen und Optimierungen
-- Version: 1.0.0
-- Datum: 2024-04-07
-- Teil 13: Mobile Funktionen und Optimierungen

-- Bestehende Tabellen löschen (in umgekehrter Reihenfolge wegen Fremdschlüsseln)
DROP TABLE IF EXISTS mobile_sync_logs CASCADE;
DROP TABLE IF EXISTS mobile_offline_data CASCADE;
DROP TABLE IF EXISTS mobile_devices CASCADE;

-- Mobile Geräte
CREATE TABLE mobile_devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50) NOT NULL, -- 'ios', 'android', 'web'
    device_model VARCHAR(255),
    os_version VARCHAR(50),
    app_version VARCHAR(50),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mobile Offline-Daten
CREATE TABLE mobile_offline_data (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES mobile_devices(id) ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL, -- 'devices', 'licenses', 'inventory', 'tickets'
    data_id INTEGER NOT NULL,
    data JSONB NOT NULL,
    sync_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'synced', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_id, data_type, data_id)
);

-- Mobile Synchronisations-Logs
CREATE TABLE mobile_sync_logs (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES mobile_devices(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'offline'
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
CREATE TRIGGER update_mobile_devices_timestamp
    BEFORE UPDATE ON mobile_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_mobile_offline_data_timestamp
    BEFORE UPDATE ON mobile_offline_data
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_mobile_sync_logs_timestamp
    BEFORE UPDATE ON mobile_sync_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- Audit-Logging Trigger
CREATE TRIGGER mobile_devices_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON mobile_devices
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER mobile_offline_data_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON mobile_offline_data
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER mobile_sync_logs_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON mobile_sync_logs
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

-- Indizes für effiziente Abfragen
CREATE INDEX idx_mobile_devices_user_id ON mobile_devices(user_id);
CREATE INDEX idx_mobile_devices_device_type ON mobile_devices(device_type);
CREATE INDEX idx_mobile_devices_last_sync_at ON mobile_devices(last_sync_at);
CREATE INDEX idx_mobile_offline_data_device_id ON mobile_offline_data(device_id);
CREATE INDEX idx_mobile_offline_data_data_type ON mobile_offline_data(data_type);
CREATE INDEX idx_mobile_offline_data_sync_status ON mobile_offline_data(sync_status);
CREATE INDEX idx_mobile_sync_logs_device_id ON mobile_sync_logs(device_id);
CREATE INDEX idx_mobile_sync_logs_sync_type ON mobile_sync_logs(sync_type);
CREATE INDEX idx_mobile_sync_logs_status ON mobile_sync_logs(status);
CREATE INDEX idx_mobile_sync_logs_started_at ON mobile_sync_logs(started_at);

-- Funktionen für mobile Optimierungen

-- Funktion zum Abrufen der minimalen Datenmenge für mobile Geräte
CREATE OR REPLACE FUNCTION get_mobile_minimal_data(
    p_device_id INTEGER,
    p_data_type VARCHAR
) RETURNS TABLE (
    id INTEGER,
    data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        md.data_id,
        md.data
    FROM mobile_offline_data md
    WHERE md.device_id = p_device_id
    AND md.data_type = p_data_type
    AND md.sync_status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- Funktion zum Aktualisieren des Synchronisationsstatus
CREATE OR REPLACE FUNCTION update_sync_status(
    p_device_id INTEGER,
    p_data_type VARCHAR,
    p_data_id INTEGER,
    p_status VARCHAR
) RETURNS VOID AS $$
BEGIN
    UPDATE mobile_offline_data
    SET
        sync_status = p_status,
        updated_at = CURRENT_TIMESTAMP
    WHERE device_id = p_device_id
    AND data_type = p_data_type
    AND data_id = p_data_id;
END;
$$ LANGUAGE plpgsql;

-- Funktion zum Erstellen eines Synchronisations-Logs
CREATE OR REPLACE FUNCTION create_sync_log(
    p_device_id INTEGER,
    p_sync_type VARCHAR,
    p_status VARCHAR,
    p_items_processed INTEGER DEFAULT 0,
    p_items_failed INTEGER DEFAULT 0,
    p_error_message TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_log_id INTEGER;
BEGIN
    INSERT INTO mobile_sync_logs (
        device_id,
        sync_type,
        status,
        items_processed,
        items_failed,
        error_message,
        started_at,
        completed_at
    ) VALUES (
        p_device_id,
        p_sync_type,
        p_status,
        p_items_processed,
        p_items_failed,
        p_error_message,
        CASE WHEN p_status = 'started' THEN CURRENT_TIMESTAMP ELSE NULL END,
        CASE WHEN p_status IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE NULL END
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;
