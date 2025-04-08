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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormHelperText,
  CircularProgress,
  Snackbar,
  Alert,
  SelectChangeEvent,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Flag as FlagIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  ViewList as ViewListIcon
} from '@mui/icons-material';
import ViewKanbanIcon from '../components/ViewKanbanIcon';
import AtlasTable, { AtlasColumn } from '../components/AtlasTable';
import KanbanBoard, { TodoItem, PriorityType, DragResult } from '../components/KanbanBoard';
import { todosApi } from '../utils/api';

// Prioritätsoptionen
const priorityOptions: PriorityType[] = [
  { value: 1, label: 'Niedrig', color: '#8bc34a' },
  { value: 2, label: 'Mittel', color: '#ff9800' },
  { value: 3, label: 'Hoch', color: '#f44336' }
];

// Statusoptionen
const statusOptions = ['Offen', 'In Bearbeitung', 'Erledigt', 'Abgebrochen'];

// Kategorieoptionen
const categoryOptions = ['Gerät', 'Benutzer', 'Netzwerk', 'Software', 'Infrastruktur', 'Sonstiges'];

const Todos: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Dialog-Zustände
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentTodo, setCurrentTodo] = useState<Partial<TodoItem>>({
    title: '',
    description: '',
    category: 'Sonstiges',
    priority: 1,
    assignedTo: '',
    status: 'Offen',
    dueDate: ''
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
    const fetchTodos = async () => {
      try {
        setLoading(true);
        const response = await todosApi.getAllTodos();

        // Priorität mappen (vom Backend kommt nur die Zahl)
        const formattedTodos = response.data.map((todo: any) => ({
          ...todo,
          // Priorität als Objekt formatieren, falls nur eine Zahl vom Backend kommt
          priority: typeof todo.priority === 'number'
            ? priorityOptions.find(p => p.value === todo.priority) || priorityOptions[0]
            : todo.priority
        }));

        setTodos(formattedTodos);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Fehler beim Laden der Todos');
        showSnackbar('Fehler beim Laden der Todos', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, []);

  // Dialog öffnen für neue Todo
  const handleNewTodo = () => {
    setCurrentTodo({
      title: '',
      description: '',
      category: 'Sonstiges',
      priority: 1,
      assignedTo: '',
      status: 'Offen',
      dueDate: ''
    });
    setDialogErrors({});
    setDialogMode('create');
    setDialogOpen(true);
  };

  // Dialog öffnen für Bearbeitung
  const handleEditTodo = (todo: TodoItem) => {
    // Bei Priorität sicherstellen, dass wir die Zahl übergeben
    setCurrentTodo({
      ...todo,
      priority: typeof todo.priority === 'object' ? todo.priority.value : todo.priority
    });
    setDialogErrors({});
    setDialogMode('edit');
    setDialogOpen(true);
  };

  // Todo löschen
  const handleDeleteTodo = async (id: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Aufgabe löschen möchten?')) {
      try {
        await todosApi.deleteTodo(id);
        setTodos(todos.filter(todo => todo.id !== id));
        showSnackbar('Aufgabe erfolgreich gelöscht', 'success');
      } catch (err: any) {
        showSnackbar(err.message || 'Fehler beim Löschen der Aufgabe', 'error');
      }
    }
  };

  // Todo als erledigt markieren
  const handleCompleteTodo = async (id: string) => {
    try {
      await todosApi.completeTodo(id);

      // Status in der lokalen Liste aktualisieren
      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, status: 'Erledigt' } : todo
      ));

      showSnackbar('Aufgabe als erledigt markiert', 'success');
    } catch (err: any) {
      showSnackbar(err.message || 'Fehler beim Aktualisieren der Aufgabe', 'error');
    }
  };

  // Status-Änderung aus dem Kanban-Board
  const handleStatusChange = async (dragResult: DragResult) => {
    try {
      const todoToUpdate = todos.find(todo => todo.id === dragResult.todoId);
      if (!todoToUpdate) return;

      // API aufrufen, um Status zu ändern
      const updatedTodoData = {
        ...todoToUpdate,
        status: dragResult.destinationStatus,
        // Priorität immer als Zahl übergeben
        priority: typeof todoToUpdate.priority === 'object'
          ? todoToUpdate.priority.value
          : todoToUpdate.priority
      };

      const response = await todosApi.updateTodo(dragResult.todoId, updatedTodoData);

      // Lokale State aktualisieren
      const updatedTodo = {
        ...response.data,
        priority: priorityOptions.find(p => p.value === response.data.priority) || priorityOptions[0]
      };

      setTodos(todos.map(todo =>
        todo.id === updatedTodo.id ? updatedTodo : todo
      ));

      showSnackbar(`Status geändert auf "${dragResult.destinationStatus}"`, 'success');
    } catch (err: any) {
      showSnackbar(err.message || 'Fehler beim Aktualisieren des Status', 'error');
    }
  };

  // Dialog-Eingaben validieren
  const validateTodoData = () => {
    const errors: Record<string, string> = {};

    if (!currentTodo.title?.trim()) {
      errors.title = 'Titel ist erforderlich';
    }

    if (!currentTodo.category) {
      errors.category = 'Kategorie ist erforderlich';
    }

    if (!currentTodo.status) {
      errors.status = 'Status ist erforderlich';
    }

    if (currentTodo.dueDate && isNaN(new Date(currentTodo.dueDate).getTime())) {
      errors.dueDate = 'Ungültiges Datumsformat';
    }

    setDialogErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Todo speichern (erstellen oder aktualisieren)
  const handleSaveTodo = async () => {
    if (!validateTodoData()) return;

    try {
      setSubmitting(true);

      // Daten für API vorbereiten
      const todoData = {
        ...currentTodo,
        // Priorität immer als Zahl übergeben
        priority: typeof currentTodo.priority === 'object'
          ? currentTodo.priority.value
          : currentTodo.priority
      };

      if (dialogMode === 'create') {
        // Neue Todo erstellen
        const response = await todosApi.createTodo(todoData);

        // Priorität formatieren für die UI
        const newTodo = {
          ...response.data,
          priority: priorityOptions.find(p => p.value === response.data.priority) || priorityOptions[0]
        };

        setTodos([...todos, newTodo]);
        showSnackbar('Aufgabe erfolgreich erstellt', 'success');
      } else {
        // Bestehende Todo aktualisieren
        const response = await todosApi.updateTodo(todoData.id!, todoData);

        // Priorität formatieren für die UI
        const updatedTodo = {
          ...response.data,
          priority: priorityOptions.find(p => p.value === response.data.priority) || priorityOptions[0]
        };

        setTodos(todos.map(todo =>
          todo.id === updatedTodo.id ? updatedTodo : todo
        ));
        showSnackbar('Aufgabe erfolgreich aktualisiert', 'success');
      }

      setDialogOpen(false);
    } catch (err: any) {
      showSnackbar(err.message || 'Fehler beim Speichern der Aufgabe', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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

  // Eingabeänderungen im Dialog verarbeiten
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentTodo({
      ...currentTodo,
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
    setCurrentTodo({
      ...currentTodo,
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

  // Ansichtsmodus ändern (Tabelle oder Kanban)
  const handleViewModeChange = (_: React.SyntheticEvent, newValue: 'table' | 'kanban') => {
    setViewMode(newValue);
  };

  // Spalten für die AtlasTable-Komponente
  const columns: AtlasColumn<TodoItem>[] = [
    { label: 'ID', dataKey: 'id', width: 100 },
    {
      label: 'Priorität',
      dataKey: 'priority',
      width: 100,
      render: (value: PriorityType) => (
        <Chip
          icon={<FlagIcon />}
          label={value.label}
          size="small"
          sx={{
            bgcolor: alpha(value.color, 0.2),
            color: value.color,
            borderColor: value.color,
            '& .MuiChip-icon': {
              color: value.color
            }
          }}
          variant="outlined"
        />
      )
    },
    { label: 'Titel', dataKey: 'title', width: 200 },
    { label: 'Beschreibung', dataKey: 'description', width: 300 },
    { label: 'Kategorie', dataKey: 'category', width: 150 },
    { label: 'Zugewiesen an', dataKey: 'assignedTo', width: 150 },
    { label: 'Erstellt von', dataKey: 'createdBy', width: 150 },
    { label: 'Status', dataKey: 'status', width: 120 },
    { label: 'Erstellt am', dataKey: 'createdAt', width: 120 },
    { label: 'Fälligkeit', dataKey: 'dueDate', width: 120 },
    {
      label: 'Aktionen',
      dataKey: 'actions',
      width: 150,
      render: (_, todo: TodoItem) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => handleEditTodo(todo)}
            sx={{ color: '#2196f3' }}
          >
            <EditIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={() => handleDeleteTodo(todo.id)}
            sx={{ color: '#f44336' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>

          {todo.status !== 'Erledigt' && (
            <IconButton
              size="small"
              onClick={() => handleCompleteTodo(todo.id)}
              sx={{ color: '#4caf50' }}
            >
              <CheckCircleOutlineIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )
    }
  ];

  // Filter für die Todo-Tabelle
  const filteredTodos = todos.filter(todo => {
    const matchesSearch = searchText === '' ||
      Object.entries(todo).some(([key, value]) => {
        if (key === 'priority' && typeof value === 'object') {
          return value.label.toString().toLowerCase().includes(searchText.toLowerCase());
        }
        return value.toString().toLowerCase().includes(searchText.toLowerCase());
      });

    const matchesStatus = statusFilter === '' || todo.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Unique Statusoptionen aus den vorhandenen Todos
  const uniqueStatuses = [...new Set(todos.map(todo => todo.status))];

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
          Aufgabenübersicht
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
        {/* Ansichts-Tabs */}
        <Tabs
          value={viewMode}
          onChange={handleViewModeChange}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': { minHeight: 40 }
          }}
        >
          <Tab
            value="table"
            label="Tabelle"
            icon={<ViewListIcon />}
            iconPosition="start"
          />
          <Tab
            value="kanban"
            label="Kanban"
            icon={<ViewKanbanIcon />}
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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

          {/* Status-Dropdown (nur in Tabellenansicht) */}
          {viewMode === 'table' && (
            <FormControl size="small" sx={{ width: 150 }}>
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
          )}

          {/* Neu-Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewTodo}
            sx={{
              bgcolor: '#1976d2',
              color: 'white',
              '&:hover': {
                bgcolor: '#1565c0',
              }
            }}
          >
            Neue Aufgabe
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
        <>
          {/* Tabellenansicht */}
          {viewMode === 'table' && (
            <Box
              sx={{
                width: '100%',
                maxWidth: '100%',
                overflowX: 'auto'
              }}
            >
              <AtlasTable
                columns={columns}
                rows={filteredTodos}
                heightPx={600}
              />
            </Box>
          )}

          {/* Kanban-Ansicht */}
          {viewMode === 'kanban' && (
            <KanbanBoard
              todos={filteredTodos}
              onEditTodo={handleEditTodo}
              onDeleteTodo={handleDeleteTodo}
              onCompleteTodo={handleCompleteTodo}
              onStatusChange={handleStatusChange}
              statusOptions={statusOptions}
            />
          )}
        </>
      )}

      {/* Todo-Dialog zum Erstellen/Bearbeiten */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Neue Aufgabe erstellen' : 'Aufgabe bearbeiten'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Titel"
                fullWidth
                value={currentTodo.title || ''}
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
                value={currentTodo.description || ''}
                onChange={handleInputChange}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!dialogErrors.category}>
                <Typography variant="caption" sx={{ mb: 1 }}>Kategorie *</Typography>
                <Select
                  name="category"
                  value={currentTodo.category || ''}
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
                    typeof currentTodo.priority === 'object'
                      ? currentTodo.priority.value
                      : currentTodo.priority || 1
                  }
                  onChange={handleSelectChange}
                  disabled={submitting}
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FlagIcon sx={{ color: option.color }} />
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="assignedTo"
                label="Zugewiesen an"
                fullWidth
                value={currentTodo.assignedTo || ''}
                onChange={handleInputChange}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!dialogErrors.status}>
                <Typography variant="caption" sx={{ mb: 1 }}>Status *</Typography>
                <Select
                  name="status"
                  value={currentTodo.status || ''}
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
                name="dueDate"
                label="Fälligkeitsdatum"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={currentTodo.dueDate || ''}
                onChange={handleInputChange}
                error={!!dialogErrors.dueDate}
                helperText={dialogErrors.dueDate}
                disabled={submitting}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={submitting}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSaveTodo}
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

export default Todos;
