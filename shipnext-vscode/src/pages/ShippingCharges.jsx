
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
  const isCod = shipment?.paymentMode === 'COD';
 
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

        const draft = data.draft;

setShipment(draft);

const savedCharge = Number(draft.quotedShippingCharge);

if (
  Number.isFinite(savedCharge) &&
  savedCharge > 0 &&
  draft.shippingMode
) {
  setQuote({
    shippingCharge: savedCharge,
    shippingMode: draft.shippingMode,
    courier: draft.selectedCourier || '',
  });
} else {
  setQuote(null);
  setQuoteError('Saved shipping charge not found. Please return to the booking page and calculate the charge again.');
}

sessionStorage.setItem('shipnextDraftId', draftId);
      } catch (err) {
        setError(err.message || 'Unable to load shipment details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDraft();
  }, [urlDraftId, location.state, navigate]);

const getCourierForMode = (mode) => {
  // Air shipments: Skyking only
  if (mode === 'EXPRESS_AIR' || mode === 'NORMAL_AIR') {
    const skyking = courierResults.find(
      (item) =>
        String(item.courier || '').toUpperCase() === 'SKYKING'
    );

    return skyking?.availableModes?.includes(mode)
      ? 'SKYKING'
      : '';
  }

  // Surface shipments: Skyking is never allowed
  const selected = courierResults.find(
    (item) =>
      String(item.courier || '').toUpperCase() ===
        String(selectedCourier || '').toUpperCase() &&
      String(item.courier || '').toUpperCase() !== 'SKYKING' &&
      item.availableModes?.includes(mode)
  );

  return selected
    ? String(selected.courier).toUpperCase()
    : '';
};


  // LOAD CUSTOMER WALLET BALANCE
  useEffect(() => {
    if (!shipment) return;

if (shipment.paymentMode === 'COD') {
  setWalletBalance(null);
  setWalletError('');
  setWalletLoading(false);
  return;
}

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

const calculateCharge = async () => {
  const courierForMode = getCourierForMode(selectedMode);

  if (!selectedMode || !courierForMode || !shipment) {
    setQuoteError('Please select a valid shipping mode and courier.');
    return;
  }

  setQuoteLoading(true);
  setQuoteError('');
  setQuote(null);
  setBookingError('');

  try {
    const response = await fetch(
      `${API_URL}/api/shipments/drafts/${shipment.id}/prepare-rates`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('shipnextToken')}`,
        },
        body: JSON.stringify({
          mode: selectedMode,
          courier: courierForMode,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Unable to calculate shipping charge.');
    }

    const shippingCharge = Number(data.shippingCharge);

    if (!Number.isFinite(shippingCharge) || shippingCharge <= 0) {
      throw new Error('Invalid shipping charge received from server.');
    }

    setQuote({
      shippingCharge,
      shippingMode: selectedMode,
      courier: courierForMode,
    });

    setShipment((prev) => ({
      ...prev,
      shippingMode: selectedMode,
      selectedCourier: courierForMode,
      quotedShippingCharge: shippingCharge,
      rateApprovalStatus: 'NOT_REQUIRED',
    }));

  } catch (err) {
    setQuoteError(err.message || 'Unable to calculate shipping charge.');
  } finally {
    setQuoteLoading(false);
  }
};
const confirmBooking = async () => {
  const token = sessionStorage.getItem('shipnextToken');

  if (!token) {
    navigate('/login');
    return;
  }

  const selectedMode = shipment?.shippingMode;
  const courierForMode = shipment?.selectedCourier;

  if (!shipment || !selectedMode || !courierForMode) {
    setBookingError('Saved shipping mode or courier information is missing.');
    return;
  }

  if (!quote || quote.shippingCharge <= 0) {
    setBookingError('Saved shipping charge is missing. Please return to the booking page.');
    return;
  }

  if (!isCod) {
    if (walletBalance === null || walletLoading) {
      setBookingError('Please wait until your wallet balance is available.');
      return;
    }

    if (walletBalance < quote.shippingCharge) {
      setBookingError('Insufficient wallet balance. Please recharge your wallet.');
      return;
    }
  }

  setBookingLoading(true);
  setBookingError('');

  try {
    const response = await fetch(`${API_URL}/api/shipments/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        draftId: shipment.id,
        mode: selectedMode,
        courier: courierForMode,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Unable to confirm shipment.');
    }

    setBookingResult(data);

    if (
      data.payment?.walletBalance !== null &&
      data.payment?.walletBalance !== undefined
    ) {
      setWalletBalance(Number(data.payment.walletBalance));
    }

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
const eligibleCouriers = courierResults.filter(
  (courier) =>
    courier.serviceable === true &&
    Array.isArray(courier.availableModes) &&
    courier.availableModes.includes(selectedMode)
);
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

            <p>
  {bookingResult.payment.paymentMode === 'COD'
    ? 'Your COD shipment has been booked successfully.'
    : 'Your wallet payment was successful.'}
</p>

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
  <span>
    {bookingResult.payment.paymentMode === 'COD'
      ? 'Wallet Deduction'
      : 'Amount Paid'}
  </span>
  <strong>
    ₹{Number(bookingResult.payment.amount).toFixed(2)}
  </strong>
</div>

              {bookingResult.payment.walletBalance !== null &&
  bookingResult.payment.walletBalance !== undefined && (
    <div className="charge-row">
      <span>Remaining Wallet Balance</span>
      <strong>
        ₹{Number(bookingResult.payment.walletBalance).toFixed(2)}
      </strong>
    </div>
  )}
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
          <p>Review your saved shipment details and complete your payment.</p>
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

           
          </div>

 
            {/* SHIPPING CHARGE AND DIRECT PAYMENT */}
<div style={{
  marginTop: '24px',
  padding: '20px',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  background: '#f8fafc',
}}>
  <h2>Shipping Charge & Payment</h2>

  {!quote ? (
    <p style={{ color: '#b91c1c' }}>
  {quoteError || 'Saved shipping charge is unavailable.'}
  <br />
  <Link to="/book-shipment" className="charges-edit">
    Return to shipment booking
  </Link>
</p>
  ) : (
    <>
      <div className="charge-row">
        <span>Shipping Mode</span>
        <strong>{MODE_LABELS[quote.shippingMode]}</strong>
      </div>

      <div className="charge-row">
        <span>Selected Courier</span>
        <strong>{quote.courier}</strong>
      </div>

      <div className="charge-row">
        <span>Shipping Charge</span>
        <strong style={{ color: '#ff3b1f', fontSize: '24px' }}>
          ₹{quote.shippingCharge.toFixed(2)}
        </strong>
      </div>

      {!isCod ? (
        <>
          <h3 style={{ marginTop: '22px' }}>Pay Using ShipNext Wallet</h3>

          {walletLoading ? (
            <p>Loading wallet balance...</p>
          ) : walletError ? (
            <p style={{ color: '#b91c1c' }}>{walletError}</p>
          ) : (
            <>
              <div className="charge-row">
                <span>Available Wallet Balance</span>
                <strong>
                  {walletBalance === null
                    ? 'Unavailable'
                    : `₹${walletBalance.toFixed(2)}`}
                </strong>
              </div>

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
                  walletBalance === null ||
                  walletBalance < quote.shippingCharge
                }
                style={{ width: '100%', marginTop: '18px' }}
              >
                {bookingLoading ? 'Processing Payment...' : 'Confirm & Pay'}
              </button>

              {walletBalance !== null &&
                walletBalance < quote.shippingCharge && (
                  <p style={{ color: '#b91c1c', marginTop: '12px' }}>
                    Insufficient wallet balance. Please recharge to continue.
                  </p>
                )}
            </>
          )}
        </>
      ) : (
        <>
          <h3 style={{ marginTop: '22px' }}>Cash on Delivery (COD)</h3>

          <p style={{ color: '#166534' }}>
            Your customer will pay the COD amount to the courier.
            No shipping charge or COD amount will be deducted from your
            ShipNext wallet.
          </p>

          <div className="charge-row">
            <span>Wallet Deduction</span>
            <strong>₹0.00</strong>
          </div>

          <button
            type="button"
            className="booking-submit"
            onClick={confirmBooking}
            disabled={bookingLoading}
            style={{ width: '100%', marginTop: '18px' }}
          >
            {bookingLoading ? 'Booking Shipment...' : 'Confirm COD Booking'}
          </button>
        </>
      )}
    </>
  )}
</div>
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
