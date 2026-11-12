
import { useState } from 'react';
import { Link } from 'react-router-dom';

function BookShipment() {
  const [formData, setFormData] = useState({
    pickupName: '',
    pickupPhone: '',
    pickupAddress: '',
    pickupPincode: '',
    deliveryName: '',
    deliveryPhone: '',
    deliveryAddress: '',
    deliveryPincode: '',
    weight: '',
  });

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (Number(formData.weight) < 0.5) {
      alert('Minimum parcel weight is 500 grams (0.5 kg).');
      return;
    }

    alert('Shipment details saved for the next booking step. Backend connection will be added later.');
  };

  return (
    <div className="booking-page">
      <header className="booking-header">
        <Link to="/dashboard" className="logo">
          <span className="logo-icon">S</span>
          Ship<span>Next</span>
        </Link>
        <Link to="/dashboard" className="booking-back">← Back to Dashboard</Link>
      </header>

      <main className="booking-container">
        <div className="booking-heading">
          <span>SHIP WITH SHIPNEXT</span>
          <h1>Book a Shipment</h1>
          <p>Enter your pickup, delivery and parcel details.</p>
        </div>

        <form className="booking-form" onSubmit={handleSubmit}>
          <section className="booking-section">
            <h2>📍 Pickup Details</h2>

            <div className="booking-grid">
              <div className="booking-field">
                <label>Sender Name</label>
                <input name="pickupName" value={formData.pickupName} onChange={handleChange} placeholder="Enter sender name" required />
              </div>

              <div className="booking-field">
                <label>Sender Mobile Number</label>
                <input name="pickupPhone" type="tel" pattern="[0-9]{10}" maxLength={10} value={formData.pickupPhone} onChange={handleChange} placeholder="10-digit mobile number" required />
              </div>

              <div className="booking-field full-width">
                <label>Pickup Address</label>
                <textarea name="pickupAddress" value={formData.pickupAddress} onChange={handleChange} placeholder="House number, street, area, landmark" required />
              </div>

              <div className="booking-field">
                <label>Pickup Pincode</label>
                <input name="pickupPincode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={formData.pickupPincode} onChange={handleChange} placeholder="6-digit pincode" required />
              </div>
            </div>
          </section>

          <section className="booking-section">
            <h2>🚚 Delivery Details</h2>

            <div className="booking-grid">
              <div className="booking-field">
                <label>Receiver Name</label>
                <input name="deliveryName" value={formData.deliveryName} onChange={handleChange} placeholder="Enter receiver name" required />
              </div>

              <div className="booking-field">
                <label>Receiver Mobile Number</label>
                <input name="deliveryPhone" type="tel" pattern="[0-9]{10}" maxLength={10} value={formData.deliveryPhone} onChange={handleChange} placeholder="10-digit mobile number" required />
              </div>

              <div className="booking-field full-width">
                <label>Delivery Address</label>
                <textarea name="deliveryAddress" value={formData.deliveryAddress} onChange={handleChange} placeholder="House number, street, area, landmark" required />
              </div>

              <div className="booking-field">
                <label>Delivery Pincode</label>
                <input name="deliveryPincode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={formData.deliveryPincode} onChange={handleChange} placeholder="6-digit pincode" required />
              </div>
            </div>
          </section>

          <section className="booking-section">
            <h2>📦 Parcel Details</h2>

            <div className="booking-grid">
              <div className="booking-field">
                <label>Parcel Weight (kg)</label>
                <input name="weight" type="number" min="0.5" step="0.1" value={formData.weight} onChange={handleChange} placeholder="Minimum 0.5 kg" required />
                <small>Minimum booking weight: 500 grams.</small>
              </div>
            </div>
          </section>

          <div className="booking-note">
            Your shipping charges will be calculated using parcel weight and pickup/delivery pincodes.
          </div>

          <button type="submit" className="booking-submit">
            Continue to Shipping Charges →
          </button>
        </form>
      </main>
    </div>
  );
}

export default BookShipment;
