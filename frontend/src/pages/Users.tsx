import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Paper,
  Tabs,
  Tab,
  Divider,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Avatar,
  Switch,
  FormControlLabel,
  SelectChangeEvent,
  Checkbox,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import AtlasAppBar from '../components/AtlasAppBar';
import AtlasTable, { AtlasColumn } from '../components/AtlasTable';
import axios from 'axios';
import { ApiResponse, ApiError } from '../types/api';

// API-Basis-URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface IUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login: string;
}

interface UserGroup {
  id: number;
  name: string;
  description: string;
  added_at: string;
  added_by: string;
}

interface Role {
  id: number;
  name: string;
  label: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const Users: React.FC = () => {
  const theme = useTheme();
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogType, setDialogType] = useState<'create' | 'edit'>('create');
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [username, setUsername] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tabValue, setTabValue] = useState<number>(0);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [availableGroups, setAvailableGroups] = useState<UserGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [roles] = useState<Role[]>([
    { id: 1, name: 'admin', label: 'Administrator' },
    { id: 2, name: 'manager', label: 'Manager' },
    { id: 3, name: 'user', label: 'Benutzer' },
    { id: 4, name: 'guest', label: 'Gast' }
  ]);

  // Spalten für die Benutzer-Tabelle
  const columns: AtlasColumn<IUser>[] = [
    { label: 'ID', dataKey: 'id', numeric: true, width: 80 },
    { label: 'Benutzername', dataKey: 'username', width: 150 },
    { label: 'Name', dataKey: 'name', width: 200 },
    { label: 'E-Mail', dataKey: 'email', width: 250 },
    { label: 'Rolle', dataKey: 'role', width: 120 },
    {
      label: 'Status',
      dataKey: 'is_active',
      width: 100,
      render: (value: boolean) => (
        <Chip
          label={value ? 'Aktiv' : 'Inaktiv'}
          color={value ? 'success' : 'error'}
          size="small"
        />
      )
    },
    { label: 'Letzter Login', dataKey: 'last_login', width: 180 }
  ];

  // Spalten für die Benutzergruppen-Tabelle
  const groupColumns: AtlasColumn<UserGroup>[] = [
    { label: 'ID', dataKey: 'id', numeric: true, width: 80 },
    { label: 'Name', dataKey: 'name', width: 200 },
    { label: 'Beschreibung', dataKey: 'description', width: 300 },
    { label: 'Hinzugefügt am', dataKey: 'added_at', width: 180 },
    { label: 'Hinzugefügt von', dataKey: 'added_by', width: 150 }
  ];

  // Benutzer laden
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get<ApiResponse<IUser[]>>(`${API_BASE_URL}/users`);
      setUsers(response.data.data);
      setError(null);
    } catch (err: unknown) {
      console.error('Fehler beim Laden der Benutzer:', err);
      setError('Fehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  // Benutzergruppen laden
  const fetchUserGroups = async (userId: number) => {
    try {
      setLoading(true);
      const response = await axios.get<ApiResponse<UserGroup[]>>(`${API_BASE_URL}/users/${userId}/groups`);
      setUserGroups(response.data.data);
      setError(null);
    } catch (err: unknown) {
      console.error('Fehler beim Laden der Benutzergruppen:', err);
      setError('Fehler beim Laden der Benutzergruppen');
    } finally {
      setLoading(false);
    }
  };

  // Verfügbare Gruppen laden
  const fetchAvailableGroups = async () => {
    try {
      const response = await axios.get<ApiResponse<UserGroup[]>>(`${API_BASE_URL}/user-groups`);
      setAvailableGroups(response.data.data);
    } catch (err: unknown) {
      console.error('Fehler beim Laden der verfügbaren Gruppen:', err);
    }
  };

  // Benutzer suchen
  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      fetchUsers();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get<ApiResponse<IUser[]>>(`${API_BASE_URL}/users/search?searchTerm=${searchTerm}`);
      setUsers(response.data.data);
      setError(null);
    } catch (err: unknown) {
      console.error('Fehler bei der Suche nach Benutzern:', err);
      setError('Fehler bei der Suche nach Benutzern');
    } finally {
      setLoading(false);
    }
  };

  // Benutzer erstellen
  const createUser = async () => {
    if (password !== confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Die Passwörter stimmen nicht überein',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post<ApiResponse<IUser>>(`${API_BASE_URL}/users`, {
        username,
        name,
        email,
        password,
        role_id: parseInt(role, 10),
        is_active: isActive
      });

      setUsers([...users, response.data.data]);
      setSnackbar({
        open: true,
        message: 'Benutzer erfolgreich erstellt',
        severity: 'success'
      });
      handleCloseDialog();
    } catch (err: unknown) {
      setSnackbar({
        open: true,
        message: 'Fehler beim Erstellen des Benutzers',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Benutzer aktualisieren
  const updateUser = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const response = await axios.put<ApiResponse<IUser>>(`${API_BASE_URL}/users/${currentUser.id}`, {
        username,
        name,
        email,
        role_id: parseInt(role, 10),
        is_active: isActive,
        ...(password ? { password } : {})
      });

      setUsers(users.map(user =>
        user.id === currentUser.id ? response.data.data : user
      ));
      setSnackbar({
        open: true,
        message: 'Benutzer erfolgreich aktualisiert',
        severity: 'success'
      });
      handleCloseDialog();
    } catch (err: unknown) {
      setSnackbar({
        open: true,
        message: 'Fehler beim Aktualisieren des Benutzers',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Benutzer löschen
  const deleteUser = async (userId: number) => {
    try {
      setLoading(true);
      await axios.delete<ApiResponse<void>>(`${API_BASE_URL}/users/${userId}`);

      setUsers(users.filter(user => user.id !== userId));
      setSnackbar({
        open: true,
        message: 'Benutzer erfolgreich gelöscht',
        severity: 'success'
      });
    } catch (err: unknown) {
      setSnackbar({
        open: true,
        message: 'Fehler beim Löschen des Benutzers',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Benutzer zu Gruppen hinzufügen
  const addUserToGroups = async () => {
    if (!selectedUser || selectedGroups.length === 0) return;

    try {
      setLoading(true);
      await axios.post<ApiResponse<void>>(`${API_BASE_URL}/users/${selectedUser.id}/groups`, {
        group_ids: selectedGroups
      });

      await fetchUserGroups(selectedUser.id);
      setSelectedGroups([]);
      setSnackbar({
        open: true,
        message: 'Benutzer erfolgreich zu Gruppen hinzugefügt',
        severity: 'success'
      });
    } catch (err: unknown) {
      setSnackbar({
        open: true,
        message: 'Fehler beim Hinzufügen zu Gruppen',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Benutzer aus Gruppe entfernen
  const removeUserFromGroup = async (groupId: number) => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      await axios.delete<ApiResponse<void>>(`${API_BASE_URL}/users/${selectedUser.id}/groups/${groupId}`);

      await fetchUserGroups(selectedUser.id);
      setSnackbar({
        open: true,
        message: 'Benutzer erfolgreich aus Gruppe entfernt',
        severity: 'success'
      });
    } catch (err: unknown) {
      setSnackbar({
        open: true,
        message: 'Fehler beim Entfernen aus Gruppe',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Dialog öffnen
  const handleOpenDialog = (type: 'create' | 'edit', user: IUser | null = null) => {
    setDialogType(type);
    if (type === 'edit' && user) {
      setCurrentUser(user);
      setUsername(user.username);
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setIsActive(user.is_active);
      setPassword('');
      setConfirmPassword('');
    } else {
      setCurrentUser(null);
      setUsername('');
      setName('');
      setEmail('');
      setRole('');
      setPassword('');
      setConfirmPassword('');
      setIsActive(true);
    }
    setOpenDialog(true);
  };

  // Dialog schließen
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentUser(null);
    setUsername('');
    setName('');
    setEmail('');
    setRole('');
    setPassword('');
    setConfirmPassword('');
    setIsActive(true);
  };

  // Dialog bestätigen
  const handleConfirmDialog = () => {
    if (dialogType === 'create') {
      createUser();
    } else {
      updateUser();
    }
  };

  // Tab wechseln
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Benutzer auswählen
  const handleSelectUser = (user: IUser) => {
    setSelectedUser(user);
    fetchUserGroups(user.id);
  };

  // Gruppen auswählen
  const handleGroupSelect = (event: SelectChangeEvent<number[]>) => {
    setSelectedGroups(event.target.value as number[]);
  };

  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Initialisierung
  useEffect(() => {
    fetchUsers();
    fetchAvailableGroups();
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AtlasAppBar onMenuClick={() => {}} />

      <Box sx={{ p: 3, flexGrow: 1 }}>
        <Typography variant="h4" gutterBottom>
          Benutzerverwaltung
        </Typography>

        <Paper sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Benutzer suchen"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => searchUsers()}>
                      <SearchIcon />
                    </IconButton>
                  )
                }}
              />
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('create')}
              >
                Neuer Benutzer
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Benutzer" icon={<PersonIcon />} />
            <Tab
              label="Gruppen"
              icon={<GroupIcon />}
              disabled={!selectedUser}
            />
          </Tabs>

          <Box sx={{ p: 2 }}>
            {tabValue === 0 ? (
              <AtlasTable
                columns={columns}
                rows={users}
                loading={loading}
                onRowClick={handleSelectUser}
                heightPx={400}
                emptyMessage="Keine Benutzer gefunden"
                onEdit={(user) => handleOpenDialog('edit', user)}
                onDelete={(user) => deleteUser(user.id)}
              />
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Gruppen für {selectedUser?.name}
                </Typography>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Gruppen hinzufügen</InputLabel>
                  <Select
                    multiple
                    value={selectedGroups}
                    onChange={handleGroupSelect}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as number[]).map((value) => (
                          <Chip
                            key={value}
                            label={availableGroups.find(g => g.id === value)?.name}
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {availableGroups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        <Checkbox checked={selectedGroups.indexOf(group.id) > -1} />
                        <ListItemText primary={group.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  onClick={addUserToGroups}
                  disabled={selectedGroups.length === 0}
                  sx={{ mb: 3 }}
                >
                  Zu Gruppen hinzufügen
                </Button>

                <AtlasTable
                  columns={groupColumns}
                  rows={userGroups}
                  loading={loading}
                  heightPx={300}
                  emptyMessage="Keine Gruppen gefunden"
                  onDelete={(group) => removeUserFromGroup(group.id)}
                />
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'create' ? 'Neuen Benutzer erstellen' : 'Benutzer bearbeiten'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Benutzername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="email"
                label="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rolle</InputLabel>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.name}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Passwort bestätigen"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                }
                label="Aktiv"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button onClick={handleConfirmDialog} variant="contained">
            {dialogType === 'create' ? 'Erstellen' : 'Speichern'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;
