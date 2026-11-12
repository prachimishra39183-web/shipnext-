
import { Link } from 'react-router-dom';

function AdminEnquiries() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>ShipNext <span>Admin</span></h2>
        <Link to="/admin">📊 Dashboard</Link>
        <Link to="/admin/customers">👥 Customers</Link>
        <Link to="/admin/shipments">📦 Shipments</Link>
        <Link to="/admin/bookings">🚚 Bookings</Link>
        <Link to="/admin/wallet">💳 Wallet Management</Link>
        <Link to="/admin/enquiries" className="admin-active">📩 Enquiries</Link>
        <Link to="/">🌐 View Website</Link>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Customer Enquiries</h1>
            <p>Manage enquiries submitted by website visitors.</p>
          </div>
        </header>

        <section className="admin-stats">
          <div className="admin-stat-card">
            <span>Total Enquiries</span>
            <h2>0</h2>
          </div>
          <div className="admin-stat-card">
            <span>New</span>
            <h2>0</h2>
          </div>
          <div className="admin-stat-card">
            <span>In Progress</span>
            <h2>0</h2>
          </div>
          <div className="admin-stat-card">
            <span>Resolved</span>
            <h2>0</h2>
          </div>
        </section>

        <section className="admin-content-card">
          <h2>All Enquiries</h2>

          <input
            type="search"
            placeholder="Search by name, email or phone..."
            style={{
              width: '100%',
              padding: '14px',
              border: '1px solid #dbe2ed',
              borderRadius: '8px',
              marginBottom: '20px'
            }}
          />

          <div className="admin-empty">
            <span>📩</span>
            <h3>No enquiries received</h3>
            <p>Website visitor enquiries will appear here.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminEnquiries;
