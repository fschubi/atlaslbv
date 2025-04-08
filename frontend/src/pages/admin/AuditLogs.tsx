import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import MainLayout from '../../layout/MainLayout';

const AuditLogs: React.FC = () => {
  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Audit-Logs
        </Typography>
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography>
            Hier können Sie alle Systemaktivitäten und Änderungen nachverfolgen.
          </Typography>
        </Paper>
      </Box>
    </MainLayout>
  );
};

export default AuditLogs;
