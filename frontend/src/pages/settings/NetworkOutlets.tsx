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
  WallpaperOutlined as WallPositionIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import AtlasTable, { AtlasColumn } from '../../components/AtlasTable';
import { NetworkOutlet, Room, Location } from '../../types/settings';
import { settingsApi } from '../../utils/api';
import handleApiError from '../../utils/errorHandler';

const NetworkOutlets: React.FC = () => {
  // State für die Daten
  const [networkOutlets, setNetworkOutlets] = useState<NetworkOutlet[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentOutlet, setCurrentOutlet] = useState<NetworkOutlet | null>(null);
  const [readOnly, setReadOnly] = useState<boolean>(false);

  // State für das Kontextmenü
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    outletId: number;
  } | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [locationId, setLocationId] = useState<number | ''>('');
  const [roomId, setRoomId] = useState<number | ''>('');
  const [wallPosition, setWallPosition] = useState<string>('');
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

  // Daten laden
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Laden der Standorte, Räume und Netzwerkdosen parallel
      const [locationsResponse, roomsResponse, networkOutletsResponse] = await Promise.all([
        settingsApi.getAllLocations(),
        settingsApi.getAllRooms(),
        settingsApi.getAllNetworkOutlets()
      ]);

      setLocations(locationsResponse.data as Location[]);
      setRooms(roomsResponse.data as Room[]);
      setNetworkOutlets(networkOutletsResponse.data as NetworkOutlet[]);
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

  // Dialog öffnen für neuen Eintrag
  const handleAddNew = () => {
    setEditMode(false);
    setReadOnly(false);
    setCurrentOutlet(null);
    setName('');
    setDescription('');
    setLocationId('');
    setRoomId('');
    setWallPosition('');
    setIsActive(true);
    setDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEdit = (outlet: NetworkOutlet) => {
    setEditMode(true);
    setReadOnly(false);
    setCurrentOutlet(outlet);
    setName(outlet.name);
    setDescription(outlet.description);
    setLocationId(outlet.locationId || '');
    setRoomId(outlet.roomId || '');
    setWallPosition(outlet.wallPosition || '');
    setIsActive(outlet.isActive);
    setDialogOpen(true);
  };

  // Löschen einer Netzwerkdose
  const handleDelete = async (outlet: NetworkOutlet) => {
    try {
      await settingsApi.deleteNetworkOutlet(outlet.id);
      // Nach erfolgreichem Löschen die Liste aktualisieren
      const updatedOutlets = networkOutlets.filter(o => o.id !== outlet.id);
      setNetworkOutlets(updatedOutlets);
      setSnackbar({
        open: true,
        message: `Netzwerkdose "${outlet.name}" wurde gelöscht.`,
        severity: 'success'
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({
        open: true,
        message: `Fehler beim Löschen der Netzwerkdose: ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  // Dialog schließen
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Handlefunktionen für das Kontextmenü
  const handleContextMenu = (event: React.MouseEvent, outletId: number) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      outletId
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleContextMenuView = () => {
    if (contextMenu) {
      const outlet = networkOutlets.find(o => o.id === contextMenu.outletId);
      if (outlet) {
        setEditMode(false);
        setReadOnly(true);
        setCurrentOutlet(outlet);
        setName(outlet.name);
        setDescription(outlet.description);
        setLocationId(outlet.locationId || '');
        setRoomId(outlet.roomId || '');
        setWallPosition(outlet.wallPosition || '');
        setIsActive(outlet.isActive);
        setDialogOpen(true);
      }
      handleContextMenuClose();
    }
  };

  const handleContextMenuEdit = () => {
    if (contextMenu) {
      const outlet = networkOutlets.find(o => o.id === contextMenu.outletId);
      if (outlet) {
        handleEdit(outlet);
      }
      handleContextMenuClose();
    }
  };

  const handleContextMenuDelete = () => {
    if (contextMenu) {
      const outlet = networkOutlets.find(o => o.id === contextMenu.outletId);
      if (outlet) {
        handleDelete(outlet);
      }
      handleContextMenuClose();
    }
  };

  // Speichern der Netzwerkdose
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

    const outletData = {
      name,
      description,
      locationId: locationId ? Number(locationId) : undefined,
      roomId: roomId ? Number(roomId) : undefined,
      wallPosition: wallPosition || undefined,
      isActive
    };

    try {
      if (editMode && currentOutlet) {
        // Bestehende Netzwerkdose aktualisieren
        const response = await settingsApi.updateNetworkOutlet(currentOutlet.id, outletData);

        // Liste der Netzwerkdosen aktualisieren
        const updatedOutlets = networkOutlets.map(o =>
          o.id === currentOutlet.id ? response.data as NetworkOutlet : o
        );

        setNetworkOutlets(updatedOutlets);
        setSnackbar({
          open: true,
          message: `Netzwerkdose "${name}" wurde aktualisiert.`,
          severity: 'success'
        });
      } else {
        // Neue Netzwerkdose erstellen
        const response = await settingsApi.createNetworkOutlet(outletData);

        // Neue Netzwerkdose zur Liste hinzufügen
        setNetworkOutlets([...networkOutlets, response.data as NetworkOutlet]);
        setSnackbar({
          open: true,
          message: `Netzwerkdose "${name}" wurde erstellt.`,
          severity: 'success'
        });
      }

      // Dialog schließen
      setDialogOpen(false);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({
        open: true,
        message: `Fehler beim Speichern der Netzwerkdose: ${errorMessage}`,
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

  // Behandeln der Standortänderung
  const handleLocationChange = (event: SelectChangeEvent<number | ''>) => {
    const newLocationId = event.target.value as number | '';
    setLocationId(newLocationId);
    // Wenn Standort geändert wird, setzen wir den Raum zurück
    setRoomId('');
  };

  // Gefilterte Räume basierend auf dem ausgewählten Standort
  const filteredRooms = locationId
    ? rooms.filter(room => room.locationId === locationId)
    : rooms;

  // Spalten für die Tabelle
  const columns: AtlasColumn<NetworkOutlet>[] = [
    { dataKey: 'id', label: 'ID', width: 70, numeric: true },
    { dataKey: 'name', label: 'Bezeichnung' },
    { dataKey: 'description', label: 'Beschreibung' },
    {
      dataKey: 'locationId',
      label: 'Standort',
      render: (value) => {
        if (!value) return '-';
        const location = locations.find(l => l.id === value);
        return location ? location.name : `ID: ${value}`;
      }
    },
    {
      dataKey: 'roomId',
      label: 'Raum',
      render: (value) => {
        if (!value) return '-';
        const room = rooms.find(r => r.id === value);
        return room ? room.name : `ID: ${value}`;
      }
    },
    { dataKey: 'wallPosition', label: 'Position an Wand' },
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
          Netzwerkdosen
        </Typography>
        <Box>
          <Tooltip title="Aktualisieren">
            <IconButton color="inherit" onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Neue Netzwerkdose">
            <IconButton color="inherit" onClick={handleAddNew}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Tabelle */}
      <AtlasTable
        columns={columns}
        rows={networkOutlets}
        loading={loading}
        heightPx={600}
        emptyMessage="Keine Netzwerkdosen vorhanden"
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
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {readOnly ? `Netzwerkdose anzeigen: ${currentOutlet?.name}` :
            (editMode ? `Netzwerkdose bearbeiten: ${currentOutlet?.name}` : 'Neue Netzwerkdose erstellen')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="z.B. ND-101-01"
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
              placeholder="Beschreibung der Netzwerkdose"
              InputProps={{
                readOnly: readOnly
              }}
            />

            <FormControl fullWidth disabled={readOnly}>
              <InputLabel id="location-label">Standort</InputLabel>
              <Select
                labelId="location-label"
                label="Standort"
                value={locationId}
                onChange={handleLocationChange}
              >
                <MenuItem value="">
                  <em>Bitte wählen</em>
                </MenuItem>
                {locations.map(location => (
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
                label="Raum"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value as number | '')}
                displayEmpty
              >
                <MenuItem value="">
                  <em>Bitte wählen</em>
                </MenuItem>
                {filteredRooms.map(room => (
                  <MenuItem key={room.id} value={room.id}>
                    {room.name} {room.floor ? `(${room.floor})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Position an der Wand"
              fullWidth
              value={wallPosition}
              onChange={(e) => setWallPosition(e.target.value)}
              placeholder="z.B. Links neben Tür"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <WallPositionIcon />
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
              label="Netzwerkdose aktiv"
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

export default NetworkOutlets;
