import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  ListItemSecondaryAction,
  ListItemIcon,
  Checkbox
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Computer as DeviceIcon,
  VpnKey as LicenseIcon,
  Inventory as InventoryIcon,
  ConfirmationNumber as TicketIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Add as AddIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import MainLayout from '../layout/MainLayout';
import AtlasTable, { AtlasColumn } from '../components/AtlasTable';
import { SelectChangeEvent } from '@mui/material';

// Interface für Benutzer
interface User {
  id: string;
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
  lastLogin?: string;
  notes?: string;
}

// Interface für zugewiesenes Gerät
interface AssignedDevice {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  assignedDate: string;
}

// Interface für zugewiesene Lizenz
interface AssignedLicense {
  id: string;
  name: string;
  type: string;
  expiryDate: string;
  assignedDate: string;
}

// Interface für Benutzeraktivität
interface UserActivity {
  id: string;
  action: string;
  timestamp: string;
  details: string;
}

// Interface für Benutzergruppe
interface UserGroup {
  id: string;
  name: string;
  description: string;
  type: string;
  memberCount: number;
}

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewUser = id === 'new';

  // Status-Verwaltung
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(isNewUser);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Benutzer-Objekt (Demo-Daten)
  const [user, setUser] = useState<User>({
    id: isNewUser ? '' : id || '',
    firstName: '',
    lastName: '',
    title: 'Herr',
    email: '',
    username: '',
    department: '',
    position: '',
    phone: '',
    role: 'Benutzer',
    status: 'Aktiv',
    createdAt: new Date().toLocaleDateString('de-DE'),
    lastLogin: isNewUser ? undefined : new Date().toLocaleDateString('de-DE'),
    notes: ''
  });

  // Passwort-Feld bei neuem Benutzer
  const [password, setPassword] = useState<string>('');

  // Demo-Daten für zugewiesene Geräte
  const [assignedDevices, setAssignedDevices] = useState<AssignedDevice[]>([]);
  const [assignedLicenses, setAssignedLicenses] = useState<AssignedLicense[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);

  // Demo-Daten für Benutzergruppen
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [availableGroups, setAvailableGroups] = useState<UserGroup[]>([]);
  const [groupDialogOpen, setGroupDialogOpen] = useState<boolean>(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  // Laden der Demo-Daten
  useEffect(() => {
    if (!isNewUser) {
      // Simuliere API-Abruf
      setTimeout(() => {
        // Demo-Benutzer
        setUser({
          id: id || 'USER-1000',
          firstName: 'Max',
          lastName: 'Mustermann',
          title: 'Herr',
          email: 'max.mustermann@lbv.de',
          username: 'mmustermann',
          department: 'IT',
          position: 'Systemadministrator',
          phone: '+49 123 4567890',
          role: 'Administrator',
          status: 'Aktiv',
          createdAt: '01.01.2020',
          lastLogin: '15.04.2023',
          notes: 'Primärer Administrator für die Windows-Systeme'
        });

        // Demo-Geräte
        setAssignedDevices([
          {
            id: 'DEVICE-1001',
            name: 'HP EliteBook 840 G8',
            type: 'Laptop',
            serialNumber: 'SN12345678',
            assignedDate: '01.03.2022'
          },
          {
            id: 'DEVICE-1050',
            name: 'iPhone 13 Pro',
            type: 'Smartphone',
            serialNumber: 'IMEI98765432',
            assignedDate: '15.05.2022'
          }
        ]);

        // Demo-Lizenzen
        setAssignedLicenses([
          {
            id: 'LIC-2001',
            name: 'Microsoft 365 E3',
            type: 'Software',
            expiryDate: '31.12.2023',
            assignedDate: '01.01.2023'
          },
          {
            id: 'LIC-2030',
            name: 'Adobe Creative Cloud',
            type: 'Software',
            expiryDate: '30.06.2023',
            assignedDate: '01.07.2022'
          }
        ]);

        // Demo-Aktivitäten
        setUserActivities([
          {
            id: 'ACT-1',
            action: 'Login',
            timestamp: '15.04.2023 08:30',
            details: 'Erfolgreicher Login über VPN'
          },
          {
            id: 'ACT-2',
            action: 'Gerätezuweisung',
            timestamp: '01.03.2022 10:15',
            details: 'HP EliteBook 840 G8 zugewiesen'
          },
          {
            id: 'ACT-3',
            action: 'Lizenzaktivierung',
            timestamp: '01.01.2023 09:00',
            details: 'Microsoft 365 E3 Lizenz aktiviert'
          }
        ]);

        // Demo-Benutzergruppen
        setUserGroups([
          {
            id: 'GROUP-1',
            name: 'IT-Administratoren',
            description: 'Vollzugriff auf alle IT-Systeme',
            type: 'Technisch',
            memberCount: 5
          },
          {
            id: 'GROUP-2',
            name: 'Support-Team',
            description: 'Zugriff auf Ticketing-System und Benutzerkonten',
            type: 'Funktional',
            memberCount: 12
          }
        ]);

        // Verfügbare Gruppen für Zuweisung
        setAvailableGroups([
          {
            id: 'GROUP-3',
            name: 'Lizenzmanager',
            description: 'Verwalten von Softwarelizenzen',
            type: 'Funktional',
            memberCount: 3
          },
          {
            id: 'GROUP-4',
            name: 'Inventarverantwortliche',
            description: 'Zugriff auf Inventarisierungsfunktionen',
            type: 'Funktional',
            memberCount: 7
          },
          {
            id: 'GROUP-5',
            name: 'Hauptstandort München',
            description: 'Alle Mitarbeiter am Standort München',
            type: 'Organisatorisch',
            memberCount: 45
          }
        ]);

        setLoading(false);
      }, 800);
    } else {
      setLoading(false);
    }
  }, [id, isNewUser]);

  // Tab-Wechsel
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Formular-Änderungen
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    setUser(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  // Speichern
  const handleSave = () => {
    setSaving(true);
    // Simuliere API-Speicherung
    setTimeout(() => {
      setSaving(false);
      setIsEditing(false);

      // Bei neuem Benutzer Redirect zur Übersichtsseite
      if (isNewUser) {
        navigate('/users');
      }
    }, 1000);
  };

  // Löschen
  const handleDelete = () => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?')) {
      setLoading(true);
      // Simuliere API-Löschung
      setTimeout(() => {
        navigate('/users');
      }, 800);
    }
  };

  // Bearbeitungsmodus umschalten
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // Zurück-Navigation
  const handleBack = () => {
    navigate('/users');
  };

  // Passwort-Sichtbarkeit umschalten
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Gerätespalten für die Tabelle
  const deviceColumns: AtlasColumn<AssignedDevice>[] = [
    { dataKey: 'name', label: 'Gerätename', width: 200, sortable: true },
    { dataKey: 'type', label: 'Typ', width: 150 },
    { dataKey: 'serialNumber', label: 'Seriennummer', width: 150 },
    { dataKey: 'assignedDate', label: 'Zugewiesen am', width: 120, sortable: true }
  ];

  // Lizenzspalten für die Tabelle
  const licenseColumns: AtlasColumn<AssignedLicense>[] = [
    { dataKey: 'name', label: 'Lizenzname', width: 200, sortable: true },
    { dataKey: 'type', label: 'Typ', width: 150 },
    { dataKey: 'expiryDate', label: 'Ablaufdatum', width: 120, sortable: true },
    { dataKey: 'assignedDate', label: 'Zugewiesen am', width: 120, sortable: true }
  ];

  // Benutzergruppe hinzufügen
  const handleAddUserToGroup = (groupId: string) => {
    // Finde die Gruppe in den verfügbaren Gruppen
    const groupToAdd = availableGroups.find(group => group.id === groupId);

    if (groupToAdd) {
      // Entferne aus verfügbaren Gruppen
      setAvailableGroups(prev => prev.filter(group => group.id !== groupId));

      // Füge zu Benutzergruppen hinzu
      setUserGroups(prev => [...prev, groupToAdd]);
    }
  };

  // Benutzergruppe entfernen
  const handleRemoveUserFromGroup = (groupId: string) => {
    // Finde die Gruppe in den Benutzergruppen
    const groupToRemove = userGroups.find(group => group.id === groupId);

    if (groupToRemove) {
      // Entferne aus Benutzergruppen
      setUserGroups(prev => prev.filter(group => group.id !== groupId));

      // Füge zu verfügbaren Gruppen hinzu
      setAvailableGroups(prev => [...prev, groupToRemove]);
    }
  };

  // Auswahl von Gruppen verwalten
  const handleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  // Hinzufügen mehrerer Gruppen
  const handleAddSelectedGroups = () => {
    // Füge ausgewählte Gruppen zum Benutzer hinzu
    selectedGroups.forEach(groupId => {
      handleAddUserToGroup(groupId);
    });

    // Schließe Dialog und leere Auswahl
    setGroupDialogOpen(false);
    setSelectedGroups([]);
  };

  return (
    <MainLayout>
      <Box sx={{ p: 3, bgcolor: '#121212', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={handleBack}
              sx={{ mr: 2, color: 'white' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" sx={{ fontWeight: 500, color: 'white' }}>
              {isNewUser ? 'Neuer Benutzer' : `Benutzer: ${user.firstName} ${user.lastName}`}
            </Typography>
          </Box>
          <Box>
            {!isNewUser && !isEditing && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<EditIcon />}
                onClick={toggleEditMode}
                sx={{ mr: 2 }}
              >
                Bearbeiten
              </Button>
            )}
            {isEditing && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{ mr: 2 }}
              >
                {saving ? 'Speichern...' : 'Speichern'}
              </Button>
            )}
            {!isNewUser && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
              >
                Löschen
              </Button>
            )}
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Tabs */}
            <Paper sx={{ bgcolor: '#1E1E1E', color: 'white', mb: 3 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab label="Übersicht" />
                <Tab label="Geräte" disabled={isNewUser} />
                <Tab label="Lizenzen" disabled={isNewUser} />
                <Tab label="Gruppen" disabled={isNewUser} />
                <Tab label="Aktivitäten" disabled={isNewUser} />
              </Tabs>
            </Paper>

            {/* Tab-Inhalte */}
            <Box sx={{ display: tabValue === 0 ? 'block' : 'none' }}>
              {/* Benutzerdetails */}
              <Paper sx={{ bgcolor: '#1E1E1E', color: 'white', p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#90caf9' }}>
                  Persönliche Informationen
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth sx={{ mb: 2 }} disabled={!isEditing}>
                      <InputLabel id="title-label" sx={{ color: '#aaa' }}>Anrede</InputLabel>
                      <Select
                        labelId="title-label"
                        name="title"
                        value={user.title}
                        onChange={handleInputChange}
                        label="Anrede"
                        sx={{ color: 'white' }}
                      >
                        <MenuItem value="Herr">Herr</MenuItem>
                        <MenuItem value="Frau">Frau</MenuItem>
                        <MenuItem value="Divers">Divers</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Vorname"
                      name="firstName"
                      value={user.firstName}
                      onChange={handleInputChange}
                      fullWidth
                      disabled={!isEditing}
                      required
                      InputLabelProps={{ sx: { color: '#aaa' } }}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: '#444' },
                          '&:hover fieldset': { borderColor: '#666' },
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Nachname"
                      name="lastName"
                      value={user.lastName}
                      onChange={handleInputChange}
                      fullWidth
                      disabled={!isEditing}
                      required
                      InputLabelProps={{ sx: { color: '#aaa' } }}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: '#444' },
                          '&:hover fieldset': { borderColor: '#666' },
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="E-Mail"
                      name="email"
                      value={user.email}
                      onChange={handleInputChange}
                      fullWidth
                      disabled={!isEditing}
                      required
                      InputLabelProps={{ sx: { color: '#aaa' } }}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: '#444' },
                          '&:hover fieldset': { borderColor: '#666' },
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Telefon"
                      name="phone"
                      value={user.phone}
                      onChange={handleInputChange}
                      fullWidth
                      disabled={!isEditing}
                      InputLabelProps={{ sx: { color: '#aaa' } }}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: '#444' },
                          '&:hover fieldset': { borderColor: '#666' },
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ bgcolor: '#333', my: 2 }} />
                    <Typography variant="h6" sx={{ mb: 2, color: '#90caf9' }}>
                      Organisatorische Informationen
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ mb: 2 }} disabled={!isEditing}>
                      <InputLabel id="department-label" sx={{ color: '#aaa' }}>Abteilung</InputLabel>
                      <Select
                        labelId="department-label"
                        name="department"
                        value={user.department}
                        onChange={handleInputChange}
                        label="Abteilung"
                        sx={{ color: 'white' }}
                      >
                        <MenuItem value="IT">IT</MenuItem>
                        <MenuItem value="Vertrieb">Vertrieb</MenuItem>
                        <MenuItem value="Marketing">Marketing</MenuItem>
                        <MenuItem value="Buchhaltung">Buchhaltung</MenuItem>
                        <MenuItem value="Entwicklung">Entwicklung</MenuItem>
                        <MenuItem value="Management">Management</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Position"
                      name="position"
                      value={user.position}
                      onChange={handleInputChange}
                      fullWidth
                      disabled={!isEditing}
                      InputLabelProps={{ sx: { color: '#aaa' } }}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: '#444' },
                          '&:hover fieldset': { borderColor: '#666' },
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ bgcolor: '#333', my: 2 }} />
                    <Typography variant="h6" sx={{ mb: 2, color: '#90caf9' }}>
                      Systemzugang
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Benutzername"
                      name="username"
                      value={user.username}
                      onChange={handleInputChange}
                      fullWidth
                      disabled={!isEditing}
                      required
                      InputLabelProps={{ sx: { color: '#aaa' } }}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: '#444' },
                          '&:hover fieldset': { borderColor: '#666' },
                        }
                      }}
                    />
                  </Grid>

                  {(isNewUser || isEditing) && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Passwort"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        required={isNewUser}
                        InputLabelProps={{ sx: { color: '#aaa' } }}
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={togglePasswordVisibility}
                              edge="end"
                              sx={{ color: '#aaa' }}
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          ),
                        }}
                        sx={{
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': { borderColor: '#444' },
                            '&:hover fieldset': { borderColor: '#666' },
                          }
                        }}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ mb: 2 }} disabled={!isEditing}>
                      <InputLabel id="role-label" sx={{ color: '#aaa' }}>Rolle</InputLabel>
                      <Select
                        labelId="role-label"
                        name="role"
                        value={user.role}
                        onChange={handleInputChange}
                        label="Rolle"
                        sx={{ color: 'white' }}
                      >
                        <MenuItem value="Administrator">Administrator</MenuItem>
                        <MenuItem value="Benutzer">Benutzer</MenuItem>
                        <MenuItem value="Manager">Manager</MenuItem>
                        <MenuItem value="Techniker">Techniker</MenuItem>
                        <MenuItem value="Gast">Gast</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ mb: 2 }} disabled={!isEditing}>
                      <InputLabel id="status-label" sx={{ color: '#aaa' }}>Status</InputLabel>
                      <Select
                        labelId="status-label"
                        name="status"
                        value={user.status}
                        onChange={handleInputChange}
                        label="Status"
                        sx={{ color: 'white' }}
                      >
                        <MenuItem value="Aktiv">Aktiv</MenuItem>
                        <MenuItem value="Inaktiv">Inaktiv</MenuItem>
                        <MenuItem value="Gesperrt">Gesperrt</MenuItem>
                        <MenuItem value="Urlaub">Urlaub</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Notizen"
                      name="notes"
                      value={user.notes || ''}
                      onChange={handleInputChange}
                      fullWidth
                      multiline
                      rows={4}
                      disabled={!isEditing}
                      InputLabelProps={{ sx: { color: '#aaa' } }}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: '#444' },
                          '&:hover fieldset': { borderColor: '#666' },
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Übersichtskarten - nur für bestehende Benutzer */}
              {!isNewUser && (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#1E1E1E', color: 'white' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <DeviceIcon sx={{ mr: 1, color: '#90caf9' }} />
                          <Typography variant="body1">Zugewiesene Geräte</Typography>
                        </Box>
                        <Typography variant="h4" sx={{ color: '#90caf9' }}>
                          {assignedDevices.length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#1E1E1E', color: 'white' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LicenseIcon sx={{ mr: 1, color: '#ffb74d' }} />
                          <Typography variant="body1">Zugewiesene Lizenzen</Typography>
                        </Box>
                        <Typography variant="h4" sx={{ color: '#ffb74d' }}>
                          {assignedLicenses.length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#1E1E1E', color: 'white' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <InventoryIcon sx={{ mr: 1, color: '#81c784' }} />
                          <Typography variant="body1">Inventureinträge</Typography>
                        </Box>
                        <Typography variant="h4" sx={{ color: '#81c784' }}>
                          {5} {/* Demo-Wert */}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#1E1E1E', color: 'white' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <TicketIcon sx={{ mr: 1, color: '#e57373' }} />
                          <Typography variant="body1">Offene Tickets</Typography>
                        </Box>
                        <Typography variant="h4" sx={{ color: '#e57373' }}>
                          {2} {/* Demo-Wert */}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Box>

            {/* Geräte-Tab */}
            <Box sx={{ display: tabValue === 1 ? 'block' : 'none' }}>
              <Paper sx={{ bgcolor: '#1E1E1E', color: 'white', p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#90caf9' }}>
                    Zugewiesene Geräte
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<AddIcon />}
                  >
                    Gerät zuweisen
                  </Button>
                </Box>

                <AtlasTable
                  columns={deviceColumns}
                  rows={assignedDevices}
                  heightPx={300}
                  densePadding={true}
                />
              </Paper>
            </Box>

            {/* Lizenzen-Tab */}
            <Box sx={{ display: tabValue === 2 ? 'block' : 'none' }}>
              <Paper sx={{ bgcolor: '#1E1E1E', color: 'white', p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#90caf9' }}>
                    Zugewiesene Lizenzen
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<AddIcon />}
                  >
                    Lizenz zuweisen
                  </Button>
                </Box>

                <AtlasTable
                  columns={licenseColumns}
                  rows={assignedLicenses}
                  heightPx={300}
                  densePadding={true}
                />
              </Paper>
            </Box>

            {/* Gruppen Tab */}
            {tabValue === 3 && (
              <Box>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Benutzergruppen</Typography>
                  <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setGroupDialogOpen(true)}
                    disabled={!isEditing || availableGroups.length === 0}
                  >
                    Zu Gruppe hinzufügen
                  </Button>
                </Box>

                {userGroups.length === 0 ? (
                  <Alert severity="info">
                    Dieser Benutzer ist keiner Gruppe zugeordnet
                  </Alert>
                ) : (
                  <Grid container spacing={2}>
                    {userGroups.map((group) => (
                      <Grid item xs={12} md={6} key={group.id}>
                        <Card variant="outlined" sx={{ bgcolor: '#1E1E1E' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box>
                                <Typography variant="h6">{group.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {group.description}
                                </Typography>
                              </Box>
                              {isEditing && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveUserFromGroup(group.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </Box>
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Chip
                                label={group.type}
                                size="small"
                                sx={{
                                  bgcolor: group.type === 'Technisch' ? 'rgba(25, 118, 210, 0.1)' :
                                          group.type === 'Funktional' ? 'rgba(46, 125, 50, 0.1)' :
                                          'rgba(245, 124, 0, 0.1)',
                                  color: group.type === 'Technisch' ? '#42a5f5' :
                                         group.type === 'Funktional' ? '#66bb6a' :
                                         '#ff9800',
                                  border: '1px solid',
                                  borderColor: 'inherit'
                                }}
                              />
                              <Typography variant="body2">
                                {group.memberCount} Mitglieder
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {/* Gruppendialog */}
                {groupDialogOpen && (
                  <Paper sx={{ mt: 2, p: 2, bgcolor: '#1E1E1E' }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Benutzer zu Gruppen hinzufügen
                    </Typography>

                    {availableGroups.length === 0 ? (
                      <Alert severity="info">
                        Alle verfügbaren Gruppen wurden bereits zugewiesen
                      </Alert>
                    ) : (
                      <>
                        <List>
                          {availableGroups.map((group) => (
                            <ListItem key={group.id} dense>
                              <ListItemIcon>
                                <Checkbox
                                  edge="start"
                                  checked={selectedGroups.includes(group.id)}
                                  onChange={() => handleGroupSelection(group.id)}
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={group.name}
                                secondary={group.description}
                              />
                              <ListItemSecondaryAction>
                                <Chip
                                  label={group.type}
                                  size="small"
                                  sx={{
                                    bgcolor: group.type === 'Technisch' ? 'rgba(25, 118, 210, 0.1)' :
                                            group.type === 'Funktional' ? 'rgba(46, 125, 50, 0.1)' :
                                            'rgba(245, 124, 0, 0.1)',
                                    color: group.type === 'Technisch' ? '#42a5f5' :
                                           group.type === 'Funktional' ? '#66bb6a' :
                                           '#ff9800',
                                    border: '1px solid',
                                    borderColor: 'inherit'
                                  }}
                                />
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>

                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setGroupDialogOpen(false);
                              setSelectedGroups([]);
                            }}
                          >
                            Abbrechen
                          </Button>
                          <Button
                            variant="contained"
                            onClick={handleAddSelectedGroups}
                            disabled={selectedGroups.length === 0}
                          >
                            Hinzufügen
                          </Button>
                        </Box>
                      </>
                    )}
                  </Paper>
                )}
              </Box>
            )}

            {/* Aktivitäten-Tab */}
            <Box sx={{ display: tabValue === 4 ? 'block' : 'none' }}>
              <Paper sx={{ bgcolor: '#1E1E1E', color: 'white', p: 3 }}>
                <Typography variant="h6" sx={{ color: '#90caf9', mb: 2 }}>
                  Benutzeraktivitäten
                </Typography>

                <List>
                  {userActivities.map((activity) => (
                    <ListItem
                      key={activity.id}
                      divider
                      sx={{ borderBottom: '1px solid #333' }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {activity.action}
                            </Typography>
                            <Chip
                              label={activity.timestamp}
                              size="small"
                              sx={{ ml: 2, bgcolor: 'rgba(25, 118, 210, 0.2)', color: '#64b5f6' }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: '#aaa', mt: 1 }}>
                            {activity.details}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          </>
        )}
      </Box>
    </MainLayout>
  );
};

export default UserDetail;
