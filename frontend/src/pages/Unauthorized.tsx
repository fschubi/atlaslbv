import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Zugriff verweigert
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Sie haben keine Berechtigung, auf diese Seite zuzugreifen.
        </Typography>
        {user && (
          <Typography variant="body2" color="text.secondary">
            Ihre aktuelle Rolle: {user.role}
          </Typography>
        )}
        <Button
          variant="contained"
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          Zurück zum Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default Unauthorized;
