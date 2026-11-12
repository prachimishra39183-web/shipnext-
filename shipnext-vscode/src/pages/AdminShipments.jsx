
import { Link } from 'react-router-dom';

function AdminShipments() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>ShipNext <span>Admin</span></h2>
        <Link to="/admin">📊 Dashboard</Link>
        <Link to="/admin/customers">👥 Customers</Link>
        <Link to="/admin/shipments" className="admin-active">📦 Shipments</Link>
        <Link to="/admin/bookings">🚚 Bookings</Link>
        <Link to="/admin/wallet">💳 Wallet Management</Link>
        <Link to="/admin/enquiries">📩 Enquiries</Link>
        <Link to="/">🌐 View Website</Link>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Shipment Management</h1>
            <p>Manage and monitor all ShipNext shipments.</p>
          </div>
        </header>

        <section className="admin-stats">
          <div className="admin-stat-card">
            <span>Total Shipments</span>
            <h2>0</h2>
          </div>
          <div className="admin-stat-card">
            <span>In Transit</span>
            <h2>0</h2>
          </div>
          <div className="admin-stat-card">
            <span>Delivered</span>
            <h2>0</h2>
          </div>
          <div className="admin-stat-card">
            <span>Pending</span>
            <h2>0</h2>
          </div>
        </section>

        <section className="admin-content-card">
          <h2>All Shipments</h2>
          <div className="admin-empty">
            <span>📦</span>
            <h3>No shipments available</h3>
            <p>Customer shipments will appear here after booking.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminShipments;
