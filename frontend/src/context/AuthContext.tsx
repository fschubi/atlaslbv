import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// API-Basis-URL aus Umgebungsvariablen
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:35001/api';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
}

interface LoginResponse {
  token: string;
  user: User;
  message?: string;
}

interface ValidateResponse {
  user: User;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Beim Start der App prüfen, ob ein Token existiert
    const token = localStorage.getItem('token');
    if (token) {
      // Token validieren und Benutzerinformationen abrufen
      validateToken(token);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const response = await axios.get<ValidateResponse>(`${API_BASE_URL}/auth/validate`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (err) {
      // Token ungültig - ausloggen
      logout();
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setError(null);
      const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);

      // Axios Default Header setzen
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (err) {
      setError('Anmeldung fehlgeschlagen');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
