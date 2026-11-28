import {
  ChevronDown,
  FileText,
  CreditCard,
  UserRound,
  CheckCheck,
  AlertCircle,
  Package
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import NdrManagement from '../components/NdrManagement';
import RtoManagement from '../components/RtoManagement';
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
const navigate = useNavigate();
const [paymentsOpen, setPaymentsOpen] = useState(false);
const [activeManagementTab, setActiveManagementTab] = useState('ndr');
const handleLogout = () => {
  sessionStorage.removeItem('shipnextToken');
  sessionStorage.removeItem('shipnextUser');

  navigate('/login', { replace: true });
};
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

    {/* PAYMENTS MENU */}
    <div className="sidebar-menu-group">
   <button
  type="button"
  className="sidebar-menu-toggle"
  onClick={() => setPaymentsOpen(!paymentsOpen)}
>
  <span>Payments</span>

  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: paymentsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.25s ease',
      marginLeft: '8px'
    }}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
</button>

      {paymentsOpen && (
        <div className="sidebar-submenu">
          <Link to="/settlement">Settlement</Link>
          <Link to="/wallet">Wallet</Link>
          <Link to="/billing">
  <FileText size={18} />
  <span>Billing</span>
</Link>
        </div>
      )}
    </div>

    <Link to="/cod-remittance">COD Remittance</Link>
    <Link to="/support">Support Tickets</Link>
    <Link to="/profile">My Profile</Link>
    <Link to="/settings">Settings</Link>
  </nav>

  <div className="sidebar-bottom">
    <Link to="/">← Back to Website</Link>
  </div>

  <button className="customer-logout-btn" onClick={handleLogout}>
    <span>↪</span> Logout
  </button>

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
   
  </div>
)}
  </div>

  <div className="welcome-icon"></div>
</section>

{/* NDR & RTO MANAGEMENT TABS */}
<section className="dashboard-panel sn-management-panel" id="ndr-rto-management">

  <div className="sn-management-heading">
    <div>
      <h2>Shipment Exception Management</h2>
      <p>Manage delivery exceptions and return shipments.</p>
    </div>
  </div>

  <div className="sn-management-tabs">
    <button
      className={`sn-management-tab ${activeManagementTab === 'ndr' ? 'active' : ''}`}
      onClick={() => setActiveManagementTab('ndr')}
    >
      <AlertCircle size={17} />
      NDR Management
    </button>

    <button
      className={`sn-management-tab ${activeManagementTab === 'rto' ? 'active' : ''}`}
      onClick={() => setActiveManagementTab('rto')}
    >
      <Package size={17} />
      RTO Management
    </button>
  </div>

  <div className="sn-management-content">
    {activeManagementTab === 'ndr' ? (
      <NdrManagement />
    ) : (
      <RtoManagement />
    )}
  </div>

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
