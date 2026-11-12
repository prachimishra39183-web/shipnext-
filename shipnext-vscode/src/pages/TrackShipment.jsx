
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

function TrackShipment() {
  const { trackingId } = useParams();
  const [trackingNumber, setTrackingNumber] = useState(trackingId || '');
  const [submitted, setSubmitted] = useState(false);

  const handleTrack = (event) => {
    event.preventDefault();

    if (!trackingNumber.trim()) {
      alert('Please enter your ShipNext tracking ID.');
      return;
    }

    setSubmitted(true);
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
                setSubmitted(false);
              }}
            />

            <button type="submit">Track Shipment</button>
          </div>
        </form>

        {submitted && (
          <div className="tracking-message">
            <h3>Tracking request received</h3>
            <p>
              Live tracking information will appear here once
              the ShipNext tracking service is connected.
            </p>
            <p>
              Your tracking ID: <strong>{trackingNumber}</strong>
            </p>
          </div>
        )}

        <div className="tracking-information">
          <h2>How ShipNext Tracking Works</h2>
          <p>
            ShipNext brings shipment updates together in one
            place, so you can follow your parcel without visiting
            separate courier websites.
          </p>
        </div>
      </div>
    </main>
  );
}

export default TrackShipment;
