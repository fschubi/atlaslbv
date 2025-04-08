import React from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Divider
} from '@mui/material';
import { User, UserGroup } from '../../types/user';
import AtlasTable from '../AtlasTable';

interface UserGroupsProps {
  user: User;
  userGroups: UserGroup[];
  availableGroups: UserGroup[];
  loading: boolean;
  onAddToGroups: (groupIds: number[]) => void;
  onRemoveFromGroup: (groupId: number) => void;
}

export const UserGroups: React.FC<UserGroupsProps> = ({
  user,
  userGroups,
  availableGroups,
  loading,
  onAddToGroups,
  onRemoveFromGroup
}) => {
  const [selectedGroups, setSelectedGroups] = React.useState<number[]>([]);

  const handleGroupSelect = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedGroups(event.target.value as number[]);
  };

  const groupColumns = [
    { label: 'ID', dataKey: 'id', numeric: true, width: 80 },
    { label: 'Name', dataKey: 'name', width: 200 },
    { label: 'Beschreibung', dataKey: 'description', width: 300 },
    { label: 'Hinzugefügt am', dataKey: 'added_at', width: 180 },
    { label: 'Hinzugefügt von', dataKey: 'added_by', width: 150 }
  ];

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">
          Gruppen für Benutzer: {user.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user.email}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Benutzer zu Gruppen hinzufügen
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <FormControl fullWidth>
              <InputLabel id="group-select-label">Gruppen auswählen</InputLabel>
              <Select
                labelId="group-select-label"
                multiple
                value={selectedGroups}
                onChange={handleGroupSelect}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((groupId) => {
                      const group = availableGroups.find(g => g.id === groupId);
                      return (
                        <Chip
                          key={groupId}
                          label={group ? group.name : groupId}
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {availableGroups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => onAddToGroups(selectedGroups)}
              disabled={selectedGroups.length === 0 || loading}
              fullWidth
            >
              Zu Gruppen hinzufügen
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Aktuelle Gruppenmitgliedschaften
      </Typography>

      <AtlasTable
        columns={groupColumns}
        rows={userGroups}
        loading={loading}
        actions={[
          {
            icon: <DeleteIcon />,
            tooltip: 'Aus Gruppe entfernen',
            onClick: (row) => onRemoveFromGroup(row.id)
          }
        ]}
      />
    </>
  );
};
