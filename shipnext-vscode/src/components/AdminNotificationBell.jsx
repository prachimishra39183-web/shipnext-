
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
import './AdminNotificationBell.css';
import { CheckCheck } from 'lucide-react';
function AdminNotificationBell() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const token = sessionStorage.getItem('shipnextToken');

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/admin/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Notification fetch error:', error);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [token]);

  const markAsRead = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/admin/notifications/${id}/read`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      await fetchNotifications();
    } catch (error) {
      console.error('Mark notification read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/admin/notifications/read-all`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      await fetchNotifications();
    } catch (error) {
      console.error('Mark all notifications error:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    setIsOpen(false);

    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="admin-notification-wrapper">
      <button
        className="admin-notification-bell"
        title="Notifications"
        onClick={() => {
  const nextState = !isOpen;
  setIsOpen(nextState);

  if (nextState) {
    fetchNotifications();
  }
}}
      >
        🔔

        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="admin-notification-dropdown">
          <div className="notification-dropdown-header">
            <strong>Notifications</strong>

            {unreadCount > 0 && (
             <button
  className="notification-read-all"
  onClick={markAllAsRead}
>
  <CheckCheck size={15} />
  Mark all as read
</button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">
                No notifications yet.
              </p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`notification-item ${
                    notification.isRead ? 'read' : 'unread'
                  }`}
                  onClick={() =>
                    handleNotificationClick(notification)
                  }
                >
                  <strong>{notification.title}</strong>

                  <span>{notification.message}</span>

                  <small>
                    {new Date(
                      notification.createdAt
                    ).toLocaleString()}
                  </small>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminNotificationBell;
