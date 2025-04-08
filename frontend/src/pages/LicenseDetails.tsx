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
  Apps as AppsIcon,
  Key as KeyIcon,
  EventAvailable as EventAvailableIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import AtlasTable, { AtlasColumn } from '../components/AtlasTable';
import api from '../utils/api';
import MainLayout from '../layout/MainLayout';
import DocumentUploader, { DocumentType, UploadedFile } from '../components/DocumentUploader';

interface LicenseHistory {
  id: string;
  action: string;
  date: string;
  user: string;
  details: string;
}

interface LicenseDocument {
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
      id={`license-tabpanel-${index}`}
      aria-labelledby={`license-tab-${index}`}
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
const generateMockHistory = (count: number): LicenseHistory[] => {
  const actionTypes = [
    'Lizenz erstellt',
    'Lizenz erneuert',
    'Lizenz gekündigt',
    'Lizenz bearbeitet',
    'Gerät zugeordnet',
    'Benutzer zugeordnet',
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

const generateMockDocuments = (count: number): LicenseDocument[] => {
  const docTypes = ['Lizenzvertrag', 'Rechnung', 'Wartungsvertrag', 'Aktivierungsanleitung', 'Support-Kontakt'];
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
  if (!expirationDate) return Infinity; // Wenn kein Ablaufdatum, dann kein Ablauf

  const today = new Date();
  const expDate = new Date(expirationDate.split('.').reverse().join('-'));
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getLicenseStatusColor = (status: string, daysUntilExpiration: number): string => {
  if (status === 'Gekündigt') return '#d32f2f'; // Rot
  if (status === 'Abgelaufen') return '#d32f2f'; // Rot
  if (daysUntilExpiration <= 0) return '#d32f2f'; // Rot
  if (daysUntilExpiration <= 30) return '#ff9800'; // Orange
  if (daysUntilExpiration <= 90) return '#ffc107'; // Gelb
  return '#4caf50'; // Grün
};

// Lizenz-Interface
interface License {
  id: string;
  name: string;
  licenseKey: string;
  type: string;
  status: string;
  expirationDate: string;
  purchaseDate: string;
  quantity: number;
  availableQuantity: number;
  vendor: string;
  cost: string;
  notes: string;
}

// Dokument-Interface
interface Document {
  id: string;
  name: string;
  type: DocumentType;
  size: string;
  uploadDate: string;
  description?: string;
}

const LicenseDetails: React.FC = () => {
  const { licenseId } = useParams<{ licenseId: string }>();
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [license, setLicense] = useState<License | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [history] = useState<LicenseHistory[]>(generateMockHistory(15));
  const [documents, setDocuments] = useState<Document[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Status-Optionen und Software-Optionen
  const statusOptions = ['Aktiv', 'Abgelaufen', 'Gekündigt', 'Wartend'];
  const typeOptions = ['Einzellizenz', 'Volumenlizenz', 'Abonnement', 'OEM'];
  const softwareOptions = ['Microsoft Office', 'Adobe Creative Cloud', 'Windows 11', 'AutoCAD', 'ESET Antivirus', 'VMware Workstation', 'Visual Studio'];

  useEffect(() => {
    const loadLicense = async () => {
      try {
        setLoading(true);
        // In einer realen Anwendung würden wir die API verwenden:
        // const response = await api.licenses.getLicenseById(licenseId!);
        // setLicense(response.data);

        // Für Entwicklungszwecke simulieren wir die Antwort
        setTimeout(() => {
          const mockLicense: License = {
            id: licenseId || '1',
            name: 'Microsoft 365 E3',
            licenseKey: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
            type: 'Abonnement',
            status: 'Aktiv',
            expirationDate: '31.12.2024',
            purchaseDate: '01.01.2023',
            quantity: 100,
            availableQuantity: 23,
            vendor: 'Microsoft',
            cost: '14.000,00 €',
            notes: 'Jährliche Verlängerung erforderlich'
          };

          setLicense(mockLicense);
          setFormData(mockLicense);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Fehler beim Laden der Lizenzdaten:', error);
        setSnackbar({
          open: true,
          message: 'Fehler beim Laden der Lizenzdaten',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    const fetchDocuments = async () => {
      try {
        // In einer realen Anwendung würden wir die API verwenden:
        // const response = await api.licenses.getDocumentsByLicenseId(licenseId!);
        // setDocuments(response.data);

        // Für Entwicklungszwecke simulieren wir die Antwort
        setTimeout(() => {
          const mockDocuments: Document[] = [
            {
              id: 'doc-1',
              name: 'Lizenzvertrag_Microsoft_365.pdf',
              type: 'Lizenzvertrag',
              size: '1.5 MB',
              uploadDate: '01.01.2023',
              description: 'Original Microsoft Vertrag'
            },
            {
              id: 'doc-2',
              name: 'Rechnung_Microsoft_365_2023.pdf',
              type: 'Rechnung',
              size: '0.7 MB',
              uploadDate: '02.01.2023',
              description: 'Jahresabrechnung 2023'
            }
          ];

          setDocuments(mockDocuments);
        }, 800);
      } catch (error) {
        console.error('Fehler beim Laden der Dokumente:', error);
        setSnackbar({
          open: true,
          message: 'Fehler beim Laden der Dokumente',
          severity: 'error'
        });
      }
    };

    if (licenseId) {
      loadLicense();
      fetchDocuments();
    }
  }, [licenseId]);

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
    setFormData(license);
    setEditMode(false);
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);

      // In einer realen Anwendung würden wir die API verwenden:
      // await api.licenses.updateLicense(licenseId!, formData);

      // Für Entwicklungszwecke simulieren wir die Antwort
      setTimeout(() => {
        setLicense(formData);
        setEditMode(false);
        setLoading(false);
        setSnackbar({
          open: true,
          message: 'Lizenz erfolgreich aktualisiert',
          severity: 'success'
        });
      }, 800);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Lizenz:', error);
      setSnackbar({
        open: true,
        message: 'Fehler beim Aktualisieren der Lizenz',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  const handleDeleteLicense = async () => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Lizenz löschen möchten?')) {
      try {
        setLoading(true);

        // In einer realen Anwendung würden wir die API verwenden:
        // await api.licenses.deleteLicense(licenseId!);

        // Für Entwicklungszwecke simulieren wir die Antwort
        setTimeout(() => {
          setLoading(false);
          setSnackbar({
            open: true,
            message: 'Lizenz erfolgreich gelöscht',
            severity: 'success'
          });
          // Zurück zur Übersichtsseite
          navigate('/licenses');
        }, 800);
      } catch (error) {
        console.error('Fehler beim Löschen der Lizenz:', error);
        setSnackbar({
          open: true,
          message: 'Fehler beim Löschen der Lizenz',
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
    navigate('/licenses');
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
    alert(`Dokument ${id} öffnen`);
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
    const newDocuments: Document[] = files.map(file => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.file.name,
      type: file.type,
      size: `${Math.round(file.file.size / 1024)} KB`,
      uploadDate: new Date().toLocaleDateString('de-DE'),
      description: file.description
    }));

    setDocuments(prev => [...newDocuments, ...prev]);
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ p: 3 }}>
          <Typography>Lizenz wird geladen...</Typography>
        </Box>
      </MainLayout>
    );
  }

  const daysUntilExpiration = license?.expirationDate ? calculateDaysUntilExpiration(license.expirationDate) : Infinity;
  const statusColor = license ? getLicenseStatusColor(license.status, daysUntilExpiration) : '#4caf50';

  return (
    <MainLayout>
      <Box sx={{ p: 3, bgcolor: '#121212', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 500, color: 'white' }}>
            Lizenzdetails
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
          >
            Bearbeiten
          </Button>
        </Box>

        {/* Basisinformationen */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#1E1E1E', color: 'white' }}>
          <Typography variant="h5" gutterBottom>
            {license?.name}
            <Chip
              label={license?.status}
              color="primary"
              size="small"
              sx={{ ml: 2 }}
            />
          </Typography>

          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {license?.type} | Lizenz-ID: {license?.id}
          </Typography>

          <Divider sx={{ my: 2, bgcolor: '#333' }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Lizenzschlüssel
                </Typography>
                <Typography variant="body1">
                  {license?.licenseKey}
                </Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Kaufdatum
                </Typography>
                <Typography variant="body1">
                  {license?.purchaseDate}
                </Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Ablaufdatum
                </Typography>
                <Typography variant="body1">
                  {license?.expirationDate}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Lizenzanzahl
                </Typography>
                <Typography variant="body1">
                  {license?.quantity} (davon {license?.availableQuantity} verfügbar)
                </Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Anbieter
                </Typography>
                <Typography variant="body1">
                  {license?.vendor}
                </Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Kosten
                </Typography>
                <Typography variant="body1">
                  {license?.cost}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ bgcolor: '#1E1E1E', color: 'white' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            sx={{ borderBottom: '1px solid #333' }}
          >
            <Tab label="Übersicht" />
            <Tab label="Dokumente" />
            <Tab label="Zuweisungen" />
            <Tab label="Historie" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {tabValue === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Notizen
                </Typography>
                <Typography paragraph>
                  {license?.notes || 'Keine Notizen vorhanden.'}
                </Typography>
              </Box>
            )}

            {tabValue === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    Dokumente
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CloudUploadIcon />}
                    onClick={handleUploadDialogOpen}
                  >
                    Dokument hochladen
                  </Button>
                </Box>

                {documents.length === 0 ? (
                  <Typography color="text.secondary">
                    Keine Dokumente vorhanden.
                  </Typography>
                ) : (
                  <List>
                    {documents.map(doc => (
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
                                    bgcolor: 'rgba(255, 152, 0, 0.15)',
                                    color: '#ffb74d',
                                    border: '1px solid #ffb74d'
                                  }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                  {doc.size} | Hochgeladen am {doc.uploadDate}
                                </Typography>
                              </Box>
                              {doc.description && (
                                <Typography variant="body2" color="text.secondary">
                                  {doc.description}
                                </Typography>
                              )}
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
              </Box>
            )}

            {tabValue === 2 && (
              <Typography>Zuweisungen zu Benutzern und Geräten</Typography>
            )}

            {tabValue === 3 && (
              <Typography>Änderungshistorie</Typography>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Upload-Dialog */}
      <DocumentUploader
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUploadComplete={handleUploadComplete}
        isModal={true}
      />
    </MainLayout>
  );
};

export default LicenseDetails;
