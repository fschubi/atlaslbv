import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import MainLayout from '../../layout/MainLayout';
import { Backup as BackupIcon, Restore as RestoreIcon } from '@mui/icons-material';

const BackupRestore: React.FC = () => {
  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Backup & Wiederherstellung
        </Typography>
        <Paper sx={{ p: 3, mt: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Datenbank-Backup
            </Typography>
            <Typography paragraph>
              Erstellen Sie ein vollständiges Backup der ATLAS-Datenbank.
            </Typography>
            <Button
              variant="contained"
              startIcon={<BackupIcon />}
              sx={{ mr: 2 }}
            >
              Backup erstellen
            </Button>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Datenbank-Wiederherstellung
            </Typography>
            <Typography paragraph>
              Stellen Sie ein vorhandenes Backup wieder her.
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<RestoreIcon />}
            >
              Wiederherstellung starten
            </Button>
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
};

export default BackupRestore;
