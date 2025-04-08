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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormHelperText,
  Grid,
  Snackbar,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import AtlasTable, { AtlasColumn } from '../components/AtlasTable';
import BarcodeScanner from '../components/BarcodeScanner';
import { ticketsApi } from '../utils/api';

// Typdefinition für Priorität
interface PriorityType {
  value: number;
  label: string;
  color: string;
}

// Prioritätsoptionen
const priorityOptions: PriorityType[] = [
  { value: 1, label: 'Niedrig', color: '#8bc34a' },
  { value: 2, label: 'Mittel', color: '#ff9800' },
  { value: 3, label: 'Hoch', color: '#f44336' },
  { value: 4, label: 'Kritisch', color: '#9c27b0' }
];

// Statusoptionen
const statusOptions = ['Offen', 'In Bearbeitung', 'Warten auf Antwort', 'Gelöst', 'Geschlossen'];

// Kategorieoptionen
const categoryOptions = ['Hardware', 'Software', 'Netzwerk', 'Zugriffsrechte', 'Allgemein'];

// Typdefinition für Ticket
interface TicketItem {
  id: string;
  title: string;
  description: string;
  category: string;
  device: string;
  priority: PriorityType | number;
  status: string;
  createdBy: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
}

const Tickets: React.FC = () => {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  // Dialog-Zustände
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentTicket, setCurrentTicket] = useState<Partial<TicketItem>>({
    title: '',
    description: '',
    category: 'Allgemein',
    device: '',
    priority: 2,
    status: 'Offen',
    assignedTo: ''
  });
  const [dialogErrors, setDialogErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Snackbar-Zustände
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Daten vom Backend laden
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const response = await ticketsApi.getAllTickets();

        // Priorität mappen (vom Backend kommt nur die Zahl)
        const formattedTickets = response.data.map((ticket: any) => ({
          ...ticket,
          // Priorität als Objekt formatieren, falls nur eine Zahl vom Backend kommt
          priority: typeof ticket.priority === 'number'
            ? priorityOptions.find(p => p.value === ticket.priority) || priorityOptions[1]
            : ticket.priority
        }));

        setTickets(formattedTickets);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Fehler beim Laden der Tickets');
        showSnackbar('Fehler beim Laden der Tickets', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

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

  // Dialog öffnen für neues Ticket
  const handleNewTicket = () => {
    setCurrentTicket({
      title: '',
      description: '',
      category: 'Allgemein',
      device: '',
      priority: 2,
      status: 'Offen',
      assignedTo: ''
    });
    setDialogErrors({});
    setDialogMode('create');
    setDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEditTicket = (ticket: TicketItem) => {
    // Bei Priorität sicherstellen, dass wir die Zahl übergeben
    setCurrentTicket({
      ...ticket,
      priority: typeof ticket.priority === 'object' ? ticket.priority.value : ticket.priority
    });
    setDialogErrors({});
    setDialogMode('edit');
    setDialogOpen(true);
  };

  // Ticket löschen
  const handleDeleteTicket = async (id: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Ticket löschen möchten?')) {
      try {
        await ticketsApi.deleteTicket(id);
        setTickets(tickets.filter(ticket => ticket.id !== id));
        showSnackbar('Ticket erfolgreich gelöscht', 'success');
      } catch (err: any) {
        showSnackbar(err.message || 'Fehler beim Löschen des Tickets', 'error');
      }
    }
  };

  // Ticket-Status ändern
  const handleUpdateTicketStatus = async (id: string, status: string) => {
    try {
      await ticketsApi.updateTicketStatus(id, status);

      // Status in der lokalen Liste aktualisieren
      setTickets(tickets.map(ticket =>
        ticket.id === id ? { ...ticket, status } : ticket
      ));

      showSnackbar('Ticket-Status erfolgreich aktualisiert', 'success');
    } catch (err: any) {
      showSnackbar(err.message || 'Fehler beim Aktualisieren des Ticket-Status', 'error');
    }
  };

  // Dialog schließen
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Input-Änderungen im Dialog verarbeiten
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentTicket({
      ...currentTicket,
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
  const handleSelectChange = (e: SelectChangeEvent<string | number>) => {
    const { name, value } = e.target;
    setCurrentTicket({
      ...currentTicket,
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

  // Dialog-Eingaben validieren
  const validateTicketData = () => {
    const errors: Record<string, string> = {};

    if (!currentTicket.title?.trim()) {
      errors.title = 'Titel ist erforderlich';
    }

    if (!currentTicket.category) {
      errors.category = 'Kategorie ist erforderlich';
    }

    if (!currentTicket.status) {
      errors.status = 'Status ist erforderlich';
    }

    setDialogErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Ticket speichern (erstellen oder aktualisieren)
  const handleSaveTicket = async () => {
    if (!validateTicketData()) return;

    try {
      setSubmitting(true);

      // Daten für API vorbereiten
      const ticketData = {
        ...currentTicket,
        // Priorität immer als Zahl übergeben
        priority: typeof currentTicket.priority === 'object'
          ? currentTicket.priority.value
          : currentTicket.priority
      };

      if (dialogMode === 'create') {
        // Neues Ticket erstellen
        const response = await ticketsApi.createTicket(ticketData);

        // Priorität formatieren für die UI
        const newTicket = {
          ...response.data,
          priority: priorityOptions.find(p => p.value === response.data.priority) || priorityOptions[1]
        };

        setTickets([...tickets, newTicket]);
        showSnackbar('Ticket erfolgreich erstellt', 'success');
      } else {
        // Bestehendes Ticket aktualisieren
        const response = await ticketsApi.updateTicket(ticketData.id!, ticketData);

        // Priorität formatieren für die UI
        const updatedTicket = {
          ...response.data,
          priority: priorityOptions.find(p => p.value === response.data.priority) || priorityOptions[1]
        };

        setTickets(tickets.map(ticket =>
          ticket.id === updatedTicket.id ? updatedTicket : ticket
        ));
        showSnackbar('Ticket erfolgreich aktualisiert', 'success');
      }

      setDialogOpen(false);
    } catch (err: any) {
      showSnackbar(err.message || 'Fehler beim Speichern des Tickets', 'error');
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
    { label: 'ID', dataKey: 'id', width: 110 },
    { label: 'Titel', dataKey: 'title', width: 300 },
    {
      label: 'Priorität',
      dataKey: 'priority',
      width: 100,
      render: (value: PriorityType) => (
        <Chip
          label={value.label}
          size="small"
          sx={{
            bgcolor: alpha(value.color, 0.2),
            color: value.color,
            borderColor: value.color,
            border: `1px solid ${value.color}`,
            height: 24
          }}
        />
      )
    },
    {
      label: 'Status',
      dataKey: 'status',
      width: 150,
      render: (value: string) => {
        let color = '#757575'; // Standardfarbe
        let bgColor = 'rgba(117, 117, 117, 0.2)';

        switch(value) {
          case 'Offen':
            color = '#2196f3';
            bgColor = 'rgba(33, 150, 243, 0.2)';
            break;
          case 'In Bearbeitung':
            color = '#ff9800';
            bgColor = 'rgba(255, 152, 0, 0.2)';
            break;
          case 'Warten auf Antwort':
            color = '#9c27b0';
            bgColor = 'rgba(156, 39, 176, 0.2)';
            break;
          case 'Gelöst':
            color = '#4caf50';
            bgColor = 'rgba(76, 175, 80, 0.2)';
            break;
          case 'Geschlossen':
            color = '#757575';
            bgColor = 'rgba(117, 117, 117, 0.2)';
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
    { label: 'Kategorie', dataKey: 'category', width: 150 },
    { label: 'Gerät', dataKey: 'device', width: 200 },
    { label: 'Erstellt von', dataKey: 'createdBy', width: 150 },
    { label: 'Zugewiesen an', dataKey: 'assignedTo', width: 150 },
    { label: 'Erstellt am', dataKey: 'createdAt', width: 120 },
    { label: 'Aktualisiert am', dataKey: 'updatedAt', width: 120 },
    {
      label: 'Aktionen',
      dataKey: 'actions',
      width: 150,
      render: (_, ticket: TicketItem) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => handleEditTicket(ticket)}
            sx={{ color: '#2196f3' }}
          >
            <EditIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={() => handleDeleteTicket(ticket.id)}
            sx={{ color: '#f44336' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  // Filter für die Ticket-Tabelle
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = searchText === '' ||
      Object.entries(ticket).some(([key, value]) => {
        if (key === 'priority' && typeof value === 'object') {
          return value.label.toString().toLowerCase().includes(searchText.toLowerCase());
        }
        return value.toString().toLowerCase().includes(searchText.toLowerCase());
      });

    const matchesStatus = statusFilter === '' || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Unique Statusoptionen aus den vorhandenen Tickets
  const uniqueStatuses = [...new Set(tickets.map(ticket => ticket.status))];

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
          Ticketübersicht
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
        {/* Suchfeld */}
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
        <FormControl size="small" sx={{ width: 180 }}>
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
            onClick={handleNewTicket}
            sx={{
              bgcolor: '#1976d2',
              color: 'white',
              '&:hover': {
                bgcolor: '#1565c0',
              }
            }}
          >
            Neues Ticket
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
        /* Ticket-Tabelle */
        <Box
          sx={{
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto'
          }}
        >
          <AtlasTable
            columns={columns}
            rows={filteredTickets}
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

      {/* Ticket-Dialog zum Erstellen/Bearbeiten */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Neues Ticket erstellen' : 'Ticket bearbeiten'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Titel"
                fullWidth
                value={currentTicket.title || ''}
                onChange={handleInputChange}
                error={!!dialogErrors.title}
                helperText={dialogErrors.title}
                disabled={submitting}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                name="description"
                label="Beschreibung"
                fullWidth
                multiline
                rows={3}
                value={currentTicket.description || ''}
                onChange={handleInputChange}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!dialogErrors.category}>
                <Typography variant="caption" sx={{ mb: 1 }}>Kategorie *</Typography>
                <Select
                  name="category"
                  value={currentTicket.category || ''}
                  onChange={handleSelectChange}
                  displayEmpty
                  disabled={submitting}
                >
                  {categoryOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {dialogErrors.category && (
                  <FormHelperText>{dialogErrors.category}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Typography variant="caption" sx={{ mb: 1 }}>Priorität *</Typography>
                <Select
                  name="priority"
                  value={
                    typeof currentTicket.priority === 'object'
                      ? currentTicket.priority.value
                      : currentTicket.priority || 2
                  }
                  onChange={handleSelectChange}
                  disabled={submitting}
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: option.color,
                            mr: 1
                          }}
                        />
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="device"
                label="Gerät (optional)"
                fullWidth
                value={currentTicket.device || ''}
                onChange={handleInputChange}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!dialogErrors.status}>
                <Typography variant="caption" sx={{ mb: 1 }}>Status *</Typography>
                <Select
                  name="status"
                  value={currentTicket.status || ''}
                  onChange={handleSelectChange}
                  displayEmpty
                  disabled={submitting}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {dialogErrors.status && (
                  <FormHelperText>{dialogErrors.status}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="assignedTo"
                label="Zugewiesen an (optional)"
                fullWidth
                value={currentTicket.assignedTo || ''}
                onChange={handleInputChange}
                disabled={submitting}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            disabled={submitting}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSaveTicket}
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

export default Tickets;
