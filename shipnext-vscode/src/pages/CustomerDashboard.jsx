
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function CustomerDashboard() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [notificationError, setNotificationError] = useState('');

  const fetchNotifications = async () => {
    try {
      const token = sessionStorage.getItem('shipnextToken');

      if (!token) {
        setNotificationError('Please log in to view your notifications.');
        setLoadingNotifications(false);
        return;
      }

      const response = await fetch(
        'http://localhost:5000/api/notifications/me',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load notifications.');
      }

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setNotificationError('');
    } catch (error) {
      setNotificationError(error.message);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      const token = sessionStorage.getItem('shipnextToken');

      const response = await fetch(
        `http://localhost:5000/api/notifications/${id}/read`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update notification.');
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, isRead: true } : item
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (error) {
      alert(error.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = sessionStorage.getItem('shipnextToken');

      const response = await fetch(
        'http://localhost:5000/api/notifications/read-all',
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update notifications.');
      }

      setNotifications((previous) =>
        previous.map((item) => ({ ...item, isRead: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      alert(error.message);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'BOOKING':
        return '📦';
      case 'PICKUP':
        return '🚚';
      case 'TRANSIT':
        return '🛣️';
      case 'DELIVERED':
        return '✅';
      default:
        return '🔔';
    }
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <Link to="/" className="logo">
          <span className="logo-ship">SHIP</span>
          <span className="logo-next">NEXT</span>
        </Link>

        <p className="sidebar-label">MAIN MENU</p>

        <nav className="sidebar-nav">
          <a href="#overview" className="active">▦ Dashboard</a>
          <Link to="/shipments">📦 My Shipments</Link>
          <Link to="/track">📍 Track Shipment</Link>
          <Link to="/wallet">💳 My Wallet</Link>
          <a href="#transactions">↔ Transactions</a>
          <Link to="/profile">👤 My Profile</Link>
          <Link to="/support">
  🎧 Support Tickets
</Link>
        </nav>

        <div className="sidebar-bottom">
          <Link to="/">← Back to Website</Link>
        </div>
      </aside>

      <main className="dashboard-main" id="overview">
        <header className="dashboard-header">
          <div>
            <h1>Customer Dashboard</h1>
            <p>Welcome back! Here's your shipping overview.</p>
          </div>

          <div className="dashboard-user">
            <div className="user-avatar">C</div>
            <div>
              <strong>Customer</strong>
              <small>ShipNext Member</small>
            </div>
          </div>
        </header>

        <section className="dashboard-welcome">
          <div>
            <span>YOUR SHIPPING AT A GLANCE</span>
            <h2>Manage your deliveries with ease.</h2>
            <p>Book shipments, check your wallet and track your parcels.</p>
            <Link to="/book-shipment" className="dashboard-button">
              + Book a Shipment
            </Link>
          </div>
          <div className="welcome-icon">📦</div>
        </section>

        {/* NOTIFICATIONS PANEL */}
        <section className="dashboard-panel" id="notifications">
          <div className="panel-heading">
            <div>
              <h2>
                🔔 Notifications
                {unreadCount > 0 && (
                  <span style={{
                    marginLeft: '10px',
                    background: '#e53935',
                    color: '#fff',
                    padding: '3px 9px',
                    borderRadius: '20px',
                    fontSize: '12px',
                  }}>
                    {unreadCount} New
                  </span>
                )}
              </h2>
              <p>Updates about your bookings and deliveries.</p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Mark All as Read
              </button>
            )}
          </div>

          {loadingNotifications ? (
            <div className="empty-state compact">
              <p>Loading notifications...</p>
            </div>
          ) : notificationError ? (
            <div className="empty-state compact">
              <p>{notificationError}</p>
              <button
                onClick={() => {
                  setLoadingNotifications(true);
                  fetchNotifications();
                }}
                className="dashboard-button"
              >
                Try Again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state compact">
              <div>🔔</div>
              <h3>No notifications yet</h3>
              <p>Your shipment updates will appear here.</p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #e5eaf1',
                    background: notification.isRead ? '#fff' : '#f0f6ff',
                  }}
                >
                  <div style={{ fontSize: '25px' }}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <strong>{notification.title}</strong>

                    <p style={{
                      margin: '6px 0',
                      color: '#64748b',
                      lineHeight: '1.5',
                    }}>
                      {notification.message}
                    </p>

                    {notification.trackingId && (
                      <small style={{ color: '#2563eb' }}>
                        Tracking ID: {notification.trackingId}
                      </small>
                    )}

                    <div style={{
                      marginTop: '7px',
                      color: '#94a3b8',
                      fontSize: '12px',
                    }}>
                      {new Date(notification.createdAt).toLocaleString('en-IN')}
                    </div>
                  </div>

                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#2563eb',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-stats">
          <div className="stat-card">
            <span>Total Shipments</span>
            <strong>0</strong>
            <small>All your bookings</small>
          </div>

          <div className="stat-card">
            <span>In Transit</span>
            <strong>0</strong>
            <small>Currently on the way</small>
          </div>

          <div className="stat-card">
            <span>Delivered</span>
            <strong>0</strong>
            <small>Successfully delivered</small>
          </div>

          <div className="stat-card" id="wallet">
            <span>Wallet Balance</span>
            <strong>₹0.00</strong>
            <small>Available balance</small>
            <Link to="/wallet" className="wallet-button">
              + Add Money
            </Link>
          </div>
        </section>

        <section className="dashboard-panel" id="bookings">
          <div className="panel-heading">
            <div>
              <h2>Recent Shipments</h2>
              <p>Keep track of your latest parcel bookings.</p>
            </div>
            <Link to="/shipments">View All →</Link>
          </div>

          <div className="empty-state">
            <div>📦</div>
            <h3>No shipments yet</h3>
            <p>Your booked shipments will appear here.</p>
            <Link to="/book-shipment" className="dashboard-button">
              Book Your First Shipment
            </Link>
          </div>
        </section>

        <section className="dashboard-panel" id="transactions">
          <div className="panel-heading">
            <div>
              <h2>Recent Transactions</h2>
              <p>Your latest wallet activity.</p>
            </div>
            <a href="#all-transactions">View All →</a>
          </div>

          <div className="empty-state compact">
            <p>No transactions available yet.</p>
          </div>
        </section>

        <footer className="dashboard-footer">
          © {new Date().getFullYear()} ShipNext. All rights reserved.
        </footer>
      </main>
    </div>
  );
}

export default CustomerDashboard;
