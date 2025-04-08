import { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import AtlasAppBar from '../components/AtlasAppBar';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const drawerWidthOpen = 240;
const drawerWidthCollapsed = 72;

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = sidebarOpen ? drawerWidthOpen : drawerWidthCollapsed;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AtlasAppBar onMenuClick={toggleSidebar} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          pl: `${sidebarWidth}px`,
          pt: '64px',
          transition: (theme) =>
            theme.transitions.create(['padding'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
