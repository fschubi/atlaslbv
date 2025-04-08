import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Divider,
  Avatar
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
  Factory as ManufacturerIcon,
  Store as SupplierIcon,
  Room as RoomIcon,
  Place as LocationIcon,
  Devices as DeviceModelIcon,
  Router as SwitchIcon,
  WifiTethering as NetworkOutletIcon,
  SettingsEthernet as PortIcon,
  Email as EmailIcon,
  AdminPanelSettings as SystemIcon
} from '@mui/icons-material';

interface SettingsCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();

  // Alle Einstellungskarten definieren
  const settingsCards: SettingsCard[] = [
    {
      title: 'Abteilungen',
      description: 'Abteilungen und Organisationsstruktur verwalten',
      icon: <BusinessIcon />,
      path: '/settings/departments',
      color: '#1976d2'
    },
    {
      title: 'Kategorien',
      description: 'Gerätekategorien und deren Hierarchie verwalten',
      icon: <CategoryIcon />,
      path: '/settings/categories',
      color: '#2196f3'
    },
    {
      title: 'Hersteller',
      description: 'Hersteller von Geräten und Komponenten verwalten',
      icon: <ManufacturerIcon />,
      path: '/settings/manufacturers',
      color: '#0d47a1'
    },
    {
      title: 'Lieferanten',
      description: 'Lieferanten und Vertriebspartner verwalten',
      icon: <SupplierIcon />,
      path: '/settings/suppliers',
      color: '#283593'
    },
    {
      title: 'Räume',
      description: 'Räume und deren Zuordnung zu Standorten verwalten',
      icon: <RoomIcon />,
      path: '/settings/rooms',
      color: '#4527a0'
    },
    {
      title: 'Standorte',
      description: 'Standorte und Niederlassungen verwalten',
      icon: <LocationIcon />,
      path: '/settings/locations',
      color: '#311b92'
    },
    {
      title: 'Gerätemodelle',
      description: 'Modelle und Typen von Geräten verwalten',
      icon: <DeviceModelIcon />,
      path: '/settings/device-models',
      color: '#512da8'
    },
    {
      title: 'Switches',
      description: 'Netzwerk-Switches und deren Konfiguration verwalten',
      icon: <SwitchIcon />,
      path: '/settings/switches',
      color: '#673ab7'
    },
    {
      title: 'Netzwerkdosen',
      description: 'Netzwerkdosen und deren Zuordnung verwalten',
      icon: <NetworkOutletIcon />,
      path: '/settings/network-outlets',
      color: '#7e57c2'
    },
    {
      title: 'Ports',
      description: 'Netzwerk-Ports und deren Konfiguration verwalten',
      icon: <PortIcon />,
      path: '/settings/ports',
      color: '#9575cd'
    },
    {
      title: 'E-Mail-Benachrichtigungen',
      description: 'E-Mail-Server und Benachrichtigungsregeln konfigurieren',
      icon: <EmailIcon />,
      path: '/settings/email-notifications',
      color: '#5e35b1'
    },
    {
      title: 'Systemeinstellungen',
      description: 'Allgemeine Systemkonfiguration und Wartung',
      icon: <SystemIcon />,
      path: '/settings/system',
      color: '#3949ab'
    }
  ];

  return (
    <Box sx={{ p: 3, bgcolor: '#121212', minHeight: '100vh' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#1976d2',
          color: 'white',
          p: 2,
          borderRadius: '4px 4px 0 0',
          mb: 3,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <SettingsIcon sx={{ fontSize: 28, mr: 2 }} />
        <Typography variant="h5" component="h1">
          Systemeinstellungen
        </Typography>
      </Paper>

      {/* Beschreibung */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1">
          Verwalten Sie hier alle System- und Anwendungseinstellungen. Die Einstellungen sind in verschiedene Kategorien unterteilt.
          Klicken Sie auf eine Karte, um zu den entsprechenden Einstellungen zu gelangen.
        </Typography>
      </Paper>

      {/* Einstellungskarten */}
      <Grid container spacing={2}>
        {settingsCards.map((card, index) => (
          <Grid item key={index} xs={12} sm={6} md={4} lg={3}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                }
              }}
            >
              <CardActionArea
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                onClick={() => navigate(card.path)}
              >
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', p: 2 }}>
                  <Avatar sx={{ bgcolor: card.color, mr: 2 }}>
                    {card.icon}
                  </Avatar>
                  <Typography variant="h6" component="h2">
                    {card.title}
                  </Typography>
                </Box>
                <Divider sx={{ width: '100%' }} />
                <CardContent sx={{ flexGrow: 1, width: '100%' }}>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Settings;
