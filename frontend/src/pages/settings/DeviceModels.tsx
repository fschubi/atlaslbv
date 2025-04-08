import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch as MuiSwitch,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Description as SpecIcon,
  CalendarToday as CalendarIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import AtlasTable, { AtlasColumn } from '../../components/AtlasTable';
import { DeviceModel, Manufacturer, Category } from '../../types/settings';

const DeviceModels: React.FC = () => {
  // State für die Daten
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentModel, setCurrentModel] = useState<DeviceModel | null>(null);
  const [readOnly, setReadOnly] = useState<boolean>(false);

  // State für das Kontextmenü
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    modelId: number;
  } | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [manufacturerId, setManufacturerId] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [specifications, setSpecifications] = useState<string>('');
  const [eol, setEol] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Validation State
  const [errors, setErrors] = useState<{
    name?: string;
    manufacturerId?: string;
    categoryId?: string;
    eol?: string;
  }>({});

  // UI State
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Mock-Daten für das Beispiel
  const mockManufacturers: Manufacturer[] = [
    {
      id: 1,
      name: 'Dell Technologies',
      description: 'US-amerikanischer Hersteller von PCs, Servern und Speichersystemen',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'HP Inc.',
      description: 'Hersteller von PCs, Druckern und anderen Peripheriegeräten',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Lenovo Group',
      description: 'Chinesischer Hersteller von PCs, Laptops und Mobilgeräten',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const mockCategories: Category[] = [
    {
      id: 1,
      name: 'Laptops',
      description: 'Tragbare Computer',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Desktop-PCs',
      description: 'Stationäre Computer',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Server',
      description: 'Serversysteme',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Monitore',
      description: 'Bildschirme',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const mockDeviceModels: DeviceModel[] = [
    {
      id: 1,
      name: 'Latitude 5420',
      description: 'Business-Laptop für professionelle Anwender',
      manufacturerId: 1,
      categoryId: 1,
      specifications: 'Intel Core i5, 16GB RAM, 512GB SSD, 14" FHD, Windows 11 Pro',
      eol: '2025-12-31',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'OptiPlex 7090',
      description: 'Desktop-PC für Unternehmen',
      manufacturerId: 1,
      categoryId: 2,
      specifications: 'Intel Core i7, 32GB RAM, 1TB SSD, NVIDIA GTX 1650, Windows 11 Pro',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      name: 'ThinkPad X1 Carbon',
      description: 'Premium Business-Laptop',
      manufacturerId: 3,
      categoryId: 1,
      specifications: 'Intel Core i7, 16GB RAM, 1TB SSD, 14" 4K, Windows 11 Pro',
      eol: '2026-06-30',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 4,
      name: 'EliteBook 840',
      description: 'Business-Laptop mit hoher Sicherheit',
      manufacturerId: 2,
      categoryId: 1,
      specifications: 'Intel Core i5, 8GB RAM, 256GB SSD, 14" FHD, Windows 11 Pro',
      eol: '2024-12-31',
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Spalten für die Tabelle
  const columns: AtlasColumn<DeviceModel>[] = [
    { dataKey: 'id', label: 'ID', width: 70, numeric: true },
    { dataKey: 'name', label: 'Modellname' },
    {
      dataKey: 'manufacturerId',
      label: 'Hersteller',
      render: (value) => {
        if (!value) return '-';
        const manufacturer = manufacturers.find(m => m.id === value);
        return manufacturer ? manufacturer.name : `ID: ${value}`;
      }
    },
    { dataKey: 'description', label: 'Beschreibung' },
    {
      dataKey: 'isActive',
      label: 'Status',
      width: 120,
      render: (value) => value ? 'Aktiv' : 'Inaktiv'
    },
    {
      dataKey: 'createdAt',
      label: 'Erstellt am',
      width: 180,
      render: (value) => new Date(value as string).toLocaleDateString('de-DE')
    },
    {
      dataKey: 'actions',
      label: 'Aktionen',
      width: 80,
      render: (_, row) => (
        <IconButton
          size="small"
          onClick={(event) => handleContextMenu(event, row.id)}
        >
          <MoreVertIcon />
        </IconButton>
      )
    }
  ];

  // Daten laden
  useEffect(() => {
    // Hier würde normalerweise ein API-Aufruf stehen
    // Für das Beispiel verwenden wir Mock-Daten
    setTimeout(() => {
      setManufacturers(mockManufacturers);
      setCategories(mockCategories);
      setDeviceModels(mockDeviceModels);
      setLoading(false);
    }, 1000);
  }, []);

  // Dialog öffnen für neuen Eintrag
  const handleAddNew = () => {
    setEditMode(false);
    setReadOnly(false);
    setCurrentModel(null);
    setName('');
    setDescription('');
    setManufacturerId('');
    setCategoryId('');
    setSpecifications('');
    setEol('');
    setIsActive(true);
    setErrors({});
    setDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEdit = (model: DeviceModel) => {
    setEditMode(true);
    setReadOnly(false);
    setCurrentModel(model);
    setName(model.name);
    setDescription(model.description);
    setManufacturerId(model.manufacturerId);
    setCategoryId(model.categoryId);
    setSpecifications(model.specifications || '');
    setEol(model.eol || '');
    setIsActive(model.isActive);
    setErrors({});
    setDialogOpen(true);
  };

  // Löschen eines Gerätemodells
  const handleDelete = (model: DeviceModel) => {
    // Hier würde normalerweise ein API-Aufruf stehen
    const updatedModels = deviceModels.filter(m => m.id !== model.id);
    setDeviceModels(updatedModels);
    setSnackbar({
      open: true,
      message: `Gerätemodell "${model.name}" wurde gelöscht.`,
      severity: 'success'
    });
  };

  // Dialog schließen
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Handlefunktionen für das Kontextmenü
  const handleContextMenu = (event: React.MouseEvent, modelId: number) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      modelId
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleContextMenuView = () => {
    if (contextMenu) {
      const model = deviceModels.find(m => m.id === contextMenu.modelId);
      if (model) {
        setEditMode(false);
        setReadOnly(true);
        setCurrentModel(model);
        setName(model.name);
        setDescription(model.description);
        setManufacturerId(model.manufacturerId);
        setCategoryId(model.categoryId);
        setSpecifications(model.specifications || '');
        setEol(model.eol || '');
        setIsActive(model.isActive);
        setErrors({});
        setDialogOpen(true);
      }
      handleContextMenuClose();
    }
  };

  const handleContextMenuEdit = () => {
    if (contextMenu) {
      const model = deviceModels.find(m => m.id === contextMenu.modelId);
      if (model) {
        handleEdit(model);
      }
      handleContextMenuClose();
    }
  };

  const handleContextMenuDelete = () => {
    if (contextMenu) {
      const model = deviceModels.find(m => m.id === contextMenu.modelId);
      if (model) {
        handleDelete(model);
      }
      handleContextMenuClose();
    }
  };

  // Validierung des Formulars
  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      manufacturerId?: string;
      categoryId?: string;
      eol?: string;
    } = {};

    // Name-Validierung
    if (!name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }

    // Hersteller-Validierung
    if (!manufacturerId) {
      newErrors.manufacturerId = 'Bitte wählen Sie einen Hersteller aus';
    }

    // Kategorie-Validierung
    if (!categoryId) {
      newErrors.categoryId = 'Bitte wählen Sie eine Kategorie aus';
    }

    // End of Life Validierung (wenn vorhanden)
    if (eol && !/^\d{4}-\d{2}-\d{2}$/.test(eol)) {
      newErrors.eol = 'Ungültiges Datumsformat (YYYY-MM-DD)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Speichern des Gerätemodells
  const handleSave = () => {
    // Validierung
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Bitte korrigieren Sie die markierten Felder.',
        severity: 'error'
      });
      return;
    }

    // Neues Gerätemodell erstellen oder bestehendes bearbeiten
    if (editMode && currentModel) {
      // Bearbeiten
      const updatedModel: DeviceModel = {
        ...currentModel,
        name,
        description,
        manufacturerId: manufacturerId as number,
        categoryId: categoryId as number,
        specifications: specifications || undefined,
        eol: eol || undefined,
        isActive,
        updatedAt: new Date().toISOString()
      };

      const updatedModels = deviceModels.map(m =>
        m.id === currentModel.id ? updatedModel : m
      );

      setDeviceModels(updatedModels);
      setSnackbar({
        open: true,
        message: `Gerätemodell "${name}" wurde aktualisiert.`,
        severity: 'success'
      });
    } else {
      // Neu erstellen
      const newModel: DeviceModel = {
        id: Math.max(0, ...deviceModels.map(m => m.id)) + 1,
        name,
        description,
        manufacturerId: manufacturerId as number,
        categoryId: categoryId as number,
        specifications: specifications || undefined,
        eol: eol || undefined,
        isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setDeviceModels([...deviceModels, newModel]);
      setSnackbar({
        open: true,
        message: `Gerätemodell "${name}" wurde erstellt.`,
        severity: 'success'
      });
    }

    setDialogOpen(false);
  };

  // Aktualisieren der Daten
  const handleRefresh = () => {
    setLoading(true);
    // Hier würde normalerweise ein API-Aufruf stehen
    setTimeout(() => {
      setManufacturers(mockManufacturers);
      setCategories(mockCategories);
      setDeviceModels(mockDeviceModels);
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Daten wurden aktualisiert.',
        severity: 'info'
      });
    }, 1000);
  };

  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 2, bgcolor: '#121212', minHeight: '100vh', width: '100%' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#1976d2',
          color: 'white',
          p: 1,
          pl: 2,
          width: '100%',
          borderRadius: '4px 4px 0 0',
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Gerätemodelle
        </Typography>
        <Box>
          <Tooltip title="Aktualisieren">
            <IconButton color="inherit" onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Neues Gerätemodell">
            <IconButton color="inherit" onClick={handleAddNew}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Tabelle */}
      <AtlasTable
        columns={columns}
        rows={deviceModels}
        loading={loading}
        heightPx={600}
        emptyMessage="Keine Gerätemodelle vorhanden"
      />

      {/* Kontextmenü */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleContextMenuView}>
          <ListItemIcon>
            <ViewIcon fontSize="small" sx={{ color: '#90CAF9' }} />
          </ListItemIcon>
          <ListItemText primary="Anzeigen" />
        </MenuItem>
        <MenuItem onClick={handleContextMenuEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" sx={{ color: '#4CAF50' }} />
          </ListItemIcon>
          <ListItemText primary="Bearbeiten" />
        </MenuItem>
        <MenuItem onClick={handleContextMenuDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: '#F44336' }} />
          </ListItemIcon>
          <ListItemText primary="Löschen" />
        </MenuItem>
      </Menu>

      {/* Dialog für Erstellen/Bearbeiten */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {readOnly ? `Gerätemodell anzeigen: ${currentModel?.name}` :
            (editMode ? `Gerätemodell bearbeiten: ${currentModel?.name}` : 'Neues Gerätemodell erstellen')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              error={!!errors.name}
              helperText={errors.name}
              InputProps={{
                readOnly: readOnly
              }}
            />
            <TextField
              label="Beschreibung"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              InputProps={{
                readOnly: readOnly
              }}
            />
            <FormControl fullWidth error={!!errors.manufacturerId} required>
              <InputLabel id="manufacturer-label">Hersteller</InputLabel>
              <Select
                labelId="manufacturer-label"
                value={manufacturerId}
                onChange={(e) => setManufacturerId(e.target.value as number)}
                label="Hersteller"
                inputProps={{
                  readOnly: readOnly
                }}
              >
                {manufacturers.filter(m => m.isActive).map((manufacturer) => (
                  <MenuItem key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.manufacturerId && <FormHelperText>{errors.manufacturerId}</FormHelperText>}
            </FormControl>
            <FormControl fullWidth error={!!errors.categoryId} required>
              <InputLabel id="category-label">Kategorie</InputLabel>
              <Select
                labelId="category-label"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value as number)}
                label="Kategorie"
                inputProps={{
                  readOnly: readOnly
                }}
              >
                {categories.filter(c => c.isActive).map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
            </FormControl>
            <TextField
              label="Spezifikationen"
              fullWidth
              multiline
              rows={3}
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              placeholder="z.B. CPU, RAM, Festplatte, Betriebssystem, etc."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SpecIcon />
                  </InputAdornment>
                ),
                readOnly: readOnly
              }}
            />
            <TextField
              label="End of Life (YYYY-MM-DD)"
              fullWidth
              value={eol}
              onChange={(e) => setEol(e.target.value)}
              placeholder="z.B. 2025-12-31"
              error={!!errors.eol}
              helperText={errors.eol}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarIcon />
                  </InputAdornment>
                ),
                readOnly: readOnly
              }}
            />
            <FormControlLabel
              control={
                <MuiSwitch
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  color="primary"
                  disabled={readOnly}
                />
              }
              label="Gerätemodell aktiv"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {readOnly ? 'Schließen' : 'Abbrechen'}
          </Button>
          {!readOnly && (
            <Button onClick={handleSave} variant="contained" color="primary">
              Speichern
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar für Benachrichtigungen */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

export default DeviceModels;
