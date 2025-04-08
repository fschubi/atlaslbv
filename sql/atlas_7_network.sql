-- ATLAS Netzwerkeinstellungen
-- Version: 1.0.0
-- Datum: 2024-04-07
-- Teil 7: Netzwerkeinstellungen

-- Bestehende Tabellen löschen (in umgekehrter Reihenfolge wegen Fremdschlüsseln)
DROP TABLE IF EXISTS network_ports CASCADE;
DROP TABLE IF EXISTS network_sockets CASCADE;
DROP TABLE IF EXISTS network_switches CASCADE;
DROP TABLE IF EXISTS network_subnets CASCADE;
DROP TABLE IF EXISTS network_vlans CASCADE;
DROP TABLE IF EXISTS network_ip_ranges CASCADE;
DROP TABLE IF EXISTS network_dns_servers CASCADE;
DROP TABLE IF EXISTS network_dhcp_servers CASCADE;
DROP TABLE IF EXISTS network_gateways CASCADE;
DROP TABLE IF EXISTS network_firewalls CASCADE;
DROP TABLE IF EXISTS network_routers CASCADE;
DROP TABLE IF EXISTS network_racks CASCADE;
DROP TABLE IF EXISTS network_cabinets CASCADE;

-- Netzwerkschränke
CREATE TABLE network_cabinets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    cabinet_number VARCHAR(50),
    height_units INTEGER, -- Höhe in Rack-Einheiten (U)
    width_cm INTEGER,
    depth_cm INTEGER,
    power_supply VARCHAR(100),
    cooling VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Netzwerkracks
CREATE TABLE network_racks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cabinet_id INTEGER REFERENCES network_cabinets(id) ON DELETE CASCADE,
    rack_number VARCHAR(50),
    start_unit INTEGER, -- Startposition in Rack-Einheiten
    height_units INTEGER, -- Höhe in Rack-Einheiten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cabinet_id, rack_number)
);

-- VLANs (muss vor network_subnets erstellt werden)
CREATE TABLE network_vlans (
    id SERIAL PRIMARY KEY,
    vlan_id INTEGER NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subnetze (muss vor network_gateways und network_dhcp_servers erstellt werden)
CREATE TABLE network_subnets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    network_address VARCHAR(45) NOT NULL, -- IPv4 oder IPv6
    subnet_mask VARCHAR(45) NOT NULL, -- IPv4 oder IPv6
    vlan_id INTEGER REFERENCES network_vlans(id) ON DELETE SET NULL,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Netzwerk-Gateways
CREATE TABLE network_gateways (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    ip_address VARCHAR(45) NOT NULL, -- IPv4 oder IPv6
    subnet_id INTEGER REFERENCES network_subnets(id) ON DELETE SET NULL,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- DHCP-Server
CREATE TABLE network_dhcp_servers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    ip_address VARCHAR(45) NOT NULL, -- IPv4 oder IPv6
    subnet_id INTEGER REFERENCES network_subnets(id) ON DELETE SET NULL,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- DNS-Server
CREATE TABLE network_dns_servers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    ip_address VARCHAR(45) NOT NULL, -- IPv4 oder IPv6
    is_primary BOOLEAN DEFAULT FALSE,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- IP-Bereiche
CREATE TABLE network_ip_ranges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    start_ip VARCHAR(45) NOT NULL, -- IPv4 oder IPv6
    end_ip VARCHAR(45) NOT NULL, -- IPv4 oder IPv6
    subnet_id INTEGER REFERENCES network_subnets(id) ON DELETE SET NULL,
    purpose VARCHAR(100), -- 'workstations', 'servers', 'printers', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Netzwerkrouter
CREATE TABLE network_routers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    manufacturer_id INTEGER REFERENCES manufacturers(id) ON DELETE SET NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100),
    firmware_version VARCHAR(50),
    ip_address VARCHAR(45), -- IPv4 oder IPv6
    mac_address VARCHAR(17),
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    cabinet_id INTEGER REFERENCES network_cabinets(id) ON DELETE SET NULL,
    rack_id INTEGER REFERENCES network_racks(id) ON DELETE SET NULL,
    rack_position INTEGER, -- Position im Rack in Einheiten
    status VARCHAR(50), -- 'active', 'inactive', 'maintenance', 'decommissioned'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Netzwerkfirewalls
CREATE TABLE network_firewalls (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    manufacturer_id INTEGER REFERENCES manufacturers(id) ON DELETE SET NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100),
    firmware_version VARCHAR(50),
    ip_address VARCHAR(45), -- IPv4 oder IPv6
    mac_address VARCHAR(17),
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    cabinet_id INTEGER REFERENCES network_cabinets(id) ON DELETE SET NULL,
    rack_id INTEGER REFERENCES network_racks(id) ON DELETE SET NULL,
    rack_position INTEGER, -- Position im Rack in Einheiten
    status VARCHAR(50), -- 'active', 'inactive', 'maintenance', 'decommissioned'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Netzwerkswitches
CREATE TABLE network_switches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    manufacturer_id INTEGER REFERENCES manufacturers(id) ON DELETE SET NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100),
    firmware_version VARCHAR(50),
    ip_address VARCHAR(45), -- IPv4 oder IPv6
    mac_address VARCHAR(17),
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    cabinet_id INTEGER REFERENCES network_cabinets(id) ON DELETE SET NULL,
    rack_id INTEGER REFERENCES network_racks(id) ON DELETE SET NULL,
    rack_position INTEGER, -- Position im Rack in Einheiten
    port_count INTEGER, -- Anzahl der Ports
    status VARCHAR(50), -- 'active', 'inactive', 'maintenance', 'decommissioned'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Netzwerkdosen
