
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import API_URL from '../config/api';
import DocketSlip from '../components/DocketSlip';

const MODE_LABELS = {
  EXPRESS_AIR: 'Express Air',
  NORMAL_AIR: 'Normal Air',
  EXPRESS_SURFACE: 'Express Surface',
  NORMAL_SURFACE: 'Normal Surface',
};

function ShippingCharges() {
  const location = useLocation();
  const navigate = useNavigate();
  const { draftId: urlDraftId } = useParams();

  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [availableModes, setAvailableModes] = useState([]);
  const [courierResults, setCourierResults] = useState([]);
const [selectedCourier, setSelectedCourier] = useState('');
const [courierCheckError, setCourierCheckError] = useState('');
  const [modeLoading, setModeLoading] = useState(false);
  const [modeError, setModeError] = useState('');
  const [selectedMode, setSelectedMode] = useState('');

  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');

  const [walletBalance, setWalletBalance] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState('');

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingResult, setBookingResult] = useState(null);

  // LOAD SAVED SHIPMENT
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
        setError('No saved shipment found. Please enter shipment details first.');
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
        sessionStorage.setItem('shipnextDraftId', draftId);
      } catch (err) {
        setError(err.message || 'Unable to load shipment details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDraft();
  }, [urlDraftId, location.state, navigate]);

  // LOAD CUSTOMER WALLET BALANCE
  useEffect(() => {
    if (!shipment) return;

    const fetchWallet = async () => {
      const token = sessionStorage.getItem('shipnextToken');

      setWalletLoading(true);
      setWalletError('');

      try {
        const response = await fetch(`${API_URL}/api/wallet/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load wallet balance.');
        }

        const balance = Number(
          data.wallet?.balance ??
          data.balance ??
          data.walletBalance ??
          0
        );

        if (!Number.isFinite(balance)) {
          throw new Error('Invalid wallet balance received.');
        }

        setWalletBalance(balance);
      } catch (err) {
        setWalletError(err.message || 'Unable to load wallet balance.');
      } finally {
        setWalletLoading(false);
      }
    };

    fetchWallet();
  }, [shipment]);

  // CHECK AVAILABLE SHIPPING MODES
  useEffect(() => {
    if (!shipment) return;

    const checkModes = async () => {

      setModeLoading(true);
      setModeError('');
      setAvailableModes([]);
      
      setSelectedMode('');
      setQuote(null);
      setQuoteError('');

      try {
        const response = await fetch(
          `${API_URL}/api/serviceability/check`,
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
            data.message || 'Unable to check available modes.'
          );
        }

        const modes = (data.availableModes || []).filter(
          (item) => item && MODE_LABELS[item.mode]
        );

        setAvailableModes(modes);
        // Check live availability across all four courier partners
try {
  const courierResponse = await fetch(
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

  const courierData = await courierResponse.json();

  if (!courierResponse.ok || !courierData.success) {
    throw new Error(
      courierData.message || 'Courier availability check failed.'
    );
  }

  setCourierResults(courierData.courierResults || []);
  console.log('Courier availability verified.');
} catch (courierError) {
  console.error('Courier availability check:', courierError.message);
}

        if (modes.length === 0) {
          setModeError('No shipping modes are currently available for this route.');
        }
      } catch (err) {
        setModeError(err.message || 'Unable to check available modes.');
      } finally {
        setModeLoading(false);
      }
    };

    checkModes();
  }, [shipment]);


  // CALCULATE SHIPPING CHARGE
  const calculateCharge = async () => {
   if (!selectedMode || !selectedCourier || !shipment) return;

    setQuoteLoading(true);
    setQuoteError('');
    setQuote(null);
    setBookingError('');

    try {
      const response = await fetch(
        `${API_URL}/api/serviceability/quote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pickupPincode: String(shipment.pickupPincode),
            deliveryPincode: String(shipment.deliveryPincode),
            weight: Number(shipment.weightGrams) / 1000,
            mode: selectedMode,
            courier: selectedCourier,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Unable to calculate shipping charge.');
      }

      const result = data.quote || data.calculation || data;
      const total = Number(result.total ?? result.amount ?? data.total);

      if (!Number.isFinite(total)) {
        throw new Error('The backend did not return a valid shipping charge.');
      }

      setQuote({
        ...result,
        total,
      });
    } catch (err) {
      setQuoteError(err.message || 'Unable to calculate shipping charge.');
    } finally {
      setQuoteLoading(false);
    }
  };

  // CONFIRM BOOKING AND PAY USING WALLET
  const confirmBooking = async () => {
   if (
  !shipment ||
  !selectedMode ||
  !selectedCourier ||
  !quote ||
  bookingLoading
) {
  setBookingError('Please select a shipping mode and courier partner.');
  return;
}
    

    if (walletBalance === null || walletLoading) {
      setBookingError('Please wait until your wallet balance is available.');
      return;
    }

    if (walletBalance < quote.total) {
      setBookingError('Insufficient wallet balance. Please recharge your wallet.');
      return;
    }

    const token = sessionStorage.getItem('shipnextToken');

    if (!token) {
      navigate('/login');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const response = await fetch(
        `${API_URL}/api/shipments/confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            draftId: shipment.id,
            mode: selectedMode,
            courier: selectedCourier,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to confirm shipment.');
      }

      setBookingResult(data);
      setWalletBalance(Number(data.payment.walletBalance));

      sessionStorage.removeItem('shipnextDraftId');
    } catch (err) {
      setBookingError(err.message || 'Shipment booking failed.');
    } finally {
      setBookingLoading(false);
    }
  };

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

  const weightKg = (Number(shipment.weightGrams) / 1000).toFixed(2);

  // SUCCESSFUL BOOKING SCREEN
  if (bookingResult) {
    const bookedShipment = bookingResult.shipment;

    return (
      <div className="booking-page">
        <header className="booking-header">
          <Link to="/dashboard" className="logo">
            <span className="logo-icon">S</span>
            Ship<span>Next</span>
          </Link>
        </header>

        <main className="charges-container">
          <div className="charges-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '55px', color: '#15803d' }}>✓</div>

            <h1>Shipment Booked Successfully!</h1>

            <p>Your wallet payment was successful.</p>

            <div style={{
              padding: '20px',
              marginTop: '24px',
              background: '#f8fafc',
              borderRadius: '12px',
              textAlign: 'left',
            }}>
              <DocketSlip shipment={bookedShipment} />
              <div className="charge-row">
                <span>ShipNext Tracking ID</span>
                <strong>{bookedShipment.trackingId}</strong>
              </div>

              <div className="charge-row">
                <span>Docket Number</span>
                <strong>{bookedShipment.docketNumber}</strong>
              </div>

              <div className="charge-row">
                <span>Shipment Status</span>
                <strong>{bookedShipment.status}</strong>
              </div>

              <div className="charge-row">
                <span>Shipping Mode</span>
                <strong>{MODE_LABELS[bookedShipment.shippingMode]}</strong>
              </div>

              <div className="charge-row">
                <span>Amount Paid</span>
                <strong>
                  ₹{Number(bookingResult.payment.amount).toFixed(2)}
                </strong>
              </div>

              <div className="charge-row">
                <span>Remaining Wallet Balance</span>
                <strong>
                  ₹{Number(bookingResult.payment.walletBalance).toFixed(2)}
                </strong>
              </div>
            </div>

            <Link
              to="/shipments"
              className="booking-submit"
              style={{
                display: 'block',
                textDecoration: 'none',
                textAlign: 'center',
                marginTop: '24px',
              }}
            >
              View My Shipments
            </Link>

            <Link
              to={`/track/${bookedShipment.trackingId}`}
              className="charges-edit"
              style={{ display: 'block', marginTop: '16px' }}
            >
              Track Shipment
            </Link>
          </div>
        </main>
      </div>
    );
  }

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
          <p>Review your shipment and select an available shipping mode.</p>
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

          <div style={{ marginTop: '30px' }}>
            <h2>Available Shipping Modes</h2>

            <p style={{ color: '#64748b', marginBottom: '18px' }}>
              Select one of the shipping modes available for your route.
            </p>

            {modeLoading && <p>Checking available shipping modes...</p>}

            {modeError && !modeLoading && (
              <div style={{
                padding: '14px',
                background: '#fef2f2',
                color: '#b91c1c',
                borderRadius: '8px',
                marginBottom: '16px',
              }}>
                {modeError}
              </div>
            )}

            {!modeLoading && availableModes.map((item) => (
              <label
                key={item.mode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '16px',
                  marginBottom: '12px',
                  border: selectedMode === item.mode
                    ? '2px solid #ff3b1f'
                    : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: selectedMode === item.mode ? '#fff7f5' : '#fff',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="radio"
                    name="shippingMode"
                    value={item.mode}
                    checked={selectedMode === item.mode}
                    onChange={() => {
                      setSelectedMode(item.mode);
                      setQuote(null);
                      setQuoteError('');
                      setBookingError('');
                    }}
                  />

                  <strong>{MODE_LABELS[item.mode]}</strong>
                </span>

                <span style={{ color: '#15803d', fontWeight: 600 }}>
                  Available
                </span>
              </label>
            ))}
            {/* COURIER PARTNER SELECTION */}
<div className="courier-selection-section" style={{ marginTop: '28px' }}>
  <h2>Select Courier Partner</h2>

  <p style={{ color: '#64748b', marginBottom: '16px' }}>
    Choose an available courier for your shipment.
  </p>

  {courierResults
    .filter(courier => courier.serviceable)
    .map(courier => (
      <label
        key={courier.courier}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '16px',
          marginBottom: '12px',
          border: selectedCourier === courier.courier
            ? '2px solid #ff3b1f'
            : '1px solid #e2e8f0',
          borderRadius: '10px',
          cursor: 'pointer',
          background: selectedCourier === courier.courier
            ? '#fff7f5'
            : '#fff',
        }}
      >
        <input
          type="radio"
          name="courierPartner"
          checked={selectedCourier === courier.courier}
          onChange={() => {
            setSelectedCourier(courier.courier);
            setQuote(null);
            setQuoteError('');
          }}
        />

        <div>
          <strong>
            {{
              DELHIVERY: 'Delhivery',
              SKYKING: 'Skyking',
              BLUEDART: 'Blue Dart',
              SHADOWFAX: 'Shadowfax',
            }[courier.courier] || courier.courier}
          </strong>

          <p style={{ color: '#15803d', margin: '5px 0 0' }}>
            Available for both PIN codes
          </p>

          {courier.courier === 'SHADOWFAX' && (
            <small>
              Services: {(courier.availableModes || []).join(' / ')}
            </small>
          )}
        </div>
      </label>
    ))}

  {courierResults.length === 0 && (
    <p>Checking courier availability...</p>
  )}

  {courierResults.length > 0 &&
    !courierResults.some(courier => courier.serviceable) && (
      <p style={{ color: '#b91c1c' }}>
        No courier is available for this route.
      </p>
    )}
</div>

            {availableModes.length > 0 && (
              
              <button
                type="button"
                className="booking-submit"
                onClick={calculateCharge}
                disabled={
  !selectedMode ||
  !selectedCourier ||
  quoteLoading ||
  bookingLoading
}
              >
                {quoteLoading ? 'Calculating...' : 'Calculate Shipping Charge'}
              </button>
            )}

            {quoteError && (
              <div style={{
                padding: '14px',
                background: '#fef2f2',
                color: '#b91c1c',
                borderRadius: '8px',
                marginTop: '16px',
              }}>
                {quoteError}
              </div>
            )}

            {quote && (
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '20px',
                marginTop: '20px',
              }}>
                <h2>Shipping Charge Summary</h2>

                <div className="charge-row">
                  <span>Selected Mode</span>
                  <strong>{MODE_LABELS[selectedMode]}</strong>
                </div>

                <div className="charge-row">
                  <span>Parcel Weight</span>
                  <strong>{weightKg} kg</strong>
                </div>

                <div className="charge-row">
                  <span>Base Charge</span>
                  <strong>₹{Number(quote.base || 0).toFixed(2)}</strong>
                </div>

                <div className="charge-row">
                  <span>Additional Weight Charge</span>
                  <strong>₹{Number(quote.additionalCharge || 0).toFixed(2)}</strong>
                </div>

                <div className="charge-row" style={{
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '14px',
                  marginTop: '14px',
                }}>
                  <strong>Total Shipping Charge</strong>

                  <strong style={{ color: '#ff3b1f', fontSize: '22px' }}>
                    ₹{quote.total.toFixed(2)}
                  </strong>
                </div>

                <p style={{ color: '#64748b', fontSize: '12px' }}>
                  Final payment amount will be recalculated by the ShipNext
                  backend during booking.
                </p>
              </div>
            )}
          </div>

          {/* WALLET PAYMENT */}
          {quote && (
            <div style={{
              marginTop: '24px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              background: '#f8fafc',
            }}>
              <h2>Pay Using ShipNext Wallet</h2>

              {walletLoading && <p>Loading wallet balance...</p>}

              {walletError && (
                <p style={{ color: '#b91c1c' }}>{walletError}</p>
              )}

              {!walletLoading && walletBalance !== null && (
                <>
                  <div className="charge-row">
                    <span>Available Wallet Balance</span>
                    <strong style={{ fontSize: '20px' }}>
                      ₹{walletBalance.toFixed(2)}
                    </strong>
                  </div>

                  <div className="charge-row">
                    <span>Booking Amount</span>
                    <strong>₹{quote.total.toFixed(2)}</strong>
                  </div>

                  {walletBalance < quote.total && (
                    <p style={{ color: '#b91c1c', marginTop: '12px' }}>
                      Insufficient wallet balance. Please recharge your wallet
                      before booking.
                    </p>
                  )}

                  <Link
                    to="/wallet"
                    className="charges-edit"
                    style={{ display: 'inline-block', marginTop: '12px' }}
                  >
                    Recharge Wallet
                  </Link>

                  <button
                    type="button"
                    className="booking-submit"
                    onClick={confirmBooking}
                    disabled={
                      bookingLoading ||
                      walletLoading ||
                      walletBalance < quote.total
                    }
                    style={{
                      width: '100%',
                      marginTop: '18px',
                      opacity:
                        bookingLoading || walletBalance < quote.total
                          ? 0.6
                          : 1,
                    }}
                  >
                    {bookingLoading
                      ? 'Processing Payment...'
                      : `Confirm & Pay ₹${quote.total.toFixed(2)}`}
                  </button>
                </>
              )}
            </div>
          )}

          {bookingError && (
            <div style={{
              padding: '14px',
              background: '#fef2f2',
              color: '#b91c1c',
              borderRadius: '8px',
              marginTop: '16px',
            }}>
              {bookingError}
            </div>
          )}

          <div className="charges-note">
            Your shipment remains a draft until booking and wallet payment
            are successfully completed.
          </div>

          <Link to="/book-shipment" className="charges-edit">
            Edit Shipment Details
          </Link>
        </div>
      </main>
    </div>
  );
}

export default ShippingCharges;
