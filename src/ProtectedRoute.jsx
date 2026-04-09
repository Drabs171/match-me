import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        gap: '16px',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          fontWeight: 500,
        }}>
          Loading...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signup" replace />;
  }

  return children;
}

