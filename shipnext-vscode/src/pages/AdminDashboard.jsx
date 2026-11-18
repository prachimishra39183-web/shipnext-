
import { Link } from 'react-router-dom';
import AdminNotificationBell from '../components/AdminNotificationBell.jsx';
function AdminDashboard() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
       <img
        src="/logo.png"
        alt="ShipNext Logo"
        className="logo-image"
      /> <span>Admin</span>
      

        <p className="admin-menu-title">MAIN MENU</p>

        <Link to="/admin" className="admin-active"> Dashboard</Link>
        <Link to="/admin/customers"> Customers</Link>
        <Link to="/admin/shipments">Shipments</Link>
        <Link to="/admin/bookings">Bookings</Link>
        <Link to="/admin/wallet"> Wallet Management</Link>
        <Link to="/admin/enquiries">Enquiries</Link>
          <Link to="/admin/support">Support Tickets →</Link>
          <Link to="/admin/reports">Reports</Link>
        <p className="admin-menu-title">ACCOUNT</p>
        <Link to="/">View Website</Link>
        <Link to="/login">↪ Logout</Link>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome to ShipNext administration panel.</p>
          </div>
          
        </header>

        <section className="admin-stats">
          <div className="admin-stat-card">
            <span>Total Customers</span>
            <h2>0</h2>
            <p>Registered customers</p>
          </div>

          <div className="admin-stat-card">
            <span>Total Shipments</span>
            <h2>0</h2>
            <p>All shipments</p>
          </div>

          <div className="admin-stat-card">
            <span>Pending Shipments</span>
            <h2>0</h2>
            <p>Awaiting processing</p>
          </div>

          <div className="admin-stat-card">
            <span>Total Enquiries</span>
            <h2>0</h2>
            <p>Customer enquiries</p>
          </div>
        </section>

        <section className="admin-content-card">
          <h2>Recent Shipments</h2>
          <div className="admin-empty">
            <span>📦</span>
            <h3>No shipments yet</h3>
            <p>New customer shipments will appear here.</p>
          </div>
        </section>

      
      </main>
    </div>
  );
}

export default AdminDashboard;
