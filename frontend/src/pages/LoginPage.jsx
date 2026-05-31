import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { authAPI } from '../api';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { settings, loading } = useTenant();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await authAPI.login({ username, password });

      // New backend returns: { accessToken, refreshToken, user: { id, username, email, firstName, lastName, role, isActive } }
      const { accessToken, refreshToken, user } = response.data;

      login(user, accessToken, refreshToken);
      navigate('/');
    } catch (err) {
      console.error("Login error", err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Invalid username or password');
      } else if (err.response && err.response.status === 404) {
        setError('Login endpoint not found (Contact Admin)');
      } else {
        setError('Server error. Please try again later.');
      }
    }
  };

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
            {settings?.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-16 w-auto mb-2" />}
            <h2 className="text-2xl font-bold text-center text-[var(--color-primary)]">
                {settings?.clinicName || "VetCloud"}
            </h2>
            <p className="text-gray-500 text-sm">Login to your account</p>
        </div>

        {/* UI: Render visible red error alert */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-[var(--color-primary)] hover:opacity-90 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              type="submit"
            >
              Sign In
            </button>
          </div>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account? <Link to="/register" className="text-[var(--color-primary)] hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;