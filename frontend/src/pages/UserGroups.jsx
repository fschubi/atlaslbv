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
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import AtlasAppBar from '../components/AtlasAppBar';
import AtlasTable, { AtlasColumn } from '../components/AtlasTable';
import axios from 'axios';

// API-Basis-URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const UserGroups = () => {
  const theme = useTheme();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('create'); // 'create' oder 'edit'
  const [currentGroup, setCurrentGroup] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Spalten für die Benutzergruppen-Tabelle
  const columns = [
    { label: 'ID', dataKey: 'id', numeric: true, width: 80 },
    { label: 'Name', dataKey: 'name', width: 200 },
    { label: 'Beschreibung', dataKey: 'description', width: 300 },
    { label: 'Erstellt von', dataKey: 'created_by', width: 150 },
    { label: 'Erstellt am', dataKey: 'created_at', width: 180 },
    { label: 'Aktualisiert am', dataKey: 'updated_at', width: 180 }
  ];

  // Spalten für die Gruppenmitglieder-Tabelle
  const memberColumns = [
    { label: 'ID', dataKey: 'id', numeric: true, width: 80 },
    { label: 'Benutzername', dataKey: 'username', width: 150 },
    { label: 'Name', dataKey: 'name', width: 200 },
    { label: 'E-Mail', dataKey: 'email', width: 250 },
    { label: 'Hinzugefügt am', dataKey: 'added_at', width: 180 },
    { label: 'Hinzugefügt von', dataKey: 'added_by', width: 150 }
  ];

  // Benutzergruppen laden
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/user-groups`);
      setGroups(response.data.data);
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der Benutzergruppen');
      console.error('Fehler beim Laden der Benutzergruppen:', err);
    } finally {
      setLoading(false);
    }
  };

  // Gruppenmitglieder laden
  const fetchGroupMembers = async (groupId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/user-groups/${groupId}/members`);
      setGroupMembers(response.data.data);
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der Gruppenmitglieder');
      console.error('Fehler beim Laden der Gruppenmitglieder:', err);
    } finally {
      setLoading(false);
    }
  };

  // Benutzergruppen suchen
  const searchGroups = async () => {
    if (!searchTerm.trim()) {
      fetchGroups();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/user-groups/search?searchTerm=${searchTerm}`);
      setGroups(response.data.data);
      setError(null);
    } catch (err) {
      setError('Fehler bei der Suche nach Benutzergruppen');
      console.error('Fehler bei der Suche nach Benutzergruppen:', err);
    } finally {
      setLoading(false);
    }
  };

  // Benutzergruppe erstellen
  const createGroup = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/user-groups`, {
        name: groupName,
        description: groupDescription
      });

      setGroups([...groups, response.data.data]);
      setSnackbar({
        open: true,
        message: 'Benutzergruppe erfolgreich erstellt',
        severity: 'success'
      });
      handleCloseDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Fehler beim Erstellen der Benutzergruppe',
        severity: 'error'
      });
      console.error('Fehler beim Erstellen der Benutzergruppe:', err);
    } finally {
      setLoading(false);
    }
  };

  // Benutzergruppe aktualisieren
  const updateGroup = async () => {
    try {
      setLoading(true);
      const response = await axios.put(`${API_BASE_URL}/user-groups/${currentGroup.id}`, {
        name: groupName,
        description: groupDescription
      });

      setGroups(groups.map(group =>
        group.id === currentGroup.id ? response.data.data : group
      ));

      setSnackbar({
        open: true,
        message: 'Benutzergruppe erfolgreich aktualisiert',
        severity: 'success'
      });
      handleCloseDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Fehler beim Aktualisieren der Benutzergruppe',
        severity: 'error'
      });
      console.error('Fehler beim Aktualisieren der Benutzergruppe:', err);
    } finally {
      setLoading(false);
    }
  };

  // Benutzergruppe löschen
  const deleteGroup = async (groupId) => {
    if (!window.confirm('Möchten Sie diese Benutzergruppe wirklich löschen?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/user-groups/${groupId}`);

      setGroups(groups.filter(group => group.id !== groupId));
      setSnackbar({
        open: true,
        message: 'Benutzergruppe erfolgreich gelöscht',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Fehler beim Löschen der Benutzergruppe',
        severity: 'error'
      });
      console.error('Fehler beim Löschen der Benutzergruppe:', err);
    } finally {
      setLoading(false);
    }
  };

  // Dialog öffnen
  const handleOpenDialog = (type, group = null) => {
    setDialogType(type);

    if (type === 'edit' && group) {
      setCurrentGroup(group);
      setGroupName(group.name);
      setGroupDescription(group.description || '');
    } else {
      setCurrentGroup(null);
      setGroupName('');
      setGroupDescription('');
    }

    setOpenDialog(true);
  };

  // Dialog schließen
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentGroup(null);
    setGroupName('');
    setGroupDescription('');
  };

  // Dialog bestätigen
  const handleConfirmDialog = () => {
    if (dialogType === 'create') {
      createGroup();
    } else {
      updateGroup();
    }
  };

  // Tab ändern
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Gruppe auswählen
  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    fetchGroupMembers(group.id);
  };

  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Effekt zum Laden der Benutzergruppen beim ersten Rendern
  useEffect(() => {
    fetchGroups();
  }, []);

  // Effekt zum Aktualisieren der Gruppenmitglieder, wenn sich die ausgewählte Gruppe ändert
  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMembers(selectedGroup.id);
    }
  }, [selectedGroup]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AtlasAppBar title="Benutzergruppen" />

      <Box sx={{ p: 3, flexGrow: 1, overflow: 'auto' }}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h1">
              Benutzergruppenverwaltung
            </Typography>

            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
            >
              Neue Gruppe
            </Button>
          </Box>

          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Benutzergruppen suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ mr: 1 }}
            />
            <Button
              variant="contained"
              onClick={searchGroups}
              sx={{ minWidth: '120px' }}
            >
              Suchen
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label="Alle Gruppen" icon={<GroupIcon />} iconPosition="start" />
            <Tab label="Gruppenmitglieder" icon={<PersonIcon />} iconPosition="start" disabled={!selectedGroup} />
          </Tabs>

          {tabValue === 0 && (
            <AtlasTable
              columns={columns}
              rows={groups}
              loading={loading}
              onRowClick={handleSelectGroup}
              actions={[
                {
                  icon: <EditIcon />,
                  tooltip: 'Bearbeiten',
                  onClick: (row) => handleOpenDialog('edit', row)
                },
                {
                  icon: <DeleteIcon />,
                  tooltip: 'Löschen',
                  onClick: (row) => deleteGroup(row.id)
                }
              ]}
            />
          )}

          {tabValue === 1 && selectedGroup && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6">
                  Mitglieder der Gruppe: {selectedGroup.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedGroup.description}
                </Typography>
              </Box>

              <AtlasTable
                columns={memberColumns}
                rows={groupMembers}
                loading={loading}
              />
            </>
          )}
        </Paper>
      </Box>

      {/* Dialog für Erstellen/Bearbeiten */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'create' ? 'Neue Benutzergruppe erstellen' : 'Benutzergruppe bearbeiten'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Gruppenname"
            type="text"
            fullWidth
            variant="outlined"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Beschreibung"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button
            onClick={handleConfirmDialog}
            variant="contained"
            color="primary"
            disabled={!groupName.trim()}
          >
            {dialogType === 'create' ? 'Erstellen' : 'Aktualisieren'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar für Benachrichtigungen */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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

export default UserGroups;
