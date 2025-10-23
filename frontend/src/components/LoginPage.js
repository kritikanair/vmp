import React, { useState } from 'react';
import { Users, Shield } from 'lucide-react';
import './LoginPage.css';

const LoginPage = ({ onLogin }) => {
  const [userType, setUserType] = useState('admin'); // 'admin' or 'volunteer'
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulate login - Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (userType === 'admin') {
        // Check admin credentials (demo credentials)
        if (credentials.email === 'admin@akshar.com' && credentials.password === 'admin123') {
          onLogin('admin', { email: credentials.email, name: 'Admin User' });
        } else {
          setError('Invalid admin credentials');
        }
      } else {
        // Check volunteer credentials (demo credentials)
        if (credentials.email === 'volunteer@akshar.com' && credentials.password === 'volunteer123') {
          onLogin('volunteer', { 
            id: 1,
            email: credentials.email, 
            name: 'John Doe',
            phone: '9876543210',
            hours: 45,
            status: 'active'
          });
        } else {
          setError('Invalid volunteer credentials');
        }
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">AP</div>
            <h1>Akshar Paaul</h1>
            <p>Volunteer Management Portal</p>
          </div>

          <div className="user-type-selector">
            <button
              className={`type-btn ${userType === 'admin' ? 'active' : ''}`}
              onClick={() => setUserType('admin')}
            >
              <Shield size={24} />
              <span>Admin Login</span>
            </button>
            <button
              className={`type-btn ${userType === 'volunteer' ? 'active' : ''}`}
              onClick={() => setUserType('volunteer')}
            >
              <Users size={24} />
              <span>Volunteer Login</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                <span>⚠️ {error}</span>
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Login as {userType === 'admin' ? 'Admin' : 'Volunteer'}</span>
              )}
            </button>
          </form>

          <div className="demo-credentials">
            <p className="demo-title">Demo Credentials:</p>
            <div className="demo-info">
              <div>
                <strong>Admin:</strong> admin@akshar.com / admin123
              </div>
              <div>
                <strong>Volunteer:</strong> volunteer@akshar.com / volunteer123
              </div>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <p>© 2024 Akshar Paaul. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;