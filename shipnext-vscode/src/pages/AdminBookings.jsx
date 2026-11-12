
import { Link } from 'react-router-dom';

function AdminBookings() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>ShipNext <span>Admin</span></h2>
        <Link to="/admin">📊 Dashboard</Link>
        <Link to="/admin/customers">👥 Customers</Link>
        <Link to="/admin/shipments">📦 Shipments</Link>
        <Link to="/admin/bookings" className="admin-active">🚚 Bookings</Link>
        <Link to="/admin/wallet">💳 Wallet Management</Link>
        <Link to="/admin/enquiries">📩 Enquiries</Link>
        <Link to="/">🌐 View Website</Link>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Booking Management</h1>
            <p>View and manage all customer shipment bookings.</p>
          </div>
        </header>

        <section className="admin-stats">
          <div className="admin-stat-card">
            <span>Total Bookings</span>
            <h2>0</h2>
          </div>
          <div className="admin-stat-card">
            <span>Confirmed</span>
            <h2>0</h2>
          </div>
          <div className="admin-stat-card">
            <span>Pending</span>
            <h2>0</h2>
          </div>
          <div className="admin-stat-card">
            <span>Cancelled</span>
            <h2>0</h2>
          </div>
        </section>

        <section className="admin-content-card">
          <h2>All Bookings</h2>
          <div className="admin-empty">
            <span>🚚</span>
            <h3>No bookings available</h3>
            <p>New customer bookings will appear here.</p>
          </div>
        </section>

        <section className="admin-content-card">
          <h2>Booking Information</h2>
          <p>Each booking will include:</p>
          <ul style={{ paddingLeft: '22px', lineHeight: '2', color: '#64748b' }}>
            <li>Customer name and contact details</li>
            <li>Pickup and delivery addresses</li>
            <li>Pickup and delivery pincodes</li>
            <li>Parcel weight and shipping charge</li>
            <li>ShipNext tracking ID</li>
            <li>Internal courier provider reference</li>
            <li>Booking and shipment status</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

export default AdminBookings;
