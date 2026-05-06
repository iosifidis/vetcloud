import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './axiosConfig';

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // Lazy Init: Διαβάζουμε από το localStorage κατά την αρχικοποίηση
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

  const login = (userData, authToken) => {
    if (!authToken) {
      console.error("No token received");
      return;
    }
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  };

  const register = async (userData) => {
    // We just return the promise and let the component handle success/error
    // because the flow might be different (e.g. redirect to login vs auto-login)
    return await api.post('/api/auth/register', userData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.clear(); // Καθαρίζουμε τα πάντα για σιγουριά
    navigate('/login');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token, // Αν υπάρχει token, θεωρούμε ότι είναι authenticated
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