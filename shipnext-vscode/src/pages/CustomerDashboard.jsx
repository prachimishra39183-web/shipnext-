import { ChevronDown,FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserRound,CheckCheck  } from 'lucide-react';
import API_URL from '../config/api';
function CustomerDashboard() {
   const loggedInUser = JSON.parse(
    sessionStorage.getItem('shipnextUser') || '{}'
  );

  const accountName =
    loggedInUser.name ||
    loggedInUser.fullName ||
    loggedInUser.email ||
    'My Account';

  const accountRole =
    loggedInUser.role === 'ADMIN' ? 'Admin' : 'Customer';
    const location = useLocation();

  const bookingAccess = location.state?.bookingAccess === true;
  const bookingShipment = location.state?.shipment || null;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [notificationError, setNotificationError] = useState('');
const [recentTransactions, setRecentTransactions] = useState([]);
const [myShipments, setMyShipments] = useState([]);
const [walletBalance, setWalletBalance] = useState(0);
const [loadingDashboardData, setLoadingDashboardData] = useState(true);
  const fetchNotifications = async () => {
        if (bookingAccess) {
      setLoadingNotifications(false);
      return;
    }
    try {
      const token = sessionStorage.getItem('shipnextToken');

      if (!token) {
        setNotificationError('Please log in to view your notifications.');
        setLoadingNotifications(false);
        return;
      }

        const response = await fetch(
  `${API_URL}/api/notifications/me`,
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
  const fetchDashboardData = async () => {
    try {
      const token = sessionStorage.getItem('shipnextToken');

      if (!token) return;

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [shipmentResponse, walletResponse] = await Promise.all([
        fetch(`${API_URL}/api/shipments/my`, { headers }),
        fetch(`${API_URL}/api/wallet/me`, { headers }),
      ]);

      const shipmentData = await shipmentResponse.json();
      const walletData = await walletResponse.json();

      if (!shipmentResponse.ok) {
        throw new Error(
          shipmentData.message || 'Unable to load shipments.'
        );
      }

      if (!walletResponse.ok) {
        throw new Error(
          walletData.message || 'Unable to load wallet.'
        );
      }

      const shipmentList = Array.isArray(shipmentData.shipments)
        ? shipmentData.shipments
        : Array.isArray(shipmentData.data)
          ? shipmentData.data
          : Array.isArray(shipmentData)
            ? shipmentData
            : [];

      setMyShipments(shipmentList);

      setWalletBalance(
        Number(
          walletData.wallet?.balance ??
          walletData.balance ??
          0
        )
      );

      setRecentTransactions(
        walletData.wallet?.transactions || []
      );

      console.log('CUSTOMER DASHBOARD SHIPMENTS:', shipmentData);
      console.log('CUSTOMER DASHBOARD WALLET:', walletData);

    } catch (error) {
      console.error('Dashboard data error:', error);
    } finally {
      setLoadingDashboardData(false);
    }
  };

  fetchDashboardData();
}, []);

  const markAsRead = async (id) => {
    try {
      const token = sessionStorage.getItem('shipnextToken');

      const response = await fetch(
        `${API_URL}/api/notifications/${id}/read`,
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
  `${API_URL}/api/notifications/read-all`,
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
        return ;
      case 'PICKUP':
        return ;
      case 'TRANSIT':
        return ;
      case 'DELIVERED':
        return ;
      default:
        return ;
    }
  };
const totalShipments = myShipments.length;

const inTransitShipments = myShipments.filter((shipment) =>
  [
    'PICKED_UP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'SHIPPED',
  ].includes(shipment.status?.toUpperCase())
).length;

const deliveredShipments = myShipments.filter(
  (shipment) => shipment.status?.toUpperCase() === 'DELIVERED'
).length;
  return (
    <div className="dashboard">
  <aside className="sidebar">
   
     
      <img
        src="/logo.jpeg"
        alt="ShipNext Logo"
        className="logo-image"
      />
  

       <p className="sidebar-label">MAIN MENU</p>

<nav className="sidebar-nav">
  <a href="#overview" className="active">Dashboard</a>
  <Link to="/shipments">My Shipments</Link>
  <Link to="/invoices" className="sidebar-link">
  <FileText size={20} />
  <span>My Invoices</span>
</Link>
  <Link to="/bulk-booking">Bulk Booking</Link>
  <Link to="/track">Track Shipment</Link>
  <Link to="/wallet">My Wallet</Link>
  <Link to="/cod-remittance">COD Remittance</Link>
    <Link to="/support">Support Tickets</Link>
  <Link to="/profile">My Profile</Link>
  <Link to="/settings">Settings</Link>

</nav>

        <div className="sidebar-bottom">
          <Link to="/">← Back to Website</Link>
        </div>
      </aside>

      <main className="dashboard-main" id="overview">
        <header className="dashboard-header">
          
          <div>
            <h1>Customer Dashboard</h1>
            <p>
  {bookingAccess
    ? 'Welcome! Here are your booking details.'
    : "Welcome back! Here's your shipping overview."}
</p>
          </div>

         <div className="dashboard-header-actions">

  <details className="customer-child-dropdown">
    <summary>
      <span> Child Accounts</span>
      <ChevronDown size={17} className="child-chevron" />
    </summary>

    <div className="customer-child-menu">
      <Link to="/child-accounts">
        <span>◈</span> Manage Child Accounts
      </Link>

      <Link to="/child-accounts">
        <span>＋</span> Add New Child Account
      </Link>
    </div>
  </details>

 <div className="dashboard-user">
  <div className="user-avatar">
    <UserRound size={21} strokeWidth={2} />
  </div>

  <div className="dashboard-user-info">
    <strong>{accountName}</strong>
    <small>ShipNext {accountRole}</small>
  </div>
</div>

</div>
        </header>

       <section className="dashboard-welcome">
  <div>
    <span>
      {bookingAccess ? 'YOUR SHIPMENT DETAILS' : 'YOUR SHIPPING AT A GLANCE'}
    </span>

    <h2>
      {bookingAccess
        ? 'Your shipment, all in one place.'
        : 'Manage your deliveries with ease.'}
    </h2>

    <p>
      {bookingAccess
        ? 'View your booking information and track your parcel.'
        : 'Book shipments, check your wallet and track your parcels.'}
    </p>

    {bookingAccess ? (
      <Link
        to={`/track/${encodeURIComponent(bookingShipment.trackingId)}`}
        className="dashboard-button"
      >
        Track My Shipment →
      </Link>
      
    ) : (
  <div className="dashboard-booking-actions">
    <Link to="/book-shipment" className="dashboard-button">
      + Book a Shipment
    </Link>

    <Link to="/bulk-booking" className="dashboard-button bulk-dashboard-button">
      Bulk Booking →
    </Link>
  </div>
)}
  </div>

  <div className="welcome-icon"></div>
</section>

        {/* NOTIFICATIONS PANEL */}
        <section className="dashboard-panel" id="notifications">
          <div className="panel-heading">
            <div>
              <h2>
                 Notifications
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
              <div></div>
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
                    background: notification.isRead ? '#810808' : '#7a050d',
                  }}
                >
                  <div style={{ fontSize: '25px' }}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <strong>{notification.title}</strong>

                    <p style={{
                      margin: '6px 0',
                      color: '#e5e8ec',
                      lineHeight: '1.5',
                    }}>
                      {notification.message}
                    </p>

                    {notification.trackingId && (
                      <small style={{ color: '#000204' }}>
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
  className="notification-mark-read"
  onClick={() => markAsRead(notification.id)}
>
  <CheckCheck size={14} />
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
    <strong>
      {loadingDashboardData ? '...' : totalShipments}
    </strong>
    <small>All your bookings</small>
  </div>

  <div className="stat-card">
    <span>In Transit</span>
    <strong>
      {loadingDashboardData ? '...' : inTransitShipments}
    </strong>
    <small>Currently on the way</small>
  </div>

  <div className="stat-card">
    <span>Delivered</span>
    <strong>
      {loadingDashboardData ? '...' : deliveredShipments}
    </strong>
    <small>Successfully delivered</small>
  </div>

  <div className="stat-card" id="wallet">
    <span>Wallet Balance</span>
    <strong>
      {loadingDashboardData
        ? '...'
        : `₹${walletBalance.toFixed(2)}`}
    </strong>
    <small>Available balance</small>
    <Link to="/wallet" className="wallet-button">
      + Add Money
    </Link>
  </div>
</section>


     
        <section className="dashboard-panel" id="transactions">
  <div className="panel-heading">
    <div>
      <h2>Recent Transactions</h2>
      <p>Your latest wallet activity.</p>
    </div>
    <a href="/wallet">View All →</a>
  </div>

  {recentTransactions.length > 0 ? (
    <div className="recent-transactions-list">
      {recentTransactions.slice(0, 5).map((transaction) => (
        <div className="recent-transaction-item" key={transaction.id}>
          <div>
            <strong>{transaction.description || 'Wallet Transaction'}</strong>
            <small>
              {new Date(transaction.createdAt).toLocaleString()}
            </small>
          </div>

          <strong className={
            transaction.type === 'CREDIT' ? 'transaction-credit' : 'transaction-debit'
          }>
            {transaction.type === 'CREDIT' ? '+' : '-'}
            ₹{Number(transaction.amount).toFixed(2)}
          </strong>
        </div>
      ))}
    </div>
  ) : (
    <div className="empty-state compact">
      <p>No transactions available yet.</p>
    </div>
  )}
</section>

        <footer className="dashboard-footer">
          © {new Date().getFullYear()} ShipNext. All rights reserved.
        </footer>
      </main>
    </div>
  );
}

export default CustomerDashboard;
