
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import API_URL from '../config/api';

function ShippingCharges() {
  const location = useLocation();
  const navigate = useNavigate();

  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [courierResults, setCourierResults] = useState([]);
  const [courierLoading, setCourierLoading] = useState(false);
  const [courierError, setCourierError] = useState('');
  const { draftId: urlDraftId } = useParams();

  useEffect(() => {
    const fetchDraft = async () => {
      const token = sessionStorage.getItem('shipnextToken');
      const draftId =
  urlDraftId ||
  location.state?.draftId ||
  sessionStorage.getItem('shipnextDraftId');

      if (!token) {
        navigate('/login');
        return;
      }

      if (!draftId) {
        setError(
          'No saved shipment details found. Please enter your shipment details first.'
        );
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
          throw new Error(
            data.message || 'Unable to load shipment details.'
          );
        }

        setShipment(data.draft);
      } catch (err) {
        setError(err.message || 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    fetchDraft();
   }, [urlDraftId, location.state, navigate]);

  // CHECK ALL THREE COURIERS
  useEffect(() => {
    if (!shipment) return;

    const checkCouriers = async () => {
      setCourierLoading(true);
      setCourierError('');
      setCourierResults([]);

      try {
        const response = await fetch(
          `${API_URL}/api/serviceability/couriers/check`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              pickupPincode: String(shipment.pickupPincode),
              deliveryPincode: String(shipment.deliveryPincode),
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || 'Unable to check courier availability.'
          );
        }

        setCourierResults(data.courierResults || []);
      } catch (err) {
        setCourierError(
          err.message || 'Unable to check courier availability.'
        );
      } finally {
        setCourierLoading(false);
      }
    };

    checkCouriers();
  }, [shipment]);

  const courierNames = {
    DELHIVERY: 'Delhivery',
    SKYKING: 'Skyking',
    BLUEDART: 'Blue Dart',
  };

  const renderAvailability = (value) => (
    <span
      style={{
        color: value ? '#15803d' : '#dc2626',
        fontWeight: 600,
      }}
    >
      {value ? 'Available' : 'Not available'}
    </span>
  );

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

          {/* COURIER AVAILABILITY */}
          <div style={{ marginTop: '30px' }}>
            <h2>Courier Partner Availability</h2>

            <p style={{ color: '#64748b', marginBottom: '18px' }}>
              Checking courier PIN-code records for your shipment.
            </p>

            {courierLoading && (
              <p>Checking Delhivery, Skyking and Blue Dart...</p>
            )}

            {courierError && (
              <div
                style={{
                  padding: '14px',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}
              >
                {courierError}
              </div>
            )}

            {!courierLoading &&
              !courierError &&
              courierResults.map((courier) => (
                <div
                  key={courier.courier}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '18px',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <h3 style={{ margin: 0 }}>
                      {courierNames[courier.courier] || courier.courier}
                    </h3>

                    <span
                      style={{
                        background: courier.serviceable
                          ? '#dcfce7'
                          : '#fee2e2',
                        color: courier.serviceable
                          ? '#166534'
                          : '#991b1b',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      {courier.serviceable
                        ? 'PIN codes available'
                        : 'PIN codes unavailable'}
                    </span>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <div className="charge-row">
                      <span>Pickup PIN</span>
                      {renderAvailability(courier.pickup.available)}
                    </div>

                    <div className="charge-row">
                      <span>Delivery PIN</span>
                      {renderAvailability(courier.delivery.available)}
                    </div>
                  </div>

                  {courier.serviceable && (
                    <div style={{ marginTop: '14px' }}>
                      <strong>Pickup services</strong>

                      {[
                        ['Prepaid', courier.pickup.prepaid],
                        ['Reverse Pickup', courier.pickup.reversePickup],
                        ['Replacement', courier.pickup.repl],
                        ['COD', courier.pickup.cod],
                        ['Cash', courier.pickup.cash],
                      ].map(([label, available]) => (
                        <div className="charge-row" key={`pickup-${label}`}>
                          <span>{label}</span>
                          {renderAvailability(available)}
                        </div>
                      ))}

                      <strong
                        style={{
                          display: 'block',
                          marginTop: '12px',
                        }}
                      >
                        Delivery services
                      </strong>

                      {[
                        ['Prepaid', courier.delivery.prepaid],
                        ['Reverse Pickup', courier.delivery.reversePickup],
                        ['Replacement', courier.delivery.repl],
                        ['COD', courier.delivery.cod],
                        ['Cash', courier.delivery.cash],
                      ].map(([label, available]) => (
                        <div
                          className="charge-row"
                          key={`delivery-${label}`}
                        >
                          <span>{label}</span>
                          {renderAvailability(available)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

            {!courierLoading &&
              !courierError &&
              courierResults.length === 0 && (
                <p>No courier results returned.</p>
              )}

            <p
              style={{
                fontSize: '12px',
                color: '#64748b',
                marginTop: '12px',
              }}
            >
              Results are based on the imported client-provided PIN-code
              dataset. Actual courier route acceptance and live availability
              must be confirmed with each courier partner.
            </p>
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
