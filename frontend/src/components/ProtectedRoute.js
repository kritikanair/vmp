import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  fallback = null,
  redirectTo = '/'
}) => {
  const { isAuthenticated, loading, hasRole } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show fallback or redirect
  if (!isAuthenticated) {
    if (fallback) {
      return fallback;
    }
    
    // Redirect to login
    window.location.href = redirectTo;
    return null;
  }

  // If role is required, check if user has the required role
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <button 
            className="btn-primary" 
            onClick={() => window.location.href = '/'}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated and has required role
  return children;
};

// Specific role-based protected routes
export const AdminRoute = ({ children, fallback = null }) => (
  <ProtectedRoute requiredRole="admin" fallback={fallback}>
    {children}
  </ProtectedRoute>
);

export const VolunteerRoute = ({ children, fallback = null }) => (
  <ProtectedRoute requiredRole="volunteer" fallback={fallback}>
    {children}
  </ProtectedRoute>
);

// Public route (only accessible when not authenticated)
export const PublicRoute = ({ children, redirectTo = '/dashboard' }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    window.location.href = redirectTo;
    return null;
  }

  return children;
};

export default ProtectedRoute;
