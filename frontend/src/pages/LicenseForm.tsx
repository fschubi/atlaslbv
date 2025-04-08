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
import { licensesApi, usersApi } from '../utils/api';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import deLocale from 'date-fns/locale/de';
import useEntityForm from '../hooks/useEntityForm';
import useCacheService from '../services/cacheService';

// Schnittstelle für Formularfelder
interface LicenseFormData {
  name: string;
  type: string;
  product: string;
  publisher: string;
  licenseKey: string;
  purchaseDate: string | null;
  expirationDate: string | null;
  seats: number;
  remainingSeats: number;
  cost: string;
  vendor: string;
  assignedTo: string;
  status: string;
  notes: string;
}

const LicenseForm: React.FC = () => {
  const { licenseId } = useParams<{ licenseId: string }>();
  const cacheService = useCacheService();

  // Optionen für Dropdown-Menüs
  const licenseTypeOptions = [
    'Einzelplatz', 'Mehrplatz', 'Volumenvertrag', 'Enterprise', 'Abonnement', 'Cloud', 'Freeware', 'Open Source', 'Sonstiges'
  ];
  const statusOptions = ['Aktiv', 'Abgelaufen', 'Gekündigt', 'In Warnung', 'Wartung'];

  // Validierungsfunktion für das Formular
  const validateForm = (data: LicenseFormData) => {
    const errors: Record<string, string> = {};

    // Pflichtfelder prüfen
    if (!data.name.trim()) errors.name = 'Name ist erforderlich';
    if (!data.type) errors.type = 'Typ ist erforderlich';
    if (!data.publisher.trim()) errors.publisher = 'Hersteller ist erforderlich';
    if (!data.status) errors.status = 'Status ist erforderlich';

    // Spezifische Validierungen
    if (data.seats < 0) errors.seats = 'Anzahl der Lizenzen kann nicht negativ sein';
    if (data.remainingSeats < 0) errors.remainingSeats = 'Verbleibende Lizenzen kann nicht negativ sein';
    if (data.remainingSeats > data.seats) {
      errors.remainingSeats = 'Verbleibende Lizenzen können nicht größer sein als die Gesamtzahl';
    }

    // Ablaufdatum muss nach Kaufdatum liegen
    if (data.purchaseDate && data.expirationDate) {
      const purchase = new Date(data.purchaseDate);
      const expiration = new Date(data.expirationDate);
      if (expiration < purchase) {
        errors.expirationDate = 'Ablaufdatum muss nach dem Kaufdatum liegen';
      }
    }

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
  } = useEntityForm<LicenseFormData>({
    initialData: {
      name: '',
      type: '',
      product: '',
      publisher: '',
      licenseKey: '',
      purchaseDate: null,
      expirationDate: null,
      seats: 1,
      remainingSeats: 1,
      cost: '',
      vendor: '',
      assignedTo: '',
      status: 'Aktiv',
      notes: ''
    },
    entityId: licenseId,
    getById: async (id) => await licensesApi.getLicenseById(id),
    create: async (data) => {
      const result = await licensesApi.createLicense(data);
      // Cache nach Erstellung invalidieren
      cacheService.licenses.invalidateAll();
      return result;
    },
    update: async (id, data) => {
      const result = await licensesApi.updateLicense(id, data);
      // Cache nach Aktualisierung invalidieren
      cacheService.licenses.invalidateById(id);
      return result;
    },
    validateForm,
    returnPath: '/licenses',
    successMessageCreate: 'Lizenz erfolgreich erstellt',
    successMessageUpdate: 'Lizenz erfolgreich aktualisiert'
  });

  // Zusätzliche Zustandsverwaltung für referenzierte Entitäten
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Daten laden
  useEffect(() => {
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

    loadUsers();
  }, []);

  // Ladeanzeige während des Ladens der Daten
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Helfer-Funktion zur Aktualisierung von remainingSeats bei Änderung von seats
  const handleSeatsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seats = parseInt(e.target.value, 10) || 0;
    handleInputChange(e);

    // Im Erstellungsmodus seats und remainingSeats synchronisieren
    if (!isEditMode) {
      const syntheticEvent = {
        target: {
          name: 'remainingSeats',
          value: seats
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleInputChange(syntheticEvent);
    }
  };

  // Korrigierter Handler für MUI Select-Komponenten
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    const syntheticEvent = {
      target: { name, value }
    } as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(syntheticEvent);
  };

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
              {isEditMode ? 'Lizenz bearbeiten' : 'Neue Lizenz erstellen'}
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
                  >
                    <MenuItem value="">
                      <em>Bitte wählen</em>
                    </MenuItem>
                    {licenseTypeOptions.map((option) => (
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
                  label="Produkt"
                  name="product"
                  value={formData.product}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Hersteller"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  error={!!errors.publisher}
                  helperText={errors.publisher}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Lizenzschlüssel"
                  name="licenseKey"
                  value={formData.licenseKey}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
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

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Anzahl Lizenzen"
                  name="seats"
                  value={formData.seats}
                  onChange={handleSeatsChange}
                  margin="normal"
                  variant="outlined"
                  InputProps={{ inputProps: { min: 0 } }}
                  error={!!errors.seats}
                  helperText={errors.seats}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Verbleibende Lizenzen"
                  name="remainingSeats"
                  value={formData.remainingSeats}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  InputProps={{ inputProps: { min: 0 } }}
                  error={!!errors.remainingSeats}
                  helperText={errors.remainingSeats}
                />
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
                <DatePicker
                  label="Ablaufdatum"
                  value={formData.expirationDate ? new Date(formData.expirationDate) : null}
                  onChange={(newValue) => handleDateChange('expirationDate', newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal",
                      variant: "outlined",
                      error: !!errors.expirationDate,
                      helperText: errors.expirationDate
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Kosten"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  placeholder="z.B. 999,99 €"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Lieferant"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>

              {/* Zuordnung */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', borderBottom: '1px solid #eee', pb: 1 }}>
                  Zuordnung
                </Typography>
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

export default LicenseForm;
