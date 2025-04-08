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
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Public as WebsiteIcon,
  Person as ContactPersonIcon,
  Assignment as ContractIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import AtlasTable, { AtlasColumn } from '../../components/AtlasTable';
import { Supplier } from '../../types/settings';
import { settingsApi } from '../../utils/api';
import handleApiError from '../../utils/errorHandler';

const Suppliers: React.FC = () => {
  // State für die Daten
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
  const [readOnly, setReadOnly] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contractNumber, setContractNumber] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

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

  // State für das Kontextmenü
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    supplierId: number;
  } | null>(null);

  // Spalten für die Tabelle
  const columns: AtlasColumn<Supplier>[] = [
    { dataKey: 'id', label: 'ID', width: 70, numeric: true },
    { dataKey: 'name', label: 'Name' },
    { dataKey: 'description', label: 'Beschreibung' },
    {
      dataKey: 'website',
      label: 'Website',
      render: (value) => value ? (
        <a href={value as string} target="_blank" rel="noopener noreferrer" style={{ color: '#90caf9' }}>
          {value as string}
        </a>
      ) : '-'
    },
    { dataKey: 'contactPerson', label: 'Ansprechpartner' },
    { dataKey: 'contactEmail', label: 'E-Mail' },
    { dataKey: 'contactPhone', label: 'Telefon' },
    { dataKey: 'contractNumber', label: 'Vertragsnummer' },
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
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const response = await settingsApi.getAllSuppliers();
      setSuppliers(response.data as Supplier[]);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({
        open: true,
        message: `Fehler beim Laden der Lieferanten: ${errorMessage}`,
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
    setCurrentSupplier(null);
    setName('');
    setDescription('');
    setWebsite('');
    setContactPerson('');
    setContactEmail('');
    setContactPhone('');
    setContractNumber('');
    setIsActive(true);
    setDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEdit = (supplier: Supplier) => {
    setEditMode(true);
    setReadOnly(false);
    setCurrentSupplier(supplier);
    setName(supplier.name);
    setDescription(supplier.description);
    setWebsite(supplier.website || '');
    setContactPerson(supplier.contactPerson || '');
    setContactEmail(supplier.contactEmail || '');
    setContactPhone(supplier.contactPhone || '');
    setContractNumber(supplier.contractNumber || '');
    setIsActive(supplier.isActive);
    setDialogOpen(true);
  };

  // Löschen eines Lieferanten
  const handleDelete = async (supplier: Supplier) => {
    try {
      await settingsApi.deleteSupplier(supplier.id);
      // Nach erfolgreichem Löschen die Liste aktualisieren
      const updatedSuppliers = suppliers.filter(s => s.id !== supplier.id);
      setSuppliers(updatedSuppliers);
      setSnackbar({
        open: true,
        message: `Lieferant "${supplier.name}" wurde gelöscht.`,
        severity: 'success'
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({
        open: true,
        message: `Fehler beim Löschen des Lieferanten: ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  // Dialog schließen
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Speichern des Lieferanten
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

    // Validierung der E-Mail-Adresse
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setSnackbar({
        open: true,
        message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
        severity: 'error'
      });
      return;
    }

    // Validierung der Website-URL
    let finalWebsite = website;
    if (website && !website.startsWith('http://') && !website.startsWith('https://')) {
      finalWebsite = 'https://' + website;
    }

    const supplierData = {
      name,
      description,
      website: finalWebsite || undefined,
      contactPerson: contactPerson || undefined,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
      contractNumber: contractNumber || undefined,
      isActive
    };

    try {
      if (editMode && currentSupplier) {
        // Bestehenden Lieferanten aktualisieren
        const response = await settingsApi.updateSupplier(currentSupplier.id, supplierData);

        // Liste der Lieferanten aktualisieren
        const updatedSuppliers = suppliers.map(s =>
          s.id === currentSupplier.id ? response.data as Supplier : s
        );

        setSuppliers(updatedSuppliers);
        setSnackbar({
          open: true,
          message: `Lieferant "${name}" wurde aktualisiert.`,
          severity: 'success'
        });
      } else {
        // Neuen Lieferanten erstellen
        const response = await settingsApi.createSupplier(supplierData);

        // Neuen Lieferanten zur Liste hinzufügen
        setSuppliers([...suppliers, response.data as Supplier]);
        setSnackbar({
          open: true,
          message: `Lieferant "${name}" wurde erstellt.`,
          severity: 'success'
        });
      }

      // Dialog schließen
      setDialogOpen(false);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({
        open: true,
        message: `Fehler beim Speichern des Lieferanten: ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  // Aktualisieren der Daten
  const handleRefresh = () => {
    loadSuppliers();
  };

  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Handlefunktionen für das Kontextmenü
  const handleContextMenu = (event: React.MouseEvent, supplierId: number) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      supplierId
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleContextMenuView = () => {
    if (contextMenu) {
      const supplier = suppliers.find(s => s.id === contextMenu.supplierId);
      if (supplier) {
        setEditMode(false);
        setReadOnly(true);
        setCurrentSupplier(supplier);
        setName(supplier.name);
        setDescription(supplier.description);
        setWebsite(supplier.website || '');
        setContactPerson(supplier.contactPerson || '');
        setContactEmail(supplier.contactEmail || '');
        setContactPhone(supplier.contactPhone || '');
        setContractNumber(supplier.contractNumber || '');
        setIsActive(supplier.isActive);
        setDialogOpen(true);
      }
      handleContextMenuClose();
    }
  };

  const handleContextMenuEdit = () => {
    if (contextMenu) {
      const supplier = suppliers.find(s => s.id === contextMenu.supplierId);
      if (supplier) {
        handleEdit(supplier);
      }
      handleContextMenuClose();
    }
  };

  const handleContextMenuDelete = () => {
    if (contextMenu) {
      const supplier = suppliers.find(s => s.id === contextMenu.supplierId);
      if (supplier) {
        handleDelete(supplier);
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
          Lieferanten
        </Typography>
        <Box>
          <Tooltip title="Aktualisieren">
            <IconButton color="inherit" onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Neuer Lieferant">
            <IconButton color="inherit" onClick={handleAddNew}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Tabelle */}
      <AtlasTable
        columns={columns}
        rows={suppliers}
        loading={loading}
        heightPx={600}
        emptyMessage="Keine Lieferanten vorhanden"
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
          {readOnly ? `Lieferant anzeigen: ${currentSupplier?.name}` :
            (editMode ? `Lieferant bearbeiten: ${currentSupplier?.name}` : 'Neuen Lieferanten erstellen')}
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
            <TextField
              label="Website"
              fullWidth
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.beispiel.de"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <WebsiteIcon />
                  </InputAdornment>
                ),
                readOnly: readOnly
              }}
            />
            <TextField
              label="Ansprechpartner"
              fullWidth
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Vor- und Nachname"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ContactPersonIcon />
                  </InputAdornment>
                ),
                readOnly: readOnly
              }}
            />
            <TextField
              label="E-Mail"
              fullWidth
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="name@beispiel.de"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
                readOnly: readOnly
              }}
            />
            <TextField
              label="Telefon"
              fullWidth
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+49 123 456789"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon />
                  </InputAdornment>
                ),
                readOnly: readOnly
              }}
            />
            <TextField
              label="Vertragsnummer"
              fullWidth
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder="V-YYYY-XXX"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ContractIcon />
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
              label="Lieferant aktiv"
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

export default Suppliers;
