import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Divider,
  Alert,
  Snackbar,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Assignment as AssignmentIcon,
  Download as DownloadIcon,
  Check as CheckIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import AtlasTable, { AtlasColumn } from '../components/AtlasTable';
import { handoverApi } from '../utils/api';

interface HandoverProtocolRow {
  id: string;
  deviceInfo: React.ReactNode;
  userInfo: React.ReactNode;
  date: string;
  status: React.ReactNode;
  attachments: React.ReactNode;
  actions: React.ReactNode;
  // Rohdaten für Filterung
  rawDeviceName: string;
  rawUserName: string;
  rawStatus: string;
  rawDate: string;
}

const HandoverProtocols: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [filteredProtocols, setFilteredProtocols] = useState<HandoverProtocolRow[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    loadHandoverProtocols();
  }, []);

  useEffect(() => {
    if (protocols.length > 0) {
      filterProtocols();
    }
  }, [searchTerm, protocols]);

  const loadHandoverProtocols = async () => {
    try {
      setIsLoading(true);
      const response = await handoverApi.getAllHandoverProtocols();
      setProtocols(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden der Übergabeprotokolle:', error);
      setMessage({
        type: 'error',
        text: 'Fehler beim Laden der Übergabeprotokolle'
      });
      setIsLoading(false);
    }
  };

  const filterProtocols = () => {
    const filteredData = protocols.filter(protocol => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        protocol.deviceName.toLowerCase().includes(searchTermLower) ||
        protocol.userName.toLowerCase().includes(searchTermLower) ||
        protocol.status.toLowerCase().includes(searchTermLower) ||
        protocol.date.includes(searchTerm)
      );
    });

    // Daten für AtlasTable aufbereiten
    const tableData: HandoverProtocolRow[] = filteredData.map(protocol => ({
      id: protocol.id,
      deviceInfo: (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {protocol.deviceName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {protocol.deviceType}
          </Typography>
        </Box>
      ),
      userInfo: (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {protocol.userName}
          </Typography>
        </Box>
      ),
      date: new Date(protocol.date).toLocaleDateString('de-DE'),
      status: (
        <Chip
          label={protocol.status}
          size="small"
          color={
            protocol.status === 'Übergeben' ? 'success' :
            protocol.status === 'Rückgabe beantragt' ? 'warning' :
            protocol.status === 'Zurückgegeben' ? 'info' : 'default'
          }
          sx={{ minWidth: 120 }}
        />
      ),
      attachments: (
        <Badge
          badgeContent={protocol.attachments?.length || 0}
          color="primary"
          max={99}
        >
          <AssignmentIcon color={protocol.attachments?.length ? 'action' : 'disabled'} />
        </Badge>
      ),
      actions: (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Details anzeigen">
            <IconButton
              size="small"
              onClick={() => navigate(`/handover/${protocol.id}`)}
              color="primary"
            >
              <AssignmentIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="PDF herunterladen">
            <span>
              <IconButton
                size="small"
                onClick={() => handleDownloadPDF(protocol.id)}
                color="secondary"
                disabled={!protocol.confirmedByUser}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
      // Rohdaten für Filterung
      rawDeviceName: protocol.deviceName,
      rawUserName: protocol.userName,
      rawStatus: protocol.status,
      rawDate: protocol.date
    }));

    setFilteredProtocols(tableData);
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      setMessage({
        type: 'info',
        text: 'PDF wird generiert...'
      });

      const response = await handoverApi.generatePDF(id);

      // Hier würde normalerweise ein tatsächlicher Download stattfinden
      // Für das Frontend-Prototyping nur eine Erfolgsmeldung
      setTimeout(() => {
        setMessage({
          type: 'success',
          text: 'PDF wurde erfolgreich generiert und heruntergeladen'
        });
      }, 1500);
    } catch (error) {
      console.error('Fehler beim Generieren des PDF:', error);
      setMessage({
        type: 'error',
        text: 'Fehler beim Generieren des PDF'
      });
    }
  };

  const handleCreateNewProtocol = () => {
    navigate('/handover/new');
  };

  const handleCloseMessage = () => {
    setMessage(null);
  };

  const columns: AtlasColumn<HandoverProtocolRow>[] = [
    {
      dataKey: 'deviceInfo',
      label: 'Gerät',
      width: 180
    },
    {
      dataKey: 'userInfo',
      label: 'Benutzer',
      width: 160
    },
    {
      dataKey: 'date',
      label: 'Datum',
      width: 120
    },
    {
      dataKey: 'status',
      label: 'Status',
      width: 160
    },
    {
      dataKey: 'attachments',
      label: 'Anhänge',
      width: 80,
      numeric: true
    },
    {
      dataKey: 'actions',
      label: 'Aktionen',
      width: 120,
      numeric: true
    }
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Übergabeprotokolle
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateNewProtocol}
        >
          Neues Protokoll
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            placeholder="Suche nach Gerät, Benutzer oder Status..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label="Suche zurücksetzen"
                    onClick={() => setSearchTerm('')}
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />

          <Box>
            <Chip
              icon={<CheckIcon />}
              label="Übergeben"
              color="success"
              variant="outlined"
              onClick={() => setSearchTerm('Übergeben')}
              sx={{ mr: 1 }}
            />
            <Chip
              icon={<AccessTimeIcon />}
              label="Beantragt"
              color="warning"
              variant="outlined"
              onClick={() => setSearchTerm('beantragt')}
              sx={{ mr: 1 }}
            />
            <Chip
              icon={<CloseIcon />}
              label="Zurückgegeben"
              color="info"
              variant="outlined"
              onClick={() => setSearchTerm('Zurückgegeben')}
            />
          </Box>
        </Box>
      </Paper>

      {filteredProtocols.length > 0 ? (
        <AtlasTable
          columns={columns}
          rows={filteredProtocols}
          heightPx={500}
        />
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {searchTerm
              ? 'Keine Übergabeprotokolle gefunden, die Ihren Suchkriterien entsprechen.'
              : 'Keine Übergabeprotokolle vorhanden. Erstellen Sie ein neues Protokoll mit dem Button oben rechts.'}
          </Typography>
        </Paper>
      )}

      <Snackbar
        open={message !== null}
        autoHideDuration={6000}
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {message ? (
          <Alert onClose={handleCloseMessage} severity={message.type} sx={{ width: '100%' }}>
            {message.text}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
};

export default HandoverProtocols;
