
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function MyShipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const token = sessionStorage.getItem('shipnextToken');

        const response = await fetch(
          'http://localhost:5000/api/shipments/my',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load shipments.');
        }

        setShipments(data.shipments || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, []);

  return (
    <div className="booking-page">
      <header className="booking-header">
        <Link to="/" className="logo">
          <span className="logo-ship">SHIP</span>
          <span className="logo-next">NEXT</span>
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
          {loading ? (
            <div className="shipments-empty">
              <h3>Loading your shipments...</h3>
            </div>
          ) : error ? (
            <div className="shipments-empty">
              <h3>Unable to load shipments</h3>
              <p>{error}</p>
            </div>
          ) : shipments.length === 0 ? (
            <div className="shipments-empty">
              <div>📦</div>
              <h3>No shipments found</h3>
              <p>
                Your confirmed parcel bookings will appear here.
              </p>
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
                    <p>
                      {shipment.pickupPincode} → {shipment.deliveryPincode}
                    </p>
                    <p>
                      Weight: {(shipment.weightGrams / 1000).toFixed(2)} kg
                    </p>
                  </div>

                  <span className="shipment-status">
                    {shipment.status.replaceAll('_', ' ')}
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
