
import { Link } from 'react-router-dom';

function MyShipments() {
  const shipments = [];

  return (
    <div className="booking-page">
      <header className="booking-header">
        <Link to="/dashboard" className="logo">
          <span className="logo-icon">S</span>
          Ship<span>Next</span>
        </Link>

        <Link to="/dashboard" className="booking-back">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="shipments-container">
        <div className="booking-heading">
          <span>YOUR SHIPNEXT ACCOUNT</span>
          <h1>My Shipments</h1>
          <p>View and track all your parcel bookings.</p>
        </div>

        <div className="shipments-toolbar">
          <div>
            <h2>All Shipments</h2>
            <p>Your complete booking history.</p>
          </div>

          <Link to="/book-shipment" className="dashboard-button">
            + Book Shipment
          </Link>
        </div>

        <div className="shipments-card">
          {shipments.length === 0 ? (
            <div className="shipments-empty">
              <div>📦</div>
              <h3>No shipments found</h3>
              <p>Your parcel bookings will appear here once you book your first shipment.</p>
              <Link to="/book-shipment" className="dashboard-button">
                Book Your First Shipment →
              </Link>
            </div>
          ) : (
            <div className="shipment-list">
              {shipments.map((shipment) => (
                <article className="shipment-item" key={shipment.id}>
                  <div>
                    <strong>{shipment.trackingId}</strong>
                    <p>{shipment.destination}</p>
                  </div>

                  <span className="shipment-status">
                    {shipment.status}
                  </span>

                  <Link to={`/track/${shipment.trackingId}`}>
                    View Details →
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MyShipments;
