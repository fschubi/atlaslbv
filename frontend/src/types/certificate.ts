/**
 * Zertifikattyp für die ATLAS-Anwendung
 */
export interface Certificate {
  id: number;
  name: string;
  service?: string;
  domain?: string;
  issued_at?: string;
  expiration_date: string;
  assigned_to_device_id?: number;
  note?: string;
  created_at: string;
  updated_at: string;

  // Erweiterte Felder (werden durch Joins gefüllt)
  device_name?: string;
}
