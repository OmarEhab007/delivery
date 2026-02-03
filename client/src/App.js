import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import { useAuth } from './context/AuthContext';

// Lazy load other pages to improve initial load time
const Shipments = React.lazy(() => import('./pages/Shipments'));
const MerchantShipments = React.lazy(() => import('./pages/MerchantShipments'));
const Applications = React.lazy(() => import('./pages/Applications'));
const Trucks = React.lazy(() => import('./pages/Trucks'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Reports = React.lazy(() => import('./pages/Reports'));
const TruckOwnerPortal = React.lazy(() => import('./pages/TruckOwnerPortal'));
const DriverPortal = React.lazy(() => import('./pages/DriverPortal'));

const LoadingFallback = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}
  >
    Loading...
  </div>
);

const App = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const defaultPath = !isAuthenticated
    ? '/login'
    : currentUser?.role === 'TruckOwner'
      ? '/truck-owner'
      : currentUser?.role === 'Driver'
        ? '/driver'
        : currentUser?.role === 'Merchant'
          ? '/merchant/shipments'
          : '/dashboard';

  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to={defaultPath} /> : <Login />}
        />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shipments"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <Shipments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/merchant/shipments"
              element={
                <ProtectedRoute requiredRole="Merchant">
                  <MerchantShipments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <Applications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trucks"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <Trucks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/truck-owner"
              element={
                <ProtectedRoute requiredRole="TruckOwner">
                  <TruckOwnerPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver"
              element={
                <ProtectedRoute requiredRole="Driver">
                  <DriverPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Redirect to dashboard if authenticated, otherwise to login */}
        <Route path="/" element={<Navigate to={defaultPath} />} />

        {/* Catch all - redirect to dashboard or login */}
        <Route path="*" element={<Navigate to={defaultPath} />} />
      </Routes>
    </React.Suspense>
  );
};

export default App;
