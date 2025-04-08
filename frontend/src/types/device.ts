/**
 * Gerätetyp für die ATLAS-Anwendung
 */
export interface Device {
  id: number;
  inventory_number: string;
  serial_number?: string;
  status: string;
  purchase_date: string;
  warranty_until?: string;
  eol_date?: string;
  lbv_number?: string;
  switch_id?: number;
  switch_port?: string;
  base_pc_number?: string;
  base_pc_inventory_number?: string;
  mac_address?: string;
  network_port_number?: number;
  category_id?: number;
  device_model_id?: number;
  room_id?: number;
  user_id?: number;
  supplier_id?: number;
  created_at: string;
  updated_at: string;

  // Erweiterte Felder (werden durch Joins gefüllt)
  category_name?: string;
  model_name?: string;
  manufacturer_name?: string;
  room_number?: string;
  location_name?: string;
  user_name?: string;
}
