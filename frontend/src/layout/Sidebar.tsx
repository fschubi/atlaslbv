import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Drawer,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Computer as DevicesIcon,
  VpnKey as LicensesIcon,
  VerifiedUser as CertificatesIcon,
  Devices as AccessoriesIcon,
  Description as DocumentsIcon,
  Inventory as InventoryIcon,
  ConfirmationNumber as TicketsIcon,
  CheckCircle as TodosIcon,
  AssessmentOutlined as ReportsIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Person as UsersIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface SubMenuItem {
  text: string;
  path: string;
  icon?: React.ReactNode;
}

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  expandable?: boolean;
  adminOnly?: boolean;
  subItems?: SubMenuItem[];
}

const drawerWidthOpen = 240;
const drawerWidthCollapsed = 72;

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const menuItems: MenuItem[] = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Geräte', icon: <DevicesIcon />, path: '/devices' },
    { text: 'Lizenzen', icon: <LicensesIcon />, path: '/licenses' },
    { text: 'Zertifikate', icon: <CertificatesIcon />, path: '/certificates' },
    { text: 'Zubehör', icon: <AccessoriesIcon />, path: '/accessories' },
    { text: 'Dokumente', icon: <DocumentsIcon />, path: '/documents' },
    { text: 'Inventur', icon: <InventoryIcon />, path: '/inventory' },
    { text: 'Tickets', icon: <TicketsIcon />, path: '/tickets' },
    { text: 'Aufgaben', icon: <TodosIcon />, path: '/todos' },
    { text: 'Berichte', icon: <ReportsIcon />, path: '/reports' },
    { text: 'Benutzer', icon: <UsersIcon />, path: '/users', adminOnly: true },
    { text: 'Einstellungen', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidthOpen : drawerWidthCollapsed,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        '& .MuiDrawer-paper': {
          width: open ? drawerWidthOpen : drawerWidthCollapsed,
          transition: theme => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
          overflowX: 'hidden',
          boxSizing: 'border-box',
          mt: '64px',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <List>
        {menuItems.map((item) => {
          if (item.adminOnly && user?.role !== 'admin') return null;
          const selected = location.pathname.startsWith(item.path);
          return (
            <Tooltip key={item.text} title={!open ? item.text : ''} placement="right">
              <ListItem disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  selected={selected}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.dark',
                      '&:hover': { backgroundColor: 'primary.dark' },
                    },
                  }}
                  onClick={() => handleNavigate(item.path)}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                      color: 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
                </ListItemButton>
              </ListItem>
            </Tooltip>
          );
        })}
      </List>
      <Divider />
    </Drawer>
  );
};

export default Sidebar;
