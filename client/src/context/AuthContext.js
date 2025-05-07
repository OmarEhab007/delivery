import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import axios from 'axios';
import { initCsrfToken } from '../utils/csrfUtils';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const navigate = useNavigate();
  
  // Use useCallback to memoize the logout function
  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setCurrentUser(null);
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Initialize CSRF token for all users (even before login)
        await initCsrfToken();
        
        if (token) {
          // Check if token is expired
          const decodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000;

          if (decodedToken.exp < currentTime) {
            // Token is expired
            logout();
            return;
          }

          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Get current user info
          const response = await axios.get('/api/auth/me');
          
          // Only set admin users
          if (response.data.data.user.role === 'Admin') {
            setCurrentUser(response.data.data.user);
          } else {
            logout();
            return;
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [token, logout]);

  const login = async (email, password) => {
    try {
      // First initialize CSRF token
      await initCsrfToken();
      
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, data } = response.data;
      const user = data.user;

      // Check if user is admin
      if (user.role !== 'Admin') {
        throw new Error('Unauthorized: Admin access only');
      }

      // Save token and set current user
      localStorage.setItem('auth_token', token);
      setToken(token);
      setCurrentUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please check your credentials.'
      };
    }
  };

  const value = {
    currentUser,
    isLoading,
    login,
    logout,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 