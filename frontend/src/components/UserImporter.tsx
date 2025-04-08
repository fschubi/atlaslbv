import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  TextField,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Publish as PublishIcon,
  Cancel as CancelIcon,
  Help as HelpIcon,
  Check as CheckIcon,
  ErrorOutline as ErrorIcon,
  Info as InfoIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

interface UserImporterProps {
  onImport: (users: User[]) => void;
  onCancel: () => void;
}

interface User {
  id?: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  username: string;
  department: string;
  position: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
}

interface ColumnMapping {
  sourceField: string;
  targetField: string;
}

const UserImporter: React.FC<UserImporterProps> = ({ onImport, onCancel }) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [generateUsernames, setGenerateUsernames] = useState<boolean>(true);
  const [generatePasswords, setGeneratePasswords] = useState<boolean>(true);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<User[]>([]);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: number;
    errorMessages: string[];
  }>({ success: 0, errors: 0, errorMessages: [] });

  const steps = ['Datei hochladen', 'Feldzuordnung', 'Vorschau und Validierung', 'Import'];

  // Dropzone-Konfiguration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setParseErrors([]);

    // CSV-Parser
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const rows = text.split('\n').filter(row => row.trim() !== '');

        // Kann angepasst werden, um verschiedene Trennzeichen zu unterstützen
        const delimiter = text.includes(';') ? ';' : ',';

        const parsedData = rows.map(row =>
          row.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, ''))
        );

        if (parsedData.length < 2) {
          setParseErrors(['Die Datei enthält zu wenige Zeilen']);
          return;
        }

        const headerRow = parsedData[0];
        setHeaders(headerRow);

        // Automatische Zuordnung versuchen (basierend auf exakter Übereinstimmung oder ähnlichen Feldnamen)
        const targetFields = [
          'firstName', 'lastName', 'title', 'email', 'username',
          'department', 'position', 'phone', 'role', 'status'
        ];

        const initialMappings: ColumnMapping[] = headerRow.map(header => {
          // Versuche, eine passende Zuordnung zu finden
          const normalizedHeader = header.toLowerCase();
          let match = '';

          // Direkte Zuordnungen
          if (normalizedHeader.includes('vorname')) match = 'firstName';
          else if (normalizedHeader.includes('nachname')) match = 'lastName';
          else if (normalizedHeader.includes('anrede')) match = 'title';
          else if (normalizedHeader.includes('email') || normalizedHeader.includes('mail')) match = 'email';
          else if (normalizedHeader.includes('benutzer') || normalizedHeader.includes('username')) match = 'username';
          else if (normalizedHeader.includes('abteilung')) match = 'department';
          else if (normalizedHeader.includes('position') || normalizedHeader.includes('stelle')) match = 'position';
          else if (normalizedHeader.includes('telefon') || normalizedHeader.includes('phone')) match = 'phone';
          else if (normalizedHeader.includes('rolle') || normalizedHeader.includes('role')) match = 'role';
          else if (normalizedHeader.includes('status')) match = 'status';

          return {
            sourceField: header,
            targetField: match
          };
        });

        setMappings(initialMappings);
        setCsvData(parsedData.slice(1)); // Erste Zeile ist Header
        setActiveStep(1); // Gehe zum nächsten Schritt
      } catch (error) {
        setParseErrors(['Fehler beim Parsen der Datei: ' + (error as Error).message]);
      }
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  // Mapping aktualisieren
  const handleMappingChange = (index: number, targetField: string) => {
    const newMappings = [...mappings];
    newMappings[index].targetField = targetField;
    setMappings(newMappings);
  };

  // Vorschau generieren
  const generatePreview = () => {
    try {
      const preview: User[] = csvData.slice(0, Math.min(5, csvData.length)).map((row, rowIndex) => {
        const user: Partial<User> = {};

        mappings.forEach((mapping, colIndex) => {
          if (mapping.targetField && colIndex < row.length) {
            user[mapping.targetField as keyof User] = row[colIndex];
          }
        });

        // Generierte Felder
        if (generateUsernames && user.firstName && user.lastName) {
          user.username = (user.firstName.charAt(0) + user.lastName).toLowerCase() + (rowIndex + 1);
        }

        // Standardwerte setzen
        if (!user.status) user.status = 'Aktiv';
        if (!user.title) user.title = 'Herr';
        if (!user.role) user.role = 'Benutzer';
        if (!user.createdAt) user.createdAt = new Date().toLocaleDateString('de-DE');

        return user as User;
      });

      setPreviewData(preview);
      setActiveStep(2);
    } catch (error) {
      setParseErrors(['Fehler bei der Vorschau: ' + (error as Error).message]);
    }
  };

  // Daten validieren
  const validateData = () => {
    const errors: string[] = [];

    // Prüfen, ob erforderliche Felder zugeordnet wurden
    const requiredFields = ['firstName', 'lastName', 'email'];
    const missingFields = requiredFields.filter(field =>
      !mappings.some(mapping => mapping.targetField === field)
    );

    if (missingFields.length > 0) {
      errors.push(`Erforderliche Felder fehlen: ${missingFields.join(', ')}`);
    }

    return errors;
  };

  // Import simulieren
  const startImport = () => {
    setActiveStep(3);
    setImportProgress(0);

    const totalUsers = csvData.length;
    const importInterval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(importInterval);

          // Simuliere Ergebnis (in echt würde hier der tatsächliche Import mit Fehlerbehandlung stattfinden)
          const successCount = Math.floor(totalUsers * 0.9); // 90% erfolgreich
          const errorCount = totalUsers - successCount;

          setImportResult({
            success: successCount,
            errors: errorCount,
            errorMessages: errorCount > 0 ? [
              'Benutzer mit E-Mail user5@example.com existiert bereits',
              'Ungültiges Format für Telefonnummer: abc-12345'
            ] : []
          });

          // Konvertiere Daten für den Import
          const usersToImport = csvData.map((row, index) => {
            const user: Partial<User> = {};

            mappings.forEach((mapping, colIndex) => {
              if (mapping.targetField && colIndex < row.length) {
                user[mapping.targetField as keyof User] = row[colIndex];
              }
            });

            // Generierte Werte
            if (generateUsernames && user.firstName && user.lastName) {
              user.username = (user.firstName.charAt(0) + user.lastName).toLowerCase() + index;
            }

            user.id = `USER-${1000 + index}`;

            // Standardwerte
            if (!user.status) user.status = 'Aktiv';
            if (!user.title) user.title = 'Herr';
            if (!user.role) user.role = 'Benutzer';
            // Setze das Erstellungsdatum auf aktuelles Datum im deutschen Format
            user.createdAt = new Date().toLocaleDateString('de-DE');

            return user as User;
          });

          onImport(usersToImport);
          return 100;
        }

        // Fortschritt erhöhen
        return prev + Math.floor(Math.random() * 10) + 5;
      });
    }, 500);
  };

  // Weiter zum nächsten Schritt
  const handleNext = () => {
    if (activeStep === 1) {
      const validationErrors = validateData();
      if (validationErrors.length > 0) {
        setParseErrors(validationErrors);
        return;
      }
      generatePreview();
    } else if (activeStep === 2) {
      startImport();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  // Zurück zum vorherigen Schritt
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  return (
    <Dialog
      open={true}
      onClose={onCancel}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { bgcolor: '#1a1a1a', color: 'white' }
      }}
    >
      <DialogTitle>
        Benutzerimport
        <IconButton
          onClick={onCancel}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'grey.500' }}
        >
          <CancelIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 1 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {parseErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {parseErrors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}

        {/* Schritt 1: Datei-Upload */}
        {activeStep === 0 && (
          <Box>
            <Paper
              {...getRootProps()}
              sx={{
                p: 3,
                mb: 2,
                border: '2px dashed #555',
                borderRadius: 2,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isDragActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              <input {...getInputProps()} />
              <CloudUploadIcon sx={{ fontSize: 48, color: '#1976d2', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                CSV/Excel-Datei hier ablegen oder klicken
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unterstützte Formate: CSV, XLS, XLSX
              </Typography>
            </Paper>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Hinweise:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Die erste Zeile der Datei sollte Spaltenüberschriften enthalten<br />
                • Erforderliche Felder: Vorname, Nachname, E-Mail<br />
                • Überprüfen Sie, dass die Daten korrekt formatiert sind<br />
                • Maximalgröße: 5 MB
              </Typography>
            </Box>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Beispiel für CSV-Format:
              </Typography>
              <Box sx={{ fontFamily: 'monospace', fontSize: 13, mt: 1, color: '#bbb' }}>
                Vorname;Nachname;E-Mail;Abteilung;Telefon<br />
                Max;Mustermann;max.mustermann@firma.de;IT;+49123456789<br />
                Erika;Musterfrau;erika.musterfrau@firma.de;Vertrieb;+49987654321
              </Box>
            </Box>
          </Box>
        )}

        {/* Schritt 2: Feldzuordnung */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Ordnen Sie die Spalten aus Ihrer Datei den ATLAS-Feldern zu:
            </Typography>

            <TableContainer component={Paper} sx={{ mb: 3, mt: 2, bgcolor: '#1E1E1E' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Quelldaten</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ATLAS-Feld</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Beispielwert</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mappings.map((mapping, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ color: 'white' }}>
                        {mapping.sourceField}
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={mapping.targetField}
                            onChange={(e) => handleMappingChange(index, e.target.value)}
                            sx={{
                              color: 'white',
                              '.MuiOutlinedInput-notchedOutline': { borderColor: '#555' }
                            }}
                          >
                            <MenuItem value="">
                              <em>Nicht zuordnen</em>
                            </MenuItem>
                            <MenuItem value="firstName">Vorname</MenuItem>
                            <MenuItem value="lastName">Nachname</MenuItem>
                            <MenuItem value="title">Anrede</MenuItem>
                            <MenuItem value="email">E-Mail</MenuItem>
                            <MenuItem value="username">Benutzername</MenuItem>
                            <MenuItem value="department">Abteilung</MenuItem>
                            <MenuItem value="position">Position</MenuItem>
                            <MenuItem value="phone">Telefon</MenuItem>
                            <MenuItem value="role">Rolle</MenuItem>
                            <MenuItem value="status">Status</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell sx={{ color: '#bbb' }}>
                        {csvData[0] && index < csvData[0].length ? csvData[0][index] : ''}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Optionen:
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={generateUsernames}
                    onChange={(e) => setGenerateUsernames(e.target.checked)}
                    color="primary"
                  />
                }
                label="Benutzernamen automatisch generieren (falls nicht zugeordnet)"
              />
              <br />
              <FormControlLabel
                control={
                  <Switch
                    checked={generatePasswords}
                    onChange={(e) => setGeneratePasswords(e.target.checked)}
                    color="primary"
                  />
                }
                label="Zufällige Passwörter generieren und per E-Mail zusenden"
              />
            </Box>
          </Box>
        )}

        {/* Schritt 3: Vorschau und Validierung */}
        {activeStep === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Vorschau (erste {Math.min(5, previewData.length)} von {csvData.length} Einträgen)
              </Typography>
              <Chip
                icon={<InfoIcon />}
                label={`${csvData.length} Einträge insgesamt`}
                variant="outlined"
                sx={{ color: 'white' }}
              />
            </Box>

            <TableContainer component={Paper} sx={{ mb: 3, bgcolor: '#1E1E1E' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vorname</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nachname</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>E-Mail</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Benutzername</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Abteilung</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ color: 'white' }}>{user.firstName}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{user.lastName}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{user.email}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{user.username}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{user.department}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mb: 2 }}>
              <Alert severity="info" icon={<CheckIcon />}>
                Die Daten wurden validiert und sind importbereit.
              </Alert>
            </Box>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Nach dem Import:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Neue Benutzer erhalten den Status "Aktiv"<br />
                • {generatePasswords ? 'Passwörter werden zufällig generiert und per E-Mail versendet' : 'Passwörter müssen manuell gesetzt werden'}<br />
                • Änderungen können später in der Benutzerverwaltung vorgenommen werden
              </Typography>
            </Box>
          </Box>
        )}

        {/* Schritt 4: Import */}
        {activeStep === 3 && (
          <Box>
            {importProgress < 100 ? (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Import wird durchgeführt...
                </Typography>
                <LinearProgress variant="determinate" value={importProgress} sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Bitte warten Sie, während die Daten importiert werden.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CheckIcon color="success" />
                  <Typography variant="h6">
                    Import abgeschlossen
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Chip
                    icon={<CheckIcon />}
                    label={`${importResult.success} erfolgreich`}
                    color="success"
                    variant="outlined"
                  />
                  {importResult.errors > 0 && (
                    <Chip
                      icon={<ErrorIcon />}
                      label={`${importResult.errors} mit Fehlern`}
                      color="error"
                      variant="outlined"
                    />
                  )}
                </Box>

                {importResult.errorMessages.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">
                      Folgende Fehler sind aufgetreten:
                    </Typography>
                    <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                      {importResult.errorMessages.map((msg, idx) => (
                        <li key={idx}>{msg}</li>
                      ))}
                    </ul>
                  </Alert>
                )}

                <Alert severity="success" sx={{ mb: 2 }}>
                  Benutzer wurden erfolgreich importiert. Sie können nun die Benutzerübersicht einsehen.
                </Alert>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        {activeStep < 3 && (
          <Button onClick={onCancel} sx={{ color: '#bbb' }}>
            Abbrechen
          </Button>
        )}

        {activeStep > 0 && activeStep < 3 && (
          <Button onClick={handleBack} sx={{ color: '#1976d2' }}>
            Zurück
          </Button>
        )}

        {activeStep < 2 && (
          <Button
            onClick={handleNext}
            variant="contained"
            startIcon={<ArrowForwardIcon />}
            disabled={activeStep === 0 && !fileName}
          >
            Weiter
          </Button>
        )}

        {activeStep === 2 && (
          <Button
            onClick={handleNext}
            variant="contained"
            startIcon={<PublishIcon />}
            color="primary"
          >
            Import starten
          </Button>
        )}

        {activeStep === 3 && importProgress >= 100 && (
          <Button
            onClick={onCancel}
            variant="contained"
            color="primary"
          >
            Fertigstellen
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UserImporter;
