
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';

function MyShipments() {
  const [shipments, setShipments] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const token = sessionStorage.getItem('shipnextToken');

        if (!token) {
          throw new Error('Please log in to view your shipments.');
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [shipmentsResponse, draftsResponse] = await Promise.all([
          fetch(`${API_URL}/api/shipments/my`, { headers }),
          fetch(`${API_URL}/api/shipments/drafts/my`, { headers }),
        ]);

        const shipmentsData = await shipmentsResponse.json();
        const draftsData = await draftsResponse.json();

        if (!shipmentsResponse.ok) {
          throw new Error(
            shipmentsData.message || 'Unable to load confirmed shipments.'
          );
        }

        if (!draftsResponse.ok) {
          throw new Error(
            draftsData.message || 'Unable to load draft shipments.'
          );
        }

        setShipments(shipmentsData.shipments || []);
        setDrafts(draftsData.drafts || []);
      } catch (err) {
        setError(err.message || 'Unable to load your shipments.');
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, []);

  const formatDate = (date) => {
    if (!date) return 'Date unavailable';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

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
          <p>View your saved drafts and confirmed parcel bookings.</p>
        </div>

        {loading ? (
          <div className="shipments-card shipments-empty">
            <h3>Loading your shipments...</h3>
          </div>
        ) : error ? (
          <div className="shipments-card shipments-empty">
            <h3>Unable to load shipments</h3>
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* DRAFT SHIPMENTS */}
            <div className="shipments-toolbar">
              <div>
                <h2>Draft Shipments</h2>
                <p>Your saved bookings that are not yet confirmed.</p>
              </div>

              <span>{drafts.length} Draft(s)</span>
            </div>

            <div className="shipments-card">
              {drafts.length === 0 ? (
                <div className="shipments-empty">
                  <div>📝</div>
                  <h3>No saved drafts</h3>
                  <p>Your saved shipment details will appear here.</p>
                </div>
              ) : (
                <div className="shipment-list">
                  {drafts.map((draft) => (
                    <article className="shipment-item" key={draft.id}>
                      <div>
                        <strong>Draft Shipment</strong>
                        <p>
                          {draft.pickupPincode} → {draft.deliveryPincode}
                        </p>
                        <p>
                          {draft.pickupName} → {draft.deliveryName}
                        </p>
                        <p>
                          Weight: {(draft.weightGrams / 1000).toFixed(2)} kg
                        </p>
                        <p>Saved: {formatDate(draft.createdAt)}</p>
                      </div>

                      <span className="shipment-status">
                        DRAFT
                      </span>
                      <Link
  to={`/shipping-charges/${draft.id}`}
  className="dashboard-button"
>
  Continue Booking →
</Link>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* CONFIRMED SHIPMENTS */}
            <div className="shipments-toolbar">
              <div>
                <h2>Confirmed Shipments</h2>
                <p>Your confirmed parcel bookings and tracking details.</p>
              </div>

              <Link to="/book-shipment" className="dashboard-button">
                + Book Shipment
              </Link>
            </div>

            <div className="shipments-card">
              {shipments.length === 0 ? (
                <div className="shipments-empty">
                  <div>📦</div>
                  <h3>No confirmed shipments</h3>
                  <p>Your confirmed bookings will appear here.</p>
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
                        <p>Booked: {formatDate(shipment.createdAt)}</p>
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
          </>
        )}
      </main>
    </div>
  );
}

export default MyShipments;
