import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import VolunteerPortal from './components/VolunteerPortal';
import VolunteerDashboard from './components/VolunteerDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null); // 'admin' or 'volunteer'
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in (on page load/refresh)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedUserType = localStorage.getItem('userType');

    if (token && savedUser && savedUserType) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setUserType(savedUserType);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (type, userData) => {
    setUserType(type);
    setCurrentUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    
    // Reset state
    setIsAuthenticated(false);
    setUserType(null);
    setCurrentUser(null);
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        <div>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Show appropriate portal based on user type
  if (userType === 'admin') {
    return <VolunteerPortal user={currentUser} onLogout={handleLogout} />;
  }

  if (userType === 'volunteer') {
    return <VolunteerDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return null;
}

export default App;