CREATE TABLE network_sockets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    socket_number VARCHAR(50),
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    wall_position VARCHAR(100), -- Position an der Wand
    socket_type VARCHAR(50), -- 'ethernet', 'fiber', 'coaxial'
    port_count INTEGER DEFAULT 1, -- Anzahl der Ports pro Dose
    status VARCHAR(50), -- 'active', 'inactive', 'maintenance', 'decommissioned'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, socket_number)
);

-- Netzwerkports
CREATE TABLE network_ports (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    port_number INTEGER NOT NULL,
    device_type VARCHAR(50) NOT NULL, -- 'switch', 'router', 'firewall'
    device_id INTEGER NOT NULL, -- ID des Geräts (Switch, Router, Firewall)
    socket_id INTEGER REFERENCES network_sockets(id) ON DELETE SET NULL,
    vlan_id INTEGER REFERENCES network_vlans(id) ON DELETE SET NULL,
    ip_address VARCHAR(45), -- IPv4 oder IPv6
    mac_address VARCHAR(17),
    status VARCHAR(50), -- 'active', 'inactive', 'maintenance', 'decommissioned'
    speed VARCHAR(50), -- '10Mbps', '100Mbps', '1Gbps', '10Gbps', etc.
    duplex VARCHAR(20), -- 'full', 'half'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_type, device_id, port_number)
);

-- Trigger für Aktualisierung der Zeitstempel
CREATE TRIGGER update_network_cabinets_timestamp
    BEFORE UPDATE ON network_cabinets
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_network_racks_timestamp
    BEFORE UPDATE ON network_racks
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_network_routers_timestamp
    BEFORE UPDATE ON network_routers
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_network_firewalls_timestamp
    BEFORE UPDATE ON network_firewalls
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_network_gateways_timestamp
    BEFORE UPDATE ON network_gateways
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_network_dhcp_servers_timestamp
    BEFORE UPDATE ON network_dhcp_servers
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_network_dns_servers_timestamp
    BEFORE UPDATE ON network_dns_servers
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_network_ip_ranges_timestamp
    BEFORE UPDATE ON network_ip_ranges
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_network_subnets_timestamp
    BEFORE UPDATE ON network_subnets
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_network_vlans_timestamp
    BEFORE UPDATE ON network_vlans
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_network_switches_timestamp
    BEFORE UPDATE ON network_switches
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_network_sockets_timestamp
    BEFORE UPDATE ON network_sockets
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_network_ports_timestamp
    BEFORE UPDATE ON network_ports
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- Audit-Logging Trigger
CREATE TRIGGER network_cabinets_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON network_cabinets
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER network_racks_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON network_racks
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER network_routers_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON network_routers
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER network_firewalls_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON network_firewalls
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER network_gateways_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON network_gateways
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER network_dhcp_servers_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON network_dhcp_servers
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER network_dns_servers_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON network_dns_servers
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER network_ip_ranges_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON network_ip_ranges
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER network_subnets_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON network_subnets
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER network_vlans_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON network_vlans
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER network_switches_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON network_switches
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER network_sockets_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON network_sockets
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER network_ports_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON network_ports
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_trigger();

