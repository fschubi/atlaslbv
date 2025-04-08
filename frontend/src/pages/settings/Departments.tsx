import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch as MuiSwitch,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import AtlasTable, { AtlasColumn } from '../../components/AtlasTable';
import { Department, Location } from '../../types/settings';
import { settingsApi } from '../../utils/api';
import handleApiError from '../../utils/errorHandler';

const Departments: React.FC = () => {
  // State für die Daten
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingLocations, setLoadingLocations] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [locationId, setLocationId] = useState<number | ''>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [readOnly, setReadOnly] = useState<boolean>(false);

  // UI State
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Neuer State für das Kontextmenü
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    departmentId: number;
  } | null>(null);

  // Spalten für die Tabelle mit zusätzlicher Aktionsspalte
  const columns: AtlasColumn<Department>[] = [
    { dataKey: 'id', label: 'ID', width: 70, numeric: true },
    { dataKey: 'name', label: 'Name' },
    { dataKey: 'description', label: 'Beschreibung' },
    {
      dataKey: 'locationId',
      label: 'Standort',
      width: 150,
      render: (value) => {
        const location = locations.find(l => l.id === value);
        return location ? location.name : '-';
      }
    },
    {
      dataKey: 'isActive',
      label: 'Status',
      width: 120,
      render: (value) => value ? 'Aktiv' : 'Inaktiv'
    },
    {
      dataKey: 'createdAt',
      label: 'Erstellt am',
      width: 180,
      render: (value) => new Date(value as string).toLocaleDateString('de-DE')
    },
    {
      dataKey: 'actions',
      label: 'Aktionen',
      width: 80,
      render: (_, row) => (
        <IconButton
          size="small"
          onClick={(event) => handleContextMenu(event, row.id)}
        >
          <MoreVertIcon />
        </IconButton>
      )
    }
  ];

  // Daten laden
  useEffect(() => {
    loadDepartments();
    loadLocations();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const response = await settingsApi.getAllDepartments();
      setDepartments(response.data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({
        open: true,
        message: `Fehler beim Laden der Abteilungen: ${errorMessage}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    setLoadingLocations(true);
    try {
      const response = await settingsApi.getAllLocations();
      setLocations(response.data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({
        open: true,
        message: `Fehler beim Laden der Standorte: ${errorMessage}`,
        severity: 'error'
      });
    } finally {
      setLoadingLocations(false);
    }
  };

  // Dialog öffnen für neuen Eintrag
  const handleAddNew = () => {
    setEditMode(false);
    setReadOnly(false);
    setCurrentDepartment(null);
    setName('');
    setDescription('');
    setLocationId('');
    setIsActive(true);
    setDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEdit = (department: Department) => {
    setEditMode(true);
    setReadOnly(false);
    setCurrentDepartment(department);
    setName(department.name);
    setDescription(department.description);
    setLocationId(department.locationId || '');
    setIsActive(department.isActive);
    setDialogOpen(true);
  };

  // Löschen einer Abteilung
  const handleDelete = async (department: Department) => {
    try {
      await settingsApi.deleteDepartment(department.id);
      // Nach erfolgreichem Löschen die Liste aktualisieren
      const updatedDepartments = departments.filter(d => d.id !== department.id);
      setDepartments(updatedDepartments);
      setSnackbar({
        open: true,
        message: `Abteilung "${department.name}" wurde gelöscht.`,
        severity: 'success'
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({
        open: true,
        message: `Fehler beim Löschen der Abteilung: ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  // Dialog schließen
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Handle für Standort-Änderung
  const handleLocationChange = (event: SelectChangeEvent<number | ''>) => {
    setLocationId(event.target.value as number | '');
  };

  // Speichern der Abteilung
  const handleSave = async () => {
    // Validierung
    if (!name.trim()) {
      setSnackbar({
        open: true,
        message: 'Bitte geben Sie einen Namen ein.',
        severity: 'error'
      });
      return;
    }

    const departmentData = {
      name,
      description,
      locationId: locationId === '' ? null : locationId,
      isActive
    };

    try {
      if (editMode && currentDepartment) {
        // Bearbeiten
        const response = await settingsApi.updateDepartment(currentDepartment.id, departmentData);

        // Liste der Abteilungen aktualisieren
        const updatedDepartments = departments.map(d =>
          d.id === currentDepartment.id ? response.data : d
        );

        setDepartments(updatedDepartments);
        setSnackbar({
          open: true,
          message: `Abteilung "${name}" wurde aktualisiert.`,
          severity: 'success'
        });
      } else {
        // Neu erstellen
        const response = await settingsApi.createDepartment(departmentData);

        // Neue Abteilung zur Liste hinzufügen
        setDepartments([...departments, response.data]);
        setSnackbar({
          open: true,
          message: `Abteilung "${name}" wurde erstellt.`,
          severity: 'success'
        });
      }

      // Dialog schließen
      setDialogOpen(false);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({
        open: true,
        message: `Fehler beim Speichern der Abteilung: ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  // Aktualisieren der Daten
  const handleRefresh = () => {
    loadDepartments();
  };

  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Handlefunktionen für das Kontextmenü
  const handleContextMenu = (event: React.MouseEvent, departmentId: number) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      departmentId
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleContextMenuView = () => {
    if (contextMenu) {
      const department = departments.find(d => d.id === contextMenu.departmentId);
      if (department) {
        setEditMode(false);
        setReadOnly(true);
        setCurrentDepartment(department);
        setName(department.name);
        setDescription(department.description);
        setLocationId(department.locationId || '');
        setIsActive(department.isActive);
        setDialogOpen(true);
      }
      handleContextMenuClose();
    }
  };

  const handleContextMenuEdit = () => {
    if (contextMenu) {
      const department = departments.find(d => d.id === contextMenu.departmentId);
      if (department) {
        handleEdit(department);
      }
      handleContextMenuClose();
    }
  };

  const handleContextMenuDelete = () => {
    if (contextMenu) {
      const department = departments.find(d => d.id === contextMenu.departmentId);
      if (department) {
        handleDelete(department);
      }
      handleContextMenuClose();
    }
  };

  return (
    <Box sx={{ p: 2, bgcolor: '#121212', minHeight: '100vh', width: '100%' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#1976d2',
          color: 'white',
          p: 1,
          pl: 2,
          width: '100%',
          borderRadius: '4px 4px 0 0',
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Abteilungen
        </Typography>
        <Box>
          <Tooltip title="Aktualisieren">
            <IconButton color="inherit" onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Neue Abteilung">
            <IconButton color="inherit" onClick={handleAddNew}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Tabelle */}
      <AtlasTable
        columns={columns}
        rows={departments}
        loading={loading}
        heightPx={600}
        emptyMessage="Keine Abteilungen vorhanden"
      />

      {/* Kontextmenü */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleContextMenuView}>
          <ListItemIcon>
            <ViewIcon fontSize="small" sx={{ color: '#90CAF9' }} />
          </ListItemIcon>
          <ListItemText primary="Anzeigen" />
        </MenuItem>
        <MenuItem onClick={handleContextMenuEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" sx={{ color: '#4CAF50' }} />
          </ListItemIcon>
          <ListItemText primary="Bearbeiten" />
        </MenuItem>
        <MenuItem onClick={handleContextMenuDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: '#F44336' }} />
          </ListItemIcon>
          <ListItemText primary="Löschen" />
        </MenuItem>
      </Menu>

      {/* Dialog für Erstellen/Bearbeiten */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {readOnly ? `Abteilung anzeigen: ${currentDepartment?.name}` :
            (editMode ? `Abteilung bearbeiten: ${currentDepartment?.name}` : 'Neue Abteilung erstellen')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              InputProps={{
                readOnly: readOnly
              }}
            />
            <TextField
              label="Beschreibung"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              InputProps={{
                readOnly: readOnly
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Standort</InputLabel>
              <Select
                value={locationId}
                onChange={handleLocationChange}
                label="Standort"
                inputProps={{
                  readOnly: readOnly
                }}
                startAdornment={
                  <LocationIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
                }
              >
                <MenuItem value="">
                  <em>Nicht zugewiesen</em>
                </MenuItem>
                {locations.map(location => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <MuiSwitch
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  color="primary"
                  disabled={readOnly}
                />
              }
              label="Abteilung aktiv"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {readOnly ? 'Schließen' : 'Abbrechen'}
          </Button>
          {!readOnly && (
            <Button onClick={handleSave} variant="contained" color="primary">
              Speichern
            </Button>
          )}
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
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Departments;
