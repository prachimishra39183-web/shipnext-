
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute({ allowedRole }) {
  const token = sessionStorage.getItem('shipnextToken');
  const storedUser = sessionStorage.getItem('shipnextUser');

  if (!token || !storedUser) {
    return <Navigate to="/login" replace />;
  }

  let user;

  try {
    user = JSON.parse(storedUser);
  } catch {
    sessionStorage.removeItem('shipnextToken');
    sessionStorage.removeItem('shipnextUser');
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return (
      <Navigate
        to={user.role === 'ADMIN' ? '/admin' : '/dashboard'}
        replace
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
