import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Admin Pages
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';
import SystemSettings from './SystemSettings';
import AuditLogs from './AuditLogs';
import BackupRestore from './BackupRestore';

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="users" replace />} />
      <Route path="users" element={<UserManagement />} />
      <Route path="roles" element={<RoleManagement />} />
      <Route path="settings" element={<SystemSettings />} />
      <Route path="audit-logs" element={<AuditLogs />} />
      <Route path="backup-restore" element={<BackupRestore />} />
      <Route path="*" element={<Navigate to="users" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
