
import { Link } from 'react-router-dom';

function AdminCustomers() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>ShipNext <span>Admin</span></h2>
        <Link to="/admin">📊 Dashboard</Link>
        <Link to="/admin/customers" className="admin-active">👥 Customers</Link>
        <Link to="/admin/shipments">📦 Shipments</Link>
        <Link to="/admin/bookings">🚚 Bookings</Link>
        <Link to="/admin/wallet">💳 Wallet Management</Link>
        <Link to="/admin/enquiries">📩 Enquiries</Link>
        <Link to="/">🌐 View Website</Link>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Customer Management</h1>
            <p>Manage all ShipNext registered customers.</p>
          </div>
        </header>

        <section className="admin-content-card">
          <h2>All Customers</h2>
          <input
            type="search"
            placeholder="Search by customer name, email or phone..."
            style={{
              width: '100%',
              padding: '14px',
              border: '1px solid #dbe2ed',
              borderRadius: '8px',
              marginBottom: '20px'
            }}
          />
          <div className="admin-empty">
            <span>👥</span>
            <h3>No customers registered yet</h3>
            <p>Registered customers will appear here.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminCustomers;
