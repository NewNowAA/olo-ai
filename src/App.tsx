// =============================================
// Olo.AI — App (Router + Auth Root)
// =============================================

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';

// Auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Layouts
import { AuthGuard } from './components/auth/AuthGuard';
import { AppLayout } from './components/layout/AppLayout';
import { DevLayout } from './components/layout/DevLayout';
import { ClientLayout } from './components/layout/ClientLayout';

// Owner pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import Conversations from './pages/owner/Conversations';
import ConversationDetail from './pages/owner/ConversationDetail';
import AgentConfig from './pages/owner/AgentConfig';
import Catalog from './pages/owner/Catalog';
import Stock from './pages/owner/Stock';
import Appointments from './pages/owner/Appointments';
import Orders from './pages/owner/Orders';
import Customers from './pages/owner/Customers';
import BusinessHours from './pages/owner/BusinessHours';
import OwnerSettings from './pages/owner/Settings';
import Onboarding from './pages/owner/Onboarding';
import Workers from './pages/owner/Workers';
import Attendance from './pages/owner/Attendance';

// Dev pages
import DevDashboard from './pages/dev/DevDashboard';
import DevOrganizations from './pages/dev/DevOrganizations';

// Client pages
import ClientAppointments from './pages/client/ClientAppointments';
import ClientOrders from './pages/client/ClientOrders';

const App: React.FC = () => {
  const { loading, isAuthenticated, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">A carregar...</p>
        </div>
      </div>
    );
  }

  // Determine home route based on role
  const getHomeRoute = () => {
    if (!isAuthenticated) return '/login';
    if (role === 'dev') return '/dev/dashboard';
    if (role === 'owner') return '/app/dashboard';
    return '/client/appointments';
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <LoginPage />
      } />
      <Route path="/register" element={
        isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <RegisterPage />
      } />

      {/* Dev routes */}
      <Route path="/dev" element={
        <AuthGuard allowedRoles={['dev']}>
          <DevLayout />
        </AuthGuard>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DevDashboard />} />
        <Route path="organizations" element={<DevOrganizations />} />
      </Route>

      {/* Owner routes */}
      <Route path="/app" element={
        <AuthGuard allowedRoles={['owner', 'dev']}>
          <AppLayout />
        </AuthGuard>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="conversations" element={<Conversations />} />
        <Route path="conversations/:id" element={<ConversationDetail />} />
        <Route path="agent" element={<AgentConfig />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="stock" element={<Stock />} />
        <Route path="orders" element={<Orders />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="customers" element={<Customers />} />
        <Route path="hours" element={<BusinessHours />} />
        <Route path="settings" element={<OwnerSettings />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="workers" element={<Workers />} />
        <Route path="attendance" element={<Attendance />} />
      </Route>

      {/* Client routes */}
      <Route path="/client" element={
        <AuthGuard allowedRoles={['client']}>
          <ClientLayout />
        </AuthGuard>
      }>
        <Route index element={<Navigate to="appointments" replace />} />
        <Route path="appointments" element={<ClientAppointments />} />
        <Route path="orders" element={<ClientOrders />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={getHomeRoute()} replace />} />
    </Routes>
  );
};

export default App;