import axios from 'axios';
import { Accessory } from '../types/accessory';
import { ApiResponse } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const accessoryService = {
  /**
   * Alle Zubehörteile abrufen
   * @param filters - Optionale Filter für die Abfrage
   * @returns Promise mit Array von Zubehörteilen
   */
  getAllAccessories: async (filters?: Record<string, any>): Promise<Accessory[]> => {
    try {
      const response = await axios.get<ApiResponse<Accessory[]>>(`${API_URL}/accessories`, {
        params: filters
      });
      return response.data.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Zubehörteile:', error);
      throw error;
    }
  },

  /**
   * Zubehörteil nach ID abrufen
   * @param id - ID des Zubehörteils
   * @returns Promise mit Zubehörteil
   */
  getAccessoryById: async (id: string): Promise<Accessory> => {
    try {
      const response = await axios.get<ApiResponse<Accessory>>(`${API_URL}/accessories/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Zubehörteils mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Neues Zubehörteil erstellen
   * @param accessoryData - Daten des neuen Zubehörteils
   * @returns Promise mit erstelltem Zubehörteil
   */
  createAccessory: async (accessoryData: Partial<Accessory>): Promise<Accessory> => {
    try {
      const response = await axios.post<ApiResponse<Accessory>>(`${API_URL}/accessories`, accessoryData);
      return response.data.data;
    } catch (error) {
      console.error('Fehler beim Erstellen des Zubehörteils:', error);
      throw error;
    }
  },

  /**
   * Zubehörteil aktualisieren
   * @param id - ID des Zubehörteils
   * @param accessoryData - Aktualisierte Daten des Zubehörteils
   * @returns Promise mit aktualisiertem Zubehörteil
   */
  updateAccessory: async (id: string, accessoryData: Partial<Accessory>): Promise<Accessory> => {
    try {
      const response = await axios.put<ApiResponse<Accessory>>(`${API_URL}/accessories/${id}`, accessoryData);
      return response.data.data;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Zubehörteils mit ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Zubehörteil löschen
   * @param id - ID des Zubehörteils
   * @returns Promise mit Erfolgsstatus
   */
  deleteAccessory: async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/accessories/${id}`);
      return true;
    } catch (error) {
      console.error(`Fehler beim Löschen des Zubehörteils mit ID ${id}:`, error);
      throw error;
    }
  }
};
