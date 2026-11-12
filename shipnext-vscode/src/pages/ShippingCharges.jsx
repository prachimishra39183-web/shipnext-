
import { Link } from 'react-router-dom';

function ShippingCharges() {
  // Temporary demo values.
  // Later, these will come from the booking form and backend.
  const shipment = {
    pickupPincode: '110001',
    deliveryPincode: '400001',
    weight: '1.0 kg',
    estimatedCharge: 80,
  };

  return (
    <div className="booking-page">
      <header className="booking-header">
        <Link to="/dashboard" className="logo">
          <span className="logo-icon">S</span>
          Ship<span>Next</span>
        </Link>

        <Link to="/book-shipment" className="booking-back">
          ← Back to Shipment Details
        </Link>
      </header>

      <main className="charges-container">
        <div className="booking-heading">
          <span>SHIPNEXT BOOKING</span>
          <h1>Shipping Charges</h1>
          <p>Review your shipment details and estimated charges.</p>
        </div>

        <div className="charges-card">
          <h2>Shipment Summary</h2>

          <div className="charge-row">
            <span>Pickup Pincode</span>
            <strong>{shipment.pickupPincode}</strong>
          </div>

          <div className="charge-row">
            <span>Delivery Pincode</span>
            <strong>{shipment.deliveryPincode}</strong>
          </div>

          <div className="charge-row">
            <span>Parcel Weight</span>
            <strong>{shipment.weight}</strong>
          </div>

          <div className="charge-row">
            <span>Estimated Shipping Charge</span>
            <strong>₹{shipment.estimatedCharge.toFixed(2)}</strong>
          </div>

          <div className="charge-total">
            <span>Total Amount</span>
            <strong>₹{shipment.estimatedCharge.toFixed(2)}</strong>
          </div>

          <div className="charges-note">
            This is a demonstration price. Actual shipping charges will be
            calculated by the ShipNext backend using configured rates and
            serviceability.
          </div>

          <Link to="/dashboard" className="booking-submit charges-confirm">
            Continue to Dashboard →
          </Link>

          <Link to="/book-shipment" className="charges-edit">
            Edit Shipment Details
          </Link>
        </div>
      </main>
    </div>
  );
}

export default ShippingCharges;
