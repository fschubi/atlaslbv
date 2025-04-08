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
  Alert
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
  Devices as DevicesIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import AtlasTable, { AtlasColumn } from '../components/AtlasTable';
import api from '../utils/api';

interface AccessoryHistory {
  id: string;
  action: string;
  date: string;
  user: string;
  details: string;
}

interface AccessoryDocument {
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
      id={`accessory-tabpanel-${index}`}
      aria-labelledby={`accessory-tab-${index}`}
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
const generateMockHistory = (count: number): AccessoryHistory[] => {
  const actionTypes = [
    'Zubehör erstellt',
    'Zubehör bearbeitet',
    'Gerät zugeordnet',
    'Benutzer zugeordnet',
    'Status geändert',
    'Standort geändert',
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

const generateMockDocuments = (count: number): AccessoryDocument[] => {
  const docTypes = ['Rechnung', 'Handbuch', 'Lieferschein', 'Garantie', 'Reparaturbeleg'];
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

const getAccessoryStatusColor = (status: string): string => {
  if (status === 'Defekt') return '#d32f2f'; // Rot
  if (status === 'In Reparatur') return '#ff9800'; // Orange
  if (status === 'Ausgegeben') return '#2196f3'; // Blau
  return '#4caf50'; // Grün für 'Verfügbar'
};

const AccessoryDetails: React.FC = () => {
  const { accessoryId } = useParams<{ accessoryId: string }>();
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [accessory, setAccessory] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);
  const [history] = useState<AccessoryHistory[]>(generateMockHistory(15));
  const [documents] = useState<AccessoryDocument[]>(generateMockDocuments(5));
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Status-Optionen
  const statusOptions = ['Verfügbar', 'Ausgegeben', 'Defekt', 'In Reparatur'];
  const typeOptions = ['Tastatur', 'Maus', 'Headset', 'Dockingstation', 'Netzteil', 'Kabel', 'Monitor'];
  const manufacturerOptions = ['Dell', 'HP', 'Logitech', 'Microsoft', 'Lenovo', 'Samsung', 'Apple'];

  useEffect(() => {
    const loadAccessory = async () => {
      try {
        setLoading(true);
        // In einer realen Anwendung würden wir die API verwenden:
        // const response = await api.accessories.getAccessoryById(accessoryId!);
        // setAccessory(response.data);

        // Für Entwicklungszwecke simulieren wir die Antwort
        setTimeout(() => {
          const mockAccessory = {
            id: accessoryId,
            name: `Dell Dockingstation D6000`,
            type: 'Dockingstation',
            serialNumber: `SN-${Math.floor(Math.random() * 90000) + 10000}`,
            manufacturer: 'Dell',
            modelNumber: 'D6000',
            purchaseDate: new Date(2022, 5, 15).toLocaleDateString('de-DE'),
            warranty: `${Math.floor(Math.random() * 3) + 1} Jahre`,
            assignedToUser: Math.random() > 0.5 ? 'Max Mustermann' : '',
            assignedToDevice: 'DEV-1001',
            assignedToDeviceName: 'Dell Latitude 7420',
            status: 'Ausgegeben',
            location: 'Hauptgebäude, Raum 304',
            department: 'IT-Abteilung',
            cost: '199,99 €',
            supplier: 'Dell GmbH',
            invoiceNumber: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
            notes: 'Universal-Dockingstation, kompatibel mit mehreren Gerätetypen.',
          };

          setAccessory(mockAccessory);
          setFormData(mockAccessory);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Fehler beim Laden der Zubehördaten:', error);
        setSnackbar({
          open: true,
          message: 'Fehler beim Laden der Zubehördaten',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    if (accessoryId) {
      loadAccessory();
    }
  }, [accessoryId]);

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
    setFormData(accessory);
    setEditMode(false);
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);

      // In einer realen Anwendung würden wir die API verwenden:
      // await api.accessories.updateAccessory(accessoryId!, formData);

      // Für Entwicklungszwecke simulieren wir die Antwort
      setTimeout(() => {
        setAccessory(formData);
        setEditMode(false);
        setLoading(false);
        setSnackbar({
          open: true,
          message: 'Zubehör erfolgreich aktualisiert',
          severity: 'success'
        });
      }, 800);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Zubehörs:', error);
      setSnackbar({
        open: true,
        message: 'Fehler beim Aktualisieren des Zubehörs',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  const handleDeleteAccessory = async () => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Zubehör löschen möchten?')) {
      try {
        setLoading(true);

        // In einer realen Anwendung würden wir die API verwenden:
        // await api.accessories.deleteAccessory(accessoryId!);

        // Für Entwicklungszwecke simulieren wir die Antwort
        setTimeout(() => {
          setLoading(false);
          setSnackbar({
            open: true,
            message: 'Zubehör erfolgreich gelöscht',
            severity: 'success'
          });
          // Zurück zur Übersichtsseite
          navigate('/accessories');
        }, 800);
      } catch (error) {
        console.error('Fehler beim Löschen des Zubehörs:', error);
        setSnackbar({
          open: true,
          message: 'Fehler beim Löschen des Zubehörs',
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
    navigate('/accessories');
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  const statusColor = accessory ? getAccessoryStatusColor(accessory.status) : '#4caf50';

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
            onClick={handleDeleteAccessory}
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
              {editMode ? formData.name : accessory?.name}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              <Box component="span" sx={{ mr: 1, fontWeight: 'bold' }}>Zubehör-ID:</Box>
              {accessory?.id}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <DevicesIcon sx={{ mr: 1, color: statusColor }} />
              <Chip
                label={accessory?.status}
                sx={{
                  bgcolor: statusColor,
                  color: 'white',
                  fontWeight: 'bold',
                  mr: 2
                }}
              />
              {accessory?.assignedToUser && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                  <PersonIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2">
                    {accessory.assignedToUser}
                  </Typography>
                </Box>
              )}
              {accessory?.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  <LocationIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2">
                    {accessory.location}
                  </Typography>
                </Box>
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
          <Tab label="Details" id="accessory-tab-0" aria-controls="accessory-tabpanel-0" />
          <Tab label="Dokumente" id="accessory-tab-1" aria-controls="accessory-tabpanel-1" />
          <Tab label="Verlauf" id="accessory-tab-2" aria-controls="accessory-tabpanel-2" />
          <Tab label="QR-Code" id="accessory-tab-3" aria-controls="accessory-tabpanel-3" />
        </Tabs>

        {/* Details-Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Linke Spalte */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Allgemeine Informationen
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={editMode ? formData.name : accessory?.name}
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
                    label="Typ"
                    name="type"
                    value={editMode ? formData.type : accessory?.type}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  >
                    {typeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Hersteller"
                    name="manufacturer"
                    value={editMode ? formData.manufacturer : accessory?.manufacturer}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  >
                    {manufacturerOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Modellnummer"
                    name="modelNumber"
                    value={editMode ? formData.modelNumber : accessory?.modelNumber}
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
                    value={editMode ? formData.serialNumber : accessory?.serialNumber}
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
                    value={editMode ? formData.status : accessory?.status}
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
                    label="Standort"
                    name="location"
                    value={editMode ? formData.location : accessory?.location}
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
                Zusätzliche Informationen
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Zugeordneter Benutzer"
                    name="assignedToUser"
                    value={editMode ? formData.assignedToUser : accessory?.assignedToUser}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Zugeordnetes Gerät"
                    name="assignedToDevice"
                    value={editMode ? formData.assignedToDevice : accessory?.assignedToDevice}
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
                    value={editMode ? formData.assignedToDeviceName : accessory?.assignedToDeviceName}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Kaufdatum"
                    name="purchaseDate"
                    value={editMode ? formData.purchaseDate : accessory?.purchaseDate}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Garantie"
                    name="warranty"
                    value={editMode ? formData.warranty : accessory?.warranty}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Abteilung"
                    name="department"
                    value={editMode ? formData.department : accessory?.department}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Kosten"
                    name="cost"
                    value={editMode ? formData.cost : accessory?.cost}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Lieferant"
                    name="supplier"
                    value={editMode ? formData.supplier : accessory?.supplier}
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
                    value={editMode ? formData.notes : accessory?.notes}
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
            <Button variant="contained" startIcon={<DocumentIcon />}>
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
                value={`ATLAS-ACCESSORY-${accessory?.id || ''}`}
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
              Dieser QR-Code enthält die Zubehör-ID für schnellen Zugriff auf die Detailseite.
            </Typography>
            <Button variant="contained" color="primary">
              QR-Code herunterladen
            </Button>
          </Box>
        </TabPanel>
      </Paper>

      {/* Snackbar für Benachrichtigungen */}
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccessoryDetails;
