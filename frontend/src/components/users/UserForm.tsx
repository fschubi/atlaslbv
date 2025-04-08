import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch
} from '@mui/material';
import { User, Role } from '../../types/user';

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (userData: Partial<User>) => void;
  user?: User;
  roles: Role[];
  loading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  open,
  onClose,
  onSubmit,
  user,
  roles,
  loading = false
}) => {
  const [formData, setFormData] = React.useState<Partial<User>>({
    username: '',
    name: '',
    email: '',
    role_id: 0,
    is_active: true,
    password: '',
    confirmPassword: ''
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        password: '',
        confirmPassword: ''
      });
    } else {
      setFormData({
        username: '',
        name: '',
        email: '',
        role_id: 0,
        is_active: true,
        password: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleChange = (field: keyof User | 'confirmPassword') => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    const value = event.target.type === 'checkbox'
      ? (event.target as HTMLInputElement).checked
      : event.target.value;

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const { confirmPassword, ...submitData } = formData;
    onSubmit(submitData);
  };

  const isFormValid = () => {
    const { username, name, email, role_id, password, confirmPassword } = formData;
    const isCreateMode = !user;

    return Boolean(
      username?.trim() &&
      name?.trim() &&
      email?.trim() &&
      role_id &&
      (!isCreateMode || (password && password === confirmPassword))
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {user ? 'Benutzer bearbeiten' : 'Neuen Benutzer erstellen'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                label="Benutzername"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.username}
                onChange={handleChange('username')}
                required
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Name"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.name}
                onChange={handleChange('name')}
                required
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="E-Mail"
                type="email"
                fullWidth
                variant="outlined"
                value={formData.email}
                onChange={handleChange('email')}
                required
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="role-label">Rolle</InputLabel>
                <Select
                  labelId="role-label"
                  value={formData.role_id}
                  onChange={handleChange('role_id')}
                  label="Rolle"
                  required
                  disabled={loading}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={user ? 'Neues Passwort (optional)' : 'Passwort'}
                type="password"
                fullWidth
                variant="outlined"
                value={formData.password}
                onChange={handleChange('password')}
                required={!user}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Passwort bestätigen"
                type="password"
                fullWidth
                variant="outlined"
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                required={!user || Boolean(formData.password)}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleChange('is_active')}
                    color="primary"
                    disabled={loading}
                  />
                }
                label="Benutzer ist aktiv"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!isFormValid() || loading}
          >
            {user ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
