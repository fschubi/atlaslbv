import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  alpha,
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Snackbar,
  Alert
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
import { accessoriesApi } from '../utils/api';

const Accessories: React.FC = () => {
  const navigate = useNavigate();
  const [accessories, setAccessories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' }>({
    column: 'id',
    direction: 'asc'
  });

  // Kontext-Menü-Status
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    accessoryId: string | number;
  } | null>(null);

  // Daten von der API laden
  useEffect(() => {
    const fetchAccessories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await accessoriesApi.getAllAccessories();
        setAccessories(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Fehler beim Laden des Zubehörs:', err);
        setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
        setLoading(false);
        setSnackbarMessage('Fehler beim Laden des Zubehörs');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };

    fetchAccessories();
  }, []);

  // Spalten für die AtlasTable-Komponente
  const columns: AtlasColumn[] = [
    { label: 'ID', dataKey: 'id', width: 100, sortable: true },
    { label: 'Name', dataKey: 'name', width: 200, sortable: true },
    { label: 'Typ', dataKey: 'type', width: 150, filterable: true },
    { label: 'Seriennummer', dataKey: 'serialNumber', width: 150 },
    { label: 'Hersteller', dataKey: 'manufacturer', width: 150, filterable: true },
    { label: 'Kaufdatum', dataKey: 'purchaseDate', width: 120, sortable: true },
    { label: 'Benutzer', dataKey: 'assignedToUser', width: 150 },
    { label: 'Gerät', dataKey: 'assignedToDevice', width: 120 },
    { label: 'Status', dataKey: 'status', width: 120, filterable: true },
    { label: 'Standort', dataKey: 'location', width: 150, filterable: true },
    { label: 'Notizen', dataKey: 'notes', width: 180 },
    {
      label: 'Aktionen',
      dataKey: 'actions',
      width: 80,
      render: (_, row) => (
        <IconButton
          size="small"
          sx={{ color: '#aaa' }}
          onClick={(event) => {
            event.stopPropagation();
            handleContextMenu(event, row.id);
          }}
        >
          <MoreVertIcon />
        </IconButton>
      )
    }
  ];

  // Filter für die Zubehörtabelle mit sicherer Typprüfung
  const filteredAccessories = accessories.filter(accessory => {
    const matchesSearch = searchText === '' ||
      Object.values(accessory).some(value =>
        value !== null &&
        value !== undefined &&
        typeof value.toString === 'function' &&
        value.toString().toLowerCase().includes(searchText.toLowerCase())
      );

    const matchesStatus = statusFilter === '' || accessory.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sortierungsfunktion
  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortConfig({ column, direction });
  };

  // Filterfunktion
  const handleFilter = (column: string, filterValue: string) => {
    if (column === 'status') {
      setStatusFilter(filterValue);
    }
  };

  const handleBarcodeDetected = (code: string) => {
    setScannerOpen(false);
    setSearchText(code);
    const matchedAccessories = accessories.filter(accessory =>
      accessory.id === code || accessory.serialNumber === code || accessory.name.includes(code)
    );

    if (matchedAccessories.length === 1) {
      setSnackbarMessage(`Zubehör gefunden: ${matchedAccessories[0].name}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setTimeout(() => navigate(`/accessories/${matchedAccessories[0].id}`), 1000);
    } else if (matchedAccessories.length > 1) {
      setSnackbarMessage(`${matchedAccessories.length} Zubehörteile gefunden. Wählen Sie ein Zubehör aus der Liste.`);
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
    } else {
      setSnackbarMessage(`Kein Zubehör mit Code ${code} gefunden.`);
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    }
  };

  const handleOpenScanner = () => setScannerOpen(true);
  const handleCloseScanner = () => setScannerOpen(false);
  const handleSnackbarClose = () => setSnackbarOpen(false);

  // Kontext-Menü öffnen
  const handleContextMenu = (event: React.MouseEvent, accessoryId: string | number) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      accessoryId
    });
  };

  // Kontext-Menü schließen
  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  // Zubehör ansehen (Details)
  const handleViewAccessory = () => {
    if (contextMenu) {
      navigate(`/accessories/${contextMenu.accessoryId}`);
      handleContextMenuClose();
    }
  };

  // Zubehör bearbeiten
  const handleEditAccessory = () => {
    if (contextMenu) {
      navigate(`/accessories/${contextMenu.accessoryId}/edit`);
      handleContextMenuClose();
    }
  };

  // Zubehör löschen
  const handleDeleteAccessory = async () => {
    if (contextMenu && window.confirm('Sind Sie sicher, dass Sie dieses Zubehör löschen möchten?')) {
      try {
        await accessoriesApi.deleteAccessory(contextMenu.accessoryId);
        setAccessories(prev => prev.filter(acc => acc.id !== contextMenu.accessoryId));
        setSnackbarMessage('Zubehör erfolgreich gelöscht');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (err) {
        console.error('Fehler beim Löschen des Zubehörs:', err);
        setSnackbarMessage('Fehler beim Löschen des Zubehörs');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
      handleContextMenuClose();
    }
  };

  // Zubehör duplizieren
  const handleDuplicateAccessory = () => {
    if (contextMenu) {
      const accessory = accessories.find(acc => acc.id === contextMenu.accessoryId);
      if (accessory) {
        const newAccessory = {
          ...accessory,
          id: `ACC-${1000 + accessories.length}`,
          serialNumber: accessory.serialNumber ? `SN-${Math.floor(Math.random() * 90000) + 10000}` : '',
          assignedToUser: '',
          assignedToDevice: '',
          name: `${accessory.name} (Kopie)`
        };
        setAccessories(prev => [...prev, newAccessory]);
      }
      handleContextMenuClose();
    }
  };

  const handleRowClick = (row: any) => {
    navigate(`/accessories/${row.id}`);
  };

  const uniqueStatuses = [...new Set(accessories.map(accessory => accessory.status || ''))];

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: 2, pt: 2 }}>
      <Paper elevation={0} sx={{ bgcolor: '#1976d2', color: 'white', p: 1, pl: 2, borderRadius: '4px 4px 0 0', boxShadow: 'none', mb: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Zubehörübersicht
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: alpha('#1976d2', 0.05) }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, maxWidth: 500 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Zubehör durchsuchen..."
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

        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/accessories/new')}>
          Neues Zubehör
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
            rows={filteredAccessories}
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
        <MenuItem onClick={handleViewAccessory}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Details anzeigen</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEditAccessory}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Bearbeiten</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDuplicateAccessory}>
          <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Duplizieren</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteAccessory}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Löschen</ListItemText>
        </MenuItem>
      </Menu>

      {scannerOpen && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={handleCloseScanner}
          title="Zubehör-Scanner"
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

export default Accessories;
