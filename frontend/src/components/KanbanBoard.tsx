import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  alpha,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  Flag as FlagIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

// Typdefinition für Priorität
export interface PriorityType {
  value: number;
  label: string;
  color: string;
}

// Typdefinition für Todo-Item
export interface TodoItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: PriorityType | number;
  assignedTo: string;
  createdBy: string;
  status: string;
  createdAt: string;
  dueDate: string;
}

// Typdefinition für spaltenübergreifende state-Änderungen
export interface DragResult {
  todoId: string;
  sourceStatus: string;
  destinationStatus: string;
}

interface KanbanBoardProps {
  todos: TodoItem[];
  loading?: boolean;
  error?: string | null;
  onEditTodo: (todo: TodoItem) => void;
  onDeleteTodo: (id: string) => void;
  onCompleteTodo: (id: string) => void;
  onStatusChange: (dragResult: DragResult) => void;
  statusOptions: string[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  todos,
  loading = false,
  error = null,
  onEditTodo,
  onDeleteTodo,
  onCompleteTodo,
  onStatusChange,
  statusOptions
}) => {
  // Organisiert Todos nach Status
  const [columnTodos, setColumnTodos] = useState<Record<string, TodoItem[]>>({});
  const [draggedItem, setDraggedItem] = useState<TodoItem | null>(null);

  // Todos nach Status gruppieren
  useEffect(() => {
    const groupedTodos: Record<string, TodoItem[]> = {};

    // Initialisiere alle Status-Spalten mit leeren Arrays
    statusOptions.forEach(status => {
      groupedTodos[status] = [];
    });

    // Fülle die Spalten mit Todos
    todos.forEach(todo => {
      if (groupedTodos[todo.status]) {
        groupedTodos[todo.status].push(todo);
      } else {
        // Fallback für unbekannte Status
        if (!groupedTodos['Sonstiges']) {
          groupedTodos['Sonstiges'] = [];
        }
        groupedTodos['Sonstiges'].push(todo);
      }
    });

    setColumnTodos(groupedTodos);
  }, [todos, statusOptions]);

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, todo: TodoItem) => {
    setDraggedItem(todo);
    // Füge Informationen zum DataTransfer hinzu
    e.dataTransfer.setData('text/plain', todo.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: string) => {
    e.preventDefault();

    if (draggedItem && draggedItem.status !== status) {
      onStatusChange({
        todoId: draggedItem.id,
        sourceStatus: draggedItem.status,
        destinationStatus: status
      });
    }

    setDraggedItem(null);
  };

  // Rendere Prioritäts-Chip
  const renderPriorityChip = (priority: PriorityType | number) => {
    const priorityObj = typeof priority === 'object' ? priority : {
      value: priority,
      label: priority === 1 ? 'Niedrig' : priority === 2 ? 'Mittel' : 'Hoch',
      color: priority === 1 ? '#8bc34a' : priority === 2 ? '#ff9800' : '#f44336'
    };

    return (
      <Chip
        icon={<FlagIcon />}
        label={priorityObj.label}
        size="small"
        sx={{
          bgcolor: alpha(priorityObj.color, 0.2),
          color: priorityObj.color,
          borderColor: priorityObj.color,
          '& .MuiChip-icon': {
            color: priorityObj.color
          }
        }}
        variant="outlined"
      />
    );
  };

  // Bewegung zwischen Spalten
  const handleMoveToNext = (todo: TodoItem) => {
    const currentIndex = statusOptions.indexOf(todo.status);
    if (currentIndex < statusOptions.length - 1) {
      onStatusChange({
        todoId: todo.id,
        sourceStatus: todo.status,
        destinationStatus: statusOptions[currentIndex + 1]
      });
    }
  };

  const handleMoveToPrevious = (todo: TodoItem) => {
    const currentIndex = statusOptions.indexOf(todo.status);
    if (currentIndex > 0) {
      onStatusChange({
        todoId: todo.id,
        sourceStatus: todo.status,
        destinationStatus: statusOptions[currentIndex - 1]
      });
    }
  };

  // Render-Logik
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, color: 'error.main' }}>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', overflowX: 'auto', gap: 2, p: 2, minHeight: 600 }}>
      {statusOptions.map(status => (
        <Paper
          key={status}
          sx={{
            width: 300,
            minWidth: 300,
            maxHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: theme => theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5'
          }}
          elevation={1}
          onDragOver={handleDragOver}
          onDrop={e => handleDrop(e, status)}
        >
          <Box
            sx={{
              p: 2,
              bgcolor: status === 'Erledigt' ? '#4caf50' :
                      status === 'In Bearbeitung' ? '#2196f3' :
                      status === 'Offen' ? '#ff9800' :
                      status === 'Abgebrochen' ? '#9e9e9e' : '#9c27b0',
              color: 'white',
              borderRadius: '4px 4px 0 0'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {status} ({columnTodos[status]?.length || 0})
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
            <Stack spacing={1}>
              {columnTodos[status]?.map(todo => (
                <Card
                  key={todo.id}
                  draggable
                  onDragStart={e => handleDragStart(e, todo)}
                  sx={{
                    '&:hover': {
                      boxShadow: 3
                    },
                    cursor: 'grab'
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem' }}>
                      {todo.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{
                      mb: 1,
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {todo.description}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      {renderPriorityChip(todo.priority)}
                      <Chip size="small" label={todo.category} />
                    </Box>

                    {todo.assignedTo && (
                      <Typography variant="caption" display="block">
                        Zugewiesen an: {todo.assignedTo}
                      </Typography>
                    )}

                    {todo.dueDate && (
                      <Typography variant="caption" display="block" color={
                        new Date(todo.dueDate) < new Date() && todo.status !== 'Erledigt'
                          ? 'error'
                          : 'inherit'
                      }>
                        Fällig: {new Date(todo.dueDate).toLocaleDateString('de-DE')}
                      </Typography>
                    )}
                  </CardContent>

                  <CardActions sx={{ px: 1, py: 0.5, justifyContent: 'space-between' }}>
                    <Box>
                      <Tooltip title="Bearbeiten">
                        <IconButton size="small" onClick={() => onEditTodo(todo)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Löschen">
                        <IconButton size="small" onClick={() => onDeleteTodo(todo.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {todo.status !== 'Erledigt' && (
                        <Tooltip title="Als erledigt markieren">
                          <IconButton size="small" onClick={() => onCompleteTodo(todo.id)}>
                            <CheckCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>

                    <Box>
                      {statusOptions.indexOf(todo.status) > 0 && (
                        <Tooltip title={`Zurück zu "${statusOptions[statusOptions.indexOf(todo.status) - 1]}"`}>
                          <IconButton size="small" onClick={() => handleMoveToPrevious(todo)}>
                            <ArrowBackIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {statusOptions.indexOf(todo.status) < statusOptions.length - 1 && (
                        <Tooltip title={`Weiter zu "${statusOptions[statusOptions.indexOf(todo.status) + 1]}"`}>
                          <IconButton size="small" onClick={() => handleMoveToNext(todo)}>
                            <ArrowForwardIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </CardActions>
                </Card>
              ))}

              {columnTodos[status]?.length === 0 && (
                <Box sx={{
                  p: 2,
                  textAlign: 'center',
                  color: 'text.secondary',
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: '1px dashed',
                  borderColor: 'divider'
                }}>
                  <Typography variant="body2">
                    Keine Aufgaben in diesem Status
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default KanbanBoard;
