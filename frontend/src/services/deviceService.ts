import axios from 'axios';
import { Device } from '../types/device';
import { ApiResponse } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const deviceService = {
  /**
   * Alle Geräte abrufen
   * @param filters - Optionale Filter für die Abfrage
   * @returns Promise mit Array von Geräten
   */
  getAllDevices: async (filters?: Record<string, any>): Promise<Device[]> => {
    try {
      const response = await axios.get<ApiResponse<Device[]>>(`${API_URL}/devices`, {
        params: filters
      });
      return response.data.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Geräte:', error);
      throw error;
    }
  },

  /**
   * Gerät nach ID abrufen
   * @param id - ID des Geräts
   * @returns Promise mit Gerät
   */
  getDeviceById: async (id: string): Promise<Device> => {
    try {
      const response = await axios.get<ApiResponse<Device>>(`${API_URL}/devices/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Geräts mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Neues Gerät erstellen
   * @param deviceData - Daten des neuen Geräts
   * @returns Promise mit erstelltem Gerät
   */
  createDevice: async (deviceData: Partial<Device>): Promise<Device> => {
    try {
      const response = await axios.post<ApiResponse<Device>>(`${API_URL}/devices`, deviceData);
      return response.data.data;
    } catch (error) {
      console.error('Fehler beim Erstellen des Geräts:', error);
      throw error;
    }
  },

  /**
   * Gerät aktualisieren
   * @param id - ID des Geräts
   * @param deviceData - Aktualisierte Daten des Geräts
   * @returns Promise mit aktualisiertem Gerät
   */
  updateDevice: async (id: string, deviceData: Partial<Device>): Promise<Device> => {
    try {
      const response = await axios.put<ApiResponse<Device>>(`${API_URL}/devices/${id}`, deviceData);
      return response.data.data;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Geräts mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Gerät löschen
   * @param id - ID des Geräts
   * @returns Promise mit Erfolgsstatus
   */
  deleteDevice: async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/devices/${id}`);
      return true;
    } catch (error) {
      console.error(`Fehler beim Löschen des Geräts mit ID ${id}:`, error);
      throw error;
    }
  }
};