-- Indizes für effiziente Abfragen
CREATE INDEX idx_network_cabinets_location_id ON network_cabinets(location_id);
CREATE INDEX idx_network_cabinets_room_id ON network_cabinets(room_id);
CREATE INDEX idx_network_racks_cabinet_id ON network_racks(cabinet_id);
CREATE INDEX idx_network_routers_location_id ON network_routers(location_id);
CREATE INDEX idx_network_routers_room_id ON network_routers(room_id);
CREATE INDEX idx_network_routers_cabinet_id ON network_routers(cabinet_id);
CREATE INDEX idx_network_routers_rack_id ON network_routers(rack_id);
CREATE INDEX idx_network_firewalls_location_id ON network_firewalls(location_id);
CREATE INDEX idx_network_firewalls_room_id ON network_firewalls(room_id);
CREATE INDEX idx_network_firewalls_cabinet_id ON network_firewalls(cabinet_id);
CREATE INDEX idx_network_firewalls_rack_id ON network_firewalls(rack_id);
CREATE INDEX idx_network_gateways_subnet_id ON network_gateways(subnet_id);
CREATE INDEX idx_network_gateways_location_id ON network_gateways(location_id);
CREATE INDEX idx_network_dhcp_servers_subnet_id ON network_dhcp_servers(subnet_id);
CREATE INDEX idx_network_dhcp_servers_location_id ON network_dhcp_servers(location_id);
CREATE INDEX idx_network_dns_servers_location_id ON network_dns_servers(location_id);
CREATE INDEX idx_network_ip_ranges_subnet_id ON network_ip_ranges(subnet_id);
CREATE INDEX idx_network_subnets_vlan_id ON network_subnets(vlan_id);
CREATE INDEX idx_network_subnets_location_id ON network_subnets(location_id);
CREATE INDEX idx_network_switches_location_id ON network_switches(location_id);
CREATE INDEX idx_network_switches_room_id ON network_switches(room_id);
CREATE INDEX idx_network_switches_cabinet_id ON network_switches(cabinet_id);
CREATE INDEX idx_network_switches_rack_id ON network_switches(rack_id);
CREATE INDEX idx_network_sockets_room_id ON network_sockets(room_id);
CREATE INDEX idx_network_ports_socket_id ON network_ports(socket_id);
CREATE INDEX idx_network_ports_vlan_id ON network_ports(vlan_id);

-- Standard-VLANs einfügen
INSERT INTO network_vlans (vlan_id, name, description, color) VALUES
(1, 'Management', 'Management-VLAN für Netzwerkgeräte', '#FF0000'),
(10, 'Server', 'Server-VLAN', '#00FF00'),
(20, 'Workstations', 'Workstation-VLAN', '#0000FF'),
(30, 'Gäste', 'Gast-VLAN', '#FFFF00'),
(40, 'VoIP', 'Voice-over-IP-VLAN', '#FF00FF'),
(50, 'IoT', 'Internet-of-Things-VLAN', '#00FFFF'),
(100, 'DMZ', 'Demilitarisierte Zone', '#FFA500'),
(200, 'Backup', 'Backup-VLAN', '#808080')
ON CONFLICT (vlan_id) DO NOTHING;

