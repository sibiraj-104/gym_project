import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';

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
              <Dashboard />
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
