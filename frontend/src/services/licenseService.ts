import axios from 'axios';
import { License } from '../types/license';
import { ApiResponse } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const licenseService = {
  /**
   * Alle Lizenzen abrufen
   * @param filters - Optionale Filter für die Abfrage
   * @returns Promise mit Array von Lizenzen
   */
  getAllLicenses: async (filters?: Record<string, any>): Promise<License[]> => {
    try {
      const response = await axios.get<ApiResponse<License[]>>(`${API_URL}/licenses`, {
        params: filters
      });
      return response.data.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Lizenzen:', error);
      throw error;
    }
  },

  /**
   * Lizenz nach ID abrufen
   * @param id - ID der Lizenz
   * @returns Promise mit Lizenz
   */
  getLicenseById: async (id: string): Promise<License> => {
    try {
      const response = await axios.get<ApiResponse<License>>(`${API_URL}/licenses/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Fehler beim Abrufen der Lizenz mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Neue Lizenz erstellen
   * @param licenseData - Daten der neuen Lizenz
   * @returns Promise mit erstellter Lizenz
   */
  createLicense: async (licenseData: Partial<License>): Promise<License> => {
    try {
      const response = await axios.post<ApiResponse<License>>(`${API_URL}/licenses`, licenseData);
      return response.data.data;
    } catch (error) {
      console.error('Fehler beim Erstellen der Lizenz:', error);
      throw error;
    }
  },

  /**
   * Lizenz aktualisieren
   * @param id - ID der Lizenz
   * @param licenseData - Aktualisierte Daten der Lizenz
   * @returns Promise mit aktualisierter Lizenz
   */
  updateLicense: async (id: string, licenseData: Partial<License>): Promise<License> => {
    try {
      const response = await axios.put<ApiResponse<License>>(`${API_URL}/licenses/${id}`, licenseData);
      return response.data.data;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren der Lizenz mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Lizenz löschen
   * @param id - ID der Lizenz
   * @returns Promise mit Erfolgsstatus
   */
  deleteLicense: async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/licenses/${id}`);
      return true;
    } catch (error) {
      console.error(`Fehler beim Löschen der Lizenz mit ID ${id}:`, error);
      throw error;
    }
  }
};
