import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  FormControlLabel,
  Switch as MuiSwitch,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Snackbar,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,
  Save as SaveIcon,
  Send as TestIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  AccessTime as ScheduleIcon
} from '@mui/icons-material';

interface EmailSettings {
  smtpServer: string;
  smtpPort: number;
  username: string;
  password: string;
  senderEmail: string;
  senderName: string;
  useTLS: boolean;
  useSSL: boolean;
}

interface NotificationRule {
  id: number;
  name: string;
  eventType: string;
  recipients: string[];
  enabled: boolean;
  delayDays?: number;
  template?: string;
}

const EMAIL_EVENT_TYPES = [
  { value: 'device_assigned', label: 'Gerät zugewiesen' },
  { value: 'device_returned', label: 'Gerät zurückgegeben' },
  { value: 'license_expiring', label: 'Lizenz läuft ab' },
  { value: 'certificate_expiring', label: 'Zertifikat läuft ab' },
  { value: 'ticket_assigned', label: 'Ticket zugewiesen' },
  { value: 'ticket_updated', label: 'Ticket aktualisiert' },
  { value: 'ticket_closed', label: 'Ticket geschlossen' },
  { value: 'inventory_started', label: 'Inventur gestartet' },
  { value: 'inventory_completed', label: 'Inventur abgeschlossen' },
  { value: 'warranty_expiring', label: 'Garantie läuft ab' },
  { value: 'todo_due_soon', label: 'Todo-Frist naht' }
];

