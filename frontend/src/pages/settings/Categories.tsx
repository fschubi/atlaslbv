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
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import AtlasTable, { AtlasColumn } from '../../components/AtlasTable';
import { Category } from '../../types/settings';
import { settingsApi } from '../../utils/api';
import handleApiError from '../../utils/errorHandler';

const Categories: React.FC = () => {
  // State für die Daten
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [type, setType] = useState<'device' | 'license' | 'certificate' | 'accessory' | ''>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [readOnly, setReadOnly] = useState<boolean>(false);

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

  // Neuer State für das Kontextmenü
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    categoryId: number;
  } | null>(null);

  // Spalten für die Tabelle
  const columns: AtlasColumn<Category>[] = [
    { dataKey: 'id', label: 'ID', width: 70, numeric: true },
    { dataKey: 'name', label: 'Name' },
    { dataKey: 'description', label: 'Beschreibung' },
    {
      dataKey: 'type',
      label: 'Typ',
      width: 130,
      render: (value) => {
        switch(value) {
          case 'device': return 'Gerät';
          case 'license': return 'Lizenz';
          case 'certificate': return 'Zertifikat';
          case 'accessory': return 'Zubehör';
          default: return '-';
        }
      }
    },
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
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await settingsApi.getAllCategories();
      // Typanpassung für korrekte Typprüfung
      const typedCategories = response.data.map(cat => ({
        ...cat,
        type: cat.type as 'device' | 'license' | 'certificate' | 'accessory' | undefined
      }));
      setCategories(typedCategories);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({
        open: true,
        message: `Fehler beim Laden der Kategorien: ${errorMessage}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Dialog öffnen für neuen Eintrag
  const handleAddNew = () => {
    setEditMode(false);
    setReadOnly(false);
    setCurrentCategory(null);
    setName('');
    setDescription('');
    setType('');
    setIsActive(true);
    setDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEdit = (category: Category) => {
    setEditMode(true);
    setReadOnly(false);
    setCurrentCategory(category);
    setName(category.name);
    setDescription(category.description);
    setType(category.type || '');
    setIsActive(category.isActive);
    setDialogOpen(true);
  };

  // Löschen einer Kategorie
  const handleDelete = async (category: Category) => {
    try {
      await settingsApi.deleteCategory(category.id);
      // Nach erfolgreichem Löschen die Liste aktualisieren
      const updatedCategories = categories.filter(c => c.id !== category.id);
      setCategories(updatedCategories);
      setSnackbar({
        open: true,
        message: `Kategorie "${category.name}" wurde gelöscht.`,
        severity: 'success'
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({
        open: true,
        message: `Fehler beim Löschen der Kategorie: ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  // Dialog schließen
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Handle für Typ-Änderung
  const handleTypeChange = (event: SelectChangeEvent<string>) => {
    setType(event.target.value as 'device' | 'license' | 'certificate' | 'accessory' | '');
  };

  // Speichern der Kategorie
  const handleSave = async () => {
    // Validierung
    if (!name.trim()) {
      setSnackbar({
        open: true,
        message: 'Bitte geben Sie einen Namen ein.',
        severity: 'error'
      });
      return;
    }

    const categoryData = {
      name,
      description,
      type: type || 'device',
      isActive
    };

    try {
      if (editMode && currentCategory) {
        // Bestehende Kategorie aktualisieren
        const response = await settingsApi.updateCategory(currentCategory.id, categoryData);

        // Liste der Kategorien aktualisieren
        const updatedCategories = categories.map(c =>
          c.id === currentCategory.id ? response.data : c
        );

        setCategories(updatedCategories);
        setSnackbar({
          open: true,
          message: `Kategorie "${name}" wurde aktualisiert.`,
          severity: 'success'
        });
      } else {
        // Neue Kategorie erstellen
        const response = await settingsApi.createCategory(categoryData);

        // Neue Kategorie zur Liste hinzufügen
        setCategories([...categories, response.data]);
        setSnackbar({
          open: true,
          message: `Kategorie "${name}" wurde erstellt.`,
          severity: 'success'
        });
      }

      // Dialog schließen
      setDialogOpen(false);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({
        open: true,
        message: `Fehler beim Speichern der Kategorie: ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  // Aktualisieren der Daten
  const handleRefresh = () => {
    loadCategories();
  };

  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Handlefunktionen für das Kontextmenü
  const handleContextMenu = (event: React.MouseEvent, categoryId: number) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      categoryId
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleContextMenuView = () => {
    if (contextMenu) {
      const category = categories.find(c => c.id === contextMenu.categoryId);
      if (category) {
        setEditMode(false);
        setReadOnly(true);
        setCurrentCategory(category);
        setName(category.name);
        setDescription(category.description);
        setType(category.type || '');
        setIsActive(category.isActive);
        setDialogOpen(true);
      }
      handleContextMenuClose();
    }
  };

  const handleContextMenuEdit = () => {
    if (contextMenu) {
      const category = categories.find(c => c.id === contextMenu.categoryId);
      if (category) {
        handleEdit(category);
      }
      handleContextMenuClose();
    }
  };

  const handleContextMenuDelete = () => {
    if (contextMenu) {
      const category = categories.find(c => c.id === contextMenu.categoryId);
      if (category) {
        handleDelete(category);
      }
      handleContextMenuClose();
    }
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
          Kategorien
        </Typography>
        <Box>
          <Tooltip title="Aktualisieren">
            <IconButton color="inherit" onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Neue Kategorie">
            <IconButton color="inherit" onClick={handleAddNew}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Tabelle */}
      <AtlasTable
        columns={columns}
        rows={categories}
        loading={loading}
        heightPx={600}
        emptyMessage="Keine Kategorien vorhanden"
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
          {readOnly ? `Kategorie anzeigen: ${currentCategory?.name}` :
            (editMode ? `Kategorie bearbeiten: ${currentCategory?.name}` : 'Neue Kategorie erstellen')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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

            <FormControl fullWidth>
              <InputLabel>Kategorie-Typ</InputLabel>
              <Select
                value={type}
                onChange={handleTypeChange}
                label="Kategorie-Typ"
                inputProps={{
                  readOnly: readOnly
                }}
                startAdornment={
                  <CategoryIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
                }
              >
                <MenuItem value="device">Gerät</MenuItem>
                <MenuItem value="license">Lizenz</MenuItem>
                <MenuItem value="certificate">Zertifikat</MenuItem>
                <MenuItem value="accessory">Zubehör</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <MuiSwitch
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  color="primary"
                  disabled={readOnly}
                />
              }
              label="Kategorie aktiv"
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

export default Categories;
