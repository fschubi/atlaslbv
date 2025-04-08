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
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  LocationCity as CityIcon,
  LocationOn as AddressIcon,
  Public as CountryIcon,
  Home as PostalCodeIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import AtlasTable, { AtlasColumn } from '../../components/AtlasTable';
import { Location } from '../../types/settings';
import { settingsApi } from '../../utils/api';

const Locations: React.FC = () => {
  // State für die Daten
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [readOnly, setReadOnly] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

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

  // State für das Kontextmenü
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    locationId: number;
  } | null>(null);

  // API-Daten laden
  useEffect(() => {
    fetchLocations();
  }, []);

  // Standorte vom API laden
  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getAllLocations();
      setLocations(response.data);
      setLoading(false);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Fehler beim Laden der Standorte: ${error.message}`,
        severity: 'error'
      });
      setLoading(false);
    }
  };

  // Spalten für die AtlasTable-Komponente
  const columns: AtlasColumn[] = [
    { label: 'ID', dataKey: 'id', width: 80 },
    { label: 'Name', dataKey: 'name', width: 200 },
    { label: 'Adresse', dataKey: 'address', width: 200 },
    { label: 'PLZ', dataKey: 'postalCode', width: 100 },
    { label: 'Stadt', dataKey: 'city', width: 150 },
    { label: 'Beschreibung', dataKey: 'description', width: 300 },
    {
      label: 'Status',
      dataKey: 'isActive',
      width: 100,
      render: (value) => (
        <Chip
          label={value ? 'Aktiv' : 'Inaktiv'}
          color={value ? 'success' : 'default'}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      label: 'Aktionen',
      dataKey: 'actions',
      width: 100,
      render: (_, location: Location) => (
        <IconButton
          onClick={(event) => handleContextMenu(event, location.id)}
          size="small"
        >
          <MoreVertIcon />
        </IconButton>
      )
    }
  ];

  // Dialog öffnen für neuen Eintrag
  const handleAddNew = () => {
    setEditMode(false);
    setReadOnly(false);
    setCurrentLocation(null);
    setName('');
    setDescription('');
    setAddress('');
    setCity('');
    setPostalCode('');
    setCountry('Deutschland');
    setIsActive(true);
    setDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEdit = (location: Location) => {
    setEditMode(true);
    setReadOnly(false);
    setCurrentLocation(location);
    setName(location.name);
    setDescription(location.description);
    setAddress(location.address || '');
    setCity(location.city || '');
    setPostalCode(location.postalCode || '');
    setCountry(location.country || '');
    setIsActive(location.isActive);
    setDialogOpen(true);
  };

  // Löschen eines Standorts
  const handleDelete = async (location: Location) => {
    try {
      await settingsApi.deleteLocation(location.id);
      // Aktualisiere die Liste der Standorte nach dem Löschen
      setLocations(locations.filter(l => l.id !== location.id));
      setSnackbar({
        open: true,
        message: `Standort "${location.name}" wurde gelöscht.`,
        severity: 'success'
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Fehler beim Löschen des Standorts: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Dialog schließen
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Speichern des Standorts
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

    try {
      // Neue Standort-Daten erstellen
      const locationData: Partial<Location> = {
        name,
        description,
        address: address || undefined,
        city: city || undefined,
        postalCode: postalCode || undefined,
        country: country || undefined,
        isActive
      };

      if (editMode && currentLocation) {
        // Bestehenden Standort bearbeiten
        const response = await settingsApi.updateLocation(currentLocation.id, locationData);

        // Lokale Liste aktualisieren
        const updatedLocation = response.data;
        setLocations(locations.map(l => l.id === currentLocation.id ? updatedLocation : l));

        setSnackbar({
          open: true,
          message: `Standort "${name}" wurde aktualisiert.`,
          severity: 'success'
        });
      } else {
        // Neuen Standort erstellen
        const response = await settingsApi.createLocation(locationData);

        // Neuen Standort zur lokalen Liste hinzufügen
        const newLocation = response.data;
        setLocations([...locations, newLocation]);

        setSnackbar({
          open: true,
          message: `Standort "${name}" wurde erstellt.`,
          severity: 'success'
        });
      }

      setDialogOpen(false);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Fehler beim Speichern: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Aktualisieren der Daten
  const handleRefresh = () => {
    fetchLocations();
  };

  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Handlefunktionen für das Kontextmenü
  const handleContextMenu = (event: React.MouseEvent, locationId: number) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      locationId
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleContextMenuView = () => {
    if (contextMenu) {
      const location = locations.find(l => l.id === contextMenu.locationId);
      if (location) {
        setEditMode(false);
        setReadOnly(true);
        setCurrentLocation(location);
        setName(location.name);
        setDescription(location.description);
        setAddress(location.address || '');
        setCity(location.city || '');
        setPostalCode(location.postalCode || '');
        setCountry(location.country || '');
        setIsActive(location.isActive);
        setDialogOpen(true);
      }
      handleContextMenuClose();
    }
  };

  const handleContextMenuEdit = () => {
    if (contextMenu) {
      const location = locations.find(l => l.id === contextMenu.locationId);
      if (location) {
        handleEdit(location);
      }
      handleContextMenuClose();
    }
  };

  const handleContextMenuDelete = () => {
    if (contextMenu) {
      const location = locations.find(l => l.id === contextMenu.locationId);
      if (location) {
        handleDelete(location);
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
          Standorte
        </Typography>
        <Box>
          <Tooltip title="Aktualisieren">
            <IconButton color="inherit" onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Neuer Standort">
            <IconButton color="inherit" onClick={handleAddNew}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Tabelle */}
      <AtlasTable
        columns={columns}
        rows={locations}
        loading={loading}
        heightPx={600}
        emptyMessage="Keine Standorte vorhanden"
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
          {readOnly ? `Standort anzeigen: ${currentLocation?.name}` :
            (editMode ? `Standort bearbeiten: ${currentLocation?.name}` : 'Neuen Standort erstellen')}
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
            <TextField
              label="Adresse"
              fullWidth
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Straße und Hausnummer"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AddressIcon />
                  </InputAdornment>
                ),
                readOnly: readOnly
              }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="PLZ"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                sx={{ width: '30%' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PostalCodeIcon />
                    </InputAdornment>
                  ),
                  readOnly: readOnly
                }}
              />
              <TextField
                label="Stadt"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                sx={{ width: '70%' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CityIcon />
                    </InputAdornment>
                  ),
                  readOnly: readOnly
                }}
              />
            </Box>
            <TextField
              label="Land"
              fullWidth
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="z.B. Deutschland"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CountryIcon />
                  </InputAdornment>
                ),
                readOnly: readOnly
              }}
            />
            <FormControlLabel
              control={
                <MuiSwitch
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  color="primary"
                  disabled={readOnly}
                />
              }
              label="Standort aktiv"
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

export default Locations;
