import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Collapse,
  Grid,
  Divider,
  Tooltip,
  Autocomplete,
  Stack,
  InputAdornment,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  FilterList as FilterIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  History as HistoryIcon,
  Star as StarIcon,
  Autorenew as AutorenewIcon
} from '@mui/icons-material';

// Typdefinitionen
export type FilterOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn' | 'isEmpty' | 'isNotEmpty';

export interface FilterOption {
  field: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  options?: Array<{ value: string; label: string }>;
  defaultOperator?: FilterOperator;
}

export interface Filter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | null;
  value2?: string | number | null; // Für Bereichsfilter (between)
}

export interface SavedFilterSet {
  id: string;
  name: string;
  filters: Filter[];
  createdAt: Date;
}

interface AdvancedSearchFiltersProps {
  filterOptions: FilterOption[];
  onFiltersChange: (filters: Filter[]) => void;
  savedFilters?: SavedFilterSet[];
  onSaveFilters?: (name: string, filters: Filter[]) => void;
  initialFilters?: Filter[];
  compact?: boolean;
  allowSave?: boolean;
  allowQuickFilters?: boolean;
  recentSearches?: { query: string; timestamp: Date }[];
  searchPlaceholder?: string;
  onSearchChange?: (searchText: string) => void;
}

const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  filterOptions,
  onFiltersChange,
  savedFilters = [],
  onSaveFilters,
  initialFilters = [],
  compact = false,
  allowSave = true,
  allowQuickFilters = true,
  recentSearches = [],
  searchPlaceholder = 'Suchen...',
  onSearchChange
}) => {
  const [filters, setFilters] = useState<Filter[]>(initialFilters);
  const [expanded, setExpanded] = useState(!compact);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterSetName, setFilterSetName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSavedFilters, setShowSavedFilters] = useState(false);

  // Standard-Operatoren nach Typ
  const defaultOperators: Record<string, FilterOperator> = {
    text: 'contains',
    number: 'equals',
    date: 'equals',
    select: 'equals',
    boolean: 'equals'
  };

  // Verfügbare Operatoren nach Typ
  const operatorsByType: Record<string, { value: FilterOperator; label: string }[]> = {
    text: [
      { value: 'contains', label: 'enthält' },
      { value: 'equals', label: 'ist gleich' },
      { value: 'startsWith', label: 'beginnt mit' },
      { value: 'endsWith', label: 'endet mit' },
      { value: 'isEmpty', label: 'ist leer' },
      { value: 'isNotEmpty', label: 'ist nicht leer' }
    ],
    number: [
      { value: 'equals', label: 'ist gleich' },
      { value: 'greaterThan', label: 'größer als' },
      { value: 'lessThan', label: 'kleiner als' },
      { value: 'between', label: 'zwischen' },
      { value: 'isEmpty', label: 'ist leer' },
      { value: 'isNotEmpty', label: 'ist nicht leer' }
    ],
    date: [
      { value: 'equals', label: 'ist gleich' },
      { value: 'greaterThan', label: 'nach' },
      { value: 'lessThan', label: 'vor' },
      { value: 'between', label: 'zwischen' },
      { value: 'isEmpty', label: 'ist leer' },
      { value: 'isNotEmpty', label: 'ist nicht leer' }
    ],
    select: [
      { value: 'equals', label: 'ist gleich' },
      { value: 'in', label: 'ist enthalten in' },
      { value: 'notIn', label: 'ist nicht enthalten in' },
      { value: 'isEmpty', label: 'ist leer' },
      { value: 'isNotEmpty', label: 'ist nicht leer' }
    ],
    boolean: [
      { value: 'equals', label: 'ist gleich' }
    ]
  };

  // Benachrichtige den Parent, wenn sich die Filter ändern
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  // Benachrichtige den Parent, wenn sich der Suchtext ändert
  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(searchText);
    }
  }, [searchText, onSearchChange]);

  // Hilfsfunktion zum Erzeugen einer Filter-ID
  const generateFilterId = () => `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Handler für das Hinzufügen eines Filters
  const handleAddFilter = () => {
    const firstOption = filterOptions[0];
    if (!firstOption) return;

    const defaultOperator = firstOption.defaultOperator || defaultOperators[firstOption.type] || 'equals';

    const newFilter: Filter = {
      id: generateFilterId(),
      field: firstOption.field,
      operator: defaultOperator,
      value: firstOption.type === 'boolean' ? false : null
    };

    setFilters([...filters, newFilter]);
  };

  // Handler für das Entfernen eines Filters
  const handleRemoveFilter = (id: string) => {
    setFilters(filters.filter(filter => filter.id !== id));
  };

  // Handler für das Ändern eines Filters
  const handleFilterChange = (id: string, field: keyof Filter, value: any) => {
    setFilters(prevFilters => {
      const updatedFilters = prevFilters.map(filter => {
        if (filter.id === id) {
          const updatedFilter = { ...filter, [field]: value };

          // Wenn sich das Feld geändert hat, setze Operator und Wert zurück
          if (field === 'field') {
            const filterOption = filterOptions.find(option => option.field === value);
            if (filterOption) {
              updatedFilter.operator = filterOption.defaultOperator || defaultOperators[filterOption.type] || 'equals';
              updatedFilter.value = filterOption.type === 'boolean' ? false : null;
              if (updatedFilter.value2 !== undefined) {
                delete updatedFilter.value2;
              }
            }
          }

          // Wenn sich der Operator geändert hat, überprüfe, ob value2 benötigt wird
          if (field === 'operator') {
            if (value === 'between') {
              updatedFilter.value2 = null;
            } else if (updatedFilter.value2 !== undefined && value !== 'between') {
              delete updatedFilter.value2;
            }

            // Setze Werte zurück für isEmpty/isNotEmpty
            if (value === 'isEmpty' || value === 'isNotEmpty') {
              updatedFilter.value = null;
              if (updatedFilter.value2 !== undefined) {
                delete updatedFilter.value2;
              }
            }
          }

          return updatedFilter;
        }
        return filter;
      });

      return updatedFilters;
    });
  };

  // Handler für das Anwenden einer gespeicherten Filtersammlung
  const handleApplySavedFilter = (savedFilter: SavedFilterSet) => {
    setFilters(savedFilter.filters);
    setShowSavedFilters(false);
  };

  // Handler für das Löschen aller Filter
  const handleClearFilters = () => {
    setFilters([]);
    setSearchText('');
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  // Handler für das Speichern einer Filtersammlung
  const handleSaveFilters = () => {
    if (filterSetName.trim() && onSaveFilters) {
      onSaveFilters(filterSetName, filters);
      setFilterSetName('');
      setSaveDialogOpen(false);
    }
  };

  // Hilfsfunktion zum Anzeigen der Werteeingabe basierend auf Typ und Operator
  const renderValueInput = (filter: Filter, option: FilterOption) => {
    // Für isEmpty und isNotEmpty keine Eingabe anzeigen
    if (filter.operator === 'isEmpty' || filter.operator === 'isNotEmpty') {
      return null;
    }

    // Basierend auf dem Typ die entsprechende Eingabekomponente rendern
    switch (option.type) {
      case 'select':
        return (
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>Wert</InputLabel>
            <Select
              value={filter.value || ''}
              onChange={(e) => handleFilterChange(filter.id, 'value', e.target.value)}
              label="Wert"
            >
              {option.options?.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(filter.value)}
                onChange={(e) => handleFilterChange(filter.id, 'value', e.target.checked)}
              />
            }
            label={Boolean(filter.value) ? 'Ja' : 'Nein'}
            sx={{ mt: 1 }}
          />
        );

      case 'number':
        return (
          <Box sx={{ mt: 1 }}>
            <TextField
              type="number"
              size="small"
              fullWidth
              label="Wert"
              value={filter.value !== null ? filter.value : ''}
              onChange={(e) => handleFilterChange(filter.id, 'value', e.target.value === '' ? null : Number(e.target.value))}
            />
            {filter.operator === 'between' && (
              <TextField
                type="number"
                size="small"
                fullWidth
                label="Bis-Wert"
                value={filter.value2 !== null && filter.value2 !== undefined ? filter.value2 : ''}
                onChange={(e) => handleFilterChange(filter.id, 'value2', e.target.value === '' ? null : Number(e.target.value))}
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        );

      case 'date':
        return (
          <Box sx={{ mt: 1 }}>
            <TextField
              type="date"
              size="small"
              fullWidth
              label="Datum"
              InputLabelProps={{ shrink: true }}
              value={filter.value !== null ? filter.value : ''}
              onChange={(e) => handleFilterChange(filter.id, 'value', e.target.value === '' ? null : e.target.value)}
            />
            {filter.operator === 'between' && (
              <TextField
                type="date"
                size="small"
                fullWidth
                label="Bis-Datum"
                InputLabelProps={{ shrink: true }}
                value={filter.value2 !== null && filter.value2 !== undefined ? filter.value2 : ''}
                onChange={(e) => handleFilterChange(filter.id, 'value2', e.target.value === '' ? null : e.target.value)}
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        );

      case 'text':
      default:
        return (
          <TextField
            size="small"
            fullWidth
            label="Wert"
            value={filter.value !== null ? filter.value : ''}
            onChange={(e) => handleFilterChange(filter.id, 'value', e.target.value)}
            sx={{ mt: 1 }}
          />
        );
    }
  };

  // Rendere aktive Filter als Chips
  const renderActiveFilterChips = () => {
    if (filters.length === 0) return null;

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, mb: compact ? 1 : 0 }}>
        {filters.map(filter => {
          const option = filterOptions.find(opt => opt.field === filter.field);
          if (!option) return null;

          let label = '';
          const operator = operatorsByType[option.type]?.find(op => op.value === filter.operator)?.label || filter.operator;

          if (filter.operator === 'isEmpty') {
            label = `${option.label} ist leer`;
          } else if (filter.operator === 'isNotEmpty') {
            label = `${option.label} ist nicht leer`;
          } else if (filter.operator === 'between' && filter.value2 !== undefined) {
            label = `${option.label} zwischen ${filter.value} und ${filter.value2}`;
          } else if (option.type === 'select' && option.options) {
            const optionLabel = option.options.find(opt => opt.value === filter.value)?.label || filter.value;
            label = `${option.label} ${operator} ${optionLabel}`;
          } else if (option.type === 'boolean') {
            label = `${option.label} ist ${filter.value ? 'Ja' : 'Nein'}`;
          } else {
            label = `${option.label} ${operator} ${filter.value}`;
          }

          return (
            <Chip
              key={filter.id}
              label={label}
              onDelete={() => handleRemoveFilter(filter.id)}
              size="small"
              color="primary"
              variant="outlined"
            />
          );
        })}

        {filters.length > 0 && (
          <Chip
            label="Alle löschen"
            onClick={handleClearFilters}
            size="small"
            variant="outlined"
            color="error"
            icon={<ClearIcon />}
          />
        )}
      </Box>
    );
  };

  // Rendere Sucheingabe und Erweiterungsschalter
  const renderSearchBar = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <TextField
        placeholder={searchPlaceholder}
        variant="outlined"
        size="small"
        fullWidth
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: searchText ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => {
                  setSearchText('');
                  if (onSearchChange) onSearchChange('');
                }}
                edge="end"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null
        }}
      />

      <Tooltip title={expanded ? "Filter einklappen" : "Filter erweitern"}>
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Tooltip>

      {allowQuickFilters && (
        <>
          {recentSearches.length > 0 && (
            <Tooltip title="Suchverlauf">
              <IconButton size="small" onClick={() => setShowHistory(!showHistory)}>
                <HistoryIcon fontSize="small" color={showHistory ? "primary" : "inherit"} />
              </IconButton>
            </Tooltip>
          )}

          {savedFilters.length > 0 && (
            <Tooltip title="Gespeicherte Filter">
              <IconButton size="small" onClick={() => setShowSavedFilters(!showSavedFilters)}>
                <StarIcon fontSize="small" color={showSavedFilters ? "primary" : "inherit"} />
              </IconButton>
            </Tooltip>
          )}
        </>
      )}
    </Box>
  );

  // Rendere die detaillierte Filtereingabe
  const renderFilterInputs = () => {
    if (filters.length === 0) {
      return (
        <Box sx={{ py: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Keine Filter definiert. Klicken Sie auf "Filter hinzufügen", um zu beginnen.
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 2 }}>
        {filters.map(filter => {
          const option = filterOptions.find(opt => opt.field === filter.field);
          if (!option) return null;

          return (
            <Paper key={filter.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2">Filter</Typography>
                <IconButton size="small" onClick={() => handleRemoveFilter(filter.id)}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
              </Box>

              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Feld</InputLabel>
                    <Select
                      value={filter.field}
                      onChange={(e) => handleFilterChange(filter.id, 'field', e.target.value)}
                      label="Feld"
                    >
                      {filterOptions.map((option) => (
                        <MenuItem key={option.field} value={option.field}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Operator</InputLabel>
                    <Select
                      value={filter.operator}
                      onChange={(e) => handleFilterChange(filter.id, 'operator', e.target.value as FilterOperator)}
                      label="Operator"
                    >
                      {operatorsByType[option.type].map((op) => (
                        <MenuItem key={op.value} value={op.value}>
                          {op.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  {renderValueInput(filter, option)}
                </Grid>
              </Grid>
            </Paper>
          );
        })}
      </Box>
    );
  };

  // Rendere Quick-Filter-Optionen (Suchverlauf und gespeicherte Filter)
  const renderQuickFilterOptions = () => {
    if (!allowQuickFilters) return null;

    return (
      <>
        {/* Suchverlauf */}
        <Collapse in={showHistory}>
          <Paper variant="outlined" sx={{ mt: 1, p: 1, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" sx={{ px: 1, py: 0.5 }}>
              Suchverlauf
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            <Stack spacing={0.5} sx={{ maxHeight: 150, overflow: 'auto' }}>
              {recentSearches.length > 0 ? (
                recentSearches.map((search, index) => (
                  <Chip
                    key={index}
                    label={search.query}
                    size="small"
                    onClick={() => {
                      setSearchText(search.query);
                      if (onSearchChange) onSearchChange(search.query);
                      setShowHistory(false);
                    }}
                    icon={<HistoryIcon fontSize="small" />}
                    variant="outlined"
                    sx={{ justifyContent: 'flex-start' }}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                  Keine Suchverlauf vorhanden
                </Typography>
              )}
            </Stack>
          </Paper>
        </Collapse>

        {/* Gespeicherte Filter */}
        <Collapse in={showSavedFilters}>
          <Paper variant="outlined" sx={{ mt: 1, p: 1, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" sx={{ px: 1, py: 0.5 }}>
              Gespeicherte Filter
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            <Stack spacing={0.5} sx={{ maxHeight: 150, overflow: 'auto' }}>
              {savedFilters.length > 0 ? (
                savedFilters.map((savedFilter) => (
                  <Chip
                    key={savedFilter.id}
                    label={savedFilter.name}
                    size="small"
                    onClick={() => handleApplySavedFilter(savedFilter)}
                    icon={<StarIcon fontSize="small" />}
                    variant="outlined"
                    sx={{ justifyContent: 'flex-start' }}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                  Keine gespeicherten Filter vorhanden
                </Typography>
              )}
            </Stack>
          </Paper>
        </Collapse>
      </>
    );
  };

  // Dialog zum Speichern von Filtern
  const renderSaveFilterDialog = () => {
    if (!allowSave) return null;

    return (
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <Box sx={{ p: 3, width: 400 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Filtersammlung speichern
          </Typography>

          <TextField
            label="Name der Filtersammlung"
            fullWidth
            value={filterSetName}
            onChange={(e) => setFilterSetName(e.target.value)}
            autoFocus
            margin="normal"
          />

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button variant="outlined" onClick={() => setSaveDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveFilters}
              disabled={!filterSetName.trim()}
              startIcon={<SaveIcon />}
            >
              Speichern
            </Button>
          </Box>
        </Box>
      </Dialog>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Suchleiste und Erweiterungsschalter */}
      {renderSearchBar()}

      {/* Aktive Filter als Chips */}
      {renderActiveFilterChips()}

      {/* Quick-Filter-Optionen */}
      {renderQuickFilterOptions()}

      {/* Erweiterte Filteroptionen */}
      <Collapse in={expanded}>
        <Paper sx={{ mt: 2, p: 2 }} variant="outlined">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1">
              <FilterIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
              Erweiterte Filter
            </Typography>

            <Box>
              {filters.length > 0 && allowSave && (
                <Tooltip title="Filter speichern">
                  <IconButton size="small" onClick={() => setSaveDialogOpen(true)} sx={{ mr: 1 }}>
                    <SaveIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddFilter}
              >
                Filter hinzufügen
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Filterkomponenten */}
          {renderFilterInputs()}

          {/* Action-Buttons */}
          {filters.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                color="error"
              >
                Alle Filter löschen
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={<AutorenewIcon />}
                onClick={() => onFiltersChange(filters)}
                color="primary"
              >
                Filter anwenden
              </Button>
            </Box>
          )}
        </Paper>
      </Collapse>

      {/* Dialog zum Speichern von Filtern */}
      {renderSaveFilterDialog()}
    </Box>
  );
};

export default AdvancedSearchFilters;
