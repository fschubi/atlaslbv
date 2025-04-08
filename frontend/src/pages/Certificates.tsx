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
import { certificatesApi } from '../utils/api';

const Certificates: React.FC = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<any[]>([]);
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
    certificateId: string | number;
  } | null>(null);

  // Daten von der API laden
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await certificatesApi.getAllCertificates();
        setCertificates(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Fehler beim Laden der Zertifikate:', err);
        setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
        setLoading(false);
        setSnackbarMessage('Fehler beim Laden der Zertifikate');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };

    fetchCertificates();
  }, []);

  // Spalten für die AtlasTable-Komponente mit Sortier- und Filterfunktionalität
  const columns: AtlasColumn[] = [
    { label: 'ID', dataKey: 'id', width: 100, sortable: true },
    { label: 'Name', dataKey: 'name', width: 200, sortable: true },
    { label: 'Service', dataKey: 'service', width: 150, filterable: true },
    { label: 'Domain', dataKey: 'domain', width: 180, filterable: true },
    { label: 'Ausgestellt am', dataKey: 'issuedAt', width: 120, sortable: true },
    { label: 'Ablaufdatum', dataKey: 'expirationDate', width: 120, sortable: true },
    { label: 'Aussteller', dataKey: 'issuer', width: 150, filterable: true },
    { label: 'Gerät', dataKey: 'assignedToDevice', width: 120 },
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

  // Filter für die Zertifikatstabelle mit sicherer Typprüfung
  const filteredCertificates = certificates.filter(certificate => {
    const matchesSearch = searchText === '' ||
      Object.values(certificate).some(value =>
        value !== null &&
        value !== undefined &&
        typeof value.toString === 'function' &&
        value.toString().toLowerCase().includes(searchText.toLowerCase())
      );

    const matchesStatus = statusFilter === '' || certificate.status === statusFilter;

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
    const matchedCertificates = certificates.filter(certificate =>
      certificate.id === code || certificate.name.includes(code) || certificate.domain === code
    );

    if (matchedCertificates.length === 1) {
      setSnackbarMessage(`Zertifikat gefunden: ${matchedCertificates[0].name}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setTimeout(() => navigate(`/certificates/${matchedCertificates[0].id}`), 1000);
    } else if (matchedCertificates.length > 1) {
      setSnackbarMessage(`${matchedCertificates.length} Zertifikate gefunden. Wählen Sie ein Zertifikat aus der Liste.`);
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
    } else {
      setSnackbarMessage(`Kein Zertifikat mit Code ${code} gefunden.`);
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    }
  };

  const handleOpenScanner = () => setScannerOpen(true);
  const handleCloseScanner = () => setScannerOpen(false);
  const handleSnackbarClose = () => setSnackbarOpen(false);

  // Kontext-Menü öffnen
  const handleContextMenu = (event: React.MouseEvent, certificateId: string | number) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      certificateId
    });
  };

  // Kontext-Menü schließen
  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  // Zertifikat ansehen (Details)
  const handleViewCertificate = () => {
    if (contextMenu) {
      navigate(`/certificates/${contextMenu.certificateId}`);
      handleContextMenuClose();
    }
  };

  // Zertifikat bearbeiten
  const handleEditCertificate = () => {
    if (contextMenu) {
      navigate(`/certificates/${contextMenu.certificateId}/edit`);
      handleContextMenuClose();
    }
  };

  // Zertifikat löschen
  const handleDeleteCertificate = async () => {
    if (contextMenu && window.confirm('Sind Sie sicher, dass Sie dieses Zertifikat löschen möchten?')) {
      try {
        await certificatesApi.deleteCertificate(contextMenu.certificateId);
        setCertificates(prev => prev.filter(cert => cert.id !== contextMenu.certificateId));
        setSnackbarMessage('Zertifikat erfolgreich gelöscht');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (err) {
        console.error('Fehler beim Löschen des Zertifikats:', err);
        setSnackbarMessage('Fehler beim Löschen des Zertifikats');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
      handleContextMenuClose();
    }
  };

  // Zertifikat duplizieren
  const handleDuplicateCertificate = () => {
    if (contextMenu) {
      const certificate = certificates.find(cert => cert.id === contextMenu.certificateId);
      if (certificate) {
        const newCertificate = {
          ...certificate,
          id: `CERT-${1000 + certificates.length}`,
          name: `${certificate.name} (Kopie)`,
          issuedAt: new Date().toLocaleDateString('de-DE'),
          expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('de-DE'),
          assignedToDevice: ''
        };
        setCertificates(prev => [...prev, newCertificate]);
      }
      handleContextMenuClose();
    }
  };

  const handleRowClick = (row: any) => {
    navigate(`/certificates/${row.id}`);
  };

  const uniqueStatuses = [...new Set(certificates.map(certificate => certificate.status || ''))];

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: 2, pt: 2 }}>
      <Paper elevation={0} sx={{ bgcolor: '#1976d2', color: 'white', p: 1, pl: 2, borderRadius: '4px 4px 0 0', boxShadow: 'none', mb: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Zertifikatsübersicht
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: alpha('#1976d2', 0.05) }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, maxWidth: 500 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Zertifikate durchsuchen..."
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

        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/certificates/new')}>
          Neues Zertifikat
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
            rows={filteredCertificates}
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
        <MenuItem onClick={handleViewCertificate}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Details anzeigen</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEditCertificate}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Bearbeiten</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDuplicateCertificate}>
          <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Duplizieren</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteCertificate}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Löschen</ListItemText>
        </MenuItem>
      </Menu>

      {scannerOpen && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={handleCloseScanner}
          title="Zertifikat-Scanner"
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

export default Certificates;
