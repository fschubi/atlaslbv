import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RequestPasswordReset: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.post('/api/auth/request-password-reset', { email });
      setSuccess(true);
    } catch (err) {
      setError('Fehler beim Anfordern des Passwort-Resets. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

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
          gap: 3
        }}
      >
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Passwort zurücksetzen
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success ? (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              Eine E-Mail mit weiteren Anweisungen wurde an Ihre E-Mail-Adresse gesendet.
            </Alert>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/login')}
            >
              Zurück zum Login
            </Button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="E-Mail-Adresse"
              type="email"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              sx={{ mb: 3 }}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ height: 48 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Passwort zurücksetzen'}
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default RequestPasswordReset;
