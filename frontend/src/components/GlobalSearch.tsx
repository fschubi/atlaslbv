import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControlLabel,
  Switch,
  Tooltip,
  alpha
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Computer as DeviceIcon,
  Key as LicenseIcon,
  VerifiedUser as CertificateIcon,
  Devices as AccessoryIcon,
  Person as UserIcon,
  Description as DocumentIcon,
  Build as InventoryIcon,
  Star as FavoriteIcon,
  History as HistoryIcon,
  Settings as FilterIcon,
  Bookmark as SavedSearchIcon,
  DeleteOutline as ClearIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { debounce } from 'lodash';

// Typdefinitionen
export interface SearchResult {
  id: string;
  type: 'device' | 'license' | 'certificate' | 'accessory' | 'user' | 'document';
  title: string;
  subtitle: string;
  status?: string;
  relevance: number;
  url: string;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter[];
  timestamp: Date;
}

interface SearchFilter {
  field: string;
  value: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
}

interface SearchHistory {
  query: string;
  timestamp: Date;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, initialQuery = '' }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['device', 'license', 'certificate', 'accessory', 'user', 'document']);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savedSearchName, setSavedSearchName] = useState('');

  // Mock-Daten für die Demonstration (später durch echte API-Calls ersetzen)
  const mockSearch = useCallback(async (searchQuery: string, types: string[], searchFilters: SearchFilter[]): Promise<SearchResult[]> => {
    // Simulieren einer Verzögerung für eine realistische Suche
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!searchQuery.trim()) return [];

    const allResults: SearchResult[] = [
      {
        id: 'DEV-1001',
        type: 'device',
        title: 'ThinkPad X1 Carbon',
        subtitle: 'Laptop - Seriennummer: TP78954X1',
        status: 'Aktiv',
        relevance: 95,
        url: '/devices/DEV-1001'
      },
      {
        id: 'DEV-1002',
        type: 'device',
        title: 'MacBook Pro M1',
        subtitle: 'Laptop - Seriennummer: MBPM1-2022-78956',
        status: 'Aktiv',
        relevance: 88,
        url: '/devices/DEV-1002'
      },
      {
        id: 'LIC-5001',
        type: 'license',
        title: 'Microsoft Office 365',
        subtitle: 'Volllizenz - Ablauf: 31.12.2023',
        status: 'Aktiv',
        relevance: 75,
        url: '/licenses/LIC-5001'
      },
      {
        id: 'CERT-3001',
        type: 'certificate',
        title: 'SSL Zertifikat - atlas.internal.com',
        subtitle: 'Ablauf: 15.06.2023',
        status: 'Abgelaufen',
        relevance: 82,
        url: '/certificates/CERT-3001'
      },
      {
        id: 'ACC-7001',
        type: 'accessory',
        title: 'Logitech MX Master 3',
        subtitle: 'Maus - Seriennummer: LMX3-789456',
        status: 'Zugewiesen',
        relevance: 70,
        url: '/accessories/ACC-7001'
      },
      {
        id: 'USR-10010',
        type: 'user',
        title: 'Max Mustermann',
        subtitle: 'IT-Abteilung - max.mustermann@example.com',
        status: 'Aktiv',
        relevance: 85,
        url: '/users/USR-10010'
      },
      {
        id: 'DOC-2001',
        type: 'document',
        title: 'Benutzerhandbuch ThinkPad.pdf',
        subtitle: 'Dokumentation - Hochgeladen: 12.04.2023',
        relevance: 65,
        url: '/documents/DOC-2001'
      }
    ];

    // Filtern der Ergebnisse nach Typ
    let filteredResults = allResults.filter(result => types.includes(result.type));

    // Anwenden der Suchfilter
    if (searchFilters.length > 0) {
      filteredResults = filteredResults.filter(result => {
        return searchFilters.every(filter => {
          // Hier würden je nach Operator und Feld komplexere Vergleiche stattfinden
          // Vereinfachte Implementierung für dieses Beispiel
          return result.title.toLowerCase().includes(filter.value.toLowerCase()) ||
                 result.subtitle.toLowerCase().includes(filter.value.toLowerCase());
        });
      });
    }

    // Filtern nach Suchbegriff
    return filteredResults.filter(result =>
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, []);

  // Debounced Suchfunktion
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string, types: string[], searchFilters: SearchFilter[]) => {
      setLoading(true);
      try {
        const searchResults = await mockSearch(searchQuery, types, searchFilters);
        setResults(searchResults);
      } catch (error) {
        console.error('Fehler bei der Suche:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // Aktualisiere die Suchergebnisse, wenn sich die Eingabe ändert
  useEffect(() => {
    if (query.trim()) {
      debouncedSearch(query, selectedTypes, filters);

      // Füge Suche zum Verlauf hinzu
      if (query.length > 2) {
        setSearchHistory(prev => {
          const newHistory = [
            { query, timestamp: new Date() },
            ...prev.filter(item => item.query !== query)
          ].slice(0, 10);
          return newHistory;
        });
      }
    } else {
      setResults([]);
    }
  }, [query, selectedTypes, filters, debouncedSearch]);

  // Ergebnisse nach Typen gruppieren
  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {});

  const handleItemClick = (result: SearchResult) => {
    navigate(result.url);
    onClose();
  };

  const handleFilterToggle = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSaveSearch = () => {
    setSaveDialogOpen(true);
    handleMenuClose();
  };

  const handleSaveSearchConfirm = () => {
    if (savedSearchName.trim()) {
      const newSavedSearch: SavedSearch = {
        id: `search-${Date.now()}`,
        name: savedSearchName,
        query,
        filters,
        timestamp: new Date()
      };

      setSavedSearches(prev => [...prev, newSavedSearch]);
      setSavedSearchName('');
      setSaveDialogOpen(false);
    }
  };

  const handleLoadSavedSearch = (search: SavedSearch) => {
    setQuery(search.query);
    setFilters(search.filters);
    handleMenuClose();
  };

  const handleClearSearch = () => {
    setQuery('');
    setFilters([]);
    handleMenuClose();
  };

  const handleAdvancedModeToggle = () => {
    setAdvancedMode(!advancedMode);
    handleMenuClose();
  };

  const handleAddFilter = () => {
    setFilters([...filters, { field: 'name', value: '', operator: 'contains' }]);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);
  };

  const handleFilterChange = (index: number, field: keyof SearchFilter, value: any) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setFilters(newFilters);
  };

  // Rendere die Typfilter
  const renderTypeFilters = () => (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
      <Tooltip title="Geräte">
        <Chip
          icon={<DeviceIcon />}
          label="Geräte"
          clickable
          color={selectedTypes.includes('device') ? 'primary' : 'default'}
          onClick={() => handleFilterToggle('device')}
          variant={selectedTypes.includes('device') ? 'filled' : 'outlined'}
        />
      </Tooltip>
      <Tooltip title="Lizenzen">
        <Chip
          icon={<LicenseIcon />}
          label="Lizenzen"
          clickable
          color={selectedTypes.includes('license') ? 'primary' : 'default'}
          onClick={() => handleFilterToggle('license')}
          variant={selectedTypes.includes('license') ? 'filled' : 'outlined'}
        />
      </Tooltip>
      <Tooltip title="Zertifikate">
        <Chip
          icon={<CertificateIcon />}
          label="Zertifikate"
          clickable
          color={selectedTypes.includes('certificate') ? 'primary' : 'default'}
          onClick={() => handleFilterToggle('certificate')}
          variant={selectedTypes.includes('certificate') ? 'filled' : 'outlined'}
        />
      </Tooltip>
      <Tooltip title="Zubehör">
        <Chip
          icon={<AccessoryIcon />}
          label="Zubehör"
          clickable
          color={selectedTypes.includes('accessory') ? 'primary' : 'default'}
          onClick={() => handleFilterToggle('accessory')}
          variant={selectedTypes.includes('accessory') ? 'filled' : 'outlined'}
        />
      </Tooltip>
      <Tooltip title="Benutzer">
        <Chip
          icon={<UserIcon />}
          label="Benutzer"
          clickable
          color={selectedTypes.includes('user') ? 'primary' : 'default'}
          onClick={() => handleFilterToggle('user')}
          variant={selectedTypes.includes('user') ? 'filled' : 'outlined'}
        />
      </Tooltip>
      <Tooltip title="Dokumente">
        <Chip
          icon={<DocumentIcon />}
          label="Dokumente"
          clickable
          color={selectedTypes.includes('document') ? 'primary' : 'default'}
          onClick={() => handleFilterToggle('document')}
          variant={selectedTypes.includes('document') ? 'filled' : 'outlined'}
        />
      </Tooltip>
    </Box>
  );

  // Rendere die Ergebnisse
  const renderResults = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (results.length === 0 && query.trim() !== '') {
      return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Keine Ergebnisse gefunden.
          </Typography>
        </Box>
      );
    }

    return Object.entries(groupedResults).map(([type, items]) => (
      <React.Fragment key={type}>
        <Typography variant="subtitle1" sx={{ my: 1, pl: 2, fontWeight: 'bold' }}>
          {type === 'device' ? 'Geräte' :
           type === 'license' ? 'Lizenzen' :
           type === 'certificate' ? 'Zertifikate' :
           type === 'accessory' ? 'Zubehör' :
           type === 'user' ? 'Benutzer' :
           type === 'document' ? 'Dokumente' : type}
          {` (${items.length})`}
        </Typography>
        <List dense>
          {items.map(result => (
            <ListItem
              key={result.id}
              button
              onClick={() => handleItemClick(result)}
              sx={{
                py: 1,
                '&:hover': { bgcolor: alpha('#3f51b5', 0.1) }
              }}
            >
              <ListItemIcon>
                {result.type === 'device' ? <DeviceIcon /> :
                 result.type === 'license' ? <LicenseIcon /> :
                 result.type === 'certificate' ? <CertificateIcon /> :
                 result.type === 'accessory' ? <AccessoryIcon /> :
                 result.type === 'user' ? <UserIcon /> :
                 <DocumentIcon />}
              </ListItemIcon>
              <ListItemText
                primary={result.title}
                secondary={result.subtitle}
                primaryTypographyProps={{ fontWeight: 'medium' }}
              />
              {result.status && (
                <Chip
                  label={result.status}
                  size="small"
                  sx={{
                    ml: 1,
                    bgcolor: result.status === 'Aktiv' ? 'rgba(46, 125, 50, 0.1)' :
                            result.status === 'Inaktiv' ? 'rgba(211, 47, 47, 0.1)' :
                            result.status === 'Abgelaufen' ? 'rgba(183, 28, 28, 0.1)' :
                            result.status === 'Zugewiesen' ? 'rgba(33, 150, 243, 0.1)' :
                            'rgba(245, 124, 0, 0.1)',
                    color: result.status === 'Aktiv' ? '#4caf50' :
                           result.status === 'Inaktiv' ? '#f44336' :
                           result.status === 'Abgelaufen' ? '#d32f2f' :
                           result.status === 'Zugewiesen' ? '#2196f3' :
                           '#ff9800',
                    border: '1px solid',
                    borderColor: 'inherit'
                  }}
                />
              )}
            </ListItem>
          ))}
        </List>
        <Divider />
      </React.Fragment>
    ));
  };

  // Rendere die Suchfilter (Advanced Mode)
  const renderSearchFilters = () => (
    <Box sx={{ mb: 2 }}>
      {filters.map((filter, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
          <TextField
            select
            size="small"
            label="Feld"
            value={filter.field}
            onChange={(e) => handleFilterChange(index, 'field', e.target.value)}
            sx={{ width: '30%' }}
          >
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="serialNumber">Seriennummer</MenuItem>
            <MenuItem value="status">Status</MenuItem>
            <MenuItem value="location">Standort</MenuItem>
            <MenuItem value="department">Abteilung</MenuItem>
            <MenuItem value="manufacturer">Hersteller</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Operator"
            value={filter.operator}
            onChange={(e) => handleFilterChange(index, 'operator', e.target.value)}
            sx={{ width: '25%' }}
          >
            <MenuItem value="equals">ist gleich</MenuItem>
            <MenuItem value="contains">enthält</MenuItem>
            <MenuItem value="startsWith">beginnt mit</MenuItem>
            <MenuItem value="endsWith">endet mit</MenuItem>
            <MenuItem value="greaterThan">größer als</MenuItem>
            <MenuItem value="lessThan">kleiner als</MenuItem>
          </TextField>

          <TextField
            size="small"
            label="Wert"
            value={filter.value}
            onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
            fullWidth
          />

          <IconButton onClick={() => handleRemoveFilter(index)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}

      <Box sx={{ mt: 1 }}>
        <Chip
          label="Filter hinzufügen"
          onClick={handleAddFilter}
          color="primary"
          variant="outlined"
          size="small"
        />
      </Box>
    </Box>
  );

  // Rendere den Suchverlauf
  const renderSearchHistory = () => {
    if (searchHistory.length === 0) return null;

    return (
      <>
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, px: 2 }}>
          Suchverlauf
        </Typography>
        <List dense>
          {searchHistory.map((item, index) => (
            <ListItem
              key={index}
              button
              onClick={() => setQuery(item.query)}
              sx={{ py: 0.5 }}
            >
              <ListItemIcon>
                <HistoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item.query}
                secondary={new Date(item.timestamp).toLocaleString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              />
            </ListItem>
          ))}
        </List>
        <Divider />
      </>
    );
  };

  // Rendere die gespeicherten Suchen
  const renderSavedSearches = () => {
    if (savedSearches.length === 0) return null;

    return (
      <>
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, px: 2 }}>
          Gespeicherte Suchen
        </Typography>
        <List dense>
          {savedSearches.map((item) => (
            <ListItem
              key={item.id}
              button
              onClick={() => handleLoadSavedSearch(item)}
              sx={{ py: 0.5 }}
            >
              <ListItemIcon>
                <SavedSearchIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item.name}
                secondary={item.query}
              />
            </ListItem>
          ))}
        </List>
        <Divider />
      </>
    );
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          minHeight: '70vh',
          maxHeight: '85vh',
          bgcolor: '#1a1a1a'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Globale Suche
          </Typography>

          <Tooltip title="Suchoptionen">
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              aria-label="Suchoptionen"
            >
              <MoreIcon />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: { width: 200, maxWidth: '100%' }
            }}
          >
            <MenuItem onClick={handleSaveSearch}>
              <ListItemIcon>
                <SavedSearchIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Suche speichern" />
            </MenuItem>
            <MenuItem onClick={handleAdvancedModeToggle}>
              <ListItemIcon>
                <FilterIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Erweiterte Suche" />
            </MenuItem>
            <MenuItem onClick={handleClearSearch}>
              <ListItemIcon>
                <ClearIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Suche zurücksetzen" />
            </MenuItem>
          </Menu>

          <Tooltip title="Schließen">
            <IconButton
              onClick={onClose}
              size="small"
              aria-label="Schließen"
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 2, pb: 2 }}>
        <TextField
          autoFocus
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suchen Sie nach Geräten, Lizenzen, Zertifikaten, Zubehör, Benutzern oder Dokumenten..."
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setQuery('')}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
          sx={{ mb: 2 }}
        />

        {/* Erweiterte Filter im Advanced Mode */}
        {advancedMode && renderSearchFilters()}

        {/* Typ-Filter immer anzeigen */}
        {renderTypeFilters()}

        {/* Aktive Filter anzeigen */}
        {filters.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {filters.map((filter, index) => (
              <Chip
                key={index}
                label={`${filter.field} ${filter.operator} "${filter.value}"`}
                onDelete={() => handleRemoveFilter(index)}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        )}

        {/* Container für Suchergebnisse oder Suchverlauf */}
        <Paper
          sx={{
            maxHeight: 'calc(70vh - 180px)',
            overflow: 'auto',
            bgcolor: '#202020',
            borderRadius: 1,
            mt: 1
          }}
        >
          {query.trim() ? (
            renderResults()
          ) : (
            <>
              {renderSavedSearches()}
              {renderSearchHistory()}

              {!searchHistory.length && !savedSearches.length && (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Geben Sie einen Suchbegriff ein, um zu beginnen.
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Paper>
      </DialogContent>

      {/* Dialog zum Speichern einer Suche */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        PaperProps={{
          sx: { bgcolor: '#1a1a1a' }
        }}
      >
        <DialogTitle>Suche speichern</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name der gespeicherten Suche"
            type="text"
            fullWidth
            value={savedSearchName}
            onChange={(e) => setSavedSearchName(e.target.value)}
            variant="outlined"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Suchbegriff: {query}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Filter: {filters.length > 0 ? filters.map(f => `${f.field} ${f.operator} "${f.value}"`).join(', ') : 'Keine'}
            </Typography>
          </Box>
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 3, pb: 2 }}>
          <Chip
            label="Abbrechen"
            onClick={() => setSaveDialogOpen(false)}
            sx={{ mr: 1 }}
            variant="outlined"
          />
          <Chip
            label="Speichern"
            onClick={handleSaveSearchConfirm}
            color="primary"
            disabled={!savedSearchName.trim()}
          />
        </Box>
      </Dialog>
    </Dialog>
  );
};

export default GlobalSearch;
