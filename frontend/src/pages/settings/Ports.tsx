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
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Router as RouterIcon,
  Numbers as PortNumberIcon,
  Settings as ConfigIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import AtlasTable, { AtlasColumn } from '../../components/AtlasTable';
import { NetworkPort, Switch as NetworkSwitch } from '../../types/settings';

const Ports: React.FC = () => {
  // State für die Daten
  const [ports, setPorts] = useState<NetworkPort[]>([]);
  const [switches, setSwitches] = useState<NetworkSwitch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentPort, setCurrentPort] = useState<NetworkPort | null>(null);
  const [readOnly, setReadOnly] = useState<boolean>(false);

  // State für das Kontextmenü
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    portId: number;
  } | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [switchId, setSwitchId] = useState<number | ''>('');
  const [portNumber, setPortNumber] = useState<string>('');
  const [vlan, setVlan] = useState<string>('');
  const [patchPanel, setPatchPanel] = useState<string>('');
  const [patchPort, setPatchPort] = useState<string>('');
  const [description, setDescription] = useState<string>('');
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

  // Mock-Daten für das Beispiel
  const mockSwitches: NetworkSwitch[] = [
    {
      id: 1,
      name: 'SW-HQ-01',
      description: 'Hauptschalter im Serverraum',
      ip: '192.168.1.1',
      model: 'Cisco Catalyst 3850',
      locationId: 1,
      roomId: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'SW-HQ-02',
      description: 'Backup-Switch im Serverraum',
      ip: '192.168.1.2',
      model: 'Cisco Catalyst 3850',
      locationId: 1,
      roomId: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      name: 'SW-FLOOR1-01',
      description: 'Etagenswitch 1. OG',
      ip: '192.168.2.1',
      model: 'Cisco Catalyst 2960',
      locationId: 1,
      roomId: 2,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const mockPorts: NetworkPort[] = [
    {
      id: 1,
      name: 'GigabitEthernet1/0/1',
      switchId: 1,
      portNumber: '1',
      vlan: '10',
      patchPanel: 'PP-01',
      patchPort: 'A1',
      description: 'Verbindung zum Router',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'GigabitEthernet1/0/2',
      switchId: 1,
      portNumber: '2',
      vlan: '20',
      patchPanel: 'PP-01',
      patchPort: 'A2',
      description: 'Server VLAN',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      name: 'GigabitEthernet1/0/3',
      switchId: 1,
      portNumber: '3',
      vlan: '30',
      patchPanel: 'PP-01',
      patchPort: 'A3',
      description: 'Client VLAN',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 4,
      name: 'GigabitEthernet1/0/1',
      switchId: 2,
      portNumber: '1',
      vlan: '10',
      patchPanel: 'PP-02',
      patchPort: 'B1',
      description: 'Uplink zum Hauptswitch',
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Spalten für die Tabelle
  const columns: AtlasColumn<NetworkPort>[] = [
    { dataKey: 'id', label: 'ID', width: 70, numeric: true },
    { dataKey: 'name', label: 'Port-Name', width: 180 },
    {
      dataKey: 'switchId',
      label: 'Switch',
      width: 150,
      render: (value) => {
        if (!value) return '-';
        const switchItem = switches.find(s => s.id === value);
        return switchItem ? switchItem.name : `ID: ${value}`;
      }
    },
    { dataKey: 'portNumber', label: 'Port #', width: 100 },
    { dataKey: 'vlan', label: 'VLAN', width: 100 },
    { dataKey: 'patchPanel', label: 'Patch-Panel', width: 120 },
    { dataKey: 'patchPort', label: 'Patch-Port', width: 120 },
    { dataKey: 'description', label: 'Beschreibung', width: 250 },
    {
      dataKey: 'isActive',
      label: 'Status',
      width: 100,
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
    // Hier würde normalerweise ein API-Aufruf stehen
    // Für das Beispiel verwenden wir Mock-Daten
    setTimeout(() => {
      setSwitches(mockSwitches);
      setPorts(mockPorts);
      setLoading(false);
    }, 1000);
  }, []);

  // Dialog öffnen für neuen Eintrag
  const handleAddNew = () => {
    setEditMode(false);
    setReadOnly(false);
    setCurrentPort(null);
    setName('');
    setSwitchId('');
    setPortNumber('');
    setVlan('');
    setPatchPanel('');
    setPatchPort('');
    setDescription('');
    setIsActive(true);
    setDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEdit = (port: NetworkPort) => {
    setEditMode(true);
    setReadOnly(false);
    setCurrentPort(port);
    setName(port.name);
    setSwitchId(port.switchId || '');
    setPortNumber(port.portNumber || '');
    setVlan(port.vlan || '');
    setPatchPanel(port.patchPanel || '');
    setPatchPort(port.patchPort || '');
    setDescription(port.description);
    setIsActive(port.isActive);
    setDialogOpen(true);
  };

  // Löschen eines Ports
  const handleDelete = (port: NetworkPort) => {
    // Hier würde normalerweise ein API-Aufruf stehen
    const updatedPorts = ports.filter(p => p.id !== port.id);
    setPorts(updatedPorts);
    setSnackbar({
      open: true,
      message: `Port "${port.name}" wurde gelöscht.`,
      severity: 'success'
    });
  };

  // Dialog schließen
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Handlefunktionen für das Kontextmenü
  const handleContextMenu = (event: React.MouseEvent, portId: number) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      portId
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleContextMenuView = () => {
    if (contextMenu) {
      const port = ports.find(p => p.id === contextMenu.portId);
      if (port) {
        setEditMode(false);
        setReadOnly(true);
        setCurrentPort(port);
        setName(port.name);
        setSwitchId(port.switchId || '');
        setPortNumber(port.portNumber || '');
        setVlan(port.vlan || '');
        setPatchPanel(port.patchPanel || '');
        setPatchPort(port.patchPort || '');
        setDescription(port.description);
        setIsActive(port.isActive);
        setDialogOpen(true);
      }
      handleContextMenuClose();
    }
  };

  const handleContextMenuEdit = () => {
    if (contextMenu) {
      const port = ports.find(p => p.id === contextMenu.portId);
      if (port) {
        handleEdit(port);
      }
      handleContextMenuClose();
    }
  };

  const handleContextMenuDelete = () => {
    if (contextMenu) {
      const port = ports.find(p => p.id === contextMenu.portId);
      if (port) {
        handleDelete(port);
      }
      handleContextMenuClose();
    }
  };

  // Speichern des Ports
  const handleSave = () => {
    // Validierung
    if (!name.trim()) {
      setSnackbar({
        open: true,
        message: 'Bitte geben Sie einen Namen ein.',
        severity: 'error'
      });
      return;
    }

    if (!switchId) {
      setSnackbar({
        open: true,
        message: 'Bitte wählen Sie einen Switch aus.',
        severity: 'error'
      });
      return;
    }

    // Neuen Port erstellen oder bestehenden bearbeiten
    if (editMode && currentPort) {
      // Bearbeiten
      const updatedPort: NetworkPort = {
        ...currentPort,
        name,
        switchId: switchId as number,
        portNumber: portNumber || undefined,
        vlan: vlan || undefined,
        patchPanel: patchPanel || undefined,
        patchPort: patchPort || undefined,
        description,
        isActive,
        updatedAt: new Date().toISOString()
      };

      const updatedPorts = ports.map(p =>
        p.id === currentPort.id ? updatedPort : p
      );

      setPorts(updatedPorts);
      setSnackbar({
        open: true,
        message: `Port "${name}" wurde aktualisiert.`,
        severity: 'success'
      });
    } else {
      // Neu erstellen
      const newPort: NetworkPort = {
        id: Math.max(0, ...ports.map(p => p.id)) + 1,
        name,
        switchId: switchId as number,
        portNumber: portNumber || undefined,
        vlan: vlan || undefined,
        patchPanel: patchPanel || undefined,
        patchPort: patchPort || undefined,
        description,
        isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setPorts([...ports, newPort]);
      setSnackbar({
        open: true,
        message: `Port "${name}" wurde erstellt.`,
        severity: 'success'
      });
    }

    setDialogOpen(false);
  };

  // Aktualisieren der Daten
  const handleRefresh = () => {
    setLoading(true);
    // Hier würde normalerweise ein API-Aufruf stehen
    setTimeout(() => {
      setSwitches(mockSwitches);
      setPorts(mockPorts);
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Daten wurden aktualisiert.',
        severity: 'info'
      });
    }, 1000);
  };

  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 2, bgcolor: '#121212', minHeight: '100vh' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#1976d2',
          color: 'white',
          p: 1,
          pl: 2,
          borderRadius: '4px 4px 0 0',
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Netzwerk-Ports
        </Typography>
        <Box>
          <Tooltip title="Aktualisieren">
            <IconButton color="inherit" onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Neuer Port">
            <IconButton color="inherit" onClick={handleAddNew}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Tabelle */}
      <AtlasTable
        columns={columns}
        rows={ports}
        loading={loading}
        heightPx={600}
        emptyMessage="Keine Ports vorhanden"
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
          {readOnly ? `Port anzeigen: ${currentPort?.name}` :
            (editMode ? `Port bearbeiten: ${currentPort?.name}` : 'Neuen Port erstellen')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Port-Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="z.B. GigabitEthernet1/0/1"
              InputProps={{
                readOnly: readOnly
              }}
            />

            <FormControl fullWidth required>
              <InputLabel id="switch-label">Switch</InputLabel>
              <Select
                labelId="switch-label"
                value={switchId}
                onChange={(e) => setSwitchId(e.target.value as number)}
                label="Switch"
                inputProps={{
                  readOnly: readOnly
                }}
                startAdornment={
                  <InputAdornment position="start">
                    <RouterIcon />
                  </InputAdornment>
                }
              >
                {switches.filter(s => s.isActive).map((switchItem) => (
                  <MenuItem key={switchItem.id} value={switchItem.id}>
                    {switchItem.name} ({switchItem.ip})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Port-Nummer"
                value={portNumber}
                onChange={(e) => setPortNumber(e.target.value)}
                sx={{ width: '50%' }}
                placeholder="z.B. 1, 2, 3, ..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PortNumberIcon />
                    </InputAdornment>
                  ),
                  readOnly: readOnly
                }}
              />
              <TextField
                label="VLAN"
                value={vlan}
                onChange={(e) => setVlan(e.target.value)}
                sx={{ width: '50%' }}
                placeholder="z.B. 10, 20, 30, ..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ConfigIcon />
                    </InputAdornment>
                  ),
                  readOnly: readOnly
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Patch-Panel"
                value={patchPanel}
                onChange={(e) => setPatchPanel(e.target.value)}
                sx={{ width: '50%' }}
                placeholder="z.B. PP-01"
                InputProps={{
                  readOnly: readOnly
                }}
              />
              <TextField
                label="Patch-Port"
                value={patchPort}
                onChange={(e) => setPatchPort(e.target.value)}
                sx={{ width: '50%' }}
                placeholder="z.B. A1, B2, ..."
                InputProps={{
                  readOnly: readOnly
                }}
              />
            </Box>

            <TextField
              label="Beschreibung"
              fullWidth
              multiline
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibung des Ports und seiner Verwendung"
              InputProps={{
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
              label="Port aktiv"
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

export default Ports;
