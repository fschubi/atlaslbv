/**
 * Zubehörtyp für die ATLAS-Anwendung
 */
export interface Accessory {
  id: number;
  name: string;
  description?: string;
  assigned_to_user_id?: number;
  assigned_to_device_id?: number;
  created_at: string;
  updated_at: string;

  // Erweiterte Felder (werden durch Joins gefüllt)
  user_name?: string;
  device_name?: string;
}
