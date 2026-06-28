import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errParam = params.get('error');
    if (errParam) {
      const errorMap = {
        invalid_state: 'Η επαλήθευση ασφαλείας απέτυχε. Παρακαλώ δοκιμάστε ξανά.',
        missing_nonce: 'Σφάλμα ασφαλείας (nonce). Παρακαλώ δοκιμάστε ξανά.',
        oidc_disabled: 'Η υπηρεσία SSO δεν είναι ενεργοποιημένη.',
        provider_error: 'Αδυναμία σύνδεσης με τον πάροχο ταυτοποίησης (SSO).',
        exchange_failed: 'Η ταυτοποίηση με τον πάροχο απέτυχε.',
        user_error: 'Αδυναμία δημιουργίας/σύνδεσης λογαριασμού χρήστη.',
        token_error: 'Σφάλμα κατά την έκδοση του token συνεδρίας.'
      };
      setError(errorMap[errParam] || 'Παρουσιάστηκε άγνωστο σφάλμα κατά τη σύνδεση OIDC.');
    }
  }, [location]);

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
        setError('Λάθος όνομα χρήστη ή κωδικός πρόσβασης');
      } else if (err.response && err.response.status === 404) {
        setError('Το endpoint σύνδεσης δεν βρέθηκε (Επικοινωνήστε με το διαχειριστή)');
      } else {
        setError('Σφάλμα διακομιστή. Παρακαλώ δοκιμάστε αργότερα.');
      }
    }
  };

  const handleOIDCLogin = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    window.location.href = `${API_BASE_URL}/api/auth/oidc/login`;
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
            <p className="text-gray-500 text-sm">Σύνδεση στο λογαριασμό σας</p>
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
              Όνομα χρήστη / Email
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
              Κωδικός πρόσβασης
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
              Είσοδος
            </button>
          </div>
        </form>

        {settings?.oidcEnabled && (
          <div className="mt-4">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase">Ή εναλλακτικά</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            <button
              onClick={handleOIDCLogin}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition duration-150"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 16H11V14H13V16ZM13 12H11V8H13V12Z" fill="currentColor"/>
              </svg>
              Σύνδεση μέσω SSO (OIDC)
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Δεν έχετε λογαριασμό; <Link to="/register" className="text-[var(--color-primary)] hover:underline">Εγγραφή</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;