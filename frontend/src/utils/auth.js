// JWT Authentication Utilities
// Using browser-compatible JWT decoding with jose library
import { decodeJwt } from 'jose';

const TOKEN_KEY = 'vmp_auth_token';
const REFRESH_TOKEN_KEY = 'vmp_refresh_token';
const USER_KEY = 'vmp_user_data';

// Token storage utilities
export const tokenStorage = {
  // Store tokens and user data
  setTokens: (accessToken, refreshToken, userData) => {
    try {
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      
      // Debug logging
      console.log('✅ Tokens stored successfully:');
      console.log('Access Token:', accessToken ? 'Present' : 'Missing');
      console.log('Refresh Token:', refreshToken ? 'Present' : 'Missing');
      console.log('User Data:', userData ? 'Present' : 'Missing');
      console.log('Storage Keys:', Object.keys(localStorage).filter(key => key.startsWith('vmp_')));
    } catch (error) {
      console.error('❌ Error storing tokens:', error);
    }
  },

  // Get access token
  getAccessToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Get refresh token
  getRefreshToken: () => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  // Get user data
  getUserData: () => {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  // Clear all tokens and user data
  clearTokens: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      console.log('✅ Tokens cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;

    try {
      const decoded = jwtUtils.decodeToken(token);
      if (!decoded) return false;

      // Check if token is expired
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
  },

  // Get token expiration time
  getTokenExpiration: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    try {
      const decoded = jwtUtils.decodeToken(token);
      return decoded ? decoded.exp * 1000 : null; // Convert to milliseconds
    } catch (error) {
      return null;
    }
  },

  // Check if token needs refresh (within 5 minutes of expiry)
  needsRefresh: () => {
    const expiration = tokenStorage.getTokenExpiration();
    if (!expiration) return false;

    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    return Date.now() >= (expiration - fiveMinutes);
  }
};

// JWT token utilities (browser-compatible with jose)
export const jwtUtils = {
  // Decode JWT token without verification (for client-side use)
  decodeToken: (token) => {
    try {
      if (!token) return null;
      return decodeJwt(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },

  // Check if token is expired
  isTokenExpired: (token) => {
    try {
      const decoded = jwtUtils.decodeToken(token);
      if (!decoded) return true;

      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  },

  // Get user role from token
  getUserRole: (token) => {
    try {
      const decoded = jwtUtils.decodeToken(token);
      return decoded ? decoded.role : null;
    } catch (error) {
      return null;
    }
  },

  // Get user ID from token
  getUserId: (token) => {
    try {
      const decoded = jwtUtils.decodeToken(token);
      return decoded ? decoded.user_id : null;
    } catch (error) {
      return null;
    }
  }
};

// Authentication helper functions
export const authHelpers = {
  // Login user and store tokens
  login: (accessToken, refreshToken, userData) => {
    tokenStorage.setTokens(accessToken, refreshToken, userData);
  },

  // Logout user and clear tokens
  logout: () => {
    tokenStorage.clearTokens();
    // Redirect to login page
    window.location.href = '/';
  },

  // Get current user
  getCurrentUser: () => {
    return tokenStorage.getUserData();
  },

  // Check if user has specific role
  hasRole: (role) => {
    const userData = tokenStorage.getUserData();
    return userData && userData.type === role;
  },

  // Check if user is admin
  isAdmin: () => {
    return authHelpers.hasRole('admin');
  },

  // Check if user is volunteer
  isVolunteer: () => {
    return authHelpers.hasRole('volunteer');
  }
};

export default {
  tokenStorage,
  jwtUtils,
  authHelpers
};
