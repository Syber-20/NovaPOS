import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/**
 * Wraps a route and redirects to /login if:
 *  - no user is logged in, OR
 *  - allowedRoles is specified and the user's role is not in it
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={['owner']}>
 *     <Reports />
 *   </ProtectedRoute>
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, isLoading } = useApp();

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Owners bypass all role checks. If allowedRoles is defined, check if user's role is in it.
  if (allowedRoles && currentUser.role !== 'owner' && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