-- Standard-Subnetze einfügen (mit korrekten VLAN-IDs)
INSERT INTO network_subnets (name, description, network_address, subnet_mask, vlan_id) VALUES
('Management-Netz', 'Management-Netzwerk', '10.0.0.0', '255.255.255.0', (SELECT id FROM network_vlans WHERE vlan_id = 1)),
('Server-Netz', 'Server-Netzwerk', '10.10.0.0', '255.255.0.0', (SELECT id FROM network_vlans WHERE vlan_id = 10)),
('Workstation-Netz', 'Workstation-Netzwerk', '10.20.0.0', '255.255.0.0', (SELECT id FROM network_vlans WHERE vlan_id = 20)),
('Gast-Netz', 'Gast-Netzwerk', '10.30.0.0', '255.255.0.0', (SELECT id FROM network_vlans WHERE vlan_id = 30)),
('VoIP-Netz', 'Voice-over-IP-Netzwerk', '10.40.0.0', '255.255.0.0', (SELECT id FROM network_vlans WHERE vlan_id = 40)),
('IoT-Netz', 'Internet-of-Things-Netzwerk', '10.50.0.0', '255.255.0.0', (SELECT id FROM network_vlans WHERE vlan_id = 50)),
('DMZ-Netz', 'Demilitarisierte Zone', '10.100.0.0', '255.255.0.0', (SELECT id FROM network_vlans WHERE vlan_id = 100)),
('Backup-Netz', 'Backup-Netzwerk', '10.200.0.0', '255.255.0.0', (SELECT id FROM network_vlans WHERE vlan_id = 200))
ON CONFLICT (name) DO NOTHING;

-- Standard-Gateways einfügen
INSERT INTO network_gateways (name, description, ip_address, subnet_id, is_default) VALUES
('Management-Gateway', 'Gateway für Management-Netzwerk', '10.0.0.1', 1, false),
('Server-Gateway', 'Gateway für Server-Netzwerk', '10.10.0.1', 2, false),
('Workstation-Gateway', 'Gateway für Workstation-Netzwerk', '10.20.0.1', 3, true),
('Gast-Gateway', 'Gateway für Gast-Netzwerk', '10.30.0.1', 4, false),
('VoIP-Gateway', 'Gateway für VoIP-Netzwerk', '10.40.0.1', 5, false),
('IoT-Gateway', 'Gateway für IoT-Netzwerk', '10.50.0.1', 6, false),
('DMZ-Gateway', 'Gateway für DMZ-Netzwerk', '10.100.0.1', 7, false),
('Backup-Gateway', 'Gateway für Backup-Netzwerk', '10.200.0.1', 8, false)
ON CONFLICT (name) DO NOTHING;

-- Standard-DNS-Server einfügen
INSERT INTO network_dns_servers (name, description, ip_address, is_primary) VALUES
('Primärer DNS', 'Primärer DNS-Server', '10.0.0.2', true),
('Sekundärer DNS', 'Sekundärer DNS-Server', '10.0.0.3', false),
('Tertiärer DNS', 'Tertiärer DNS-Server', '8.8.8.8', false)
ON CONFLICT (name) DO NOTHING;

-- Standard-DHCP-Server einfügen
INSERT INTO network_dhcp_servers (name, description, ip_address, subnet_id) VALUES
('Workstation-DHCP', 'DHCP-Server für Workstations', '10.20.0.2', 3),
('Gast-DHCP', 'DHCP-Server für Gäste', '10.30.0.2', 4),
('IoT-DHCP', 'DHCP-Server für IoT-Geräte', '10.50.0.2', 6)
ON CONFLICT (name) DO NOTHING;

-- Standard-IP-Bereiche einfügen
INSERT INTO network_ip_ranges (name, description, start_ip, end_ip, subnet_id, purpose) VALUES
('Workstation-Bereich', 'IP-Bereich für Workstations', '10.20.0.10', '10.20.255.254', 3, 'workstations'),
('Server-Bereich', 'IP-Bereich für Server', '10.10.0.10', '10.10.255.254', 2, 'servers'),
('Drucker-Bereich', 'IP-Bereich für Drucker', '10.20.0.100', '10.20.0.200', 3, 'printers'),
('VoIP-Bereich', 'IP-Bereich für VoIP-Geräte', '10.40.0.10', '10.40.255.254', 5, 'voip'),
('IoT-Bereich', 'IP-Bereich für IoT-Geräte', '10.50.0.10', '10.50.255.254', 6, 'iot')
ON CONFLICT (name) DO NOTHING;
