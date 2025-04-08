import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Select,
  FormControl,
  alpha,
  Menu,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  QrCodeScanner as QrCodeScannerIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import AtlasTable, { AtlasColumn } from '../components/AtlasTable';
import BarcodeScanner from '../components/BarcodeScanner';
import { BarcodeFormat } from '@zxing/browser';
import { devicesApi } from '../utils/api';

const Devices: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' }>({ column: 'id', direction: 'asc' });
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; deviceId: string | number } | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await devicesApi.getAllDevices();
        setDevices(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Fehler beim Laden der Geräte:', err);
        setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
        setLoading(false);
        setSnackbarMessage('Fehler beim Laden der Geräte');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };

    fetchDevices();
  }, []);

  const columns: AtlasColumn[] = [
    { label: 'ID', dataKey: 'id', width: 100, sortable: true },
    { label: 'Name', dataKey: 'name', width: 200, sortable: true },
    { label: 'Typ', dataKey: 'type', width: 150, filterable: true },
    { label: 'Seriennummer', dataKey: 'serialNumber', width: 150 },
    { label: 'Hersteller', dataKey: 'manufacturer', width: 150, filterable: true },
    { label: 'Kaufdatum', dataKey: 'purchaseDate', width: 120, sortable: true },
    { label: 'Garantie', dataKey: 'warranty', width: 100 },
    { label: 'Status', dataKey: 'status', width: 120, filterable: true },
    { label: 'Abteilung', dataKey: 'department', width: 150, filterable: true },
    { label: 'Standort', dataKey: 'location', width: 150, filterable: true },
    { label: 'Zugewiesen an', dataKey: 'assignedTo', width: 180 },
    { label: 'Notizen', dataKey: 'notes', width: 180 },
    {
      label: 'Aktionen',
      dataKey: 'actions',
      width: 80,
      render: (_, row) => (
        <IconButton size="small" sx={{ color: '#aaa' }} onClick={(e) => { e.stopPropagation(); handleContextMenu(e, row.id); }}>
          <MoreVertIcon />
        </IconButton>
      )
    }
  ];

  const filteredDevices = devices.filter(device => {
    const matchesSearch = searchText === '' || Object.values(device).some(value =>
      value !== null &&
      value !== undefined &&
      typeof value.toString === 'function' &&
      value.toString().toLowerCase().includes(searchText.toLowerCase())
    );
    const matchesStatus = statusFilter === '' || device.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortConfig({ column, direction });
  };

  const handleFilter = (column: string, filterValue: string) => {
    if (column === 'status') setStatusFilter(filterValue);
  };

  const handleBarcodeDetected = (code: string, format?: BarcodeFormat) => {
    setScannerOpen(false);
    setSearchText(code);
    const matchedDevices = devices.filter(device =>
      device.id === code || device.serialNumber === code || device.name.includes(code)
    );

    if (matchedDevices.length === 1) {
      setSnackbarMessage(`Gerät gefunden: ${matchedDevices[0].name}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setTimeout(() => navigate(`/devices/${matchedDevices[0].id}`), 1000);
    } else if (matchedDevices.length > 1) {
      setSnackbarMessage(`${matchedDevices.length} Geräte gefunden. Wählen Sie ein Gerät aus der Liste.`);
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
    } else {
      setSnackbarMessage(`Kein Gerät mit Code ${code} gefunden.`);
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    }
  };

  const handleOpenScanner = () => setScannerOpen(true);
  const handleCloseScanner = () => setScannerOpen(false);
  const handleSnackbarClose = () => setSnackbarOpen(false);

  const handleContextMenu = (event: React.MouseEvent, deviceId: string | number) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ mouseX: event.clientX - 2, mouseY: event.clientY - 4, deviceId });
  };

  const handleContextMenuClose = () => setContextMenu(null);

  const handleViewDevice = () => {
    if (contextMenu) navigate(`/devices/${contextMenu.deviceId}`);
    handleContextMenuClose();
  };

  const handleEditDevice = () => {
    if (contextMenu) navigate(`/devices/${contextMenu.deviceId}/edit`);
    handleContextMenuClose();
  };

  const handleDeleteDevice = async () => {
    if (contextMenu && window.confirm('Sind Sie sicher, dass Sie dieses Gerät löschen möchten?')) {
      try {
        await devicesApi.deleteDevice(contextMenu.deviceId);
        setDevices(prev => prev.filter(d => d.id !== contextMenu.deviceId));
        setSnackbarMessage('Gerät erfolgreich gelöscht');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (err) {
        console.error('Fehler beim Löschen des Geräts:', err);
        setSnackbarMessage('Fehler beim Löschen des Geräts');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
    handleContextMenuClose();
  };

  const handleDuplicateDevice = () => {
    if (contextMenu) {
      const device = devices.find(d => d.id === contextMenu.deviceId);
      if (device) {
        const newDevice = {
          ...device,
          id: `DEV-${1000 + devices.length}`,
          serialNumber: `SN-${Math.floor(Math.random() * 90000) + 10000}`,
          name: `${device.name} (Kopie)`
        };
        setDevices(prev => [...prev, newDevice]);
      }
    }
    handleContextMenuClose();
  };

  const handleRowClick = (row: any) => navigate(`/devices/${row.id}`);
  const uniqueStatuses = [...new Set(devices.map(d => d.status || ''))];

  const handleCreateDevice = () => {
    navigate('/devices/new');
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: 2, pt: 2 }}>
      <Paper elevation={0} sx={{ bgcolor: '#1976d2', color: 'white', p: 1, pl: 2, borderRadius: '4px 4px 0 0', boxShadow: 'none', mb: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Geräteübersicht
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: alpha('#1976d2', 0.05) }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, maxWidth: 500 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Geräte durchsuchen..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
            sx={{ mr: 1 }}
          />

          <IconButton color="primary" onClick={handleOpenScanner} sx={{ mr: 1 }}>
            <QrCodeScannerIcon />
          </IconButton>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              displayEmpty
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              renderValue={(selected) => selected ? selected : 'Status filtern'}
            >
              <MenuItem value="">Alle Status</MenuItem>
              {uniqueStatuses.map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateDevice}
        >
          Neues Gerät
        </Button>
      </Box>

      <Paper sx={{ flexGrow: 1, overflow: 'hidden', boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderTop: 'none', borderRadius: '0 0 4px 4px' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
              Erneut versuchen
            </Button>
          </Box>
        ) : (
          <AtlasTable
            columns={columns}
            rows={filteredDevices}
            onRowClick={handleRowClick}
            onSort={handleSort}
            onFilter={handleFilter}
            initialSortColumn={sortConfig.column}
            initialSortDirection={sortConfig.direction}
          />
        )}
      </Paper>

      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
      >
        <MenuItem onClick={handleViewDevice}><ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon><ListItemText>Details anzeigen</ListItemText></MenuItem>
        <MenuItem onClick={handleEditDevice}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon><ListItemText>Bearbeiten</ListItemText></MenuItem>
        <MenuItem onClick={handleDuplicateDevice}><ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon><ListItemText>Duplizieren</ListItemText></MenuItem>
        <MenuItem onClick={handleDeleteDevice}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon><ListItemText>Löschen</ListItemText></MenuItem>
      </Menu>

      {scannerOpen && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={handleCloseScanner}
          title="Geräte-Scanner"
          saveHistory={true}
        />
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Devices;
