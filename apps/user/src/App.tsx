import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';

// Placeholder for Dashboard page
function DashboardPlaceholder() {
  const { user, logout } = useAuthStore();
  return (
    <div
      style={{
        padding: '2rem',
        backgroundColor: '#09090b',
        color: '#fff',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <h1>GymFuel Dashboard</h1>
      <p>Hello, {user?.name}! You have successfully completed onboarding.</p>
      <button
        onClick={logout}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#ef4444',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default function App() {
  const { fetchProfile, isInitialized } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected Routes */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute requireOnboarded={false}>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireOnboarded={true}>
              <DashboardPlaceholder />
            </ProtectedRoute>
          }
        />

        {/* Catch-all Redirect */}
        <Route
          path="*"
          element={
            isInitialized ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <div style={{ backgroundColor: '#09090b', minHeight: '100vh' }} />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