const EmailNotifications: React.FC = () => {
  // Status für E-Mail-Server-Einstellungen
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpServer: 'smtp.lbv.de',
    smtpPort: 587,
    username: 'atlas-mail@lbv.de',
    password: '********',
    senderEmail: 'atlas-system@lbv.de',
    senderName: 'ATLAS Inventarsystem',
    useTLS: true,
    useSSL: false
  });

  // Status für Benachrichtigungsregeln
  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([
    {
      id: 1,
      name: 'Lizenzablauf',
      eventType: 'license_expiring',
      recipients: ['it-admin@lbv.de', 'license-manager@lbv.de'],
      enabled: true,
      delayDays: 30,
      template: 'Sehr geehrte/r ${USER},\n\ndie Lizenz ${LICENSE_NAME} läuft am ${EXPIRY_DATE} ab.\n\nMit freundlichen Grüßen\nIhr ATLAS-System'
    },
    {
      id: 2,
      name: 'Zertifikatsablauf',
      eventType: 'certificate_expiring',
      recipients: ['it-admin@lbv.de', 'security@lbv.de'],
      enabled: true,
      delayDays: 14,
      template: 'Sehr geehrte/r ${USER},\n\ndas Zertifikat ${CERTIFICATE_NAME} für ${DOMAIN} läuft am ${EXPIRY_DATE} ab.\n\nMit freundlichen Grüßen\nIhr ATLAS-System'
    },
    {
      id: 3,
      name: 'Gerätezuweisung',
      eventType: 'device_assigned',
      recipients: ['it-admin@lbv.de'],
      enabled: true,
      template: 'Sehr geehrte/r ${USER},\n\ndas Gerät ${DEVICE_NAME} wurde ${ASSIGNED_USER} zugewiesen.\n\nMit freundlichen Grüßen\nIhr ATLAS-System'
    }
  ]);

  // Status für neue Regel im Bearbeitungsmodus
  const [editRule, setEditRule] = useState<NotificationRule | null>(null);

  // UI-Status
  const [loading, setLoading] = useState<boolean>(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [expandedPanel, setExpandedPanel] = useState<string | false>('panel1');
  const [testEmailAddress, setTestEmailAddress] = useState<string>('');
  const [testEmailSending, setTestEmailSending] = useState<boolean>(false);

  // Snackbar-Status
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Daten laden
  useEffect(() => {
    // Hier würde normalerweise ein API-Aufruf stehen
    // Für das Beispiel verwenden wir die initialisierten States
    setLoading(false);
  }, []);

  // Panel-Wechsel behandeln
  const handlePanelChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  // E-Mail-Einstellungen aktualisieren
  const handleEmailSettingChange = (field: keyof EmailSettings) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    const value = field === 'smtpPort'
      ? parseInt(event.target.value as string, 10)
      : event.target.value;

    setEmailSettings({
      ...emailSettings,
      [field]: value
    });
  };

  // Switch-Änderungen für E-Mail-Einstellungen
  const handleSwitchChange = (field: 'useTLS' | 'useSSL') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEmailSettings({
      ...emailSettings,
      [field]: event.target.checked
    });
  };

  // E-Mail-Einstellungen speichern
  const saveEmailSettings = () => {
    setLoading(true);

    // Hier würde normalerweise ein API-Aufruf stehen
    setTimeout(() => {
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'E-Mail-Einstellungen wurden gespeichert.',
        severity: 'success'
      });
    }, 1000);
  };

  // Test-E-Mail senden
  const sendTestEmail = () => {
    if (!testEmailAddress) {
      setSnackbar({
        open: true,
        message: 'Bitte geben Sie eine E-Mail-Adresse ein.',
        severity: 'error'
      });
      return;
    }

    setTestEmailSending(true);

    // Hier würde normalerweise ein API-Aufruf stehen
    setTimeout(() => {
      setTestEmailSending(false);
      setSnackbar({
        open: true,
        message: `Test-E-Mail wurde an ${testEmailAddress} gesendet.`,
        severity: 'success'
      });
    }, 2000);
  };

  // Regel bearbeiten
  const startEditRule = (rule: NotificationRule, index: number) => {
    setEditRule({...rule});
    setEditIndex(index);
  };

  // Neue Regel hinzufügen
  const addNewRule = () => {
    const newRule: NotificationRule = {
      id: Math.max(0, ...notificationRules.map(r => r.id)) + 1,
      name: '',
      eventType: '',
      recipients: [],
      enabled: true,
      delayDays: 0,
      template: ''
    };
    setEditRule(newRule);
    setEditIndex(null);
  };

  // Regel aktualisieren
  const updateRule = (field: keyof NotificationRule, value: any) => {
    if (!editRule) return;

    setEditRule({
      ...editRule,
      [field]: value
    });
  };

  // Regel speichern
  const saveRule = () => {
    if (!editRule) return;

    if (!editRule.name || !editRule.eventType || editRule.recipients.length === 0) {
      setSnackbar({
        open: true,
        message: 'Bitte füllen Sie alle Pflichtfelder aus.',
        severity: 'error'
      });
      return;
    }

    if (editIndex !== null) {
      // Vorhandene Regel aktualisieren
      const updatedRules = [...notificationRules];
      updatedRules[editIndex] = editRule;
      setNotificationRules(updatedRules);
    } else {
      // Neue Regel hinzufügen
      setNotificationRules([...notificationRules, editRule]);
    }

    setEditRule(null);
    setEditIndex(null);

    setSnackbar({
      open: true,
      message: 'Benachrichtigungsregel wurde gespeichert.',
      severity: 'success'
    });
  };

  // Regel löschen
  const deleteRule = (id: number) => {
    const updatedRules = notificationRules.filter(r => r.id !== id);
    setNotificationRules(updatedRules);

    setSnackbar({
      open: true,
      message: 'Benachrichtigungsregel wurde gelöscht.',
      severity: 'success'
    });
  };

  // Abbrechen der Regelbearbeitung
  const cancelEditRule = () => {
    setEditRule(null);
    setEditIndex(null);
  };

  // Regel aktivieren/deaktivieren
  const toggleRuleEnabled = (id: number) => {
    const updatedRules = notificationRules.map(rule =>
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    );
    setNotificationRules(updatedRules);
  };

  // Empfänger hinzufügen/entfernen
  const handleRecipientsChange = (value: string) => {
    if (!editRule) return;

    // E-Mail-Adressen durch Komma oder Leerzeichen trennen und bereinigen
    const emails = value.split(/[\s,]+/).filter(email => email.trim() !== '');
    updateRule('recipients', emails);
  };

  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 2, bgcolor: '#121212', minHeight: '100vh' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#1976d2',
          color: 'white',
          p: 1,
          pl: 2,
          borderRadius: '4px 4px 0 0',
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
          <EmailIcon sx={{ mr: 1 }} />
          E-Mail-Benachrichtigungen
        </Typography>
        <Box>
          <Tooltip title="Aktualisieren">
            <IconButton color="inherit" onClick={() => window.location.reload()} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Haupt-Inhalt */}
      <Box sx={{ mb: 4 }}>
        {/* Akkordeon-Panel für E-Mail-Server-Einstellungen */}
        <Accordion
          expanded={expandedPanel === 'panel1'}
          onChange={handlePanelChange('panel1')}
          sx={{
            mb: 2,
            '&::before': { display: 'none' },
            bgcolor: 'background.paper'
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              bgcolor: 'rgba(25, 118, 210, 0.04)',
              borderBottom: 1,
              borderColor: 'divider'
            }}
          >
            <Typography sx={{ display: 'flex', alignItems: 'center' }}>
              <SettingsIcon sx={{ mr: 1 }} />
              E-Mail-Server-Einstellungen
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="SMTP-Server"
                  fullWidth
                  value={emailSettings.smtpServer}
                  onChange={handleEmailSettingChange('smtpServer')}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="SMTP-Port"
                  fullWidth
                  type="number"
                  value={emailSettings.smtpPort}
                  onChange={handleEmailSettingChange('smtpPort')}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Benutzername"
                  fullWidth
                  value={emailSettings.username}
                  onChange={handleEmailSettingChange('username')}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Passwort"
                  fullWidth
                  type="password"
                  value={emailSettings.password}
                  onChange={handleEmailSettingChange('password')}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Absender-E-Mail"
                  fullWidth
                  value={emailSettings.senderEmail}
                  onChange={handleEmailSettingChange('senderEmail')}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Absender-Name"
                  fullWidth
                  value={emailSettings.senderName}
                  onChange={handleEmailSettingChange('senderName')}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <MuiSwitch
                      checked={emailSettings.useTLS}
                      onChange={handleSwitchChange('useTLS')}
                    />
                  }
                  label="TLS verwenden"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <MuiSwitch
                      checked={emailSettings.useSSL}
                      onChange={handleSwitchChange('useSSL')}
                    />
                  }
                  label="SSL verwenden"
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    label="Test-E-Mail an"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="beispiel@lbv.de"
                    sx={{ flexGrow: 1 }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<TestIcon />}
                    onClick={sendTestEmail}
                    disabled={testEmailSending}
                  >
                    {testEmailSending ? 'Wird gesendet...' : 'Test-E-Mail senden'}
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={saveEmailSettings}
                  disabled={loading}
                >
                  Einstellungen speichern
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Akkordeon-Panel für Benachrichtigungsregeln */}
        <Accordion
          expanded={expandedPanel === 'panel2'}
          onChange={handlePanelChange('panel2')}
          sx={{
            '&::before': { display: 'none' },
            bgcolor: 'background.paper'
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              bgcolor: 'rgba(25, 118, 210, 0.04)',
              borderBottom: 1,
              borderColor: 'divider'
            }}
          >
            <Typography sx={{ display: 'flex', alignItems: 'center' }}>
              <ScheduleIcon sx={{ mr: 1 }} />
              Benachrichtigungsregeln
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {editRule ? (
              // Bearbeitungsformular für Regeln
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {editIndex !== null ? 'Regel bearbeiten' : 'Neue Regel erstellen'}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Regelname"
                      fullWidth
                      value={editRule.name}
                      onChange={(e) => updateRule('name', e.target.value)}
                      required
                      placeholder="z.B. Lizenzablauf-Benachrichtigung"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Ereignistyp</InputLabel>
                      <Select
                        value={editRule.eventType}
                        onChange={(e) => updateRule('eventType', e.target.value)}
                        label="Ereignistyp"
                      >
                        {EMAIL_EVENT_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Empfänger (durch Komma getrennt)"
                      fullWidth
                      value={editRule.recipients.join(', ')}
                      onChange={(e) => handleRecipientsChange(e.target.value)}
                      required
                      placeholder="admin@lbv.de, it-team@lbv.de"
                      helperText="Geben Sie eine oder mehrere E-Mail-Adressen ein, getrennt durch Komma"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Verzögerung (Tage)"
                      fullWidth
                      type="number"
                      value={editRule.delayDays || 0}
                      onChange={(e) => updateRule('delayDays', parseInt(e.target.value, 10))}
                      helperText="Anzahl der Tage vor dem Ereignis, an dem die Benachrichtigung gesendet wird (0 = sofort)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <MuiSwitch
                          checked={editRule.enabled}
                          onChange={(e) => updateRule('enabled', e.target.checked)}
                        />
                      }
                      label="Regel aktiv"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="E-Mail-Vorlage"
                      fullWidth
                      multiline
                      rows={6}
                      value={editRule.template || ''}
                      onChange={(e) => updateRule('template', e.target.value)}
                      placeholder="Sehr geehrte/r ${USER},

Die Lizenz ${LICENSE_NAME} läuft am ${EXPIRY_DATE} ab.

Mit freundlichen Grüßen
Ihr ATLAS-System"
                      helperText="Verwenden Sie Platzhalter wie ${USER}, ${DEVICE_NAME}, ${EXPIRY_DATE} usw. je nach Ereignistyp"
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={cancelEditRule}
                    >
                      Abbrechen
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={saveRule}
                    >
                      Regel speichern
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              // Liste der Regeln
              <Box>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<EmailIcon />}
                    onClick={addNewRule}
                  >
                    Neue Benachrichtigungsregel
                  </Button>
                </Box>

                {notificationRules.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Keine Benachrichtigungsregeln vorhanden. Erstellen Sie eine neue Regel, um automatische E-Mail-Benachrichtigungen zu aktivieren.
                  </Alert>
                ) : (
                  notificationRules.map((rule, index) => (
                    <Paper
                      key={rule.id}
                      sx={{
                        p: 2,
                        mb: 2,
                        border: '1px solid',
                        borderColor: rule.enabled ? 'success.dark' : 'text.disabled',
                        opacity: rule.enabled ? 1 : 0.7,
                        transition: 'all 0.3s'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" color={rule.enabled ? 'text.primary' : 'text.secondary'}>
                          {rule.name}
                        </Typography>
                        <Box>
                          <FormControlLabel
                            control={
                              <MuiSwitch
                                checked={rule.enabled}
                                onChange={() => toggleRuleEnabled(rule.id)}
                                color="success"
                              />
                            }
                            label={rule.enabled ? "Aktiv" : "Inaktiv"}
                          />
                        </Box>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2">Ereignistyp:</Typography>
                          <Typography>
                            {EMAIL_EVENT_TYPES.find(t => t.value === rule.eventType)?.label || rule.eventType}
                          </Typography>
                        </Grid>
                        {rule.delayDays !== undefined && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">Vorlaufzeit:</Typography>
                            <Typography>
                              {rule.delayDays} {rule.delayDays === 1 ? 'Tag' : 'Tage'}
                            </Typography>
                          </Grid>
                        )}
                        <Grid item xs={12}>
                          <Typography variant="subtitle2">Empfänger:</Typography>
                          <Typography>
                            {rule.recipients.join(', ')}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => deleteRule(rule.id)}
                        >
                          Löschen
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => startEditRule(rule, index)}
                        >
                          Bearbeiten
                        </Button>
                      </Box>
                    </Paper>
                  ))
                )}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>

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

export default EmailNotifications;
