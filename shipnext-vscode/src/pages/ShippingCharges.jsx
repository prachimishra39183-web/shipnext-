
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

// REFRESH LATEST ADMIN RATE APPROVAL
const refreshApprovalStatus = async () => {
  const token = sessionStorage.getItem('shipnextToken');

  if (!token || !shipment?.id) return;

  try {
    const response = await fetch(
      `${API_URL}/api/shipments/drafts/${shipment.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Unable to refresh approval status.');
    }

    setShipment(data.draft);
    setBookingError('');

  } catch (err) {
    setBookingError(err.message || 'Unable to refresh approval status.');
  }
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

  // CHECK AVAILABLE SHIPPING MODES
  useEffect(() => {
    if (!shipment) return;

    const checkModes = async () => {

      setModeLoading(true);
      setModeError('');
      setAvailableModes([]);
      
      setSelectedMode(shipment.shippingMode || '');
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

        
const modes = (data.availableModes || [])
  .map((item) => {
    if (typeof item === 'string') {
      return { mode: item };
    }

    if (item && typeof item.mode === 'string') {
      return item;
    }

    return null;
  })
  .filter((item) => item && MODE_LABELS[item.mode]);

setAvailableModes(modes);

// Use mode-specific courier availability from the same response.
const results = data.courierResults || [];

setCourierResults(results);
setSelectedCourier('');

const hasAvailableCourier = results.some(
  (courier) =>
    Array.isArray(courier.availableModes) &&
    courier.availableModes.length > 0
);

setCourierCheckError(
  hasAvailableCourier
    ? ''
    : 'No delivery option is currently available for this route.'
);

console.log('SHIPPING MODES:', modes);
console.log('COURIER AVAILABILITY:', results);


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


// PREPARE SHIPPING RATE FOR ADMIN APPROVAL
const calculateCharge = async () => {
  const courierForMode = getCourierForMode(selectedMode);

  if (!selectedMode || !courierForMode || !shipment) return;

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
      throw new Error(data.message || 'Unable to prepare shipping rates.');
    }

    // Do not display internal rate amounts to the customer.
    setQuote(null);
    setShipment((prev) => ({
  ...prev,
  shippingMode: selectedMode,
  rateApprovalStatus: 'PENDING',
  selectedRateOption: null,
  approvedShippingCharge: null,
}));

    setBookingError(
      'Your shipping rate request has been sent to ShipNext admin. Booking will be available after rate approval.'
    );
  } catch (err) {
    setQuoteError(err.message || 'Unable to prepare shipping rates.');
  } finally {
    setQuoteLoading(false);
  }
};


 
// CONFIRM BOOKING AFTER ADMIN RATE APPROVAL
const confirmBooking = async () => {
  const courierForMode = getCourierForMode(selectedMode);
  const token = sessionStorage.getItem('shipnextToken');

  if (!token) {
    navigate('/login');
    return;
  }

  if (!shipment || !selectedMode || !courierForMode) {
    setBookingError('Please select an available shipping mode.');
    return;
  }

  if (
    shipment.rateApprovalStatus !== 'APPROVED' ||
    !shipment.approvedShippingCharge ||
    Number(shipment.approvedShippingCharge) <= 0
  ) {
    setBookingError(
      'Your shipping rate is awaiting admin approval. You can book after approval.'
    );
    return;
  }

  const approvedCharge = Number(shipment.approvedShippingCharge);

  if (!isCod) {
    if (walletBalance === null || walletLoading) {
      setBookingError('Please wait until your wallet balance is available.');
      return;
    }

    if (walletBalance < approvedCharge) {
      setBookingError('Your wallet balance may be insufficient. Please recharge your wallet.');
      return;
    }
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
          courier: courierForMode,
        }),
      }
    );

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
                      setSelectedCourier('');
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
           
<div className="shipnext-allocation-card">
  <div className="shipnext-allocation-icon">🚚</div>

  <div className="shipnext-allocation-content">
    <h3>Choose Your Courier Partner</h3>

    {!selectedMode ? (
      <span>Please select a shipping mode first.</span>
    ) : selectedMode === 'EXPRESS_AIR' ||
      selectedMode === 'NORMAL_AIR' ? (
      <span className="allocation-success">
        ✓ Skyking will be automatically assigned for Air shipments.
      </span>
    ) : (
      <>
        <label htmlFor="courierSelect">
          Select your preferred courier:
        </label>

        <select
          id="courierSelect"
          value={selectedCourier}
          onChange={(e) => {
            setSelectedCourier(e.target.value);
            setQuote(null);
            setQuoteError('');
            setBookingError('');
          }}
        >
          <option value="">Select Courier</option>

          {eligibleCouriers
  .filter(
    (courier) =>
      String(courier.courier).toUpperCase() !== 'SKYKING'
  )
  .map((courier) => (
            <option
              key={courier.courier}
              value={String(courier.courier).toUpperCase()}
            >
              {String(courier.courier).toUpperCase() === 'BLUEDART'
                ? 'Blue Dart'
                : String(courier.courier).charAt(0).toUpperCase() +
                  String(courier.courier).slice(1).toLowerCase()}
            </option>
          ))}
        </select>

        {eligibleCouriers.length === 0 && (
          <span className="allocation-error">
            No courier is available for this shipping mode.
          </span>
        )}
      </>
    )}
  </div>
</div>

            {availableModes.length > 0 && (
              
              <button
                type="button"
                className="booking-submit"
                onClick={calculateCharge}
                disabled={
  !selectedMode ||
  !getCourierForMode(selectedMode) ||
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

           
          </div>

 
            
{/* ADMIN RATE APPROVAL AND PAYMENT */}
<div style={{
  marginTop: '24px',
  padding: '20px',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  background: '#f8fafc',
}}>
  {shipment.rateApprovalStatus !== 'APPROVED' ? (
    <>
      <h2>Shipping Rate Approval Pending</h2>
      <p style={{ color: '#64748b' }}>
        Your shipment details have been submitted to ShipNext admin.
        Your shipping charge will be displayed after approval.
      </p>

      <button
        type="button"
        className="booking-submit"
        onClick={refreshApprovalStatus}
        style={{ marginTop: '14px' }}
      >
        Refresh Approval Status
      </button>
    </>
  ) : (
    <>
      <h2>Approved Shipping Charge</h2>

      <div className="charge-row">
        <span>Shipping Mode</span>
        <strong>{MODE_LABELS[selectedMode]}</strong>
      </div>

      <div className="charge-row">
        <span>Approved Shipping Charge</span>
        <strong style={{ color: '#ff3b1f', fontSize: '22px' }}>
          ₹{Number(shipment.approvedShippingCharge).toFixed(2)}
        </strong>
      </div>

      {!isCod ? (
        <>
          <h3 style={{ marginTop: '20px' }}>Pay Using ShipNext Wallet</h3>

          {walletLoading ? (
            <p>Loading wallet balance...</p>
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
                disabled={bookingLoading || walletBalance === null}
                style={{ width: '100%', marginTop: '18px' }}
              >
                {bookingLoading ? 'Processing Payment...' : 'Confirm & Pay'}
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <h3 style={{ marginTop: '20px' }}>Cash on Delivery (COD)</h3>

          <p style={{ color: '#166534' }}>
            The recipient will pay the COD amount to the courier.
            No shipping charge or COD amount will be deducted from
            your ShipNext wallet.
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
