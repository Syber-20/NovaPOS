import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser } = useApp();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'customer' && location.pathname !== '/store') {
    return <Navigate to="/store" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
