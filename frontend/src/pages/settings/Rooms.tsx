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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Business as BuildingIcon,
  Layers as FloorIcon,
  Groups as CapacityIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import AtlasTable, { AtlasColumn } from '../../components/AtlasTable';
import { Room } from '../../types/settings';
import { settingsApi } from '../../utils/api';

const Rooms: React.FC = () => {
  // State für die Daten
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [readOnly, setReadOnly] = useState<boolean>(false);

  // State für das Kontextmenü
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    roomId: number;
  } | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [floor, setFloor] = useState<string>('');
  const [building, setBuilding] = useState<string>('');
  const [capacity, setCapacity] = useState<string>('');
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

  // Gebäudeoptionen
  const buildingOptions = ['Hauptgebäude', 'Nebengebäude', 'Produktionshalle', 'Lager'];

  // Stockwerksoptionen
  const floorOptions = ['UG', 'EG', '1. OG', '2. OG', '3. OG', '4. OG', '5. OG'];

  // API-Daten laden
  useEffect(() => {
    fetchRooms();
  }, []);

  // Räume vom API laden
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getAllRooms();
      setRooms(response.data);
      setLoading(false);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Fehler beim Laden der Räume: ${error.message}`,
        severity: 'error'
      });
      setLoading(false);
    }
  };

  // Spalten für die AtlasTable-Komponente
  const columns: AtlasColumn[] = [
    { label: 'ID', dataKey: 'id', width: 80 },
    { label: 'Name', dataKey: 'name', width: 200 },
    { label: 'Beschreibung', dataKey: 'description', width: 300 },
    { label: 'Gebäude', dataKey: 'building', width: 150 },
    { label: 'Stockwerk', dataKey: 'floor', width: 120 },
    { label: 'Kapazität', dataKey: 'capacity', width: 100, numeric: true },
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
      render: (_, room: Room) => (
        <IconButton
          onClick={(event) => handleContextMenu(event, room.id)}
          size="small"
        >
          <MoreVertIcon />
        </IconButton>
      )
    }
  ];

  // Dialog öffnen für neuen Raum
  const handleAddNew = () => {
    setEditMode(false);
    setReadOnly(false);
    setCurrentRoom(null);
    setName('');
    setDescription('');
    setFloor('');
    setBuilding('');
    setCapacity('');
    setIsActive(true);
    setDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEdit = (room: Room) => {
    setEditMode(true);
    setReadOnly(false);
    setCurrentRoom(room);
    setName(room.name);
    setDescription(room.description);
    setFloor(room.floor || '');
    setBuilding(room.building || '');
    setCapacity(room.capacity !== undefined ? String(room.capacity) : '');
    setIsActive(room.isActive);
    setDialogOpen(true);
  };

  // Löschen eines Raums
  const handleDelete = async (room: Room) => {
    try {
      await settingsApi.deleteRoom(room.id);
      // Aktualisiere die Liste der Räume nach dem Löschen
      setRooms(rooms.filter(r => r.id !== room.id));
      setSnackbar({
        open: true,
        message: `Raum "${room.name}" wurde gelöscht.`,
        severity: 'success'
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Fehler beim Löschen des Raums: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Dialog schließen
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Speichern des Raums
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

    // Kapazität in Zahl umwandeln
    const capacityNumber = capacity ? parseInt(capacity, 10) : undefined;

    // Validierung der Kapazität
    if (capacity && isNaN(capacityNumber as number)) {
      setSnackbar({
        open: true,
        message: 'Kapazität muss eine Zahl sein.',
        severity: 'error'
      });
      return;
    }

    try {
      // Neue Raum-Daten erstellen
      const roomData: Partial<Room> = {
        name,
        description,
        floor: floor || undefined,
        building: building || undefined,
        capacity: capacityNumber,
        isActive
      };

      if (editMode && currentRoom) {
        // Bestehenden Raum bearbeiten
        const response = await settingsApi.updateRoom(currentRoom.id, roomData);

        // Lokale Liste aktualisieren
        const updatedRoom = response.data;
        setRooms(rooms.map(r => r.id === currentRoom.id ? updatedRoom : r));

        setSnackbar({
          open: true,
          message: `Raum "${name}" wurde aktualisiert.`,
          severity: 'success'
        });
      } else {
        // Neuen Raum erstellen
        const response = await settingsApi.createRoom(roomData);

        // Neuen Raum zur lokalen Liste hinzufügen
        const newRoom = response.data;
        setRooms([...rooms, newRoom]);

        setSnackbar({
          open: true,
          message: `Raum "${name}" wurde erstellt.`,
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
    fetchRooms();
  };

  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Handlefunktionen für das Kontextmenü
  const handleContextMenu = (event: React.MouseEvent, roomId: number) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      roomId
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleContextMenuView = () => {
    if (contextMenu) {
      const room = rooms.find(r => r.id === contextMenu.roomId);
      if (room) {
        setEditMode(false);
        setReadOnly(true);
        setCurrentRoom(room);
        setName(room.name);
        setDescription(room.description);
        setFloor(room.floor || '');
        setBuilding(room.building || '');
        setCapacity(room.capacity !== undefined ? String(room.capacity) : '');
        setIsActive(room.isActive);
        setDialogOpen(true);
      }
      handleContextMenuClose();
    }
  };

  const handleContextMenuEdit = () => {
    if (contextMenu) {
      const room = rooms.find(r => r.id === contextMenu.roomId);
      if (room) {
        handleEdit(room);
      }
      handleContextMenuClose();
    }
  };

  const handleContextMenuDelete = () => {
    if (contextMenu) {
      const room = rooms.find(r => r.id === contextMenu.roomId);
      if (room) {
        handleDelete(room);
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
          Räume
        </Typography>
        <Box>
          <Tooltip title="Aktualisieren">
            <IconButton color="inherit" onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Neuer Raum">
            <IconButton color="inherit" onClick={handleAddNew}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Tabelle */}
      <AtlasTable
        columns={columns}
        rows={rooms}
        loading={loading}
        heightPx={600}
        emptyMessage="Keine Räume vorhanden"
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
          {readOnly ? `Raum anzeigen: ${currentRoom?.name}` :
            (editMode ? `Raum bearbeiten: ${currentRoom?.name}` : 'Neuen Raum erstellen')}
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
              <InputLabel id="building-label">Gebäude</InputLabel>
              <Select
                labelId="building-label"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                label="Gebäude"
                inputProps={{
                  readOnly: readOnly
                }}
                startAdornment={
                  <InputAdornment position="start">
                    <BuildingIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="">
                  <em>Keines</em>
                </MenuItem>
                {buildingOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="floor-label">Stockwerk</InputLabel>
              <Select
                labelId="floor-label"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                label="Stockwerk"
                inputProps={{
                  readOnly: readOnly
                }}
                startAdornment={
                  <InputAdornment position="start">
                    <FloorIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="">
                  <em>Keines</em>
                </MenuItem>
                {floorOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Kapazität"
              fullWidth
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Anzahl der Personen"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CapacityIcon />
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
              label="Raum aktiv"
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

export default Rooms;
