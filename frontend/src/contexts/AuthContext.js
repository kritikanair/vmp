import React, { createContext, useContext, useState, useEffect } from 'react';
import { tokenStorage, authHelpers } from '../utils/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const userData = tokenStorage.getUserData();
        const authenticated = tokenStorage.isAuthenticated();

        if (authenticated && userData) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Clear invalid tokens
          tokenStorage.clearTokens();
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        tokenStorage.clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = (accessToken, refreshToken, userData) => {
    try {
      authHelpers.login(accessToken, refreshToken, userData);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    try {
      authHelpers.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Update user data
  const updateUser = (updatedUserData) => {
    try {
      const currentUser = tokenStorage.getUserData();
      const newUserData = { ...currentUser, ...updatedUserData };
      
      // Update stored user data
      localStorage.setItem('vmp_user_data', JSON.stringify(newUserData));
      setUser(newUserData);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user && user.type === role;
  };

  // Check if user is admin
  const isAdmin = () => {
    return hasRole('admin');
  };

  // Check if user is volunteer
  const isVolunteer = () => {
    return hasRole('volunteer');
  };

  // Get access token
  const getAccessToken = () => {
    return tokenStorage.getAccessToken();
  };

  // Get refresh token
  const getRefreshToken = () => {
    return tokenStorage.getRefreshToken();
  };

  // Check if token needs refresh
  const needsTokenRefresh = () => {
    return tokenStorage.needsRefresh();
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
    hasRole,
    isAdmin,
    isVolunteer,
    getAccessToken,
    getRefreshToken,
    needsTokenRefresh
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
