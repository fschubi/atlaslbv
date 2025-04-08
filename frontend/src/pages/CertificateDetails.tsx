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
  Description as DocumentIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  DateRange as DateRangeIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import AtlasTable, { AtlasColumn } from '../components/AtlasTable';
import api from '../utils/api';
import DocumentUploader, { DocumentType, UploadedFile } from '../components/DocumentUploader';

interface CertificateHistory {
  id: string;
  action: string;
  date: string;
  user: string;
  details: string;
}

interface CertificateDocument {
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
      id={`certificate-tabpanel-${index}`}
      aria-labelledby={`certificate-tab-${index}`}
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
const generateMockHistory = (count: number): CertificateHistory[] => {
  const actionTypes = [
    'Zertifikat erstellt',
    'Zertifikat erneuert',
    'Zertifikat widerrufen',
    'Zertifikat bearbeitet',
    'Ablaufdatum geändert',
    'Gerät zugeordnet',
    'Dokument hinzugefügt'
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

const generateMockDocuments = (count: number): CertificateDocument[] => {
  const docTypes = ['Zertifikatsdatei', 'Signiertes Dokument', 'Verifikation', 'Antrag', 'Zugehörige Schlüssel'];
  const users = ['Max Mustermann', 'Anna Schmidt', 'Thomas Müller', 'Maria Weber'];

  return Array.from({ length: count }, (_, i) => ({
    id: `DOC-${1000 + i}`,
    name: `Dokument ${i + 1}`,
    type: docTypes[Math.floor(Math.random() * docTypes.length)],
    uploadDate: new Date(Date.now() - i * 86400000 * Math.floor(Math.random() * 90)).toLocaleDateString('de-DE'),
    size: `${Math.floor(Math.random() * 10) + 1} KB`,
    uploadedBy: users[Math.floor(Math.random() * users.length)],
  }));
};

const calculateDaysUntilExpiration = (expirationDate: string): number => {
  const today = new Date();
  const expDate = new Date(expirationDate.split('.').reverse().join('-'));
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getCertificateStatusColor = (status: string, daysUntilExpiration: number): string => {
  if (status === 'Widerrufen') return '#d32f2f'; // Rot
  if (status === 'Abgelaufen') return '#d32f2f'; // Rot
  if (daysUntilExpiration <= 0) return '#d32f2f'; // Rot
  if (daysUntilExpiration <= 30) return '#ff9800'; // Orange
  if (daysUntilExpiration <= 90) return '#ffc107'; // Gelb
  return '#4caf50'; // Grün
};

const CertificateDetails: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);
  const [history] = useState<CertificateHistory[]>(generateMockHistory(15));
  const [documents, setDocuments] = useState<CertificateDocument[]>(generateMockDocuments(5));
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Status-Optionen
  const statusOptions = ['Aktiv', 'Abgelaufen', 'Widerrufen', 'Erneuern'];
  const serviceOptions = ['TLS/SSL', 'Code Signing', 'Client Authentication', 'Email (S/MIME)', 'VPN'];

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        setLoading(true);
        // In einer realen Anwendung würden wir die API verwenden:
        // const response = await api.certificates.getCertificateById(certificateId!);
        // setCertificate(response.data);

        // Für Entwicklungszwecke simulieren wir die Antwort
        setTimeout(() => {
          const mockCertificate = {
            id: certificateId,
            name: `TLS/SSL-Zertifikat ${certificateId?.split('-')[1] || '1000'}`,
            service: 'TLS/SSL',
            domain: 'lbv-cloud.de',
            issuedAt: new Date(2023, 5, 15).toLocaleDateString('de-DE'),
            expirationDate: new Date(2024, 5, 15).toLocaleDateString('de-DE'),
            issuer: 'DigiCert',
            assignedToDevice: 'DEV-1001',
            assignedToDeviceName: 'Dell PowerEdge Server',
            status: 'Aktiv',
            fingerprint: 'SHA-256: 1A:2B:3C:4D:5E:6F:7G:8H:9I:0J:1K:2L:3M:4N:5O:6P',
            publicKey: 'RSA 2048 bit (e 65537)',
            serialNumber: '01:23:45:67:89:AB:CD:EF',
            usage: 'Server Authentication, Client Authentication',
            signatureAlgorithm: 'sha256WithRSAEncryption',
            notes: 'Zertifikat für den Haupt-Webserver. Wird jährlich erneuert.',
          };

          setCertificate(mockCertificate);
          setFormData(mockCertificate);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Fehler beim Laden der Zertifikatsdaten:', error);
        setSnackbar({
          open: true,
          message: 'Fehler beim Laden der Zertifikatsdaten',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    if (certificateId) {
      loadCertificate();
    }
  }, [certificateId]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
    setFormData(certificate);
    setEditMode(false);
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);

      // In einer realen Anwendung würden wir die API verwenden:
      // await api.certificates.updateCertificate(certificateId!, formData);

      // Für Entwicklungszwecke simulieren wir die Antwort
      setTimeout(() => {
        setCertificate(formData);
        setEditMode(false);
        setLoading(false);
        setSnackbar({
          open: true,
          message: 'Zertifikat erfolgreich aktualisiert',
          severity: 'success'
        });
      }, 800);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Zertifikats:', error);
      setSnackbar({
        open: true,
        message: 'Fehler beim Aktualisieren des Zertifikats',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  const handleDeleteCertificate = async () => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Zertifikat löschen möchten?')) {
      try {
        setLoading(true);

        // In einer realen Anwendung würden wir die API verwenden:
        // await api.certificates.deleteCertificate(certificateId!);

        // Für Entwicklungszwecke simulieren wir die Antwort
        setTimeout(() => {
          setLoading(false);
          setSnackbar({
            open: true,
            message: 'Zertifikat erfolgreich gelöscht',
            severity: 'success'
          });
          // Zurück zur Übersichtsseite
          navigate('/certificates');
        }, 800);
      } catch (error) {
        console.error('Fehler beim Löschen des Zertifikats:', error);
        setSnackbar({
          open: true,
          message: 'Fehler beim Löschen des Zertifikats',
          severity: 'error'
        });
        setLoading(false);
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const handleGoBack = () => {
    navigate('/certificates');
  };

  // Spalten für die Verlaufsübersicht
  const historyColumns: AtlasColumn[] = [
    { label: 'ID', dataKey: 'id', width: 100 },
    { label: 'Aktion', dataKey: 'action', width: 170 },
    { label: 'Datum', dataKey: 'date', width: 120 },
    { label: 'Benutzer', dataKey: 'user', width: 150 },
    { label: 'Details', dataKey: 'details', width: 200 },
  ];

  // Spalten für die Dokumentenübersicht
  const documentColumns: AtlasColumn[] = [
    { label: 'ID', dataKey: 'id', width: 100 },
    { label: 'Name', dataKey: 'name', width: 150 },
    { label: 'Typ', dataKey: 'type', width: 150 },
    { label: 'Datum', dataKey: 'uploadDate', width: 120 },
    { label: 'Größe', dataKey: 'size', width: 100 },
    { label: 'Hochgeladen von', dataKey: 'uploadedBy', width: 150 },
  ];

  const handleViewDocument = (id: string) => {
    // In einer echten Anwendung würden wir hier das Dokument öffnen
    alert(`Dokument ${id} anzeigen`);
  };

  const handleDownloadDocument = (id: string) => {
    // In einer echten Anwendung würden wir hier den Download starten
    alert(`Dokument ${id} herunterladen`);
  };

  const handleDeleteDocument = (id: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Dokument löschen möchten?')) {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    }
  };

  const handleUploadDialogOpen = () => {
    setUploadDialogOpen(true);
  };

  const handleUploadComplete = (files: UploadedFile[]) => {
    // Neue Dokumente hinzufügen
    const newDocuments: CertificateDocument[] = files.map(file => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.file.name,
      type: file.type,
      size: `${Math.round(file.file.size / 1024)} KB`,
      uploadDate: new Date().toLocaleDateString('de-DE'),
      uploadedBy: 'Max Mustermann',
    }));

    setDocuments(prev => [...newDocuments, ...prev]);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  const daysUntilExpiration = certificate ? calculateDaysUntilExpiration(certificate.expirationDate) : 0;
  const statusColor = certificate ? getCertificateStatusColor(certificate.status, daysUntilExpiration) : '#4caf50';

  return (
    <Box sx={{ p: 3 }}>
      {/* Zurück-Button und Titel */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          sx={{ ml: -1 }}
        >
          Zurück
        </Button>
        <Box>
          <IconButton
            color="error"
            onClick={handleDeleteCertificate}
            disabled={editMode}
            sx={{ ml: 2 }}
          >
            <DeleteIcon />
          </IconButton>
          {editMode ? (
            <>
              <IconButton
                color="primary"
                onClick={handleSaveChanges}
                sx={{ ml: 1 }}
              >
                <SaveIcon />
              </IconButton>
              <IconButton
                color="default"
                onClick={handleCancelEdit}
                sx={{ ml: 1 }}
              >
                <CancelIcon />
              </IconButton>
            </>
          ) : (
            <IconButton
              color="primary"
              onClick={handleEditMode}
              sx={{ ml: 1 }}
            >
              <EditIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Titelbereich */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h5" component="h1" gutterBottom>
              {editMode ? formData.name : certificate?.name}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              <Box component="span" sx={{ mr: 1, fontWeight: 'bold' }}>Zertifikat-ID:</Box>
              {certificate?.id}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <SecurityIcon sx={{ mr: 1, color: statusColor }} />
              <Chip
                label={certificate?.status}
                sx={{
                  bgcolor: statusColor,
                  color: 'white',
                  fontWeight: 'bold',
                  mr: 2
                }}
              />
              {daysUntilExpiration > 0 ? (
                <Typography variant="body2">
                  Läuft in {daysUntilExpiration} Tagen ab
                </Typography>
              ) : (
                <Typography variant="body2" color="error">
                  Abgelaufen
                </Typography>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <IconButton
                color="primary"
                sx={{ mb: 1, bgcolor: 'rgba(25, 118, 210, 0.1)', p: 2 }}
              >
                <QrCodeIcon sx={{ fontSize: 40 }} />
              </IconButton>
              <Typography variant="body2">QR-Code anzeigen</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs-Bereich */}
      <Paper elevation={3} sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Details" id="certificate-tab-0" aria-controls="certificate-tabpanel-0" />
          <Tab label="Dokumente" id="certificate-tab-1" aria-controls="certificate-tabpanel-1" />
          <Tab label="Verlauf" id="certificate-tab-2" aria-controls="certificate-tabpanel-2" />
          <Tab label="QR-Code" id="certificate-tab-3" aria-controls="certificate-tabpanel-3" />
        </Tabs>

        {/* Details-Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Linke Spalte */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Zertifikatsinformationen
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={editMode ? formData.name : certificate?.name}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Service"
                    name="service"
                    value={editMode ? formData.service : certificate?.service}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  >
                    {serviceOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Domain"
                    name="domain"
                    value={editMode ? formData.domain : certificate?.domain}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Aussteller"
                    name="issuer"
                    value={editMode ? formData.issuer : certificate?.issuer}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Status"
                    name="status"
                    value={editMode ? formData.status : certificate?.status}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ausgestellt am"
                    name="issuedAt"
                    value={editMode ? formData.issuedAt : certificate?.issuedAt}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ablaufdatum"
                    name="expirationDate"
                    value={editMode ? formData.expirationDate : certificate?.expirationDate}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Rechte Spalte */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Technische Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Zugeordnetes Gerät"
                    name="assignedToDevice"
                    value={editMode ? formData.assignedToDevice : certificate?.assignedToDevice}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Gerätename"
                    name="assignedToDeviceName"
                    value={editMode ? formData.assignedToDeviceName : certificate?.assignedToDeviceName}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Fingerprint"
                    name="fingerprint"
                    value={editMode ? formData.fingerprint : certificate?.fingerprint}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Public Key"
                    name="publicKey"
                    value={editMode ? formData.publicKey : certificate?.publicKey}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Seriennummer"
                    name="serialNumber"
                    value={editMode ? formData.serialNumber : certificate?.serialNumber}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Verwendung"
                    name="usage"
                    value={editMode ? formData.usage : certificate?.usage}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Signatur-Algorithmus"
                    name="signatureAlgorithm"
                    value={editMode ? formData.signatureAlgorithm : certificate?.signatureAlgorithm}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notizen"
                    name="notes"
                    value={editMode ? formData.notes : certificate?.notes}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                    multiline
                    rows={4}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Dokumente-Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Zugehörige Dokumente
            </Typography>
            <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={handleUploadDialogOpen}>
              Dokument hochladen
            </Button>
          </Box>
          <Box sx={{ position: 'relative', height: 400 }}>
            <AtlasTable
              columns={documentColumns}
              rows={documents}
              heightPx={400}
            />
          </Box>
        </TabPanel>

        {/* Verlauf-Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Änderungsverlauf
          </Typography>
          <Box sx={{ position: 'relative', height: 400 }}>
            <AtlasTable
              columns={historyColumns}
              rows={history}
              heightPx={400}
            />
          </Box>
        </TabPanel>

        {/* QR-Code-Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: 'white', width: 'fit-content' }}>
              <QRCodeSVG
                value={`ATLAS-CERTIFICATE-${certificate?.id || ''}`}
                size={200}
                level="H"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </Paper>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Dieser QR-Code enthält die Zertifikats-ID für schnellen Zugriff auf die Detailseite.
            </Typography>
            <Button variant="contained" color="primary">
              QR-Code herunterladen
            </Button>
          </Box>
        </TabPanel>
      </Paper>

      {/* Upload-Dialog */}
      <DocumentUploader
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUploadComplete={handleUploadComplete}
        isModal={true}
      />

      {/* Snackbar für Benachrichtigungen */}
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CertificateDetails;
