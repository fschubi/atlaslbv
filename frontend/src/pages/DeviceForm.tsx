import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  SelectChangeEvent
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { devicesApi, usersApi, settingsApi } from '../utils/api';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import deLocale from 'date-fns/locale/de';
import useEntityForm from '../hooks/useEntityForm';
import useCacheService from '../services/cacheService';

// Schnittstelle für Formularfelder
interface DeviceFormData {
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  inventoryNumber: string;
  purchaseDate: string | null;
  warranty: string;
  warrantyUntil: string | null;
  price: string;
  status: string;
  department: string;
  location: string;
  room: string;
  assignedTo: string;
  processor: string;
  memory: string;
  storage: string;
  operatingSystem: string;
  macAddress: string;
  ipAddress: string;
  notes: string;
}

const DeviceForm: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const cacheService = useCacheService();

  // Status-Optionen
  const statusOptions = ['In Betrieb', 'Lager', 'Reparatur', 'Defekt', 'Entsorgt'];
  const deviceTypeOptions = ['Laptop', 'Desktop', 'Tablet', 'Smartphone', 'Server', 'Drucker', 'Netzwerk', 'Sonstiges'];

  // Validierungsfunktion für das Formular
  const validateForm = (data: DeviceFormData) => {
    const errors: Record<string, string> = {};

    // Pflichtfelder prüfen
    if (!data.name.trim()) errors.name = 'Name ist erforderlich';
    if (!data.type.trim()) errors.type = 'Typ ist erforderlich';
    if (!data.status.trim()) errors.status = 'Status ist erforderlich';

    // Weitere Validierungen bei Bedarf...
    if (data.serialNumber && !isValidSerialNumber(data.serialNumber)) {
      errors.serialNumber = 'Ungültiges Format für Seriennummer';
    }

    if (data.ipAddress && !isValidIPAddress(data.ipAddress)) {
      errors.ipAddress = 'Ungültiges IP-Adressen-Format';
    }

    if (data.macAddress && !isValidMACAddress(data.macAddress)) {
      errors.macAddress = 'Ungültiges MAC-Adressen-Format';
    }

    return errors;
  };

  // Hilfsfunktionen für Validierungen
  const isValidSerialNumber = (serialNumber: string): boolean => {
    // In der Praxis würde hier eine spezifischere Validierung stehen
    // Für das Beispiel: mindestens 4 Zeichen, alphanumerisch
    return serialNumber.length >= 4;
  };

  const isValidIPAddress = (ipAddress: string): boolean => {
    // Vereinfachte IPv4-Validierung
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(ipAddress);
  };

  const isValidMACAddress = (macAddress: string): boolean => {
    // Vereinfachte MAC-Adressen-Validierung
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(macAddress);
  };

  // useEntityForm Hook initialisieren
  const {
    formData,
    errors,
    loading,
    saving,
    snackbar,
    isEditMode,
    handleInputChange,
    handleDateChange,
    handleSubmit,
    handleCancel,
    handleCloseSnackbar
  } = useEntityForm<DeviceFormData>({
    initialData: {
      name: '',
      type: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      inventoryNumber: '',
      purchaseDate: null,
      warranty: '',
      warrantyUntil: null,
      price: '',
      status: 'In Betrieb',
      department: '',
      location: '',
      room: '',
      assignedTo: '',
      processor: '',
      memory: '',
      storage: '',
      operatingSystem: '',
      macAddress: '',
      ipAddress: '',
      notes: ''
    },
    entityId: deviceId,
    getById: async (id) => await devicesApi.getDeviceById(id),
    create: async (data) => {
      const result = await devicesApi.createDevice(data);
      // Cache nach Erstellung invalidieren
      cacheService.devices.invalidateAll();
      return result;
    },
    update: async (id, data) => {
      const result = await devicesApi.updateDevice(id, data);
      // Cache nach Aktualisierung invalidieren
      cacheService.devices.invalidateById(id);
      return result;
    },
    validateForm,
    returnPath: '/devices',
    successMessageCreate: 'Gerät erfolgreich erstellt',
    successMessageUpdate: 'Gerät erfolgreich aktualisiert'
  });

  // Zusätzliche Zustandsverwaltung für referenzierte Entitäten
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  // Daten laden
  useEffect(() => {
    // Standorte laden mit Cache
    const loadLocations = async () => {
      try {
        setLocationsLoading(true);
        const response = await cacheService.references.getLocations(
          () => settingsApi.getAllLocations()
        );
        setLocations(response.data);
      } catch (err) {
        console.error('Fehler beim Laden der Standorte:', err);
      } finally {
        setLocationsLoading(false);
      }
    };

    // Abteilungen laden mit Cache
    const loadDepartments = async () => {
      try {
        setDepartmentsLoading(true);
        const response = await cacheService.references.getDepartments(
          () => settingsApi.getAllDepartments()
        );
        setDepartments(response.data);
      } catch (err) {
        console.error('Fehler beim Laden der Abteilungen:', err);
      } finally {
        setDepartmentsLoading(false);
      }
    };

    // Benutzer laden mit Cache
    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        const response = await cacheService.references.getUsers(
          () => usersApi.getAllUsers()
        );
        setUsers(response.data);
      } catch (err) {
        console.error('Fehler beim Laden der Benutzer:', err);
      } finally {
        setUsersLoading(false);
      }
    };

    loadLocations();
    loadDepartments();
    loadUsers();
  }, []);

  // Räume basierend auf ausgewähltem Standort laden
  useEffect(() => {
    const loadRooms = async () => {
      if (!formData.location) {
        setRooms([]);
        return;
      }

      try {
        setRoomsLoading(true);
        // Mit Cache über Service
        const response = await cacheService.references.getRooms(
          () => settingsApi.getAllRooms(),
          formData.location
        );

        // Filtere Räume nach Standort (in einer echten API wäre das nicht nötig)
        const filteredRooms = response.data.filter((room: any) =>
          room.location === formData.location || !room.location
        );

        setRooms(filteredRooms);
      } catch (err) {
        console.error('Fehler beim Laden der Räume:', err);
      } finally {
        setRoomsLoading(false);
      }
    };

    loadRooms();
  }, [formData.location]);

  // Korrigierter Handler für MUI Select-Komponenten
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    const syntheticEvent = {
      target: { name, value }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(syntheticEvent);
  };

  // Ladeanzeige während des Ladens der Daten
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={deLocale}>
      <Box sx={{ width: '100%', maxWidth: '100%', px: 2, pt: 2 }}>
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
            <ArrowBackIcon
              onClick={handleCancel}
              sx={{ cursor: 'pointer' }}
            />
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {isEditMode ? 'Gerät bearbeiten' : 'Neues Gerät erstellen'}
            </Typography>
          </Box>
        </Paper>

        {/* Formular */}
        <Paper sx={{ p: 3, borderRadius: '0 0 4px 4px' }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Hauptinformationen */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', borderBottom: '1px solid #eee', pb: 1 }}>
                  Allgemeine Informationen
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  error={!!errors.name}
                  helperText={errors.name}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={!!errors.type}>
                  <InputLabel>Typ *</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleSelectChange}
                    label="Typ *"
                    required
                  >
                    <MenuItem value="">
                      <em>Bitte wählen</em>
                    </MenuItem>
                    {deviceTypeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hersteller"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Modell"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Seriennummer"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  error={!!errors.serialNumber}
                  helperText={errors.serialNumber}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Inventarnummer"
                  name="inventoryNumber"
                  value={formData.inventoryNumber}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Kaufdatum"
                  value={formData.purchaseDate ? new Date(formData.purchaseDate) : null}
                  onChange={(newValue) => handleDateChange('purchaseDate', newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal",
                      variant: "outlined"
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Preis"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  placeholder="z.B. 999,99 €"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Garantie"
                  name="warranty"
                  value={formData.warranty}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  placeholder="z.B. 3 Jahre"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Garantie bis"
                  value={formData.warrantyUntil ? new Date(formData.warrantyUntil) : null}
                  onChange={(newValue) => handleDateChange('warrantyUntil', newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal",
                      variant: "outlined"
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={!!errors.status}>
                  <InputLabel>Status *</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleSelectChange}
                    label="Status *"
                    required
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* Technische Informationen */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', borderBottom: '1px solid #eee', pb: 1 }}>
                  Technische Informationen
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prozessor"
                  name="processor"
                  value={formData.processor}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Arbeitsspeicher"
                  name="memory"
                  value={formData.memory}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  placeholder="z.B. 16 GB"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Speicher"
                  name="storage"
                  value={formData.storage}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  placeholder="z.B. 512 GB SSD"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Betriebssystem"
                  name="operatingSystem"
                  value={formData.operatingSystem}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="MAC-Adresse"
                  name="macAddress"
                  value={formData.macAddress}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  error={!!errors.macAddress}
                  helperText={errors.macAddress}
                  placeholder="z.B. 00:1A:2B:3C:4D:5E"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="IP-Adresse"
                  name="ipAddress"
                  value={formData.ipAddress}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  error={!!errors.ipAddress}
                  helperText={errors.ipAddress}
                  placeholder="z.B. 192.168.1.100"
                />
              </Grid>

              {/* Standort und Zuordnung */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', borderBottom: '1px solid #eee', pb: 1 }}>
                  Standort & Zuordnung
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Abteilung</InputLabel>
                  <Select
                    name="department"
                    value={formData.department}
                    onChange={handleSelectChange}
                    label="Abteilung"
                  >
                    <MenuItem value="">
                      <em>Keine Abteilung</em>
                    </MenuItem>
                    {departmentsLoading ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} /> Wird geladen...
                      </MenuItem>
                    ) : (
                      departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Standort</InputLabel>
                  <Select
                    name="location"
                    value={formData.location}
                    onChange={handleSelectChange}
                    label="Standort"
                  >
                    <MenuItem value="">
                      <em>Kein Standort</em>
                    </MenuItem>
                    {locationsLoading ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} /> Wird geladen...
                      </MenuItem>
                    ) : (
                      locations.map((loc) => (
                        <MenuItem key={loc.id} value={loc.id.toString()}>
                          {loc.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Raum</InputLabel>
                  <Select
                    name="room"
                    value={formData.room}
                    onChange={handleSelectChange}
                    label="Raum"
                    disabled={!formData.location || roomsLoading}
                  >
                    <MenuItem value="">
                      <em>Kein Raum</em>
                    </MenuItem>
                    {roomsLoading ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} /> Wird geladen...
                      </MenuItem>
                    ) : (
                      rooms.map((room) => (
                        <MenuItem key={room.id} value={room.id.toString()}>
                          {room.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Zugewiesen an</InputLabel>
                  <Select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleSelectChange}
                    label="Zugewiesen an"
                  >
                    <MenuItem value="">
                      <em>Niemandem zugewiesen</em>
                    </MenuItem>
                    {usersLoading ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} /> Wird geladen...
                      </MenuItem>
                    ) : (
                      users.map((user) => (
                        <MenuItem key={user.id} value={user.id.toString()}>
                          {user.firstName} {user.lastName}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>

              {/* Notizen */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', borderBottom: '1px solid #eee', pb: 1 }}>
                  Notizen
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Notizen"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>

              {/* Formular-Buttons */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <CircularProgress size={24} sx={{ mr: 1 }} />
                        Speichern...
                      </>
                    ) : (
                      'Speichern'
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>

        {/* Benachrichtigung */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default DeviceForm;
