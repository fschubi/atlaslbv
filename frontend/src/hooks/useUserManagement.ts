import { useState, useCallback } from 'react';
import { User, UserGroup } from '../types/user';
import { UserService } from '../services/userService';
import { useSnackbar } from './useSnackbar';

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await UserService.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      showSnackbar(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  const searchUsers = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      fetchUsers();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await UserService.searchUsers(searchTerm);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      showSnackbar(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten', 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, showSnackbar]);

  const createUser = useCallback(async (userData: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      const newUser = await UserService.createUser(userData);
      setUsers(prev => [...prev, newUser]);
      showSnackbar('Benutzer erfolgreich erstellt', 'success');
      return newUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      showSnackbar(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  const updateUser = useCallback(async (userId: number, userData: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await UserService.updateUser(userId, userData);
      setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user));
      showSnackbar('Benutzer erfolgreich aktualisiert', 'success');
      return updatedUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      showSnackbar(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  const deleteUser = useCallback(async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      await UserService.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
      showSnackbar('Benutzer erfolgreich gelöscht', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      showSnackbar(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    searchUsers,
    createUser,
    updateUser,
    deleteUser
  };
};
