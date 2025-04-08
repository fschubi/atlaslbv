/**
 * Lizenztyp für die ATLAS-Anwendung
 */
export interface License {
  id: number;
  license_key: string;
  software_name: string;
  purchase_date?: string;
  expiration_date?: string;
  assigned_to_user_id?: number;
  assigned_to_device_id?: number;
  note?: string;
  created_at: string;
  updated_at: string;

  // Erweiterte Felder (werden durch Joins gefüllt)
  user_name?: string;
  device_name?: string;
}
