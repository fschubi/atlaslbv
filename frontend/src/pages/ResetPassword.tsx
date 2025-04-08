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
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token,
        password
      });
      setSuccess(true);
    } catch (err) {
      setError('Fehler beim Zurücksetzen des Passworts. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
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
          <Alert severity="error">
            Ungültiger oder abgelaufener Token. Bitte fordern Sie einen neuen Link an.
          </Alert>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate('/request-password-reset')}
          >
            Neuen Link anfordern
          </Button>
        </Paper>
      </Box>
    );
  }

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
          Neues Passwort setzen
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success ? (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              Ihr Passwort wurde erfolgreich zurückgesetzt.
            </Alert>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/login')}
            >
              Zum Login
            </Button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Neues Passwort"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Passwort bestätigen"
              type="password"
              variant="outlined"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
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
              {loading ? <CircularProgress size={24} /> : 'Passwort ändern'}
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default ResetPassword;
