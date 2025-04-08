import React, { useState, useEffect } from 'react';
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
  Chip,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormHelperText,
  CircularProgress,
  Snackbar,
  Alert,
  SelectChangeEvent,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  QrCodeScanner as QrCodeScannerIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Lock as LockIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import AtlasTable, { AtlasColumn } from '../components/AtlasTable';
import BarcodeScanner from '../components/BarcodeScanner';
import { inventoryApi, settingsApi } from '../utils/api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { de } from 'date-fns/locale';

// Typdefinition für Inventursitzung
interface InventorySession {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  location: string;
  status: string;
  progress: number;
  responsibleUser: string;
  devicesTotal: number;
  devicesChecked: number;
  notes: string;
}

// Neuer Interface für die Sperrung
interface DeviceEditLock {
  sessionId: string;
  sessionTitle: string;
  active: boolean;
  startedAt: string;
  affectedDevices: number;
}

const Inventory: React.FC = () => {
  const [inventorySessions, setInventorySessions] = useState<InventorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [locations, setLocations] = useState<{id: number; name: string}[]>([]);

  // Dialog-Zustände
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentSession, setCurrentSession] = useState<Partial<InventorySession>>({
    title: '',
    startDate: new Date().toISOString().substring(0, 10),
    endDate: '',
    location: '',
    status: 'Geplant',
    notes: '',
    responsibleUser: ''
  });
  const [dialogErrors, setDialogErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Neue Zustände für Sperrung und Dialog
  const [editLockActive, setEditLockActive] = useState<boolean>(false);
  const [lockWarningOpen, setLockWarningOpen] = useState<boolean>(false);
  const [activeLocks, setActiveLocks] = useState<DeviceEditLock[]>([]);
  const [lockInfoOpen, setLockInfoOpen] = useState<boolean>(false);

  // Snackbar-Zustände
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Daten vom Backend laden
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Inventarsitzungen laden
        const sessionsResponse = await inventoryApi.getAllInventorySessions();
        setInventorySessions(sessionsResponse.data);

        // Standorte für Dropdown-Menü laden
        const locationsResponse = await settingsApi.getAllLocations();
        setLocations(locationsResponse.data);

        // Überprüfe aktive Sperren durch laufende Inventuren
        checkActiveLocks(sessionsResponse.data);

        setError(null);
      } catch (err: any) {
        setError(err.message || 'Fehler beim Laden der Inventurdaten');
        showSnackbar('Fehler beim Laden der Inventurdaten', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Neue Funktion: Überprüfe aktive Sperren durch laufende Inventuren
  const checkActiveLocks = (sessions: InventorySession[]) => {
    const activeSessions = sessions.filter(session => session.status === 'Aktiv');

    if (activeSessions.length > 0) {
      const locks: DeviceEditLock[] = activeSessions.map(session => ({
        sessionId: session.id,
        sessionTitle: session.title,
        active: true,
        startedAt: session.startDate,
        affectedDevices: session.devicesTotal
      }));

      setActiveLocks(locks);

      // Globalen Sperrstatus setzen
      const isLocked = locks.length > 0;
      setEditLockActive(isLocked);

      // Wenn eine Sperrung vorliegt, zeige Warnung an
      if (isLocked && !localStorage.getItem('lockWarningDismissed')) {
        setLockWarningOpen(true);
      }

      // Sperre in localStorage speichern für app-weite Verfügbarkeit
      localStorage.setItem('deviceEditLocked', JSON.stringify(isLocked));
      localStorage.setItem('activeLocks', JSON.stringify(locks));
    } else {
      setActiveLocks([]);
      setEditLockActive(false);
      localStorage.removeItem('deviceEditLocked');
      localStorage.removeItem('activeLocks');
    }
  };

  // Snackbar anzeigen
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Dialog öffnen für neue Inventursitzung
  const handleNewSession = () => {
    setCurrentSession({
      title: '',
      startDate: new Date().toISOString().substring(0, 10),
      endDate: '',
      location: locations.length > 0 ? locations[0].name : '',
      status: 'Geplant',
      notes: '',
      responsibleUser: ''
    });
    setDialogErrors({});
    setDialogMode('create');
    setDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEditSession = (session: InventorySession) => {
    setCurrentSession({
      ...session
    });
    setDialogErrors({});
    setDialogMode('edit');
    setDialogOpen(true);
  };

  // Inventursitzung löschen
  const handleDeleteSession = async (id: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Inventursitzung löschen möchten?')) {
      try {
        await inventoryApi.deleteInventorySession(id);
        const updatedSessions = inventorySessions.filter(session => session.id !== id);
        setInventorySessions(updatedSessions);

        // Aktualisiere die Sperrinformationen, da sich die Sessions geändert haben
        checkActiveLocks(updatedSessions);

        showSnackbar('Inventursitzung erfolgreich gelöscht', 'success');
      } catch (err: any) {
        showSnackbar(err.message || 'Fehler beim Löschen der Inventursitzung', 'error');
      }
    }
  };

  // Inventursitzung starten
  const handleStartSession = async (id: string) => {
    try {
      const session = inventorySessions.find(s => s.id === id);
      if (!session) return;

      const updatedSession = {
        ...session,
        status: 'Aktiv',
        startDate: new Date().toISOString().substring(0, 10)
      };

      const response = await inventoryApi.updateInventorySession(id, updatedSession);
      const updatedSessions = inventorySessions.map(s =>
        s.id === id ? { ...response.data } : s
      );

      setInventorySessions(updatedSessions);

      // Aktualisiere die Sperrinformationen, da eine Session nun aktiv ist
      checkActiveLocks(updatedSessions);

      showSnackbar('Inventursitzung erfolgreich gestartet', 'success');

      // Zeige Sperrwarnung an
      setLockWarningOpen(true);
    } catch (err: any) {
      showSnackbar(err.message || 'Fehler beim Starten der Inventursitzung', 'error');
    }
  };

  // Inventursitzung stoppen
  const handleStopSession = async (id: string) => {
    try {
      const session = inventorySessions.find(s => s.id === id);
      if (!session) return;

      const updatedSession = {
        ...session,
        status: 'Abgebrochen',
        endDate: new Date().toISOString().substring(0, 10)
      };

      const response = await inventoryApi.updateInventorySession(id, updatedSession);
      const updatedSessions = inventorySessions.map(s =>
        s.id === id ? { ...response.data } : s
      );

      setInventorySessions(updatedSessions);

      // Aktualisiere die Sperrinformationen, da die Session nicht mehr aktiv ist
      checkActiveLocks(updatedSessions);

      showSnackbar('Inventursitzung erfolgreich gestoppt', 'success');
    } catch (err: any) {
      showSnackbar(err.message || 'Fehler beim Stoppen der Inventursitzung', 'error');
    }
  };

  // Inventursitzung abschließen
  const handleCompleteSession = async (id: string) => {
    try {
      const response = await inventoryApi.completeInventorySession(id);
      const updatedSessions = inventorySessions.map(s =>
        s.id === id ? { ...s, ...response.data } as InventorySession : s
      );

      setInventorySessions(updatedSessions);

      // Aktualisiere die Sperrinformationen, da die Session nun abgeschlossen ist
      checkActiveLocks(updatedSessions);

      showSnackbar('Inventursitzung erfolgreich abgeschlossen', 'success');
    } catch (err: any) {
      showSnackbar(err.message || 'Fehler beim Abschließen der Inventursitzung', 'error');
    }
  };

  // Neues Dialogfeld für Sperrinformationen schließen
  const handleCloseLockInfo = () => {
    setLockInfoOpen(false);
  };

  // Neue Funktion zum Schließen der Sperrwarnung
  const handleCloseLockWarning = () => {
    setLockWarningOpen(false);
    localStorage.setItem('lockWarningDismissed', 'true');
  };

  // Eingabeänderungen im Dialog verarbeiten
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentSession({
      ...currentSession,
      [name]: value
    });

    // Fehler entfernen, wenn Feld ausgefüllt wird
    if (dialogErrors[name]) {
      setDialogErrors({
        ...dialogErrors,
        [name]: ''
      });
    }
  };

  // Select-Änderungen im Dialog verarbeiten
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setCurrentSession({
      ...currentSession,
      [name]: value
    });

    // Fehler entfernen, wenn Feld ausgefüllt wird
    if (dialogErrors[name]) {
      setDialogErrors({
        ...dialogErrors,
        [name]: ''
      });
    }
  };

  // Datum-Änderungen im Dialog verarbeiten
  const handleDateChange = (name: string, date: Date | null): void => {
    if (date) {
      setCurrentSession({
        ...currentSession,
        [name]: date.toISOString().substring(0, 10)
      });

      // Fehler entfernen, wenn Feld ausgefüllt wird
      if (dialogErrors[name]) {
        setDialogErrors({
          ...dialogErrors,
          [name]: ''
        });
      }
    }
  };

  // Dialog-Eingaben validieren
  const validateSessionData = () => {
    const errors: Record<string, string> = {};

    if (!currentSession.title?.trim()) {
      errors.title = 'Titel ist erforderlich';
    }

    if (!currentSession.location) {
      errors.location = 'Standort ist erforderlich';
    }

    if (!currentSession.startDate) {
      errors.startDate = 'Startdatum ist erforderlich';
    }

    if (currentSession.endDate && new Date(currentSession.endDate) < new Date(currentSession.startDate || '')) {
      errors.endDate = 'Enddatum muss nach dem Startdatum liegen';
    }

    setDialogErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Inventursitzung speichern (erstellen oder aktualisieren)
  const handleSaveSession = async () => {
    if (!validateSessionData()) return;

    try {
      setSubmitting(true);

      const sessionData = {
        ...currentSession
      };

      if (dialogMode === 'create') {
        // Neue Inventursitzung erstellen
        const response = await inventoryApi.createInventorySession(sessionData);

        setInventorySessions([...inventorySessions, response.data]);
        showSnackbar('Inventursitzung erfolgreich erstellt', 'success');
      } else {
        // Bestehende Inventursitzung aktualisieren
        const response = await inventoryApi.updateInventorySession(sessionData.id!, sessionData);

        setInventorySessions(inventorySessions.map(session =>
          session.id === response.data.id ? response.data : session
        ));
        showSnackbar('Inventursitzung erfolgreich aktualisiert', 'success');
      }

      setDialogOpen(false);
    } catch (err: any) {
      showSnackbar(err.message || 'Fehler beim Speichern der Inventursitzung', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBarcodeDetected = (code: string) => {
    setSearchText(code);
    setScannerOpen(false);
    showSnackbar(`Barcode/QR-Code erkannt: ${code}`, 'info');
  };

  // Spalten für die AtlasTable-Komponente
  const columns: AtlasColumn[] = [
    { label: 'ID', dataKey: 'id', width: 100 },
    { label: 'Titel', dataKey: 'title', width: 200 },
    { label: 'Startdatum', dataKey: 'startDate', width: 120 },
    { label: 'Enddatum', dataKey: 'endDate', width: 120 },
    { label: 'Standort', dataKey: 'location', width: 150 },
    {
      label: 'Status',
      dataKey: 'status',
      width: 130,
      render: (value: string) => {
        let color = '#757575'; // Standardfarbe
        let bgColor = 'rgba(117, 117, 117, 0.2)';

        switch(value) {
          case 'Geplant':
            color = '#2196f3';
            bgColor = 'rgba(33, 150, 243, 0.2)';
            break;
          case 'Aktiv':
            color = '#ff9800';
            bgColor = 'rgba(255, 152, 0, 0.2)';
            break;
          case 'Abgeschlossen':
            color = '#4caf50';
            bgColor = 'rgba(76, 175, 80, 0.2)';
            break;
          case 'Abgebrochen':
            color = '#f44336';
            bgColor = 'rgba(244, 67, 54, 0.2)';
            break;
        }

        return (
          <Chip
            label={value}
            size="small"
            sx={{
              bgcolor: bgColor,
              color: color,
              border: `1px solid ${color}`,
              height: 24
            }}
          />
        );
      }
    },
    {
      label: 'Fortschritt',
      dataKey: 'progress',
      width: 120,
      render: (value: number) => {
        let color = '#757575';
        if (value > 80) color = '#4caf50';
        else if (value > 40) color = '#ff9800';
        else if (value > 0) color = '#2196f3';

        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: '100%',
                mr: 1,
                height: 8,
                borderRadius: 4,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Box
                sx={{
                  width: `${value}%`,
                  height: '100%',
                  borderRadius: 4,
                  bgcolor: color,
                }}
              />
            </Box>
            <Typography variant="body2" color="white" sx={{ minWidth: 35, fontSize: '0.75rem' }}>
              {`${value}%`}
            </Typography>
          </Box>
        );
      }
    },
    { label: 'Verantwortlich', dataKey: 'responsibleUser', width: 150 },
    { label: 'Geräte Gesamt', dataKey: 'devicesTotal', width: 120, numeric: true },
    { label: 'Geräte Geprüft', dataKey: 'devicesChecked', width: 120, numeric: true },
    { label: 'Notizen', dataKey: 'notes', width: 200 },
    {
      label: 'Aktionen',
      dataKey: 'actions',
      width: 180,
      render: (_, session: InventorySession) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {session.status === 'Geplant' && (
            <Tooltip title="Inventur starten">
              <IconButton
                size="small"
                onClick={() => handleStartSession(session.id)}
                sx={{ color: '#4caf50' }}
              >
                <PlayArrowIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {session.status === 'Aktiv' && (
            <>
              <Tooltip title="Inventur abschließen">
                <IconButton
                  size="small"
                  onClick={() => handleCompleteSession(session.id)}
                  sx={{ color: '#4caf50' }}
                >
                  <CheckCircleOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Inventur abbrechen">
                <IconButton
                  size="small"
                  onClick={() => handleStopSession(session.id)}
                  sx={{ color: '#f44336' }}
                >
                  <StopIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Inventur durchführen">
                <IconButton
                  size="small"
                  onClick={() => window.location.href = `/inventory/${session.id}`}
                  sx={{ color: '#1976d2' }}
                >
                  <QrCodeScannerIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}

          <Tooltip title="Bearbeiten">
            <IconButton
              size="small"
              onClick={() => handleEditSession(session)}
              sx={{ color: '#2196f3' }}
              disabled={session.status === 'Abgeschlossen'}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Löschen">
            <IconButton
              size="small"
              onClick={() => handleDeleteSession(session.id)}
              sx={{ color: '#f44336' }}
              disabled={session.status === 'Aktiv'}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  // Filter für die Inventartabelle
  const filteredInventories = inventorySessions.filter(session => {
    const matchesSearch = searchText === '' ||
      Object.values(session).some(value =>
        value.toString().toLowerCase().includes(searchText.toLowerCase())
      );

    const matchesStatus = statusFilter === '' || session.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Unique Statusoptionen aus den vorhandenen Inventuren
  const uniqueStatuses = [...new Set(inventorySessions.map(session => session.status))];

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: 0 }}>
      {/* Überschrift in blauem Banner */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#1976d2',
          color: 'white',
          p: 1,
          pl: 2,
          borderRadius: '4px 4px 0 0'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Inventurverwaltung
        </Typography>
      </Paper>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          py: 1,
          px: 2,
          bgcolor: '#1a1a1a'
        }}
      >
        {/* Titel und Hinweis auf aktive Sperren */}
        <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <Typography variant="body2" sx={{ position: 'absolute', left: 10, zIndex: 1, color: '#aaa' }}>
            Suche
          </Typography>
          <InputBase
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{
              border: '1px solid #555',
              borderRadius: 1,
              pl: 7,
              pr: 1,
              py: 0.5,
              width: 300,
              color: 'white'
            }}
            endAdornment={
              <IconButton
                size="small"
                sx={{ color: '#1976d2' }}
              >
                <SearchIcon />
              </IconButton>
            }
          />
        </Box>

        {/* Status-Dropdown */}
        <FormControl size="small" sx={{ width: 150 }}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as string)}
            displayEmpty
            sx={{
              border: '1px solid #555',
              borderRadius: 1,
              bgcolor: '#333',
              color: 'white',
              '.MuiOutlinedInput-notchedOutline': { border: 0 },
              '&:hover .MuiOutlinedInput-notchedOutline': { border: 0 },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 0 },
            }}
          >
            <MenuItem value="">
              <Typography>Status</Typography>
            </MenuItem>
            {uniqueStatuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Scanner-Button */}
          <Button
            variant="outlined"
            startIcon={<QrCodeScannerIcon />}
            onClick={() => setScannerOpen(true)}
            sx={{
              borderColor: '#1976d2',
              color: '#1976d2',
              '&:hover': {
                bgcolor: 'rgba(25, 118, 210, 0.04)',
                borderColor: '#1565c0',
              }
            }}
          >
            Scanner
          </Button>

          {/* Neu-Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewSession}
            sx={{
              bgcolor: '#1976d2',
              color: 'white',
              '&:hover': {
                bgcolor: '#1565c0',
              }
            }}
          >
            Neue Inventur
          </Button>
        </Box>
      </Box>

      {/* Ladeindikator oder Fehlermeldung */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 2, color: 'error.main' }}>
          <Typography>{error}</Typography>
        </Box>
      ) : (
        /* Inventartabelle */
        <Box
          sx={{
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto'
          }}
        >
          <AtlasTable
            columns={columns}
            rows={filteredInventories}
            heightPx={600}
          />
        </Box>
      )}

      {/* Barcode-Scanner */}
      {scannerOpen && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {/* Dialog zum Erstellen/Bearbeiten einer Inventursitzung */}
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
        <Dialog
          open={dialogOpen}
          onClose={() => !submitting && setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {dialogMode === 'create' ? 'Neue Inventursitzung erstellen' : 'Inventursitzung bearbeiten'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  name="title"
                  label="Titel"
                  fullWidth
                  value={currentSession.title || ''}
                  onChange={handleInputChange}
                  error={!!dialogErrors.title}
                  helperText={dialogErrors.title}
                  disabled={submitting}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!dialogErrors.location}>
                  <Typography variant="caption" sx={{ mb: 1 }}>Standort *</Typography>
                  <Select
                    name="location"
                    value={currentSession.location || ''}
                    onChange={handleSelectChange}
                    displayEmpty
                    disabled={submitting}
                  >
                    {locations.map((location) => (
                      <MenuItem key={location.id} value={location.name}>
                        {location.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {dialogErrors.location && (
                    <FormHelperText>{dialogErrors.location}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!dialogErrors.status}>
                  <Typography variant="caption" sx={{ mb: 1 }}>Status *</Typography>
                  <Select
                    name="status"
                    value={currentSession.status || 'Geplant'}
                    onChange={handleSelectChange}
                    displayEmpty
                    disabled={submitting || dialogMode === 'edit' && currentSession.status === 'Abgeschlossen'}
                  >
                    <MenuItem value="Geplant">Geplant</MenuItem>
                    <MenuItem value="Aktiv">Aktiv</MenuItem>
                    <MenuItem value="Abgeschlossen">Abgeschlossen</MenuItem>
                    <MenuItem value="Abgebrochen">Abgebrochen</MenuItem>
                  </Select>
                  {dialogErrors.status && (
                    <FormHelperText>{dialogErrors.status}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Startdatum *"
                  value={currentSession.startDate ? new Date(currentSession.startDate) : null}
                  onChange={(date) => handleDateChange('startDate', date)}
                  disabled={submitting}
                  format="dd.MM.yyyy"
                  slotProps={{
                    textField: {
                      variant: 'outlined',
                      fullWidth: true,
                      error: !!dialogErrors.startDate,
                      helperText: dialogErrors.startDate,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Enddatum"
                  value={currentSession.endDate ? new Date(currentSession.endDate) : null}
                  onChange={(date) => handleDateChange('endDate', date)}
                  disabled={submitting}
                  format="dd.MM.yyyy"
                  slotProps={{
                    textField: {
                      variant: 'outlined',
                      fullWidth: true,
                      error: !!dialogErrors.endDate,
                      helperText: dialogErrors.endDate,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  name="responsibleUser"
                  label="Verantwortlicher Benutzer"
                  fullWidth
                  value={currentSession.responsibleUser || ''}
                  onChange={handleInputChange}
                  disabled={submitting}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notizen"
                  fullWidth
                  multiline
                  rows={3}
                  value={currentSession.notes || ''}
                  onChange={handleInputChange}
                  disabled={submitting}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSaveSession}
              variant="contained"
              color="primary"
              disabled={submitting}
            >
              {submitting ? (
                <CircularProgress size={24} />
              ) : (
                dialogMode === 'create' ? 'Erstellen' : 'Speichern'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>

      {/* Neue Warnung bei aktiven Inventuren */}
      {editLockActive && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setLockInfoOpen(true)}
            >
              DETAILS
            </Button>
          }
        >
          Eine oder mehrere Inventursitzungen sind aktiv. Die Bearbeitung von Geräten ist eingeschränkt.
        </Alert>
      )}

      {/* Neue Dialoge für Sperrinformationen */}
      <Dialog open={lockWarningOpen} onClose={handleCloseLockWarning}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon color="warning" sx={{ mr: 1 }} />
            Bearbeitung während Inventur gesperrt
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Eine oder mehrere Inventursitzungen wurden aktiviert. Während aktiver Inventuren wird die Bearbeitung von Geräten systemweit eingeschränkt, um die Konsistenz der Inventurdaten zu gewährleisten.
          </Typography>
          <Typography paragraph>
            Folgende Einschränkungen gelten während aktiver Inventuren:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <InfoIcon color="info" />
              </ListItemIcon>
              <ListItemText primary="Geräte können nicht hinzugefügt, bearbeitet oder gelöscht werden" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <InfoIcon color="info" />
              </ListItemIcon>
              <ListItemText primary="Nur Administratoren können die Sperrung umgehen" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <InfoIcon color="info" />
              </ListItemIcon>
              <ListItemText primary="Die Sperrung wird automatisch aufgehoben, wenn alle Inventuren abgeschlossen oder abgebrochen sind" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLockWarning} color="primary">
            Verstanden
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={lockInfoOpen} onClose={handleCloseLockInfo}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LockIcon color="warning" sx={{ mr: 1 }} />
            Aktive Inventursperren
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Die folgenden aktiven Inventursitzungen haben eine Bearbeitungssperre ausgelöst:
          </Typography>
          <List>
            {activeLocks.map((lock) => (
              <ListItem key={lock.sessionId}>
                <ListItemText
                  primary={lock.sessionTitle}
                  secondary={`Gestartet am: ${lock.startedAt} • Betroffene Geräte: ${lock.affectedDevices}`}
                />
              </ListItem>
            ))}
          </List>
          <Typography paragraph sx={{ mt: 2 }}>
            Die Bearbeitungssperre wird automatisch aufgehoben, wenn alle Inventuren abgeschlossen oder abgebrochen sind.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLockInfo} color="primary">
            Schließen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar für Benachrichtigungen */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
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

export default Inventory;
