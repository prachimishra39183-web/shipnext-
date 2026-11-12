
import { Link } from 'react-router-dom';

function AdminWallet() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>ShipNext <span>Admin</span></h2>
        <Link to="/admin">📊 Dashboard</Link>
        <Link to="/admin/customers">👥 Customers</Link>
        <Link to="/admin/shipments">📦 Shipments</Link>
        <Link to="/admin/bookings">🚚 Bookings</Link>
        <Link to="/admin/wallet" className="admin-active">💳 Wallet Management</Link>
        <Link to="/admin/enquiries">📩 Enquiries</Link>
        <Link to="/">🌐 View Website</Link>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Wallet Management</h1>
            <p>Monitor customer wallet balances and transactions.</p>
          </div>
        </header>

        <section className="admin-stats">
          <div className="admin-stat-card">
            <span>Total Wallet Balance</span>
            <h2>₹0</h2>
          </div>
          <div className="admin-stat-card">
            <span>Total Credits</span>
            <h2>₹0</h2>
          </div>
          <div className="admin-stat-card">
            <span>Total Debits</span>
            <h2>₹0</h2>
          </div>
          <div className="admin-stat-card">
            <span>Transactions</span>
            <h2>0</h2>
          </div>
        </section>

        <section className="admin-content-card">
          <h2>Customer Wallets</h2>
          <input
            type="search"
            placeholder="Search customer by name, email or phone..."
            style={{
              width: '100%',
              padding: '14px',
              border: '1px solid #dbe2ed',
              borderRadius: '8px',
              marginBottom: '20px'
            }}
          />
          <div className="admin-empty">
            <span>💳</span>
            <h3>No wallet records yet</h3>
            <p>Customer wallet balances will appear here.</p>
          </div>
        </section>

        <section className="admin-content-card">
          <h2>Wallet Transaction History</h2>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            All wallet credits, debits, refunds and adjustments
            will be recorded here with transaction references.
          </p>
        </section>
      </main>
    </div>
  );
}

export default AdminWallet;
