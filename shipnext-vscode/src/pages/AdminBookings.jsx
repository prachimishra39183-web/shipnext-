
import { Link } from 'react-router-dom';
import './AdminBookings.css';

function AdminBookings() {
  const bookingDetails = [
    'Customer name and contact details',
    'Pickup and delivery addresses',
    'Pickup and delivery pincodes',
    'Parcel weight and shipping charge',
    'ShipNext tracking ID',
    'Internal courier provider reference',
    'Booking and shipment status',
  ];

  return (
    <div className="admin-layout sn-bookings-page">
      <aside className="admin-sidebar sn-bookings-sidebar">
        <img
          src="/logo.png"
          alt="ShipNext Logo"
          className="logo-image"
        />

        <div className="sn-booking-nav-label">OVERVIEW</div>
        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/customers">Customers</Link>
        <Link to="/admin/shipments">Shipments</Link>
        <Link to="/admin/bookings" className="admin-active">
          Bookings
        </Link>

        <div className="sn-booking-nav-label">OPERATIONS</div>
        <Link to="/admin/wallet">Wallet Management</Link>
        <Link to="/admin/enquiries">Enquiries</Link>
        <Link to="/">View Website</Link>

        <div className="sn-booking-sidebar-footer">
          <span className="sn-booking-online-dot" />
          <div>
            <strong>Administrator</strong>
            <small>System access</small>
          </div>
        </div>
      </aside>

      <main className="admin-main sn-bookings-main">
        <header className="sn-bookings-header">
          <div>
            <span className="sn-booking-eyebrow">
              SHIPNEXT CONTROL CENTER
            </span>
            <h1>Booking Management</h1>
            <p>Monitor and manage customer shipment bookings.</p>
          </div>

          <div className="sn-booking-header-status">
            <span className="sn-booking-online-dot" />
            Booking Operations
          </div>
        </header>

        <section className="sn-booking-hero">
          <div className="sn-booking-hero-copy">
            <span className="sn-booking-hero-label">
              BOOKING OPERATIONS
            </span>
            <h2>Every booking. One control center.</h2>
            <p>
              Keep track of customer shipment bookings, booking information
              and processing activity from your ShipNext administration panel.
            </p>
          </div>

          <div className="sn-booking-hero-art" aria-hidden="true">
            <div className="sn-booking-art-ring ring-one" />
            <div className="sn-booking-art-ring ring-two" />
            <div className="sn-booking-art-core" />
          </div>
        </section>

        <section className="sn-booking-stats">
          <article className="sn-booking-stat stat-orange">
            <div className="sn-booking-stat-top">
              <span>Total Bookings</span>
              <span>01</span>
            </div>
            <strong>0</strong>
            <p>All customer bookings</p>
            <div className="sn-booking-stat-line" />
          </article>

          <article className="sn-booking-stat stat-green">
            <div className="sn-booking-stat-top">
              <span>Confirmed</span>
              <span>02</span>
            </div>
            <strong>0</strong>
            <p>Confirmed bookings</p>
            <div className="sn-booking-stat-line" />
          </article>

          <article className="sn-booking-stat stat-blue">
            <div className="sn-booking-stat-top">
              <span>Pending</span>
              <span>03</span>
            </div>
            <strong>0</strong>
            <p>Awaiting confirmation</p>
            <div className="sn-booking-stat-line" />
          </article>

          <article className="sn-booking-stat stat-red">
            <div className="sn-booking-stat-top">
              <span>Cancelled</span>
              <span>04</span>
            </div>
            <strong>0</strong>
            <p>Cancelled bookings</p>
            <div className="sn-booking-stat-line" />
          </article>
        </section>

        <section className="sn-booking-panel">
          <div className="sn-booking-panel-heading">
            <div>
              <span className="sn-booking-eyebrow">
                BOOKING DIRECTORY
              </span>
              <h2>All Bookings</h2>
              <p>Customer booking records and their current status.</p>
            </div>

            <span className="sn-booking-record-tag">
              <span className="sn-booking-online-dot" />
              0 Records
            </span>
          </div>

          <div className="sn-booking-empty">
            <div className="sn-booking-empty-visual">
              <div className="sn-booking-empty-ring">
                <div className="sn-booking-empty-core" />
              </div>
            </div>

            <span className="sn-booking-empty-label">
              BOOKING DATABASE
            </span>
            <h3>No bookings available</h3>
            <p>
              New customer bookings will appear here once customers
              complete their shipment booking process.
            </p>
          </div>
        </section>

        <section className="sn-booking-information">
          <div className="sn-booking-information-heading">
            <div>
              <span className="sn-booking-eyebrow">
                RECORD STRUCTURE
              </span>
              <h2>Booking Information</h2>
              <p>Information associated with each customer booking.</p>
            </div>
            <div className="sn-booking-info-badge">
              BOOKING DETAILS
            </div>
          </div>

          <div className="sn-booking-detail-grid">
            {bookingDetails.map((detail, index) => (
              <div className="sn-booking-detail" key={detail}>
                <span className="sn-booking-detail-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{detail}</span>
                <span className="sn-booking-detail-arrow">↗</span>
              </div>
            ))}
          </div>
        </section>

        <footer className="sn-booking-footer">
          <span>SHIPNEXT · BOOKING MANAGEMENT</span>
          <span>ADMINISTRATION CONTROL CENTER</span>
        </footer>
      </main>
    </div>
  );
}

export default AdminBookings;
