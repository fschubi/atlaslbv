import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Computer as ComputerIcon,
  Person as PersonIcon,
  Key as KeyIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Headset as HeadsetIcon,
  DeveloperBoard as DeveloperBoardIcon,
  Devices as DevicesIcon,
  VpnKey as LicensesIcon,
  Verified as CertificatesIcon,
  Extension as AccessoriesIcon,
  Assignment as TodosIcon,
  ConfirmationNumber as TicketsIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Mock-Daten für das Dashboard
  const statistics = {
    devices: {
      total: 387,
      active: 324,
      maintenance: 18,
      inactive: 45
    },
    users: {
      total: 156,
      active: 143,
      inactive: 13
    },
    licenses: {
      total: 245,
      active: 212,
      expiringSoon: 18,
      expired: 15
    },
    certificates: {
      total: 48,
      valid: 42,
      expiringSoon: 4,
      expired: 2
    }
  };

  // Daten für Geräte-Tortendiagramm
  const deviceStatusData = [
    { name: 'Aktiv', value: statistics.devices.active, color: '#4caf50' },
    { name: 'Wartung', value: statistics.devices.maintenance, color: '#ff9800' },
    { name: 'Inaktiv', value: statistics.devices.inactive, color: '#f44336' }
  ];

  // Daten für Lizenzen-Tortendiagramm
  const licenseStatusData = [
    { name: 'Aktiv', value: statistics.licenses.active, color: '#4caf50' },
    { name: 'Läuft bald ab', value: statistics.licenses.expiringSoon, color: '#ff9800' },
    { name: 'Abgelaufen', value: statistics.licenses.expired, color: '#f44336' }
  ];

  const recentActivities = [
    { id: 1, type: 'Gerät', action: 'Hinzugefügt', name: 'HP EliteBook 840 G8', user: 'Maria Weber', date: '03.04.2025' },
    { id: 2, type: 'Benutzer', action: 'Bearbeitet', name: 'Thomas Schmidt', user: 'Admin', date: '02.04.2025' },
    { id: 3, type: 'Lizenz', action: 'Erneuert', name: 'Adobe Creative Cloud', user: 'Admin', date: '01.04.2025' },
    { id: 4, type: 'Gerät', action: 'Zugewiesen', name: 'Dell Latitude 7420', user: 'Frank Meyer', date: '31.03.2025' },
    { id: 5, type: 'Zertifikat', action: 'Abgelaufen', name: 'SSL-Zertifikat lbv-cloud.de', user: 'System', date: '30.03.2025' },
  ];

  const upcomingExpirations = [
    { id: 1, type: 'Lizenz', name: 'Microsoft 365 E3', expiresIn: '15 Tage', count: 25 },
    { id: 2, type: 'Zertifikat', name: 'VPN-Client Zertifikat', expiresIn: '23 Tage', count: 1 },
    { id: 3, type: 'Lizenz', name: 'AutoCAD 2023', expiresIn: '30 Tage', count: 5 },
    { id: 4, type: 'Gerät', name: 'HP Drucker Garantie', expiresIn: '45 Tage', count: 8 },
  ];

  const todoItems = [
    { id: 1, title: 'Inventur Q2 abschließen', priority: 'Hoch', status: 'In Bearbeitung' },
    { id: 2, title: 'Neue Geräte registrieren', priority: 'Mittel', status: 'Offen' },
    { id: 3, title: 'Lizenzen überprüfen', priority: 'Niedrig', status: 'Offen' },
    { id: 4, title: 'Zertifikate erneuern', priority: 'Hoch', status: 'Offen' },
  ];

  // Kategorien nach Geräteanzahl
  const devicesByCategory = [
    { id: 1, category: 'Laptops', count: 187 },
    { id: 2, category: 'Desktop PCs', count: 82 },
    { id: 3, category: 'Monitore', count: 215 },
    { id: 4, category: 'Drucker', count: 35 },
    { id: 5, category: 'Server', count: 12 }
  ];

  // Standorte nach Geräteanzahl
  const devicesByLocation = [
    { id: 1, location: 'München', count: 210 },
    { id: 2, location: 'Berlin', count: 89 },
    { id: 3, location: 'Hamburg', count: 57 },
    { id: 4, location: 'Frankfurt', count: 31 }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Hoch': return '#f44336';
      case 'Mittel': return '#ff9800';
      case 'Niedrig': return '#8bc34a';
      default: return '#8bc34a';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Erledigt': return '#4caf50';
      case 'In Bearbeitung': return '#2196f3';
      case 'Offen': return '#757575';
      default: return '#757575';
    }
  };

  // Anpassbarer Tooltip für Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          sx={{
            bgcolor: '#333',
            color: 'white',
            p: 1.5,
            border: '1px solid #444',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}
        >
          <Typography variant="body2">{`${payload[0].name}: ${payload[0].value}`}</Typography>
        </Paper>
      );
    }
    return null;
  };

  const quickStats = [
    { label: 'Geräte', value: '42', icon: <DevicesIcon /> },
    { label: 'Lizenzen', value: '15', icon: <LicensesIcon /> },
    { label: 'Zertifikate', value: '8', icon: <CertificatesIcon /> },
    { label: 'Zubehör', value: '23', icon: <AccessoriesIcon /> }
  ];

  return (
    <Box sx={{ p: 3, bgcolor: '#121212', minHeight: '100vh' }}>
      <Typography variant="h4" color="white" gutterBottom sx={{ mb: 3, fontWeight: 500 }}>
        Willkommen, {user?.name || 'Benutzer'}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Quick Stats */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {quickStats.map((stat) => (
              <Grid item xs={12} sm={6} md={3} key={stat.label}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: 'primary.main',
                      borderRadius: 1,
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h6">{stat.value}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Statistiken */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1E1E1E', color: 'white', height: '100%', border: '1px solid #333' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2 }}>
                <ComputerIcon sx={{ fontSize: 48, color: '#1976d2', mb: 1 }} />
                <Typography variant="h4" sx={{ mb: 0, fontWeight: 500 }}>
                  {statistics.devices.total}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: '#aaa' }}>
                  Geräte
                </Typography>
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Aktiv</span>
                    <span>{statistics.devices.active}</span>
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(statistics.devices.active / statistics.devices.total) * 100}
                    sx={{
                      mb: 1,
                      backgroundColor: 'rgba(25, 118, 210, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#1976d2'
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1E1E1E', color: 'white', height: '100%', border: '1px solid #333' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2 }}>
                <PersonIcon sx={{ fontSize: 48, color: '#9c27b0', mb: 1 }} />
                <Typography variant="h4" sx={{ mb: 0, fontWeight: 500 }}>
                  {statistics.users.total}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: '#aaa' }}>
                  Benutzer
                </Typography>
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Aktiv</span>
                    <span>{statistics.users.active}</span>
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(statistics.users.active / statistics.users.total) * 100}
                    sx={{
                      mb: 1,
                      backgroundColor: 'rgba(156, 39, 176, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#9c27b0'
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1E1E1E', color: 'white', height: '100%', border: '1px solid #333' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2 }}>
                <KeyIcon sx={{ fontSize: 48, color: '#ff9800', mb: 1 }} />
                <Typography variant="h4" sx={{ mb: 0, fontWeight: 500 }}>
                  {statistics.licenses.total}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: '#aaa' }}>
                  Lizenzen
                </Typography>
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Aktiv</span>
                    <span>{statistics.licenses.active}</span>
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(statistics.licenses.active / statistics.licenses.total) * 100}
                    sx={{
                      mb: 1,
                      backgroundColor: 'rgba(255, 152, 0, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#ff9800'
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1E1E1E', color: 'white', height: '100%', border: '1px solid #333' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2 }}>
                <SecurityIcon sx={{ fontSize: 48, color: '#4caf50', mb: 1 }} />
                <Typography variant="h4" sx={{ mb: 0, fontWeight: 500 }}>
                  {statistics.certificates.total}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: '#aaa' }}>
                  Zertifikate
                </Typography>
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Gültig</span>
                    <span>{statistics.certificates.valid}</span>
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(statistics.certificates.valid / statistics.certificates.total) * 100}
                    sx={{
                      mb: 1,
                      backgroundColor: 'rgba(76, 175, 80, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#4caf50'
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Diagramme */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Geräte nach Status */}
          <Grid item xs={12} sm={6}>
            <Card sx={{ bgcolor: '#1E1E1E', color: 'white', border: '1px solid #333' }}>
              <CardHeader
                title="Geräte nach Status"
                sx={{
                  borderBottom: '1px solid #333',
                  '& .MuiCardHeader-title': {
                    fontSize: '1.1rem',
                    fontWeight: 500
                  }
                }}
              />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {deviceStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Lizenzen */}
          <Grid item xs={12} sm={6}>
            <Card sx={{ bgcolor: '#1E1E1E', color: 'white', border: '1px solid #333' }}>
              <CardHeader
                title="Lizenzen nach Status"
                sx={{
                  borderBottom: '1px solid #333',
                  '& .MuiCardHeader-title': {
                    fontSize: '1.1rem',
                    fontWeight: 500
                  }
                }}
              />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={licenseStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {licenseStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Zusätzliche Tabellen für Geräte nach Kategorie und Standort */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Geräte nach Kategorie */}
          <Grid item xs={12} sm={6}>
            <Card sx={{ bgcolor: '#1E1E1E', color: 'white', border: '1px solid #333' }}>
              <CardHeader
                title="Geräte nach Kategorie"
                sx={{
                  borderBottom: '1px solid #333',
                  '& .MuiCardHeader-title': {
                    fontSize: '1.1rem',
                    fontWeight: 500
                  }
                }}
              />
              <CardContent sx={{ p: 0 }}>
                <List sx={{ p: 0 }}>
                  {devicesByCategory.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <ListItem sx={{ px: 2, py: 1 }}>
                        <ListItemText
                          primary={item.category}
                          sx={{ flex: '1 1 70%' }}
                        />
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {item.count}
                        </Typography>
                      </ListItem>
                      {index < devicesByCategory.length - 1 && <Divider sx={{ bgcolor: '#333' }} />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Geräte nach Standort */}
          <Grid item xs={12} sm={6}>
            <Card sx={{ bgcolor: '#1E1E1E', color: 'white', border: '1px solid #333' }}>
              <CardHeader
                title="Geräte nach Standort"
                sx={{
                  borderBottom: '1px solid #333',
                  '& .MuiCardHeader-title': {
                    fontSize: '1.1rem',
                    fontWeight: 500
                  }
                }}
              />
              <CardContent sx={{ p: 0 }}>
                <List sx={{ p: 0 }}>
                  {devicesByLocation.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <ListItem sx={{ px: 2, py: 1 }}>
                        <ListItemText
                          primary={item.location}
                          sx={{ flex: '1 1 70%' }}
                        />
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {item.count}
                        </Typography>
                      </ListItem>
                      {index < devicesByLocation.length - 1 && <Divider sx={{ bgcolor: '#333' }} />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Inhaltskarten */}
        <Grid container spacing={3}>
          {/* Letzte Aktivitäten */}
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#1E1E1E', color: 'white', height: '100%', border: '1px solid #333' }}>
              <CardHeader
                title="Aktivitäten"
                sx={{
                  borderBottom: '1px solid #333',
                  '& .MuiCardHeader-title': {
                    fontSize: '1.1rem',
                    fontWeight: 500
                  }
                }}
              />
              <CardContent sx={{ p: 0 }}>
                <List>
                  {recentActivities.map((activity) => (
                    <ListItem key={activity.id} divider>
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="body1">{activity.name}</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Chip
                              label={activity.type}
                              size="small"
                              sx={{ bgcolor: '#333', color: 'white' }}
                            />
                            <Chip
                              label={activity.action}
                              size="small"
                              color="primary"
                              sx={{ height: 20 }}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ color: '#aaa', fontSize: '0.875rem' }}>
                            {activity.user} • {activity.date}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Offene Aufgaben */}
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#1E1E1E', color: 'white', height: '100%', border: '1px solid #333' }}>
              <CardHeader
                title="Offene Aufgaben"
                sx={{
                  borderBottom: '1px solid #333',
                  '& .MuiCardHeader-title': {
                    fontSize: '1.1rem',
                    fontWeight: 500
                  }
                }}
              />
              <CardContent sx={{ p: 0 }}>
                <List>
                  {todoItems.map((item) => (
                    <ListItem key={item.id} divider>
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="body1">{item.title}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={item.priority}
                            size="small"
                            sx={{
                              bgcolor: getPriorityColor(item.priority),
                              color: 'white',
                              height: 20
                            }}
                          />
                          <Chip
                            label={item.status}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(item.status),
                              color: 'white',
                              height: 20
                            }}
                          />
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
