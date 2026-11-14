
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
function ShippingCharges() {
  const location = useLocation();
  const navigate = useNavigate();

  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDraft = async () => {
      const token = sessionStorage.getItem('shipnextToken');
      const draftId =
        location.state?.draftId ||
        sessionStorage.getItem('shipnextDraftId');

      if (!token) {
        navigate('/login');
        return;
      }

      if (!draftId) {
        setError('No saved shipment details found. Please enter your shipment details first.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/shipments/drafts/${draftId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load shipment details.');
        }

        setShipment(data.draft);
      } catch (err) {
        setError(err.message || 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    fetchDraft();
  }, [location.state, navigate]);

  if (loading) {
    return (
      <div className="booking-page">
        <main className="charges-container">
          <div className="booking-heading">
            <h1>Loading Shipment Details...</h1>
            <p>Please wait while we retrieve your saved shipment.</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="booking-page">
        <main className="charges-container">
          <div className="booking-heading">
            <h1>Shipment Details</h1>
            <p>{error || 'Shipment details could not be loaded.'}</p>
            <Link to="/book-shipment" className="booking-submit">
              Enter Shipment Details
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const weightKg = (shipment.weightGrams / 1000).toFixed(2);

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
          <p>Review your saved shipment details.</p>
        </div>

        <div className="charges-card">
          <h2>Pickup Details</h2>

          <div className="charge-row">
            <span>Sender Name</span>
            <strong>{shipment.pickupName}</strong>
          </div>

          <div className="charge-row">
            <span>Sender Mobile</span>
            <strong>{shipment.pickupPhone}</strong>
          </div>

          <div className="charge-row">
            <span>Pickup Address</span>
            <strong>{shipment.pickupAddress}</strong>
          </div>

          <div className="charge-row">
            <span>Pickup Pincode</span>
            <strong>{shipment.pickupPincode}</strong>
          </div>

          <h2>Delivery Details</h2>

          <div className="charge-row">
            <span>Receiver Name</span>
            <strong>{shipment.deliveryName}</strong>
          </div>

          <div className="charge-row">
            <span>Receiver Mobile</span>
            <strong>{shipment.deliveryPhone}</strong>
          </div>

          <div className="charge-row">
            <span>Delivery Address</span>
            <strong>{shipment.deliveryAddress}</strong>
          </div>

          <div className="charge-row">
            <span>Delivery Pincode</span>
            <strong>{shipment.deliveryPincode}</strong>
          </div>

          <h2>Parcel Details</h2>

          <div className="charge-row">
            <span>Parcel Weight</span>
            <strong>{weightKg} kg</strong>
          </div>

          <div className="charges-note">
            Your shipment details have been saved successfully.

            <br /><br />

            Shipping charges will be calculated by the ShipNext backend
            using configured rates and pincode serviceability.

            <br /><br />

            This shipment is currently a draft. No wallet amount has
            been deducted and no tracking ID has been generated.
          </div>

          <button
            type="button"
            className="booking-submit charges-confirm"
            disabled
          >
            Shipping Charge Calculation Coming Next
          </button>

          <Link to="/book-shipment" className="charges-edit">
            Edit Shipment Details
          </Link>
        </div>
      </main>
    </div>
  );
}

export default ShippingCharges;
