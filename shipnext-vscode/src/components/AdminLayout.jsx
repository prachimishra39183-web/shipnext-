
import { Outlet } from 'react-router-dom';
import AdminNotificationBell from './AdminNotificationBell';

function AdminLayout() {
  return (
    <>
      <div className="admin-global-header">
        <div className="admin-global-brand">
          
        </div>

        <div className="admin-header-actions">
          <AdminNotificationBell />
          <div className="admin-user">👤 Administrator</div>
        </div>
      </div>

      <Outlet />
    </>
  );
}

export default AdminLayout;
