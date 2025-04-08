import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import MainLayout from '../../layout/MainLayout';

const SystemSettings: React.FC = () => {
  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Systemeinstellungen
        </Typography>
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography>
            Hier können Sie die grundlegenden Einstellungen des ATLAS-Systems konfigurieren.
          </Typography>
        </Paper>
      </Box>
    </MainLayout>
  );
};

export default SystemSettings;
