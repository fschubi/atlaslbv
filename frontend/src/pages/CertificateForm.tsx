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
import { certificatesApi } from '../utils/api';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import deLocale from 'date-fns/locale/de';
import useEntityForm from '../hooks/useEntityForm';
import useCacheService from '../services/cacheService';

// Schnittstelle für Formularfelder
interface CertificateFormData {
  name: string;
  type: string;
  domain: string;
  issuedBy: string;
  issueDate: string | null;
  expirationDate: string | null;
  status: string;
  notes: string;
}

const CertificateForm: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const cacheService = useCacheService();

  // Optionen für Dropdown-Menüs
  const certificateTypeOptions = [
    'SSL/TLS', 'Code Signing', 'Client', 'S/MIME', 'Root CA', 'Intermediate CA', 'Sonstiges'
  ];
  const statusOptions = ['Aktiv', 'Abgelaufen', 'Widerrufen', 'Auslaufend'];

  // Validierungsfunktion für das Formular
  const validateForm = (data: CertificateFormData) => {
    const errors: Record<string, string> = {};

    // Pflichtfelder prüfen
    if (!data.name.trim()) errors.name = 'Name ist erforderlich';
    if (!data.type) errors.type = 'Typ ist erforderlich';
    if (!data.status) errors.status = 'Status ist erforderlich';

    // Spezifische Validierungen
    if (data.type === 'SSL/TLS' && !data.domain.trim()) {
      errors.domain = 'Domain ist für SSL/TLS-Zertifikate erforderlich';
    }

    // Domain-Format validieren, wenn Domain angegeben ist
    if (data.domain.trim() && !isValidDomain(data.domain.trim())) {
      errors.domain = 'Ungültiges Domain-Format';
    }

    // Ablaufdatum muss nach Ausstellungsdatum liegen
    if (data.issueDate && data.expirationDate) {
      const issueDate = new Date(data.issueDate);
      const expirationDate = new Date(data.expirationDate);
      if (expirationDate < issueDate) {
        errors.expirationDate = 'Ablaufdatum muss nach dem Ausstellungsdatum liegen';
      }
    }

    return errors;
  };

  // Domain-Validierung
  const isValidDomain = (domain: string): boolean => {
    // Vereinfachte Domainvalidierung
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
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
  } = useEntityForm<CertificateFormData>({
    initialData: {
      name: '',
      type: '',
      domain: '',
      issuedBy: '',
      issueDate: null,
      expirationDate: null,
      status: 'Aktiv',
      notes: ''
    },
    entityId: certificateId,
    getById: async (id) => await certificatesApi.getCertificateById(id),
    create: async (data) => {
      const result = await certificatesApi.createCertificate(data);
      // Cache nach Erstellung invalidieren
      cacheService.certificates.invalidateAll();
      return result;
    },
    update: async (id, data) => {
      const result = await certificatesApi.updateCertificate(id, data);
      // Cache nach Aktualisierung invalidieren
      cacheService.certificates.invalidateById(id);
      return result;
    },
    validateForm,
    returnPath: '/certificates',
    successMessageCreate: 'Zertifikat erfolgreich erstellt',
    successMessageUpdate: 'Zertifikat erfolgreich aktualisiert'
  });

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
              {isEditMode ? 'Zertifikat bearbeiten' : 'Neues Zertifikat erstellen'}
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
                    {certificateTypeOptions.map((option) => (
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
                  label="Domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  error={!!errors.domain}
                  helperText={errors.domain || 'Bei SSL-Zertifikaten: Domain oder Wildcard (z.B. *.example.com)'}
                  required={formData.type === 'SSL/TLS'}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ausgestellt von"
                  name="issuedBy"
                  value={formData.issuedBy}
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

              {/* Datumsangaben */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', borderBottom: '1px solid #eee', pb: 1 }}>
                  Gültigkeitszeitraum
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Ausstellungsdatum"
                  value={formData.issueDate ? new Date(formData.issueDate) : null}
                  onChange={(newValue) => handleDateChange('issueDate', newValue)}
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
                  placeholder="Zusätzliche Informationen zum Zertifikat, Verwendungszweck, etc."
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

export default CertificateForm;
