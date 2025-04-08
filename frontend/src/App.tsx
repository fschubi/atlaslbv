import { Routes, Route } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import Devices from './pages/Devices';
import Licenses from './pages/Licenses';
import Certificates from './pages/Certificates';
import Accessories from './pages/Accessories';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import RequestPasswordReset from './pages/RequestPasswordReset';

import Departments from './pages/settings/Departments';
import Categories from './pages/settings/Categories';
import Manufacturers from './pages/settings/Manufacturers';
import Suppliers from './pages/settings/Suppliers';
import Rooms from './pages/settings/Rooms';
import Locations from './pages/settings/Locations';
import DeviceModels from './pages/settings/DeviceModels';
import Switches from './pages/settings/Switches';
import NetworkOutlets from './pages/settings/NetworkOutlets';
import Ports from './pages/settings/Ports';
import EmailNotifications from './pages/settings/EmailNotifications';
import DocumentManager from './pages/DocumentManager';
import Tickets from './pages/Tickets';
import Todos from './pages/Todos';
import Users from './pages/Users';
import DeviceForm from './pages/DeviceForm';
import DeviceDetails from './pages/DeviceDetails';
import LicenseForm from './pages/LicenseForm';
import LicenseDetails from './pages/LicenseDetails';
import CertificateForm from './pages/CertificateForm';
import CertificateDetails from './pages/CertificateDetails';
import AccessoryForm from './pages/AccessoryForm';
import AccessoryDetails from './pages/AccessoryDetails';

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/devices/new" element={<DeviceForm />} />
        <Route path="/devices/:deviceId" element={<DeviceDetails />} />
        <Route path="/devices/:deviceId/edit" element={<DeviceForm />} />
        <Route path="/licenses" element={<Licenses />} />
        <Route path="/licenses/new" element={<LicenseForm />} />
        <Route path="/licenses/:licenseId" element={<LicenseDetails />} />
        <Route path="/licenses/:licenseId/edit" element={<LicenseForm />} />
        <Route path="/certificates" element={<Certificates />} />
        <Route path="/certificates/new" element={<CertificateForm />} />
        <Route path="/certificates/:certificateId" element={<CertificateDetails />} />
        <Route path="/certificates/:certificateId/edit" element={<CertificateForm />} />
        <Route path="/accessories" element={<Accessories />} />
        <Route path="/accessories/new" element={<AccessoryForm />} />
        <Route path="/accessories/:accessoryId" element={<AccessoryDetails />} />
        <Route path="/accessories/:accessoryId/edit" element={<AccessoryForm />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/documents" element={<DocumentManager />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/todos" element={<Todos />} />
        <Route path="/users" element={<Users />} />

        {/* Unterseiten von Einstellungen */}
        <Route path="/settings/departments" element={<Departments />} />
        <Route path="/settings/categories" element={<Categories />} />
        <Route path="/settings/manufacturers" element={<Manufacturers />} />
        <Route path="/settings/suppliers" element={<Suppliers />} />
        <Route path="/settings/rooms" element={<Rooms />} />
        <Route path="/settings/locations" element={<Locations />} />
        <Route path="/settings/device-models" element={<DeviceModels />} />
        <Route path="/settings/switches" element={<Switches />} />
        <Route path="/settings/network-outlets" element={<NetworkOutlets />} />
        <Route path="/settings/ports" element={<Ports />} />
        <Route path="/settings/email-notifications" element={<EmailNotifications />} />
      </Route>

      {/* Auth-Seiten ohne Layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/reset" element={<ResetPassword />} />
      <Route path="/request-reset" element={<RequestPasswordReset />} />
    </Routes>
  );
};

export default App;
