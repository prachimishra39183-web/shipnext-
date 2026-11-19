
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import API_URL from '../config/api';

function TrackShipment() {
  const { trackingId } = useParams();

  const [trackingNumber, setTrackingNumber] = useState(trackingId || '');
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (event) => {
    event.preventDefault();

    if (!trackingNumber.trim()) {
      setError('Please enter your ShipNext tracking ID.');
      return;
    }

    setLoading(true);
    setError('');
    setShipment(null);

    try {
      const response = await fetch(
        `${API_URL}/api/shipments/track/${encodeURIComponent(
          trackingNumber.trim()
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Shipment not found.');
      }

      setShipment(data.shipment);
    } catch (err) {
      setError(err.message || 'Unable to track shipment.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date, includeTime = false) => {
    if (!date) return 'Not available';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return 'Not available';

    return parsedDate.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  };

  const formatStatus = (status) => {
    if (!status) return 'STATUS UNAVAILABLE';
    return status.replaceAll('_', ' ').toUpperCase();
  };

  return (
    <main className="sn-track-page">
      <header className="sn-track-header">
        <Link to="/" className="sn-track-brand">
         
        </Link>

        <Link to="/dashboard" className="sn-track-back">
          Back to Dashboard
        </Link>
      </header>

      <section className="sn-track-hero">
        <div className="sn-track-eyebrow">
          SHIPNEXT DELIVERY NETWORK
        </div>

        <h1>
          Every shipment.
          <span> One clear view.</span>
        </h1>

        <p>
          Track your shipment using its ShipNext tracking ID
          and view the latest recorded shipment information.
        </p>

        <div className="sn-track-search-card">
          <div className="sn-track-search-heading">
            <div>
              <span className="sn-track-small-label">SHIPMENT LOOKUP</span>
              <h2>Track your delivery</h2>
            </div>
            <span className="sn-track-search-number">01 / TRACK</span>
          </div>

          <form onSubmit={handleTrack}>
            <label htmlFor="snTrackingNumber">
              ShipNext Tracking ID
            </label>

            <div className="sn-track-input-row">
              <input
                id="snTrackingNumber"
                type="text"
                placeholder="Enter your tracking ID"
                value={trackingNumber}
                onChange={(event) => {
                  setTrackingNumber(event.target.value);
                  setShipment(null);
                  setError('');
                }}
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? 'Checking...' : 'Track Shipment'}
              </button>
            </div>

            <p className="sn-track-input-note">
              Enter the tracking ID provided after your shipment is booked.
            </p>
          </form>
        </div>
      </section>

      {error && (
        <section className="sn-track-result sn-track-error">
          <span className="sn-track-small-label">TRACKING UPDATE</span>
          <h2>We couldn't find your shipment</h2>
          <p>{error}</p>
          <button
            type="button"
            className="sn-track-retry"
            onClick={() => {
              setError('');
              setTrackingNumber('');
            }}
          >
            Try another tracking ID
          </button>
        </section>
      )}

      {shipment && (
        <section className="sn-track-result">
          <div className="sn-track-result-top">
            <div>
              <span className="sn-track-small-label">
                SHIPMENT INFORMATION
              </span>
              <h2>Your shipment details</h2>
              <p className="sn-track-result-description">
                Latest shipment information recorded by ShipNext.
              </p>
            </div>

            <div className="sn-track-status">
              <span> CURRENT STATUS </span>
              <strong>{formatStatus(shipment.status)}</strong>
            </div>
          </div>

          <div className="sn-track-id-panel">
            <span>TRACKING REFERENCE</span>
            <strong>{shipment.trackingId || 'Not available'}</strong>
          </div>

          <div className="sn-track-route">
            <div className="sn-track-route-point">
              <span className="sn-track-route-label">PICKUP LOCATION</span>
              <strong>{shipment.pickupPincode || '—'}</strong>
              <p>Shipment origin</p>
            </div>

            <div className="sn-track-route-line">
              <span>SHIPNEXT NETWORK</span>
              <div></div>
            </div>

            <div className="sn-track-route-point sn-track-destination">
              <span className="sn-track-route-label">DELIVERY LOCATION</span>
              <strong>{shipment.deliveryPincode || '—'}</strong>
              <p>Shipment destination</p>
            </div>
          </div>

          <div className="sn-track-details-heading">
            <span className="sn-track-small-label">SHIPMENT BREAKDOWN</span>
            <h3>Booking details</h3>
          </div>

          <div className="sn-track-details-grid">
            <div className="sn-track-detail">
              <span>Shipment weight</span>
              <strong>
                {typeof shipment.weightGrams === 'number'
                  ? `${(shipment.weightGrams / 1000).toFixed(2)} kg`
                  : 'Not available'}
              </strong>
            </div>

            <div className="sn-track-detail">
              <span>Booking date</span>
              <strong>{formatDate(shipment.createdAt)}</strong>
            </div>

            <div className="sn-track-detail">
              <span>Last updated</span>
              <strong>{formatDate(shipment.updatedAt, true)}</strong>
            </div>

            <div className="sn-track-detail">
              <span>Current status</span>
              <strong>{formatStatus(shipment.status)}</strong>
            </div>
          </div>

          <div className="sn-track-disclaimer">
            <strong>Tracking information</strong>
            <p>
              This page displays the latest shipment details returned
              by ShipNext. Detailed movement events will appear here
              when tracking updates are available.
            </p>
          </div>
        </section>
      )}

      {!shipment && !error && (
        <section className="sn-track-benefits">
          <div>
            <span className="sn-track-benefit-number">01</span>
            <h3>Enter your reference</h3>
            <p>Use the tracking ID associated with your booking.</p>
          </div>

          <div>
            <span className="sn-track-benefit-number">02</span>
            <h3>Retrieve shipment details</h3>
            <p>ShipNext checks the latest recorded shipment information.</p>
          </div>

          <div>
            <span className="sn-track-benefit-number">03</span>
            <h3>Review your shipment</h3>
            <p>View the available status, route and booking details.</p>
          </div>
        </section>
      )}

      <footer className="sn-track-footer">
        
        <p>Moving your shipments forward.</p>
      </footer>
    </main>
  );
}

export default TrackShipment;
