import axios from 'axios';
import { Certificate } from '../types/certificate';
import { ApiResponse } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const certificateService = {
  /**
   * Alle Zertifikate abrufen
   * @param filters - Optionale Filter für die Abfrage
   * @returns Promise mit Array von Zertifikaten
   */
  getAllCertificates: async (filters?: Record<string, any>): Promise<Certificate[]> => {
    try {
      const response = await axios.get<ApiResponse<Certificate[]>>(`${API_URL}/certificates`, {
        params: filters
      });
      return response.data.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Zertifikate:', error);
      throw error;
    }
  },

  /**
   * Zertifikat nach ID abrufen
   * @param id - ID des Zertifikats
   * @returns Promise mit Zertifikat
   */
  getCertificateById: async (id: string): Promise<Certificate> => {
    try {
      const response = await axios.get<ApiResponse<Certificate>>(`${API_URL}/certificates/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Zertifikats mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Neues Zertifikat erstellen
   * @param certificateData - Daten des neuen Zertifikats
   * @returns Promise mit erstelltem Zertifikat
   */
  createCertificate: async (certificateData: Partial<Certificate>): Promise<Certificate> => {
    try {
      const response = await axios.post<ApiResponse<Certificate>>(`${API_URL}/certificates`, certificateData);
      return response.data.data;
    } catch (error) {
      console.error('Fehler beim Erstellen des Zertifikats:', error);
      throw error;
    }
  },

  /**
   * Zertifikat aktualisieren
   * @param id - ID des Zertifikats
   * @param certificateData - Aktualisierte Daten des Zertifikats
   * @returns Promise mit aktualisiertem Zertifikat
   */
  updateCertificate: async (id: string, certificateData: Partial<Certificate>): Promise<Certificate> => {
    try {
      const response = await axios.put<ApiResponse<Certificate>>(`${API_URL}/certificates/${id}`, certificateData);
      return response.data.data;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Zertifikats mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Zertifikat löschen
   * @param id - ID des Zertifikats
   * @returns Promise mit Erfolgsstatus
   */
  deleteCertificate: async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/certificates/${id}`);
      return true;
    } catch (error) {
      console.error(`Fehler beim Löschen des Zertifikats mit ID ${id}:`, error);
      throw error;
    }
  }
};
