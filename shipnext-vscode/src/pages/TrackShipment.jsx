
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

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
        `http://localhost:5000/api/shipments/track/${encodeURIComponent(
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

  return (
    <main className="tracking-page">
      <div className="tracking-container">
        <Link to="/dashboard" className="tracking-back">
          ← Back to Dashboard
        </Link>

        <div className="tracking-heading">
          <div className="tracking-icon">📦</div>
          <h1>Track Your Shipment</h1>
          <p>
            Follow your shipment's journey with ShipNext.
          </p>
        </div>

        <form className="tracking-search" onSubmit={handleTrack}>
          <label htmlFor="trackingNumber">
            ShipNext Tracking ID
          </label>

          <div className="tracking-input-row">
            <input
              id="trackingNumber"
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
        </form>

        {error && (
          <div className="tracking-message">
            <h3>Tracking unsuccessful</h3>
            <p>{error}</p>
          </div>
        )}

        {shipment && (
          <div className="tracking-message">
            <h3>Shipment Found ✓</h3>

            <p>
              Tracking ID: <strong>{shipment.trackingId}</strong>
            </p>

            <p>
              Current Status:{' '}
              <strong>{shipment.status.replaceAll('_', ' ')}</strong>
            </p>

            <p>
              Pickup PIN: <strong>{shipment.pickupPincode}</strong>
            </p>

            <p>
              Delivery PIN: <strong>{shipment.deliveryPincode}</strong>
            </p>

            <p>
              Parcel Weight:{' '}
              <strong>
                {(shipment.weightGrams / 1000).toFixed(2)} kg
              </strong>
            </p>

            <p>
              Booking Date:{' '}
              <strong>
                {new Date(shipment.createdAt).toLocaleDateString('en-IN')}
              </strong>
            </p>

            <p>
              Last Updated:{' '}
              <strong>
                {new Date(shipment.updatedAt).toLocaleString('en-IN')}
              </strong>
            </p>
          </div>
        )}

        <div className="tracking-information">
          <h2>How ShipNext Tracking Works</h2>
          <p>
            Enter your ShipNext tracking ID to retrieve your
            shipment's latest recorded status.
          </p>
        </div>
      </div>
    </main>
  );
}

export default TrackShipment;
