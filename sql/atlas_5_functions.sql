-- ATLAS Statistik-Funktionen
-- Version: 1.0.0
-- Datum: 2024-04-07
-- Teil 5: Statistik-Funktionen

-- Funktion: Gerätestatistik nach Status
CREATE OR REPLACE FUNCTION get_device_status_stats()
RETURNS TABLE (
    status VARCHAR(20),
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT d.status, COUNT(*) as count
    FROM devices d
    GROUP BY d.status
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Gerätestatistik nach Kategorie
CREATE OR REPLACE FUNCTION get_device_category_stats()
RETURNS TABLE (
    category_name VARCHAR(100),
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.name, COUNT(*) as count
    FROM devices d
    LEFT JOIN categories c ON d.category_id = c.id
    GROUP BY c.name
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Lizenzstatistik nach Ablaufstatus
CREATE OR REPLACE FUNCTION get_license_expiry_stats()
RETURNS TABLE (
    expiry_status VARCHAR(20),
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN expiry_date IS NULL THEN 'permanent'
            WHEN expiry_date < CURRENT_DATE THEN 'expired'
            WHEN expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
            ELSE 'active'
        END as expiry_status,
        COUNT(*) as count
    FROM licenses
    GROUP BY expiry_status
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Zertifikatstatistik nach Ablaufstatus
CREATE OR REPLACE FUNCTION get_certificate_expiry_stats()
RETURNS TABLE (
    expiry_status VARCHAR(20),
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN valid_to < CURRENT_DATE THEN 'expired'
            WHEN valid_to < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
            ELSE 'active'
        END as expiry_status,
        COUNT(*) as count
    FROM certificates
    GROUP BY expiry_status
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Ticketstatistik nach Status und Priorität
CREATE OR REPLACE FUNCTION get_ticket_stats()
RETURNS TABLE (
    ticket_status VARCHAR(20),
    priority VARCHAR(20),
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.status, t.priority, COUNT(*) as count
    FROM tickets t
    GROUP BY t.status, t.priority
    ORDER BY t.status, t.priority;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Inventarstatistik der letzten Session
CREATE OR REPLACE FUNCTION get_last_inventory_stats()
RETURNS TABLE (
    status VARCHAR(20),
    device_count BIGINT,
    accessory_count BIGINT
) AS $$
DECLARE
    last_session_id INTEGER;
BEGIN
    -- Letzte aktive oder abgeschlossene Session finden
    SELECT id INTO last_session_id
    FROM inventory_sessions
    WHERE status IN ('active', 'completed')
    ORDER BY start_date DESC
    LIMIT 1;

    RETURN QUERY
    SELECT
        ic.status,
        COUNT(DISTINCT ic.device_id) as device_count,
        COUNT(DISTINCT ic.accessory_id) as accessory_count
    FROM inventory_checks ic
    WHERE ic.session_id = last_session_id
    GROUP BY ic.status
    ORDER BY ic.status;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Benutzerstatistik nach zugewiesenen Assets
CREATE OR REPLACE FUNCTION get_user_asset_stats()
RETURNS TABLE (
    username VARCHAR(50),
    device_count BIGINT,
    accessory_count BIGINT,
    total_assets BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.username,
        COUNT(DISTINCT d.id) as device_count,
        COUNT(DISTINCT a.id) as accessory_count,
        COUNT(DISTINCT d.id) + COUNT(DISTINCT a.id) as total_assets
    FROM users u
    LEFT JOIN devices d ON u.id = d.assigned_to_user_id
    LEFT JOIN accessories a ON u.id = a.assigned_to_user_id
    GROUP BY u.username
    ORDER BY total_assets DESC;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Standortstatistik nach Assets
CREATE OR REPLACE FUNCTION get_location_asset_stats()
RETURNS TABLE (
    location_name VARCHAR(100),
    device_count BIGINT,
    accessory_count BIGINT,
    total_assets BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.name as location_name,
        COUNT(DISTINCT d.id) as device_count,
        COUNT(DISTINCT a.id) as accessory_count,
        COUNT(DISTINCT d.id) + COUNT(DISTINCT a.id) as total_assets
    FROM locations l
    LEFT JOIN rooms r ON l.id = r.location_id
    LEFT JOIN devices d ON r.id = d.room_id
    LEFT JOIN accessories a ON a.location = l.name
    GROUP BY l.name
    ORDER BY total_assets DESC;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Abteilungsstatistik nach Assets
CREATE OR REPLACE FUNCTION get_department_asset_stats()
RETURNS TABLE (
    department_name VARCHAR(100),
    user_count BIGINT,
    device_count BIGINT,
    accessory_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.name as department_name,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT dev.id) as device_count,
        COUNT(DISTINCT a.id) as accessory_count
    FROM departments d
    LEFT JOIN user_profiles up ON d.name = up.department
    LEFT JOIN users u ON up.user_id = u.id
    LEFT JOIN devices dev ON u.id = dev.assigned_to_user_id
    LEFT JOIN accessories a ON u.id = a.assigned_to_user_id
    GROUP BY d.name
    ORDER BY user_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Wartungsstatistik nach Gerätetyp
CREATE OR REPLACE FUNCTION get_maintenance_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    device_type VARCHAR(50),
    total_tickets BIGINT,
    open_tickets BIGINT,
    resolved_tickets BIGINT,
    avg_resolution_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    WITH maintenance_tickets AS (
        SELECT
            d.type as device_type,
            t.status,
            t.created_at,
            t.updated_at,
            CASE
                WHEN t.status = 'closed' THEN
                    t.updated_at - t.created_at
                ELSE NULL
            END as resolution_time
        FROM tickets t
        JOIN devices d ON t.device_id = d.id
        WHERE t.type = 'maintenance'
        AND t.created_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    )
    SELECT
        mt.device_type,
        COUNT(*) as total_tickets,
        COUNT(*) FILTER (WHERE status = 'open') as open_tickets,
        COUNT(*) FILTER (WHERE status = 'closed') as resolved_tickets,
        AVG(resolution_time) as avg_resolution_time
    FROM maintenance_tickets mt
    GROUP BY mt.device_type
    ORDER BY total_tickets DESC;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Dashboard-Statistik (Zusammenfassung)
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    metric_name VARCHAR(50),
    metric_value BIGINT,
    metric_change NUMERIC,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY

    -- Gesamtzahl aktiver Geräte
    SELECT
        'active_devices'::VARCHAR(50) as metric_name,
        COUNT(*)::BIGINT as metric_value,
        0::NUMERIC as metric_change,
        NOW() as last_updated
    FROM devices
    WHERE status = 'active'

    UNION ALL

    -- Gesamtzahl aktiver Lizenzen
    SELECT
        'active_licenses'::VARCHAR(50),
        COUNT(*)::BIGINT,
        0::NUMERIC,
        NOW()
    FROM licenses
    WHERE status = 'active'

    UNION ALL

    -- Gesamtzahl aktiver Zertifikate
    SELECT
        'active_certificates'::VARCHAR(50),
        COUNT(*)::BIGINT,
        0::NUMERIC,
        NOW()
    FROM certificates
    WHERE status = 'active'

    UNION ALL

    -- Offene Tickets
    SELECT
        'open_tickets'::VARCHAR(50),
        COUNT(*)::BIGINT,
        0::NUMERIC,
        NOW()
    FROM tickets
    WHERE status = 'open'

    UNION ALL

    -- Ablaufende Lizenzen (nächste 30 Tage)
    SELECT
        'expiring_licenses'::VARCHAR(50),
        COUNT(*)::BIGINT,
        0::NUMERIC,
        NOW()
    FROM licenses
    WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'

    UNION ALL

    -- Ablaufende Zertifikate (nächste 30 Tage)
    SELECT
        'expiring_certificates'::VARCHAR(50),
        COUNT(*)::BIGINT,
        0::NUMERIC,
        NOW()
    FROM certificates
    WHERE valid_to BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'

    ORDER BY metric_name;
END;
$$ LANGUAGE plpgsql;
