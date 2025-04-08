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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Computer as NetworkIcon,
  Assignment as NetworkInfoIcon,
  Web as WebIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import AtlasTable, { AtlasColumn } from '../../components/AtlasTable';
import { Switch, Manufacturer, Room, Location } from '../../types/settings';
import { settingsApi } from '../../utils/api';
import handleApiError from '../../utils/errorHandler';

const Switches: React.FC = () => {
  // State für die Daten
  const [switches, setSwitches] = useState<Switch[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentSwitch, setCurrentSwitch] = useState<Switch | null>(null);
  const [readOnly, setReadOnly] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [ipAddress, setIpAddress] = useState<string>('');
  const [macAddress, setMacAddress] = useState<string>('');
  const [manufacturerId, setManufacturerId] = useState<number | ''>('');
  const [model, setModel] = useState<string>('');
  const [locationId, setLocationId] = useState<number | ''>('');
  const [roomId, setRoomId] = useState<number | ''>('');
  const [rackUnit, setRackUnit] = useState<string>('');
  const [portCount, setPortCount] = useState<string>('');
  const [managementUrl, setManagementUrl] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Validation State
  const [errors, setErrors] = useState<{
    name?: string;
    ipAddress?: string;
    macAddress?: string;
    manufacturerId?: string;
    portCount?: string;
    managementUrl?: string;
  }>({});

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
    switchId: number;
  } | null>(null);

  // Daten laden
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Laden der Standorte, Räume, Hersteller und Switches parallel
      const [locationsResponse, roomsResponse, manufacturersResponse, switchesResponse] = await Promise.all([
        settingsApi.getAllLocations(),
        settingsApi.getAllRooms(),
        settingsApi.getAllManufacturers(),
        settingsApi.getAllSwitches()
      ]);

      setLocations(locationsResponse.data as Location[]);
      setRooms(roomsResponse.data as Room[]);
      setManufacturers(manufacturersResponse.data as Manufacturer[]);
      setSwitches(switchesResponse.data as Switch[]);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({
        open: true,
        message: `Fehler beim Laden der Daten: ${errorMessage}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Validierung des Formulars
  const validateForm = (): boolean => {
    const newErrors: any = {};

    // Name ist pflichtfeld
    if (!name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }

    // Hersteller ist pflichtfeld
    if (!manufacturerId) {
      newErrors.manufacturerId = 'Hersteller ist erforderlich';
    }

    // IP-Adresse validieren, wenn eingegeben
    if (ipAddress && !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ipAddress)) {
      newErrors.ipAddress = 'Ungültige IP-Adresse';
    }

    // MAC-Adresse validieren, wenn eingegeben
    if (macAddress && !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(macAddress)) {
      newErrors.macAddress = 'Ungültige MAC-Adresse (Format: XX:XX:XX:XX:XX:XX)';
    }

    // Portanzahl validieren, wenn eingegeben
    if (portCount) {
      const portCountNum = parseInt(portCount, 10);
      if (isNaN(portCountNum) || portCountNum <= 0) {
        newErrors.portCount = 'Ports müssen eine positive Zahl sein';
      }
    }

    // Management-URL validieren, wenn eingegeben
    if (managementUrl && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/.test(managementUrl)) {
      newErrors.managementUrl = 'Ungültige URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Dialog öffnen für neuen Eintrag
  const handleAddNew = () => {
    setEditMode(false);
    setReadOnly(false);
    setCurrentSwitch(null);
    setName('');
    setDescription('');
    setIpAddress('');
    setMacAddress('');
    setManufacturerId('');
    setModel('');
    setLocationId('');
    setRoomId('');
    setRackUnit('');
    setPortCount('');
    setManagementUrl('');
    setIsActive(true);
    setErrors({});
    setDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEdit = (switchItem: Switch) => {
    setEditMode(true);
    setReadOnly(false);
    setCurrentSwitch(switchItem);
    setName(switchItem.name);
    setDescription(switchItem.description);
    setIpAddress(switchItem.ipAddress || '');
    setMacAddress(switchItem.macAddress || '');
    setManufacturerId(switchItem.manufacturerId);
    setModel(switchItem.model || '');
    setLocationId(switchItem.locationId || '');
    setRoomId(switchItem.roomId || '');
    setRackUnit(switchItem.rackUnit || '');
    setPortCount(switchItem.portCount !== undefined ? String(switchItem.portCount) : '');
    setManagementUrl(switchItem.managementUrl || '');
    setIsActive(switchItem.isActive);
    setErrors({});
    setDialogOpen(true);
  };

  // Löschen eines Switches
  const handleDelete = async (switchItem: Switch) => {
    try {
      await settingsApi.deleteSwitch(switchItem.id);
      // Nach erfolgreichem Löschen die Liste aktualisieren
      const updatedSwitches = switches.filter(s => s.id !== switchItem.id);
      setSwitches(updatedSwitches);
      setSnackbar({
        open: true,
        message: `Switch "${switchItem.name}" wurde gelöscht.`,
        severity: 'success'
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({
        open: true,
        message: `Fehler beim Löschen des Switches: ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  // Füge die Kontextmenü-Funktionen hinzu
  const handleContextMenu = (event: React.MouseEvent, switchId: number) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      switchId
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleContextMenuView = () => {
    if (contextMenu) {
      const switchItem = switches.find(s => s.id === contextMenu.switchId);
      if (switchItem) {
        setEditMode(false);
        setReadOnly(true);
        setCurrentSwitch(switchItem);
        setName(switchItem.name);
        setDescription(switchItem.description);
        setIpAddress(switchItem.ipAddress || '');
        setMacAddress(switchItem.macAddress || '');
        setManufacturerId(switchItem.manufacturerId);
        setModel(switchItem.model || '');
        setLocationId(switchItem.locationId || '');
        setRoomId(switchItem.roomId || '');
        setRackUnit(switchItem.rackUnit || '');
        setPortCount(switchItem.portCount !== undefined ? String(switchItem.portCount) : '');
        setManagementUrl(switchItem.managementUrl || '');
        setIsActive(switchItem.isActive);
        setErrors({});
        setDialogOpen(true);
      }
      handleContextMenuClose();
    }
  };

  const handleContextMenuEdit = () => {
    if (contextMenu) {
      const switchItem = switches.find(s => s.id === contextMenu.switchId);
      if (switchItem) {
        handleEdit(switchItem);
      }
      handleContextMenuClose();
    }
  };

  const handleContextMenuDelete = () => {
    if (contextMenu) {
      const switchItem = switches.find(s => s.id === contextMenu.switchId);
      if (switchItem) {
        handleDelete(switchItem);
      }
      handleContextMenuClose();
    }
  };

  // Dialog schließen
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Speichern des Switches
  const handleSave = async () => {
    // Validierung
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Bitte korrigieren Sie die markierten Felder.',
        severity: 'error'
      });
      return;
    }

    const portCountNum = portCount ? parseInt(portCount, 10) : undefined;

    const switchData = {
      name,
      description,
      ipAddress: ipAddress || undefined,
      macAddress: macAddress || undefined,
      manufacturerId: manufacturerId as number,
      model: model || undefined,
      locationId: locationId ? Number(locationId) : undefined,
      roomId: roomId ? Number(roomId) : undefined,
      rackUnit: rackUnit || undefined,
      portCount: portCountNum,
      managementUrl: managementUrl || undefined,
      isActive
    };

    try {
      if (editMode && currentSwitch) {
        // Bestehenden Switch aktualisieren
        const response = await settingsApi.updateSwitch(currentSwitch.id, switchData);

        // Liste der Switches aktualisieren
        const updatedSwitches = switches.map(s =>
          s.id === currentSwitch.id ? response.data as Switch : s
        );

        setSwitches(updatedSwitches);
        setSnackbar({
          open: true,
          message: `Switch "${name}" wurde aktualisiert.`,
          severity: 'success'
        });
      } else {
        // Neuen Switch erstellen
        const response = await settingsApi.createSwitch(switchData);

        // Neuen Switch zur Liste hinzufügen
        setSwitches([...switches, response.data as Switch]);
        setSnackbar({
          open: true,
          message: `Switch "${name}" wurde erstellt.`,
          severity: 'success'
        });
      }

      // Dialog schließen
      setDialogOpen(false);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({
        open: true,
        message: `Fehler beim Speichern des Switches: ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  // Aktualisieren der Daten
  const handleRefresh = () => {
    loadData();
  };

  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Behandeln der Abhängigkeit zwischen Standort und Raum
  const handleLocationChange = (event: SelectChangeEvent<number | ''>) => {
    const newLocationId = event.target.value as number | '';
    setLocationId(newLocationId);
    // Wenn Standort geändert wird, setzen wir den Raum zurück
    setRoomId('');
  };

  // Filtern der Räume nach ausgewähltem Standort
  const filteredRooms = locationId
    ? rooms.filter(room => room.locationId === locationId)
    : rooms;

  // Spalten für die Tabelle
  const columns: AtlasColumn<Switch>[] = [
    { dataKey: 'id', label: 'ID', width: 70, numeric: true },
    { dataKey: 'name', label: 'Bezeichnung' },
    {
      dataKey: 'locationId',
      label: 'Standort',
      render: (value) => {
        if (!value) return '-';
        const location = locations.find(l => l.id === value);
        return location ? location.name : `ID: ${value}`;
      }
    },
    { dataKey: 'ipAddress', label: 'IP-Adresse' },
    {
      dataKey: 'portCount',
      label: 'Anzahl Ports',
      numeric: true,
      render: (value) => value || '-'
    },
    { dataKey: 'description', label: 'Beschreibung' },
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
          Switches
        </Typography>
        <Box>
          <Tooltip title="Aktualisieren">
            <IconButton color="inherit" onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Neuer Switch">
            <IconButton color="inherit" onClick={handleAddNew}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Tabelle */}
      <AtlasTable
        columns={columns}
        rows={switches}
        loading={loading}
        heightPx={600}
        emptyMessage="Keine Switches vorhanden"
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
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Anzeigen</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleContextMenuEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Bearbeiten</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleContextMenuDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Löschen</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {readOnly ? `Switch anzeigen: ${currentSwitch?.name}` :
            (editMode ? `Switch bearbeiten: ${currentSwitch?.name}` : 'Neuen Switch erstellen')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              required
              InputProps={{
                readOnly: readOnly
              }}
            />
            <TextField
              label="Beschreibung"
              fullWidth
              multiline
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              InputProps={{
                readOnly: readOnly
              }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth error={!!errors.manufacturerId} required>
                <InputLabel id="manufacturer-label">Hersteller</InputLabel>
                <Select
                  labelId="manufacturer-label"
                  value={manufacturerId}
                  onChange={(e) => setManufacturerId(e.target.value as number | '')}
                  label="Hersteller"
                  readOnly={readOnly}
                  disabled={readOnly}
                >
                  <MenuItem value="">
                    <em>Bitte wählen</em>
                  </MenuItem>
                  {manufacturers.map((manufacturer) => (
                    <MenuItem key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.manufacturerId && (
                  <Typography variant="caption" color="error">
                    {errors.manufacturerId}
                  </Typography>
                )}
              </FormControl>

              <TextField
                label="Modell"
                fullWidth
                value={model}
                onChange={(e) => setModel(e.target.value)}
                InputProps={{
                  readOnly: readOnly
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="IP-Adresse"
                fullWidth
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="z.B. 192.168.1.1"
                error={!!errors.ipAddress}
                helperText={errors.ipAddress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NetworkIcon />
                    </InputAdornment>
                  ),
                  readOnly: readOnly
                }}
              />

              <TextField
                label="MAC-Adresse"
                fullWidth
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                placeholder="z.B. 00:1A:2B:3C:4D:5E"
                error={!!errors.macAddress}
                helperText={errors.macAddress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NetworkInfoIcon />
                    </InputAdornment>
                  ),
                  readOnly: readOnly
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth disabled={readOnly}>
                <InputLabel id="location-label">Standort</InputLabel>
                <Select
                  labelId="location-label"
                  value={locationId}
                  onChange={handleLocationChange}
                  label="Standort"
                >
                  <MenuItem value="">
                    <em>Bitte wählen</em>
                  </MenuItem>
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth disabled={!locationId || readOnly}>
                <InputLabel id="room-label">Raum</InputLabel>
                <Select
                  labelId="room-label"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value as number | '')}
                  label="Raum"
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>Bitte wählen</em>
                  </MenuItem>
                  {filteredRooms.map((room) => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.name} {room.floor ? `(${room.floor})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Rack-Einheit"
                fullWidth
                value={rackUnit}
                onChange={(e) => setRackUnit(e.target.value)}
                placeholder="z.B. 12-13"
                InputProps={{
                  readOnly: readOnly
                }}
              />

              <TextField
                label="Anzahl Ports"
                fullWidth
                value={portCount}
                onChange={(e) => setPortCount(e.target.value)}
                type="number"
                error={!!errors.portCount}
                helperText={errors.portCount}
                InputProps={{
                  readOnly: readOnly
                }}
              />
            </Box>

            <TextField
              label="Management-URL"
              fullWidth
              value={managementUrl}
              onChange={(e) => setManagementUrl(e.target.value)}
              placeholder="z.B. https://switch01.local"
              error={!!errors.managementUrl}
              helperText={errors.managementUrl}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <WebIcon />
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
              label="Switch aktiv"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          {readOnly ? (
            <Button onClick={handleCloseDialog} color="primary">
              Schließen
            </Button>
          ) : (
            <>
              <Button onClick={handleCloseDialog}>Abbrechen</Button>
              <Button onClick={handleSave} color="primary" variant="contained">
                {editMode ? 'Speichern' : 'Erstellen'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Switches;
