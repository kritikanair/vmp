import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./components/LoginPage";
import VolunteerDashboard from "./components/VolunteerDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ProtectedRoute, { AdminRoute, VolunteerRoute, PublicRoute } from "./components/ProtectedRoute";
import "./components/ProtectedRoute.css";

function AppContent() {
  const { isAuthenticated, user, loading } = useAuth();

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

  if (!isAuthenticated) {
    return (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    );
  }

  // User is authenticated, show appropriate dashboard
  if (user?.type === 'admin') {
    return (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    );
  } else if (user?.type === 'volunteer') {
    return (
      <VolunteerRoute>
        <VolunteerDashboard />
      </VolunteerRoute>
    );
  }

  // Fallback - should not reach here
  return (
    <div className="error-container">
      <h2>Authentication Error</h2>
      <p>Invalid user type. Please log in again.</p>
      <button onClick={() => window.location.href = '/'}>Go to Login</button>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
