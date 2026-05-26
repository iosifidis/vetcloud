import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // Lazy Init: Read from localStorage on initialization
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser && savedUser !== 'undefined' && savedUser !== 'null'
        ? JSON.parse(savedUser)
        : null;
    } catch (e) {
      console.error("Error parsing user", e);
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token');
    return savedToken && savedToken !== 'undefined' && savedToken !== 'null'
      ? savedToken
      : null;
  });

  const [loading, setLoading] = useState(false);

  /**
   * Login: stores access token + refresh token + user data.
   * Called after successful API login response.
   */
  const login = (userData, accessToken, refreshToken) => {
    if (!accessToken) {
      console.error("No access token received");
      return;
    }
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  };

  /**
   * Register: creates a new user account.
   * Returns the promise so the component can handle success/error.
   */
  const register = async (userData) => {
    return await authAPI.register(userData);
  };

  /**
   * Logout: revokes refresh tokens server-side, then clears local state.
   */
  const logout = async () => {
    // Try to revoke server-side (fire and forget)
    try {
      await authAPI.logout();
    } catch (e) {
      // Ignore errors — we're logging out regardless
    }

    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;