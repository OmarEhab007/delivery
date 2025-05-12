import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, currentUser } = useAuth();

  // Show loading spinner while authentication state is being determined
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Check if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check role-based access if requiredRole is specified
  if (requiredRole && currentUser?.role !== requiredRole) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
          padding: 3,
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1">
          You don't have permission to access this page. This feature requires {requiredRole} privileges.
        </Typography>
      </Box>
    );
  }

  // If there are children, render them, otherwise render the Outlet
  return children ? children : <Outlet />;
};

export default ProtectedRoute; 