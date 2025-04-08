import React from 'react';
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  TextField,
  Typography,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';

export interface ChecklistItemData {
  id: string;
  text: string;
  checked: boolean;
}

interface ChecklistItemProps {
  item: ChecklistItemData;
  onToggle: (id: string, checked: boolean) => void;
  onTextChange?: (id: string, text: string) => void;
  onDelete?: (id: string) => void;
  editable?: boolean;
  required?: boolean;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  item,
  onToggle,
  onTextChange,
  onDelete,
  editable = false,
  required = false
}) => {
  const handleToggle = () => {
    onToggle(item.id, !item.checked);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onTextChange) {
      onTextChange(item.id, e.target.value);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(item.id);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 0.5
      }}
    >
      <FormControlLabel
        control={
          <Checkbox
            checked={item.checked}
            onChange={handleToggle}
            color="primary"
            disabled={!editable && !item.checked} // Im Nicht-Bearbeitungsmodus können Haken nur entfernt werden
          />
        }
        label={
          editable ? (
            <TextField
              variant="standard"
              value={item.text}
              onChange={handleTextChange}
              fullWidth
              size="small"
              required={required}
              sx={{ ml: 1, minWidth: 300 }}
            />
          ) : (
            <Typography
              variant="body2"
              sx={{
                ml: 1,
                textDecoration: item.checked ? 'line-through' : 'none',
                color: item.checked ? 'text.secondary' : 'text.primary'
              }}
            >
              {item.text}
              {required && ' *'}
            </Typography>
          )
        }
      />

      {editable && onDelete && (
        <IconButton
          size="small"
          onClick={handleDelete}
          color="error"
          aria-label="Checklistenpunkt löschen"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
};

interface ChecklistProps {
  items: ChecklistItemData[];
  onChange: (items: ChecklistItemData[]) => void;
  editable?: boolean;
  title?: string;
  requiredItems?: string[]; // IDs der erforderlichen Elemente
}

export const Checklist: React.FC<ChecklistProps> = ({
  items,
  onChange,
  editable = false,
  title = 'Checkliste',
  requiredItems = []
}) => {
  const handleToggle = (id: string, checked: boolean) => {
    const newItems = items.map(item =>
      item.id === id ? { ...item, checked } : item
    );
    onChange(newItems);
  };

  const handleTextChange = (id: string, text: string) => {
    const newItems = items.map(item =>
      item.id === id ? { ...item, text } : item
    );
    onChange(newItems);
  };

  const handleDelete = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    onChange(newItems);
  };

  const handleAddItem = () => {
    const newId = `checklist-${Date.now()}`;
    const newItems = [
      ...items,
      { id: newId, text: '', checked: false }
    ];
    onChange(newItems);
  };

  return (
    <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1">{title}</Typography>
        {editable && (
          <Tooltip title="Checklistenpunkt hinzufügen">
            <IconButton
              onClick={handleAddItem}
              color="primary"
              size="small"
              aria-label="Checklistenpunkt hinzufügen"
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <FormGroup>
        {items.map(item => (
          <ChecklistItem
            key={item.id}
            item={item}
            onToggle={handleToggle}
            onTextChange={editable ? handleTextChange : undefined}
            onDelete={editable ? handleDelete : undefined}
            editable={editable}
            required={requiredItems.includes(item.id)}
          />
        ))}
        {items.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', p: 1 }}>
            {editable ? 'Klicken Sie auf +, um einen Checklistenpunkt hinzuzufügen.' : 'Keine Checklistenpunkte vorhanden.'}
          </Typography>
        )}
      </FormGroup>
    </Paper>
  );
};

export default Checklist;
