import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface PrivateRouteProps {
  requiredRoles?: string[];
}

/**
 * PrivateRoute-Komponente für geschützte Routen
 *
 * Prüft, ob der Benutzer authentifiziert ist und die erforderlichen Rollen hat.
 * Leitet nicht authentifizierte Benutzer zur Login-Seite um.
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ requiredRoles = [] }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Wenn der Benutzer nicht authentifiziert ist, zur Login-Seite umleiten
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wenn Rollen erforderlich sind, prüfen ob der Benutzer die erforderlichen Rollen hat
  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Authentifizierung erfolgreich, Route rendern
  return <Outlet />;
};

export default PrivateRoute;
