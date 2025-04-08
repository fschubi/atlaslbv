import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import MainLayout from '../../layout/MainLayout';

const RoleManagement: React.FC = () => {
  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Rollenverwaltung
        </Typography>
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography>
            Hier können Sie Benutzerrollen definieren und verwalten.
          </Typography>
        </Paper>
      </Box>
    </MainLayout>
  );
};

export default RoleManagement;
