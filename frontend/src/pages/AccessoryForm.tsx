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
  FormHelperText
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { accessoriesApi, usersApi, settingsApi } from '../utils/api';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import deLocale from 'date-fns/locale/de';
import useEntityForm from '../hooks/useEntityForm';
import useCacheService from '../services/cacheService';

// Schnittstelle für Formularfelder
interface AccessoryFormData {
  name: string;
  type: string;
  model: string;
  brand: string;
  serialNumber: string;
  purchaseDate: string | null;
  warranty: string;
  warrantyUntil: string | null;
  price: string;
  supplier: string;
  location: string;
  room: string;
  assignedTo: string;
  status: string;
  notes: string;
  quantity: number;
}

const AccessoryForm: React.FC = () => {
  const { accessoryId } = useParams<{ accessoryId: string }>();
  const cacheService = useCacheService();

  // Optionen für Dropdown-Menüs
  const accessoryTypeOptions = [
    'Tastatur', 'Maus', 'Monitor', 'Kabel', 'Adapter', 'Headset',
    'Webcam', 'Dockingstation', 'Netzteil', 'Tasche', 'Sonstiges'
  ];
  const statusOptions = ['Verfügbar', 'In Benutzung', 'Defekt', 'Entsorgt'];

  // Validierungsfunktion für das Formular
  const validateForm = (data: AccessoryFormData) => {
    const errors: Record<string, string> = {};

    // Pflichtfelder prüfen
    if (!data.name.trim()) errors.name = 'Name ist erforderlich';
    if (!data.type) errors.type = 'Typ ist erforderlich';
    if (!data.status) errors.status = 'Status ist erforderlich';

    // Spezifische Validierungen
    if (data.quantity < 1) errors.quantity = 'Muss mindestens 1 sein';

    return errors;
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
  } = useEntityForm<AccessoryFormData>({
    initialData: {
      name: '',
      type: '',
      model: '',
      brand: '',
      serialNumber: '',
      purchaseDate: null,
      warranty: '',
      warrantyUntil: null,
      price: '',
      supplier: '',
      location: '',
      room: '',
      assignedTo: '',
      status: 'Verfügbar',
      notes: '',
      quantity: 1
    },
    entityId: accessoryId,
    getById: async (id) => await accessoriesApi.getAccessoryById(id),
    create: async (data) => {
      const result = await accessoriesApi.createAccessory(data);
      // Cache nach Erstellung invalidieren
      cacheService.accessories.invalidateAll();
      return result;
    },
    update: async (id, data) => {
      const result = await accessoriesApi.updateAccessory(id, data);
      // Cache nach Aktualisierung invalidieren
      cacheService.accessories.invalidateById(id);
      return result;
    },
    validateForm,
    returnPath: '/accessories',
    successMessageCreate: 'Zubehör erfolgreich erstellt',
    successMessageUpdate: 'Zubehör erfolgreich aktualisiert'
  });

  // Zusätzliche Zustandsverwaltung für referenzierte Entitäten
  const [locations, setLocations] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
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
              {isEditMode ? 'Zubehör bearbeiten' : 'Neues Zubehör erstellen'}
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
                    onChange={handleInputChange}
                    label="Typ *"
                  >
                    <MenuItem value="">
                      <em>Bitte wählen</em>
                    </MenuItem>
                    {accessoryTypeOptions.map((option) => (
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
                  label="Marke"
                  name="brand"
                  value={formData.brand}
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
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Anzahl"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  InputProps={{ inputProps: { min: 1 } }}
                  error={!!errors.quantity}
                  helperText={errors.quantity}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={!!errors.status}>
                  <InputLabel>Status *</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    label="Status *"
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

              {/* Kaufinformationen */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', borderBottom: '1px solid #eee', pb: 1 }}>
                  Kaufinformationen
                </Typography>
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
                  placeholder="z.B. 99,99 €"
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
                  placeholder="z.B. 2 Jahre"
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
                <TextField
                  fullWidth
                  label="Lieferant"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
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
                  <InputLabel>Standort</InputLabel>
                  <Select
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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

export default AccessoryForm;
