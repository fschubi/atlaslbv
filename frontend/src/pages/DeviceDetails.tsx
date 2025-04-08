import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  QrCode as QrCodeIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Description as DocumentIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import AtlasTable, { AtlasColumn } from '../components/AtlasTable';
import api from '../utils/api';
import DocumentUploader, { DocumentType, UploadedFile } from '../components/DocumentUploader';
import DocumentPreview from '../components/DocumentPreview';

interface DeviceHistory {
  id: string;
  action: string;
  date: string;
  user: string;
  details: string;
}

interface DeviceDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
  uploadedBy: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`device-tabpanel-${index}`}
      aria-labelledby={`device-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Mock-Daten für die Entwicklung
const generateMockHistory = (count: number): DeviceHistory[] => {
  const actionTypes = [
    'Gerät erstellt',
    'Gerät bearbeitet',
    'Status geändert',
    'Benutzer zugeordnet',
    'Standort geändert',
    'Dokument hinzugefügt',
    'Inventarisiert'
  ];

  const users = ['Max Mustermann', 'Anna Schmidt', 'Thomas Müller', 'Maria Weber'];

  return Array.from({ length: count }, (_, i) => ({
    id: `HIST-${1000 + i}`,
    action: actionTypes[Math.floor(Math.random() * actionTypes.length)],
    date: new Date(Date.now() - i * 86400000 * Math.floor(Math.random() * 30)).toLocaleDateString('de-DE'),
    user: users[Math.floor(Math.random() * users.length)],
    details: `Details zur Aktion ${i + 1}`,
  }));
};

const generateMockDocuments = (count: number): DeviceDocument[] => {
  const docTypes = ['Rechnung', 'Lieferschein', 'Garantie', 'Handbuch', 'Lizenz'];
  const users = ['Max Mustermann', 'Anna Schmidt', 'Thomas Müller', 'Maria Weber'];

  return Array.from({ length: count }, (_, i) => ({
    id: `DOC-${1000 + i}`,
    name: `Dokument ${i + 1}`,
    type: docTypes[Math.floor(Math.random() * docTypes.length)],
    uploadDate: new Date(Date.now() - i * 86400000 * Math.floor(Math.random() * 90)).toLocaleDateString('de-DE'),
    size: `${Math.floor(Math.random() * 10) + 1} MB`,
    uploadedBy: users[Math.floor(Math.random() * users.length)],
  }));
};

const DeviceDetails: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [device, setDevice] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);
  const [history] = useState<DeviceHistory[]>(generateMockHistory(15));
  const [documents, setDocuments] = useState<DeviceDocument[]>(generateMockDocuments(8));
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Für die Dokumentvorschau
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<DeviceDocument | null>(null);

  // Zusätzlicher State für die Histori-API
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deviceHistory, setDeviceHistory] = useState<DeviceHistory[]>([]);

  // Zusätzlicher State für Dokumente
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [deviceDocuments, setDeviceDocuments] = useState<DeviceDocument[]>([]);

  // Demo-URLs für die Dokumente (in einer echten App würden diese vom Server kommen)
  const getDocumentUrl = (doc: DeviceDocument) => {
    // Beispiel-URLs
    const fileExtension = doc.name.split('.').pop()?.toLowerCase() || '';

    if (fileExtension === 'pdf') {
      return '/sample-documents/sample.pdf';
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
      return '/sample-documents/sample-image.jpg';
    }

    return '#'; // Fallback URL
  };

  // Status-Optionen
  const statusOptions = ['In Betrieb', 'Lager', 'Reparatur', 'Defekt', 'Entsorgt'];

  useEffect(() => {
    const loadDevice = async () => {
      try {
        setLoading(true);

        // API-Aufruf zum Laden des Geräts
        const response = await api.devices.getDeviceById(deviceId || '');
        setDevice(response.data);
        setFormData(response.data);

        setLoading(false);
      } catch (err) {
        console.error('Fehler beim Laden der Gerätedaten:', err);
        setSnackbar({
          open: true,
          message: 'Fehler beim Laden der Gerätedaten. Bitte versuchen Sie es später erneut.',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    if (deviceId) {
      loadDevice();
    } else {
      navigate('/devices');
    }
  }, [deviceId, navigate]);

  // Lade die Gerätehistorie beim Tab-Wechsel
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);

    // Lade Historie-Daten, wenn der Historie-Tab ausgewählt wird
    if (newValue === 1 && deviceId && deviceHistory.length === 0) {
      loadDeviceHistory();
    }

    // Lade Dokumente, wenn der Dokumente-Tab ausgewählt wird
    if (newValue === 2 && deviceId && deviceDocuments.length === 0) {
      loadDeviceDocuments();
    }
  };

  // Historie über die API laden
  const loadDeviceHistory = async () => {
    try {
      setHistoryLoading(true);

      // In einer realen API würde hier ein Aufruf wie folgt stehen:
      // const response = await api.devices.getDeviceHistory(deviceId);
      // setDeviceHistory(response.data);

      // Da wir noch keine vollständige API haben, verwenden wir die Mock-Daten
      // Diese würden später durch den API-Aufruf ersetzt
      setTimeout(() => {
        setDeviceHistory(generateMockHistory(15));
        setHistoryLoading(false);
      }, 800);
    } catch (err) {
      console.error('Fehler beim Laden der Gerätehistorie:', err);
      setSnackbar({
        open: true,
        message: 'Fehler beim Laden der Gerätehistorie',
        severity: 'error'
      });
      setHistoryLoading(false);
    }
  };

  // Dokumente über die API laden
  const loadDeviceDocuments = async () => {
    try {
      setDocumentsLoading(true);

      // In einer realen API würde hier ein Aufruf wie folgt stehen:
      // const response = await api.devices.getDeviceDocuments(deviceId);
      // setDeviceDocuments(response.data);

      // Da wir noch keine vollständige API haben, verwenden wir die Mock-Daten
      setTimeout(() => {
        setDeviceDocuments(generateMockDocuments(8));
        setDocumentsLoading(false);
      }, 800);
    } catch (err) {
      console.error('Fehler beim Laden der Gerätedokumente:', err);
      setSnackbar({
        open: true,
        message: 'Fehler beim Laden der Gerätedokumente',
        severity: 'error'
      });
      setDocumentsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleEditMode = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setFormData(device);
    setEditMode(false);
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);

      // API-Aufruf zum Aktualisieren des Geräts
      const response = await api.devices.updateDevice(deviceId || '', formData);

      // Aktualisiere Gerätedaten mit der Antwort vom Server
      setDevice(response.data);
      setEditMode(false);

      setSnackbar({
        open: true,
        message: 'Gerätedaten erfolgreich gespeichert',
        severity: 'success'
      });
    } catch (err) {
      console.error('Fehler beim Speichern der Gerätedaten:', err);
      setSnackbar({
        open: true,
        message: 'Fehler beim Speichern der Gerätedaten',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const handleGoBack = () => {
    navigate('/devices');
  };

  // Spalten für die Historie-Tabelle
  const historyColumns: AtlasColumn[] = [
    { label: 'Datum', dataKey: 'date', width: 120 },
    { label: 'Aktion', dataKey: 'action', width: 200 },
    { label: 'Benutzer', dataKey: 'user', width: 180 },
    { label: 'Details', dataKey: 'details', width: 300 },
  ];

  // Spalten für die Dokumente-Tabelle
  const documentColumns: AtlasColumn[] = [
    { label: 'Name', dataKey: 'name', width: 200 },
    { label: 'Typ', dataKey: 'type', width: 120 },
    { label: 'Datum', dataKey: 'uploadDate', width: 120 },
    { label: 'Größe', dataKey: 'size', width: 80 },
    { label: 'Hochgeladen von', dataKey: 'uploadedBy', width: 180 },
    {
      label: 'Aktionen',
      dataKey: 'id',
      width: 100,
      render: () => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" color="primary">
            <DocumentIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    },
  ];

  const handleViewDocument = (id: string) => {
    // Finde das ausgewählte Dokument
    const doc = deviceDocuments.find(doc => doc.id === id);
    if (doc) {
      setSelectedDocument(doc);
      setPreviewOpen(true);
    }
  };

  // Vorschau schließen
  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  const handleDownloadDocument = (id: string) => {
    // In einer echten Anwendung würden wir hier den Download starten
    alert(`Dokument ${id} herunterladen`);
  };

  // Dokument löschen mit API-Aufruf
  const handleDeleteDocument = async (id: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Dokument löschen möchten?')) {
      try {
        setDocumentsLoading(true);

        // In einer realen API würde hier ein Aufruf wie folgt stehen:
        // await api.devices.deleteDeviceDocument(deviceId, id);

        // Da wir noch keine vollständige API haben, simulieren wir den Löschvorgang
        setTimeout(() => {
          setDeviceDocuments(prev => prev.filter(doc => doc.id !== id));
          setDocumentsLoading(false);

          setSnackbar({
            open: true,
            message: 'Dokument erfolgreich gelöscht',
            severity: 'success'
          });
        }, 600);
      } catch (err) {
        console.error('Fehler beim Löschen des Dokuments:', err);
        setSnackbar({
          open: true,
          message: 'Fehler beim Löschen des Dokuments',
          severity: 'error'
        });
        setDocumentsLoading(false);
      }
    }
  };

  // Dokument hochladen mit API-Aufruf
  const handleUploadComplete = async (files: UploadedFile[]) => {
    try {
      setDocumentsLoading(true);

      // In einer realen API würde hier ein Aufruf wie folgt stehen:
      // const uploadPromises = files.map(file => {
      //   const formData = new FormData();
      //   formData.append('file', file.file);
      //   formData.append('type', file.type);
      //   return api.devices.uploadDeviceDocument(deviceId, formData);
      // });
      // await Promise.all(uploadPromises);
      // const response = await api.devices.getDeviceDocuments(deviceId);
      // setDeviceDocuments(response.data);

      // Da wir noch keine vollständige API haben, simulieren wir den Upload
      setTimeout(() => {
        const newDocuments: DeviceDocument[] = files.map(file => ({
          id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.file.name,
          type: file.type,
          size: `${Math.round(file.file.size / 1024)} KB`,
          uploadDate: new Date().toLocaleDateString('de-DE'),
          uploadedBy: 'Max Mustermann',
        }));

        setDeviceDocuments(prev => [...newDocuments, ...prev]);
        setDocumentsLoading(false);

        setSnackbar({
          open: true,
          message: `${files.length} Dokument(e) erfolgreich hochgeladen`,
          severity: 'success'
        });
      }, 1000);
    } catch (err) {
      console.error('Fehler beim Hochladen der Dokumente:', err);
      setSnackbar({
        open: true,
        message: 'Fehler beim Hochladen der Dokumente',
        severity: 'error'
      });
      setDocumentsLoading(false);
    }
  };

  if (loading && !device) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: 0 }}>
      {/* Kopfzeile */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#1976d2',
          color: 'white',
          p: 1,
          pl: 2,
          borderRadius: '4px 4px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" onClick={handleGoBack} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Gerätedetails: {device?.name || ''}
          </Typography>
          <Chip
            label={device?.status}
            size="small"
            sx={{
              ml: 2,
              bgcolor: device?.status === 'In Betrieb' ? 'success.dark' :
                        device?.status === 'Lager' ? 'info.dark' :
                        device?.status === 'Reparatur' ? 'warning.dark' : 'error.dark',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>
        {!editMode ? (
          <Button
            startIcon={<EditIcon />}
            variant="contained"
            color="secondary"
            onClick={handleEditMode}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
          >
            Bearbeiten
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<CancelIcon />}
              variant="outlined"
              onClick={handleCancelEdit}
              sx={{ borderColor: 'white', color: 'white' }}
            >
              Abbrechen
            </Button>
            <Button
              startIcon={<SaveIcon />}
              variant="contained"
              color="success"
              onClick={handleSaveChanges}
            >
              Speichern
            </Button>
          </Box>
        )}
      </Paper>

      {/* Tabs */}
      <Paper sx={{ bgcolor: '#1a1a1a', borderRadius: 0 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Übersicht" id="device-tab-0" aria-controls="device-tabpanel-0" />
          <Tab label="Historie" id="device-tab-1" aria-controls="device-tabpanel-1" />
          <Tab label="Dokumente" id="device-tab-2" aria-controls="device-tabpanel-2" />
          <Tab label="QR-Code" id="device-tab-3" aria-controls="device-tabpanel-3" />
        </Tabs>
      </Paper>

      {/* Tab-Inhalte */}
      <Paper sx={{ borderRadius: 0, bgcolor: '#1E1E1E', minHeight: '60vh' }}>
        {/* Übersicht Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Linke Spalte - Hauptinformationen */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2, bgcolor: '#2A2A2A' }}>
                <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #444', pb: 1, color: '#1976d2' }}>
                  Allgemeine Informationen
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      value={formData?.name || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Typ"
                      name="type"
                      value={formData?.type || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Hersteller"
                      name="manufacturer"
                      value={formData?.manufacturer || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Modell"
                      name="model"
                      value={formData?.model || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Seriennummer"
                      name="serialNumber"
                      value={formData?.serialNumber || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Inventarnummer"
                      name="inventoryNumber"
                      value={formData?.inventoryNumber || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Kaufdatum"
                      name="purchaseDate"
                      value={formData?.purchaseDate || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Preis"
                      name="price"
                      value={formData?.price || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Garantie"
                      name="warranty"
                      value={formData?.warranty || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Garantie bis"
                      name="warrantyUntil"
                      value={formData?.warrantyUntil || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Status"
                      name="status"
                      value={formData?.status || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    >
                      {statusOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Paper>

              <Paper elevation={2} sx={{ p: 2, bgcolor: '#2A2A2A', mt: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #444', pb: 1, color: '#1976d2' }}>
                  Technische Informationen
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Prozessor"
                      name="processor"
                      value={formData?.processor || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Arbeitsspeicher"
                      name="memory"
                      value={formData?.memory || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Speicher"
                      name="storage"
                      value={formData?.storage || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Betriebssystem"
                      name="operatingSystem"
                      value={formData?.operatingSystem || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="MAC-Adresse"
                      name="macAddress"
                      value={formData?.macAddress || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="IP-Adresse"
                      name="ipAddress"
                      value={formData?.ipAddress || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Rechte Spalte - Standort, Nutzer, Notizen */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2, bgcolor: '#2A2A2A' }}>
                <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #444', pb: 1, color: '#1976d2' }}>
                  Standort & Verwaltung
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Standort"
                      name="location"
                      value={formData?.location || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Raum"
                      name="room"
                      value={formData?.room || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Abteilung"
                      name="department"
                      value={formData?.department || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Zugewiesen an"
                      name="assignedTo"
                      value={formData?.assignedTo || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      disabled={!editMode}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Letzte Inventur"
                      name="lastInventory"
                      value={formData?.lastInventory || ''}
                      disabled
                      margin="normal"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Paper elevation={2} sx={{ p: 2, bgcolor: '#2A2A2A', mt: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #444', pb: 1, color: '#1976d2' }}>
                  Notizen
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={9}
                  label="Notizen"
                  name="notes"
                  value={formData?.notes || ''}
                  onChange={handleInputChange}
                  margin="normal"
                  disabled={!editMode}
                  variant="outlined"
                />
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Historie Tab */}
        <TabPanel value={tabValue} index={1}>
          <Paper elevation={2} sx={{ p: 2, bgcolor: '#2A2A2A' }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #444', pb: 1, color: '#1976d2', display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon /> Gerätehistorie
            </Typography>

            <AtlasTable
              columns={historyColumns}
              rows={deviceHistory}
              heightPx={500}
            />
          </Paper>
        </TabPanel>

        {/* Dokumente Tab */}
        <TabPanel value={tabValue} index={2}>
          <Paper elevation={2} sx={{ p: 2, bgcolor: '#2A2A2A' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', pb: 1, mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#1976d2', display: 'flex', alignItems: 'center', gap: 1 }}>
                <DocumentIcon /> Dokumente
              </Typography>

              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudUploadIcon />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Dokument hochladen
              </Button>
            </Box>

            {documentsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <CircularProgress />
              </Box>
            ) : deviceDocuments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Keine Dokumente vorhanden
                </Typography>
              </Box>
            ) : (
              <List>
                {deviceDocuments.map(doc => (
                  <ListItem
                    key={doc.id}
                    sx={{
                      mb: 1,
                      borderRadius: 1,
                      border: '1px solid #333',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
                    }}
                  >
                    <ListItemText
                      primary={doc.name}
                      secondary={
                        <Box component="span" sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Chip
                              label={doc.type}
                              size="small"
                              sx={{
                                mr: 1,
                                bgcolor: 'rgba(25, 118, 210, 0.2)',
                                color: '#64b5f6',
                                border: '1px solid #64b5f6'
                              }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {doc.size} | Hochgeladen am {doc.uploadDate}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="anzeigen"
                        onClick={() => handleViewDocument(doc.id)}
                        sx={{ color: 'primary.main' }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="herunterladen"
                        onClick={() => handleDownloadDocument(doc.id)}
                        sx={{ color: 'primary.main' }}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="löschen"
                        onClick={() => handleDeleteDocument(doc.id)}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </TabPanel>

        {/* QR-Code Tab */}
        <TabPanel value={tabValue} index={3}>
          <Paper elevation={2} sx={{ p: 2, bgcolor: '#2A2A2A' }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #444', pb: 1, color: '#1976d2', display: 'flex', alignItems: 'center', gap: 1 }}>
              <QrCodeIcon /> Barcode / QR-Code
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <Paper elevation={3} sx={{ p: 3, bgcolor: 'white', width: 'fit-content' }}>
                <QRCodeSVG
                  value={`ATLAS-DEVICE-${device?.id || ''}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </Paper>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" gutterBottom>
                {device?.inventoryNumber || ''}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Scannen Sie diesen Code, um das Gerät schnell zu identifizieren.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                sx={{ mt: 2 }}
              >
                QR-Code drucken
              </Button>
            </Box>
          </Paper>
        </TabPanel>
      </Paper>

      {/* Upload-Dialog */}
      <DocumentUploader
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUploadComplete={handleUploadComplete}
        isModal={true}
      />

      {/* Vorschau-Dialog */}
      {selectedDocument && (
        <DocumentPreview
          isOpen={previewOpen}
          onClose={handleClosePreview}
          fileName={selectedDocument.name}
          fileUrl={getDocumentUrl(selectedDocument)}
          fileType={selectedDocument.type}
          fileSize={selectedDocument.size}
          uploadDate={selectedDocument.uploadDate}
          uploadedBy={selectedDocument.uploadedBy}
        />
      )}

      {/* Snackbar für Benachrichtigungen */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DeviceDetails;
