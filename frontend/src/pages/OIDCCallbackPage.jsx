import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../api';

const OIDCCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [status, setStatus] = useState('Ολοκλήρωση ταυτοποίησης...');
  const [error, setError] = useState('');

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('oidc_token');

      if (!token) {
        setError('Δεν βρέθηκε token OIDC στη διεύθυνση URL.');
        setTimeout(() => navigate('/login?error=token_error'), 3000);
        return;
      }

      try {
        // 1. Temporarily store token so Axios interceptor picks it up
        localStorage.setItem('token', token);

        // 2. Decode user ID from the token
        const claims = parseJwt(token);
        if (!claims || !claims.user_id) {
          throw new Error('Μη έγκυρο token (λείπουν claims)');
        }

        setStatus('Λήψη στοιχείων προφίλ χρήστη...');

        // 3. Fetch full profile details
        const response = await usersAPI.getById(claims.user_id);
        const user = response.data;

        // 4. Log in using full profile details
        login(user, token, null);

        setStatus('Επιτυχής σύνδεση! Μεταφορά στην αρχική σελίδα...');
        setTimeout(() => navigate('/'), 1000);
      } catch (err) {
        console.error('OIDC callback processing failed:', err);
        localStorage.removeItem('token');
        setError('Αδυναμία ολοκλήρωσης σύνδεσης SSO.');
        setTimeout(() => navigate('/login?error=user_error'), 3000);
      }
    };

    handleCallback();
  }, [location, navigate, login]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">VetCloud SSO</h3>
        
        {error ? (
          <p className="text-red-500 font-medium">{error}</p>
        ) : (
          <p className="text-gray-600">{status}</p>
        )}
      </div>
    </div>
  );
};

export default OIDCCallbackPage;
