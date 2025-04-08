-- ATLAS Views für häufige Abfragen
-- Version: 1.0.0
-- Datum: 2024-04-07
-- Teil 4: Views

-- Geräte-Inventar-Status View
CREATE OR REPLACE VIEW device_inventory_status AS
SELECT
    d.id AS device_id,
    d.name AS device_name,
    d.type AS device_type,
    d.serial_number,
    d.status,
    d.location,
    r.name AS room_name,
    r.room_number,
    l.name AS location_name,
    l.city,
    u.username AS assigned_to,
    ic.check_date AS last_inventory_check,
    ic.status AS last_inventory_status
FROM devices d
LEFT JOIN rooms r ON d.room_id = r.id
LEFT JOIN locations l ON r.location_id = l.id
LEFT JOIN users u ON d.assigned_to_user_id = u.id
LEFT JOIN inventory_checks ic ON d.id = ic.device_id
WHERE ic.id = (
    SELECT ic2.id
    FROM inventory_checks ic2
    WHERE ic2.device_id = d.id
    ORDER BY ic2.check_date DESC
    LIMIT 1
);

-- Lizenz-Ablauf-Status View
CREATE OR REPLACE VIEW license_expiry_status AS
SELECT
    l.id AS license_id,
    l.name AS license_name,
    l.type AS license_type,
    l.vendor,
    l.seats,
    l.status,
    l.expiry_date,
    CASE
        WHEN l.expiry_date IS NULL THEN 'permanent'
        WHEN l.expiry_date < CURRENT_DATE THEN 'expired'
        WHEN l.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
        ELSE 'active'
    END AS expiry_status,
    c.name AS category_name
FROM licenses l
LEFT JOIN categories c ON l.category_id = c.id;

-- Zertifikat-Ablauf-Status View
CREATE OR REPLACE VIEW certificate_expiry_status AS
SELECT
    c.id AS certificate_id,
    c.name AS certificate_name,
    c.type AS certificate_type,
    c.issuer,
    c.valid_from,
    c.valid_to,
    c.status,
    CASE
        WHEN c.valid_to < CURRENT_DATE THEN 'expired'
        WHEN c.valid_to < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
        ELSE 'active'
    END AS expiry_status,
    cat.name AS category_name
FROM certificates c
LEFT JOIN categories cat ON c.category_id = cat.id;

-- Ticket-Übersicht View
CREATE OR REPLACE VIEW ticket_overview AS
SELECT
    t.id AS ticket_id,
    t.title,
    t.status,
    t.priority,
    t.type,
    t.created_at,
    t.due_date,
    creator.username AS created_by,
    assignee.username AS assigned_to,
    COALESCE(d.name, a.name, l.name, c.name) AS asset_name,
    CASE
        WHEN d.id IS NOT NULL THEN 'device'
        WHEN a.id IS NOT NULL THEN 'accessory'
        WHEN l.id IS NOT NULL THEN 'license'
        WHEN c.id IS NOT NULL THEN 'certificate'
        ELSE NULL
    END AS asset_type,
    (SELECT COUNT(*) FROM ticket_comments tc WHERE tc.ticket_id = t.id) AS comment_count,
    (SELECT COUNT(*) FROM ticket_attachments ta WHERE ta.ticket_id = t.id) AS attachment_count
FROM tickets t
LEFT JOIN users creator ON t.created_by_user_id = creator.id
LEFT JOIN users assignee ON t.assigned_to_user_id = assignee.id
LEFT JOIN devices d ON t.device_id = d.id
LEFT JOIN accessories a ON t.accessory_id = a.id
LEFT JOIN licenses l ON t.license_id = l.id
LEFT JOIN certificates c ON t.certificate_id = c.id;

