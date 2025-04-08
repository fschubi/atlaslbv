import { useState, useCallback } from 'react';
import { UserGroup } from '../types/user';
import { UserService } from '../services/userService';
import { useSnackbar } from './useSnackbar';

export const useUserGroups = (userId?: number) => {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [availableGroups, setAvailableGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  const fetchUserGroups = useCallback(async (selectedUserId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await UserService.getUserGroups(selectedUserId);
      setUserGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      showSnackbar(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  const fetchAvailableGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await UserService.getAvailableGroups();
      setAvailableGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      showSnackbar(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  const addUserToGroups = useCallback(async (selectedUserId: number, groupIds: number[]) => {
    try {
      setLoading(true);
      setError(null);
      await UserService.addUserToGroups(selectedUserId, groupIds);
      await fetchUserGroups(selectedUserId);
      showSnackbar('Benutzer erfolgreich zu Gruppen hinzugefügt', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      showSnackbar(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUserGroups, showSnackbar]);

  const removeUserFromGroup = useCallback(async (groupId: number, selectedUserId: number) => {
    try {
      setLoading(true);
      setError(null);
      await UserService.removeUserFromGroup(groupId, selectedUserId);
      await fetchUserGroups(selectedUserId);
      showSnackbar('Benutzer erfolgreich aus Gruppe entfernt', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      showSnackbar(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUserGroups, showSnackbar]);

  return {
    userGroups,
    availableGroups,
    loading,
    error,
    fetchUserGroups,
    fetchAvailableGroups,
    addUserToGroups,
    removeUserFromGroup
  };
};
