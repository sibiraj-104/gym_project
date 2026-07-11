import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children?: ReactNode;
  requireOnboarded?: boolean;
}

export function ProtectedRoute({
  children,
  requireOnboarded = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isInitialized, user } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#09090b',
          color: '#ffffff',
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(0, 255, 136, 0.1)',
            borderTop: '3px solid #00ff88',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem',
          }}
        />
        <p
          style={{
            color: '#a1a1aa',
            fontSize: '0.9rem',
            letterSpacing: '0.05em',
          }}
        >
          LOADING PROFILE...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Not authenticated -> redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but not onboarded -> redirect to onboarding
  if (requireOnboarded && !user?.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  // Authenticated and onboarded, but trying to visit onboarding -> redirect to dashboard
  if (
    !requireOnboarded &&
    user?.isOnboarded &&
    location.pathname === '/onboarding'
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : null;
}
