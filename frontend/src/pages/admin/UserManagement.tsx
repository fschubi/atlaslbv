import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import MainLayout from '../../layout/MainLayout';

const UserManagement: React.FC = () => {
  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Benutzerverwaltung
        </Typography>
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography>
            Hier können Sie Benutzer verwalten, erstellen, bearbeiten und löschen.
          </Typography>
        </Paper>
      </Box>
    </MainLayout>
  );
};

export default UserManagement;
