import React, { useState } from 'react';
import { Users, Shield, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const { login } = useAuth();
  const [userType, setUserType] = useState('admin'); // 'admin' or 'volunteer'
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleUserTypeChange = (newUserType) => {
    setUserType(newUserType);
    setCredentials({ email: '', password: '' }); // Clear credentials when switching
    setError(''); // Clear any errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;

      if (userType === 'admin') {
        response = await authAPI.adminLogin(credentials);
        if (response.data && response.data.admin && response.data.token) {
          const { admin, token, refresh_token } = response.data;
          login(token, refresh_token, { ...admin, type: 'admin' });
          // Redirect will be handled by the auth context
        } else {
          setError('Invalid admin credentials');
        }
      } else {
        response = await authAPI.volunteerLogin(credentials);
        if (response.data && response.data.volunteer && response.data.token) {
          const { volunteer, token, refresh_token } = response.data;
          login(token, refresh_token, { ...volunteer, type: 'volunteer' });
          // Redirect will be handled by the auth context
        } else {
          setError('Invalid volunteer credentials');
        }
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Login failed. Please try again.');
      }
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
              onClick={() => handleUserTypeChange('admin')}
            >
              <Shield size={24} />
              <span>Admin Login</span>
            </button>
            <button
              className={`type-btn ${userType === 'volunteer' ? 'active' : ''}`}
              onClick={() => handleUserTypeChange('volunteer')}
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
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
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

                 <div className="signup-section">
                   <p>Default Admin Credentials:</p>
                   <p><strong>Email:</strong> admin@aksharpaaul.com</p>
                   <p><strong>Password:</strong> Admin@123</p>
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