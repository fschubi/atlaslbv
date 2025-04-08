import axios from 'axios';
import { User, Department, UserRole } from '../types/user';
import { ApiResponse } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await axios.get<ApiResponse<User[]>>(`${API_URL}/users`);
      return response.data.data as User[];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  getUserById: async (id: string): Promise<User> => {
    try {
      const response = await axios.get<ApiResponse<User>>(`${API_URL}/users/${id}`);
      return response.data.data as User;
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }
  },

  getUserRoles: async (): Promise<UserRole[]> => {
    try {
      const response = await axios.get<ApiResponse<UserRole[]>>(`${API_URL}/users/roles`);
      return response.data.data as UserRole[];
    } catch (error) {
      console.error('Error fetching user roles:', error);
      throw error;
    }
  },

  getDepartments: async (): Promise<Department[]> => {
    try {
      const response = await axios.get<ApiResponse<Department[]>>(`${API_URL}/users/departments`);
      return response.data.data as Department[];
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  createUser: async (userData: Partial<User>): Promise<User> => {
    try {
      const response = await axios.post<ApiResponse<User>>(`${API_URL}/users`, userData);
      return response.data.data as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
    try {
      const response = await axios.put<ApiResponse<User>>(`${API_URL}/users/${id}`, userData);
      return response.data.data as User;
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
  },

  deleteUser: async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/users/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw error;
    }
  },

  changePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      await axios.post(`${API_URL}/users/${userId}/change-password`, {
        currentPassword,
        newPassword
      });
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
};
