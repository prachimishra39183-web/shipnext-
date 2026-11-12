
import { Link } from 'react-router-dom';

function CustomerDashboard() {
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <Link to="/" className="logo">
          <span className="logo-icon">S</span>
          Ship<span>Next</span>
        </Link>

        <p className="sidebar-label">MAIN MENU</p>

        <nav className="sidebar-nav">
          <a href="#overview" className="active">▦ Dashboard</a>
         <Link to="/shipments">📦 My Shipments</Link>
         <Link to="/track">📍 Track Shipment</Link>
          <Link to="/wallet">💳 My Wallet</Link>
          <a href="#transactions">↔ Transactions</a>
         <Link to="/profile">👤 My Profile</Link>
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
           <Link to="/wallet" className="wallet-button">+ Add Money</Link>
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
