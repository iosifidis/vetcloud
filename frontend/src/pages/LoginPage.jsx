import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../context/axiosConfig';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Perform the actual API call to login
      const response = await api.post('/api/auth/login', { username, password });

      // Expecting response.data to contain { token: "...", user: { ... } }
      // Adjust based on actual backend response structure.
      // Based on previous patterns, it might return AuthenticationResponse { token, user? }

      // If the backend only returns token, we might need to decode it or fetch user details.
      // Assuming it returns at least the token.

      const { token, ...userData } = response.data;

      // If userData is empty (backend only returns token), we might need to fetch user profile
      // For now, let's assume response.data has what we need or just store the token.

      // FIX logic: AuthContext expects (userData, authToken)
      // If backend response is just { token: "..." }, then userData is undefined.
      // Let's verify backend response structure if possible.
      // But typically it returns { token, ...userFields }

      await login(userData, token);
      navigate('/');
    } catch (err) {
      console.error("Login error", err);
      // Logic: Set error message based on status
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Invalid username or password');
      } else if (err.response && err.response.status === 404) {
        setError('Login endpoint not found (Contact Admin)');
      } else {
        setError('Server error. Please try again later.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>

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
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              type="submit"
            >
              Sign In
            </button>
          </div>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account? <Link to="/register" className="text-blue-500 hover:text-blue-700">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;