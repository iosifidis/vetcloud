import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  const handleMobileNavClick = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-gray-900 text-white z-20 flex items-center justify-between p-4 shadow-md">
        <h1 className="text-xl font-bold text-blue-500">PIMS</h1>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-white p-2 focus:outline-none"
        >
          {isSidebarOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gray-900 text-white flex flex-col z-20 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 pt-16 md:pt-0
      `}>
        <div className="p-6 border-b border-gray-800 hidden md:block">
          <h1 className="text-2xl font-bold text-blue-500">PIMS</h1>
          <p className="text-xs text-gray-400 mt-1">Veterinary Management</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavLink
            to="/"
            onClick={handleMobileNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <span className="text-xl">📊</span>
            <span className="font-medium">Dashboard</span>
          </NavLink>

          <NavLink
            to="/appointments"
            onClick={handleMobileNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <span className="text-xl">📅</span>
            <span className="font-medium">Appointments</span>
          </NavLink>

          <NavLink
            to="/clients"
            onClick={handleMobileNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <span className="text-xl">👥</span>
            <span className="font-medium">Clients</span>
          </NavLink>

          <NavLink
            to="/patients"
            onClick={handleMobileNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <span className="text-xl">🐾</span>
            <span className="font-medium">Patients</span>
          </NavLink>

          {/* Admin Only - Users */}
          {(user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN') && (
            <NavLink
              to="/users"
              onClick={handleMobileNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <span className="text-xl">🛡️</span>
              <span className="font-medium">Users</span>
            </NavLink>
          )}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <NavLink
            to="/profile"
            onClick={handleMobileNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <span className="text-xl">👤</span>
            <span className="font-medium">My Profile</span>
          </NavLink>

          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
