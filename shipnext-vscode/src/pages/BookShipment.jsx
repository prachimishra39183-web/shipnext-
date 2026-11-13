
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function BookShipment() {
  const navigate = useNavigate();
const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (event) => {
  event.preventDefault();

  if (Number(formData.weight) < 0.5) {
    alert('Minimum parcel weight is 500 grams (0.5 kg).');
    return;
  }

  const token = sessionStorage.getItem('shipnextToken');

  if (!token) {
    alert('Please log in before booking a shipment.');
    navigate('/login');
    return;
  }

  try {
    setIsSubmitting(true);

    const response = await fetch('http://localhost:5000/api/shipments/drafts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to save shipment details.');
    }

  sessionStorage.setItem('shipnextDraftId', data.draft.id);

alert('Shipment details saved successfully!');

navigate('/shipping-charges', {
  state: {
    draftId: data.draft.id,
  },
});

  } catch (error) {
    alert(error.message || 'Something went wrong. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
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

          <button
  type="submit"
  className="booking-submit"
  disabled={isSubmitting}
>
  {isSubmitting ? 'Saving Shipment...' : 'Continue to Shipping Charges →'}
</button>
        </form>
      </main>
    </div>
  );
}

export default BookShipment;
