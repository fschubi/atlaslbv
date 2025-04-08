import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Alert,
  Snackbar,
  Chip,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Tab,
  Tabs
} from '@mui/material';
import {
  AssignmentTurnedIn as AssignmentIcon,
  Person as PersonIcon,
  Devices as DevicesIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  GetApp as DownloadIcon,
  Print as PrintIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import SignatureCanvas from '../components/SignatureCanvas';
import Checklist, { ChecklistItemData } from '../components/ChecklistItem';
import DocumentUploader from '../components/DocumentUploader';
import { handoverApi } from '../utils/api';

// Schnittstelle für den TabPanel
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`protocol-tabpanel-${index}`}
      aria-labelledby={`protocol-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const HandoverProtocolDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [protocol, setProtocol] = useState<any>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemData[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);

  // Lade Protokoll-Daten beim Seitenaufruf
  useEffect(() => {
    if (id && id !== 'new') {
      loadProtocolData();
    } else {
      // Neues Protokoll
      setIsLoading(false);
      setProtocol({
        id: 'new',
        deviceId: '',
        deviceName: '',
        deviceType: '',
        userId: '',
        userName: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Entwurf',
        notes: '',
        checklistItems: [
          { id: 'check-1', text: 'Gerät ist funktionsfähig', checked: false },
          { id: 'check-2', text: 'Ladekabel vorhanden', checked: false },
          { id: 'check-3', text: 'Keine sichtbaren Schäden', checked: false },
          { id: 'check-4', text: 'Zugangsdaten übergeben', checked: false }
        ],
        attachments: []
      });
      setChecklistItems([
        { id: 'check-1', text: 'Gerät ist funktionsfähig', checked: false },
        { id: 'check-2', text: 'Ladekabel vorhanden', checked: false },
        { id: 'check-3', text: 'Keine sichtbaren Schäden', checked: false },
        { id: 'check-4', text: 'Zugangsdaten übergeben', checked: false }
      ]);
      setIsEditing(true);
    }
  }, [id]);

  const loadProtocolData = async () => {
    try {
      setIsLoading(true);
      if (id) {
        const data = await handoverApi.getHandoverProtocolById(id);
        setProtocol(data);
        setChecklistItems(data.checklistItems || []);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden des Übergabeprotokolls:', error);
      setMessage({
        type: 'error',
        text: 'Fehler beim Laden des Übergabeprotokolls'
      });
      setIsLoading(false);
    }
  };

  const handleSaveProtocol = async () => {
    try {
      setIsLoading(true);

      // Bereite aktualisierte Daten vor
      const updatedProtocol = {
        ...protocol,
        checklistItems
      };

      let response;

      if (id === 'new') {
        // Neues Protokoll erstellen
        response = await handoverApi.createHandoverProtocol(updatedProtocol);
        setMessage({
          type: 'success',
          text: 'Übergabeprotokoll erfolgreich erstellt'
        });
        navigate(`/handover/${response.data.id}`);
      } else {
        // Bestehendes Protokoll aktualisieren
        response = await handoverApi.updateHandoverProtocol(id, updatedProtocol);
        setMessage({
          type: 'success',
          text: 'Übergabeprotokoll erfolgreich aktualisiert'
        });
      }

      setProtocol(response.data);
      setIsEditing(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Fehler beim Speichern des Übergabeprotokolls:', error);
      setMessage({
        type: 'error',
        text: 'Fehler beim Speichern des Übergabeprotokolls'
      });
      setIsLoading(false);
    }
  };

  const handleSaveSignature = async (signatureData: string) => {
    try {
      setIsLoading(true);

      if (id && id !== 'new') {
        const response = await handoverApi.addSignature(id, signatureData);

        // Protokoll aktualisieren
        setProtocol((prev: any) => ({
          ...prev,
          signatureUrl: response.data.signatureUrl,
          confirmedByUser: true,
          status: 'Übergeben'
        }));

        setMessage({
          type: 'success',
          text: 'Unterschrift erfolgreich hinzugefügt'
        });
      }

      setSignatureDialogOpen(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Fehler beim Speichern der Unterschrift:', error);
      setMessage({
        type: 'error',
        text: 'Fehler beim Speichern der Unterschrift'
      });
      setIsLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setIsLoading(true);

      if (id && id !== 'new') {
        const response = await handoverApi.generatePDF(id);

        // In echter Anwendung würde hier ein Download erfolgen

        setMessage({
          type: 'success',
          text: 'PDF erfolgreich generiert und heruntergeladen'
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Fehler beim Generieren des PDF:', error);
      setMessage({
        type: 'error',
        text: 'Fehler beim Generieren des PDF'
      });
      setIsLoading(false);
    }
  };

  const handleUploadComplete = (files: any[]) => {
    // Dokumente zum Protokoll hinzufügen
    setProtocol((prev: any) => ({
      ...prev,
      attachments: [
        ...(prev.attachments || []),
        ...files.map(file => ({
          id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: file.file.name,
          type: file.file.type
        }))
      ]
    }));

    setUploadDialogOpen(false);

    setMessage({
      type: 'success',
      text: `${files.length} Dokument(e) erfolgreich hochgeladen`
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCloseMessage = () => {
    setMessage(null);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!protocol) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Übergabeprotokoll konnte nicht gefunden werden.
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/handover')}
          sx={{ mt: 2 }}
        >
          Zurück zur Übersicht
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header und Aktionen */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/handover')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            {id === 'new' ? 'Neues Übergabeprotokoll' : `Übergabeprotokoll: ${protocol.deviceName}`}
          </Typography>
          <Chip
            label={protocol.status}
            color={
              protocol.status === 'Übergeben' ? 'success' :
              protocol.status === 'Rückgabe beantragt' ? 'warning' :
              protocol.status === 'Zurückgegeben' ? 'info' :
              protocol.status === 'Entwurf' ? 'default' : 'primary'
            }
            size="small"
            sx={{ ml: 2 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isEditing ? (
            <>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
                disabled={protocol.status === 'Übergeben' || protocol.status === 'Zurückgegeben'}
              >
                Bearbeiten
              </Button>

              {protocol.id !== 'new' && !protocol.confirmedByUser && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AssignmentIcon />}
                  onClick={() => setSignatureDialogOpen(true)}
                >
                  Unterschreiben
                </Button>
              )}

              {protocol.id !== 'new' && protocol.confirmedByUser && (
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<DownloadIcon />}
                  onClick={handleGeneratePDF}
                >
                  PDF
                </Button>
              )}
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveProtocol}
            >
              Speichern
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs für verschiedene Ansichten */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab
            icon={<AssignmentIcon />}
            label="Protokoll"
            id="protocol-tab-0"
            aria-controls="protocol-tabpanel-0"
          />
          <Tab
            icon={<DescriptionIcon />}
            label={`Dokumente (${protocol.attachments?.length || 0})`}
            id="protocol-tab-1"
            aria-controls="protocol-tabpanel-1"
          />
        </Tabs>
      </Paper>

      {/* Protokoll-Details */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Linke Spalte - Geräteinformationen */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <DevicesIcon />
                  </Avatar>
                }
                title="Geräteinformationen"
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Gerätename</Typography>
                    <Typography variant="body1">{protocol.deviceName || 'Nicht angegeben'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Typ</Typography>
                    <Typography variant="body1">{protocol.deviceType || 'Nicht angegeben'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Seriennummer</Typography>
                    <Typography variant="body1">{protocol.deviceSerialNumber || 'Nicht angegeben'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Inventarnummer</Typography>
                    <Typography variant="body1">{protocol.deviceInventoryNumber || 'Nicht angegeben'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Standort</Typography>
                    <Typography variant="body1">{protocol.location || 'Nicht angegeben'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Rechte Spalte - Benutzerinformationen */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <PersonIcon />
                  </Avatar>
                }
                title="Benutzerinformationen"
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{protocol.userName || 'Nicht angegeben'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Abteilung</Typography>
                    <Typography variant="body1">{protocol.userDepartment || 'Nicht angegeben'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">E-Mail</Typography>
                    <Typography variant="body1">{protocol.userEmail || 'Nicht angegeben'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Volle Breite - Protokolldetails */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardHeader
                title="Protokolldetails"
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Datum</Typography>
                    <Typography variant="body1">
                      {new Date(protocol.date).toLocaleDateString('de-DE')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip
                      label={protocol.status}
                      color={
                        protocol.status === 'Übergeben' ? 'success' :
                        protocol.status === 'Rückgabe beantragt' ? 'warning' :
                        protocol.status === 'Zurückgegeben' ? 'info' :
                        protocol.status === 'Entwurf' ? 'default' : 'primary'
                      }
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Art</Typography>
                    <Typography variant="body1">{protocol.transferType || 'Übergabe'}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Bestätigt</Typography>
                    {protocol.confirmedByUser ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body1">Ja</Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CancelIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body1">Nein</Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Notizen</Typography>
                    <Typography variant="body1">{protocol.notes || 'Keine Notizen'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Volle Breite - Checkliste */}
          <Grid item xs={12}>
            <Box sx={{ mb: 3 }}>
              <Checklist
                items={checklistItems}
                onChange={setChecklistItems}
                editable={isEditing}
                title="Checkliste zur Geräteübergabe"
              />
            </Box>
          </Grid>

          {/* Unterschrift, wenn vorhanden */}
          {protocol.signatureUrl && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Unterschrift
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <img
                    src={protocol.signatureUrl}
                    alt="Unterschrift"
                    style={{ maxWidth: '400px', maxHeight: '200px', border: '1px solid #ddd' }}
                  />
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Dokumente */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Angehängte Dokumente</Typography>
          <Button
            variant="contained"
            startIcon={<DescriptionIcon />}
            onClick={() => setUploadDialogOpen(true)}
            disabled={protocol.status === 'Zurückgegeben'}
          >
            Dokument hinzufügen
          </Button>
        </Box>

        {protocol.attachments && protocol.attachments.length > 0 ? (
          <Grid container spacing={2}>
            {protocol.attachments.map((attachment: any) => (
              <Grid item xs={12} sm={6} md={4} key={attachment.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1" noWrap>
                        {attachment.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {attachment.type}
                    </Typography>
                  </CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                    <Tooltip title="Herunterladen">
                      <IconButton size="small" color="primary">
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Keine Dokumente angehängt.
            </Typography>
            <Button
              variant="contained"
              startIcon={<DescriptionIcon />}
              onClick={() => setUploadDialogOpen(true)}
              sx={{ mt: 2 }}
              disabled={protocol.status === 'Zurückgegeben'}
            >
              Dokument hinzufügen
            </Button>
          </Paper>
        )}
      </TabPanel>

      {/* Unterschrift-Dialog */}
      <Dialog
        open={signatureDialogOpen}
        onClose={() => setSignatureDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Übergabeprotokoll unterschreiben</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Mit Ihrer Unterschrift bestätigen Sie, dass Sie das Gerät "{protocol.deviceName}"
            gemäß den angegebenen Bedingungen erhalten haben.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <SignatureCanvas
              width={500}
              height={200}
              label="Unterschrift hier einzeichnen"
              onSave={handleSaveSignature}
              showControls={true}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignatureDialogOpen(false)}>
            Abbrechen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dokument-Upload-Dialog */}
      <DocumentUploader
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUploadComplete={handleUploadComplete}
        relatedEntityType="handover"
        relatedEntityId={protocol.id}
        isModal={true}
      />

      {/* Snackbar für Nachrichten */}
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

export default HandoverProtocolDetail;