-- Geräte-Zubehör-Übersicht View
CREATE OR REPLACE VIEW device_accessories_view AS
SELECT
    d.id AS device_id,
    d.name AS device_name,
    d.type AS device_type,
    d.serial_number AS device_serial,
    a.id AS accessory_id,
    a.name AS accessory_name,
    a.type AS accessory_type,
    a.serial_number AS accessory_serial,
    a.status AS accessory_status,
    u.username AS assigned_to_user,
    r.name AS room_name,
    l.name AS location_name
FROM devices d
LEFT JOIN accessories a ON a.assigned_to_device_id = d.id
LEFT JOIN users u ON d.assigned_to_user_id = u.id
LEFT JOIN rooms r ON d.room_id = r.id
LEFT JOIN locations l ON r.location_id = l.id;

-- Benutzer-Asset-Übersicht View
CREATE OR REPLACE VIEW user_assets_view AS
SELECT
    u.id AS user_id,
    u.username,
    u.name AS full_name,
    d.id AS device_id,
    d.name AS device_name,
    d.type AS device_type,
    a.id AS accessory_id,
    a.name AS accessory_name,
    a.type AS accessory_type,
    r.name AS room_name,
    l.name AS location_name,
    dep.name AS department_name
FROM users u
LEFT JOIN devices d ON d.assigned_to_user_id = u.id
LEFT JOIN accessories a ON a.assigned_to_user_id = u.id
LEFT JOIN rooms r ON d.room_id = r.id
LEFT JOIN locations l ON r.location_id = l.id
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN departments dep ON up.department = dep.name;

-- Inventar-Status-Übersicht View
CREATE OR REPLACE VIEW inventory_status_view AS
SELECT
    inv_session.id AS session_id,
    inv_session.name AS session_name,
    inv_session.start_date,
    inv_session.end_date,
    inv_session.status AS session_status,
    COUNT(DISTINCT ic.id) AS total_checks,
    COUNT(DISTINCT ic.device_id) AS checked_devices,
    COUNT(DISTINCT ic.accessory_id) AS checked_accessories,
    COUNT(DISTINCT CASE WHEN ic.status = 'verified' THEN ic.id END) AS verified_items,
    COUNT(DISTINCT CASE WHEN ic.status = 'missing' THEN ic.id END) AS missing_items,
    COUNT(DISTINCT CASE WHEN ic.status = 'damaged' THEN ic.id END) AS damaged_items,
    creator.username AS created_by,
    inv_session.created_at
FROM inventory_sessions inv_session
LEFT JOIN inventory_checks ic ON ic.session_id = inv_session.id
LEFT JOIN users creator ON inv_session.created_by_user_id = creator.id
GROUP BY inv_session.id, inv_session.name, inv_session.start_date, inv_session.end_date, inv_session.status, creator.username, inv_session.created_at;

-- Ablaufende-Items-Übersicht View
CREATE OR REPLACE VIEW expiring_items_view AS
SELECT
    'license' AS item_type,
    l.id AS item_id,
    l.name AS item_name,
    l.type AS item_subtype,
    l.expiry_date AS expiry_date,
    l.status,
    c.name AS category_name,
    CASE
        WHEN l.expiry_date IS NULL THEN 'permanent'
        WHEN l.expiry_date < CURRENT_DATE THEN 'expired'
        WHEN l.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
        ELSE 'active'
    END AS expiry_status
FROM licenses l
LEFT JOIN categories c ON l.category_id = c.id
WHERE l.expiry_date IS NOT NULL
UNION ALL
SELECT
    'certificate' AS item_type,
    c.id AS item_id,
    c.name AS item_name,
    c.type AS item_subtype,
    c.valid_to AS expiry_date,
    c.status,
    cat.name AS category_name,
    CASE
        WHEN c.valid_to < CURRENT_DATE THEN 'expired'
        WHEN c.valid_to < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
        ELSE 'active'
    END AS expiry_status
FROM certificates c
LEFT JOIN categories cat ON c.category_id = cat.id
ORDER BY expiry_date ASC;
