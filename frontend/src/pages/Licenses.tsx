import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  InputBase,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  alpha,
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  TextField,
  InputAdornment,
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
import { licensesApi } from '../utils/api';

const Licenses: React.FC = () => {
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [sortConfig, setSortConfig] = useState<{column: string, direction: 'asc' | 'desc'}>({
    column: 'id',
    direction: 'asc'
  });

  // Kontext-Menü-Status
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    licenseId: string | number;
  } | null>(null);

  // Daten von der API laden
  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await licensesApi.getAllLicenses();
        setLicenses(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Fehler beim Laden der Lizenzen:', err);
        setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
        setLoading(false);
        setSnackbarMessage('Fehler beim Laden der Lizenzen');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };

    fetchLicenses();
  }, []);

  // Spalten für die AtlasTable-Komponente mit Sortier- und Filterfunktionalität
  const columns: AtlasColumn[] = [
    { label: 'ID', dataKey: 'id', width: 100, sortable: true },
    { label: 'Software', dataKey: 'software', width: 180, sortable: true, filterable: true },
    { label: 'Lizenztyp', dataKey: 'type', width: 150, filterable: true },
    { label: 'Lizenzschlüssel', dataKey: 'licenseKey', width: 180 },
    { label: 'Kaufdatum', dataKey: 'purchaseDate', width: 120, sortable: true },
    { label: 'Ablaufdatum', dataKey: 'expirationDate', width: 120, sortable: true },
    { label: 'Arbeitsplätze', dataKey: 'seats', width: 120, numeric: true, sortable: true },
    { label: 'Zugewiesen an', dataKey: 'assignedTo', width: 150 },
    { label: 'Gerät-ID', dataKey: 'deviceId', width: 120 },
    { label: 'Status', dataKey: 'status', width: 120, filterable: true },
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

  // Filter für die Lizenztabelle mit sicherer Typprüfung
  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = searchText === '' ||
      Object.values(license).some(value =>
        value !== null &&
        value !== undefined &&
        typeof value.toString === 'function' &&
        value.toString().toLowerCase().includes(searchText.toLowerCase())
      );

    const matchesStatus = statusFilter === '' || license.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sortierungsfunktion hinzufügen
  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortConfig({ column, direction });
  };

  // Filterfunktion hinzufügen
  const handleFilter = (column: string, filterValue: string) => {
    if (column === 'status') {
      setStatusFilter(filterValue);
    }
  };

  const handleBarcodeDetected = (code: string) => {
    setScannerOpen(false);
    setSearchText(code);
    const matchedLicenses = licenses.filter(license =>
      license.id === code || license.licenseKey === code || license.software.includes(code)
    );

    if (matchedLicenses.length === 1) {
      setSnackbarMessage(`Lizenz gefunden: ${matchedLicenses[0].software}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setTimeout(() => navigate(`/licenses/${matchedLicenses[0].id}`), 1000);
    } else if (matchedLicenses.length > 1) {
      setSnackbarMessage(`${matchedLicenses.length} Lizenzen gefunden. Wählen Sie eine Lizenz aus der Liste.`);
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
    } else {
      setSnackbarMessage(`Keine Lizenz mit Code ${code} gefunden.`);
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    }
  };

  const handleOpenScanner = () => setScannerOpen(true);
  const handleCloseScanner = () => setScannerOpen(false);
  const handleSnackbarClose = () => setSnackbarOpen(false);

  // Kontext-Menü öffnen
  const handleContextMenu = (event: React.MouseEvent, licenseId: string | number) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      licenseId
    });
  };

  // Kontext-Menü schließen
  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  // Lizenz anzeigen
  const handleViewLicense = () => {
    if (contextMenu) {
      navigate(`/licenses/${contextMenu.licenseId}`);
      handleContextMenuClose();
    }
  };

  // Lizenz bearbeiten
  const handleEditLicense = () => {
    if (contextMenu) {
      navigate(`/licenses/${contextMenu.licenseId}/edit`);
      handleContextMenuClose();
    }
  };

  // Lizenz löschen
  const handleDeleteLicense = async () => {
    if (contextMenu && window.confirm('Sind Sie sicher, dass Sie diese Lizenz löschen möchten?')) {
      try {
        await licensesApi.deleteLicense(contextMenu.licenseId);
        setLicenses(prev => prev.filter(license => license.id !== contextMenu.licenseId));
        setSnackbarMessage('Lizenz erfolgreich gelöscht');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (err) {
        console.error('Fehler beim Löschen der Lizenz:', err);
        setSnackbarMessage('Fehler beim Löschen der Lizenz');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
      handleContextMenuClose();
    }
  };

  // Lizenz duplizieren
  const handleDuplicateLicense = () => {
    if (contextMenu) {
      const license = licenses.find(license => license.id === contextMenu.licenseId);
      if (license) {
        const newLicense = {
          ...license,
          id: `LIC-${1000 + licenses.length}`,
          licenseKey: `XXXX-XXXX-XXXX-${Math.floor(Math.random() * 9000) + 1000}`,
          software: `${license.software} (Kopie)`
        };
        setLicenses(prev => [...prev, newLicense]);
      }
      handleContextMenuClose();
    }
  };

  // Zeile anklicken
  const handleRowClick = (row: any) => {
    navigate(`/licenses/${row.id}`);
  };

  // Eindeutige Status für Filter ermitteln
  const uniqueStatuses = [...new Set(licenses.map(license => license.status || ''))];

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: 2, pt: 2 }}>
      <Paper elevation={0} sx={{ bgcolor: '#1976d2', color: 'white', p: 1, pl: 2, borderRadius: '4px 4px 0 0', boxShadow: 'none', mb: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Lizenzübersicht
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: alpha('#1976d2', 0.05) }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, maxWidth: 500 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Lizenzen durchsuchen..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>)
            }}
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

        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/licenses/new')}>
          Neue Lizenz
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
            rows={filteredLicenses}
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
        <MenuItem onClick={handleViewLicense}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Details anzeigen</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEditLicense}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Bearbeiten</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDuplicateLicense}>
          <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Duplizieren</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteLicense}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Löschen</ListItemText>
        </MenuItem>
      </Menu>

      {scannerOpen && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={handleCloseScanner}
          title="Lizenz-Scanner"
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

export default Licenses;
