import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

// CSS Imports
import "react-big-calendar/lib/css/react-big-calendar.css";

// Page Imports
import DashboardPage from "./pages/DashboardPage";
import ClientsPage from './pages/ClientsPage';
import AppointmentsPage from "./pages/AppointmentsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PatientsPage from "./pages/PatientsPage";
import UsersPage from "./pages/UsersPage";
import ProfilePage from "./pages/ProfilePage";

// Component Imports
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import { AuthProvider } from "./context/AuthContext";

// Placeholder Components


const FinancialsPage = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold text-gray-800 mb-4">Financials</h2>
    <p className="text-gray-600">Financial reports and analytics coming soon...</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes with MainLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout><Outlet /></MainLayout>}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/financials" element={<FinancialsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
