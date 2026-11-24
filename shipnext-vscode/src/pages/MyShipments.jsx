
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
import '../styles.css';

function MyShipments() {
  const [shipments, setShipments] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
const [refunds, setRefunds] = useState([]);
const [refundLoading, setRefundLoading] = useState(true);
const [refundSubmitting, setRefundSubmitting] = useState(false);
const [refundError, setRefundError] = useState('');
const [refundSuccess, setRefundSuccess] = useState('');

const [refundForm, setRefundForm] = useState({
  shipmentId: '',
  amount: '',
  reason: '',
});
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const token = sessionStorage.getItem('shipnextToken');

        if (!token) {
          throw new Error('Please log in to view your shipments.');
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };
       const [shipmentsResponse, draftsResponse, refundsResponse] =
  await Promise.all([
    fetch(`${API_URL}/api/shipments/my`, { headers }),
    fetch(`${API_URL}/api/shipments/drafts/my`, { headers }),
    fetch(`${API_URL}/api/refunds/my`, { headers }),
  ]);

const shipmentsData = await shipmentsResponse.json();
const draftsData = await draftsResponse.json();
const refundsData = await refundsResponse.json();

if (refundsResponse.ok) {
  setRefunds(refundsData.refunds || []);
} else {
  setRefundError(
    refundsData.message || 'Unable to load refund requests.'
  );
}

setRefundLoading(false);
        if (!shipmentsResponse.ok) {
          throw new Error(
            shipmentsData.message || 'Unable to load confirmed shipments.'
          );
        }

        if (!draftsResponse.ok) {
          throw new Error(
            draftsData.message || 'Unable to load draft shipments.'
          );
        }

        setShipments(shipmentsData.shipments || []);
        setDrafts(draftsData.drafts || []);
      } catch (err) {
        setError(err.message || 'Unable to load your shipments.');
      } finally {
        setLoading(false);
        setRefundLoading(false);
      }
    };

    fetchShipments();
  }, []);

const handleRefundSubmit = async (event) => {
  event.preventDefault();

  setRefundError('');
  setRefundSuccess('');

  if (!refundForm.shipmentId) {
    setRefundError('Please select a shipment.');
    return;
  }

  if (!refundForm.amount || Number(refundForm.amount) <= 0) {
    setRefundError('Enter a valid refund amount.');
    return;
  }

  if (!refundForm.reason.trim()) {
    setRefundError('Please provide a refund reason.');
    return;
  }

  try {
    setRefundSubmitting(true);

    const token = sessionStorage.getItem('shipnextToken');

    const response = await fetch(`${API_URL}/api/refunds/request`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shipmentId: refundForm.shipmentId,
        amount: Number(refundForm.amount),
        reason: refundForm.reason.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to submit refund request.');
    }

    setRefundSuccess('Your refund request has been submitted successfully.');

    setRefundForm({
      shipmentId: '',
      amount: '',
      reason: '',
    });

    const refreshResponse = await fetch(`${API_URL}/api/refunds/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const refreshData = await refreshResponse.json();

    if (refreshResponse.ok) {
      setRefunds(refreshData.refunds || []);
    }
  } catch (err) {
    setRefundError(err.message || 'Unable to submit refund request.');
  } finally {
    setRefundSubmitting(false);
  }
};

  const formatDate = (date) => {
    if (!date) return 'Date unavailable';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatMoney = (amount) =>
    `₹${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatLabel = (value) =>
    String(value || 'Pending').replaceAll('_', ' ');

  const confirmedCount = shipments.length;
  const draftCount = drafts.length;

  const codShipments = shipments.filter(
    (shipment) => shipment.recipientPaymentMode === 'COD'
  );

  const filteredShipments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return shipments.filter((shipment) => {
      const matchesSearch = [
        shipment.trackingId,
        shipment.pickupPincode,
        shipment.deliveryPincode,
        shipment.status,
        shipment.recipientPaymentMode,
        shipment.codCollectionStatus,
        shipment.codRemittanceStatus,
      ].some((value) => String(value || '').toLowerCase().includes(query));

      const matchesFilter =
        activeFilter === 'ALL' ||
        String(shipment.status || '').toUpperCase() === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [shipments, search, activeFilter]);

  const filteredDrafts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return drafts.filter((draft) =>
      [
        draft.pickupName,
        draft.deliveryName,
        draft.pickupPincode,
        draft.deliveryPincode,
      ].some((value) => String(value || '').toLowerCase().includes(query))
    );
  }, [drafts, search]);

  const getStatusClass = (status) => {
    const value = String(status || 'PENDING').toLowerCase();

    if (value.includes('deliver')) return 'delivered';
    if (value.includes('transit')) return 'transit';
    if (value.includes('cancel') || value.includes('rto')) return 'cancelled';
    if (value.includes('pending') || value.includes('book')) return 'pending';

    return 'general';
  };

  const getCodStatusClass = (status) => {
    const value = String(status || '').toUpperCase();

    if (value.includes('RECEIVED') || value.includes('COLLECTED') ||
        value === 'SETTLED') {
      return 'success';
    }

    if (value.includes('FAILED') || value.includes('REVERSED')) {
      return 'failed';
    }

    return 'pending';
  };

  return (
    <div className="sn-shipments-page">
      <header className="sn-shipments-header">
        <Link to="/dashboard" className="sn-back-link">
          Back to Dashboard
        </Link>
      </header>

      <main className="sn-shipments-main">
        <section className="sn-page-intro">
          <div>
            <span className="sn-eyebrow">SHIPNEXT / YOUR ACCOUNT</span>
            <h1>My <span>Shipments.</span></h1>
            <p>
              Manage your bookings, review saved drafts and follow
              your shipment activity from one place.
            </p>
          </div>

          <Link to="/book-shipment" className="sn-primary-button">
            Book a Shipment
          </Link>
        </section>

        {loading ? (
          <section className="sn-loading-panel">
            <div className="sn-loading-line" />
            <h3>Preparing your shipment overview</h3>
            <p>Please wait while we retrieve your account activity.</p>
          </section>
        ) : error ? (
          <section className="sn-error-panel">
            <span className="sn-eyebrow">ACCOUNT NOTICE</span>
            <h2>Unable to load your shipments</h2>
            <p>{error}</p>
            <Link to="/dashboard" className="sn-primary-button">
              Return to Dashboard
            </Link>
          </section>
        ) : (
          <>
            <section className="sn-overview-grid">
              <article className="sn-overview-card sn-overview-featured">
                <span className="sn-card-label">TOTAL SHIPMENTS</span>
                <strong>{confirmedCount + draftCount}</strong>
                <p>All your saved and confirmed bookings</p>
                <div className="sn-card-decoration" />
              </article>

              <article className="sn-overview-card">
                <span className="sn-card-label">CONFIRMED BOOKINGS</span>
                <strong>{confirmedCount}</strong>
                <p>Shipments successfully booked</p>
              </article>

              <article className="sn-overview-card">
                <span className="sn-card-label">SAVED DRAFTS</span>
                <strong>{draftCount}</strong>
                <p>Bookings waiting for completion</p>
              </article>

              <article className="sn-overview-card">
                <span className="sn-card-label">COD SHIPMENTS</span>
                <strong>{codShipments.length}</strong>
                <p>Bookings with recipient payment due</p>
              </article>
            </section>

            <section className="sn-shipment-workspace">
              <div className="sn-workspace-heading">
                <div>
                  <span className="sn-eyebrow">YOUR BOOKING ACTIVITY</span>
                  <h2>Shipment <span>Management</span></h2>
                  <p>Search and manage your shipment records.</p>
                </div>
              </div>

              <div className="sn-shipment-tools">
                <input
                  type="search"
                  placeholder="Search by tracking ID or PIN code..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search shipments"
                />

                <div className="sn-filter-group">
                  {['ALL', 'IN_TRANSIT', 'DELIVERED', 'PENDING'].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      className={activeFilter === filter ? 'selected' : ''}
                      onClick={() => setActiveFilter(filter)}
                    >
                      {filter === 'ALL'
                        ? 'All'
                        : filter.replaceAll('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <section className="sn-shipment-section">
                <div className="sn-section-heading">
                  <div>
                    <span className="sn-section-kicker">01 / INCOMPLETE BOOKINGS</span>
                    <h3>Saved Drafts</h3>
                    <p>Continue a booking whenever you are ready.</p>
                  </div>
                  <span className="sn-count">{draftCount} DRAFTS</span>
                </div>

                {filteredDrafts.length === 0 ? (
                  <div className="sn-empty-state">
                    <span className="sn-empty-line" />
                    <h4>{search ? 'No matching drafts' : 'No saved drafts yet'}</h4>
                    <p>
                      {search
                        ? 'Try another name or PIN code.'
                        : 'Your unfinished shipment bookings will appear here.'}
                    </p>
                    {!search && (
                      <Link to="/book-shipment" className="sn-text-link">
                        Start a new booking
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="sn-shipment-grid">
                    {filteredDrafts.map((draft) => (
                      <article
                        className="sn-shipment-card sn-draft-card"
                        key={draft.id}
                      >
                        <div className="sn-shipment-card-top">
                          <span className="sn-record-label">SAVED BOOKING</span>
                          <span className="sn-status-pill draft">DRAFT</span>
                        </div>

                        <div className="sn-route">
                          <div>
                            <span>ORIGIN PIN</span>
                            <strong>{draft.pickupPincode}</strong>
                          </div>
                          <div className="sn-route-connector"><span /></div>
                          <div>
                            <span>DESTINATION PIN</span>
                            <strong>{draft.deliveryPincode}</strong>
                          </div>
                        </div>

                        <div className="sn-card-details">
                          <div>
                            <span>Sender</span>
                            <strong>{draft.pickupName || 'Not provided'}</strong>
                          </div>
                          <div>
                            <span>Receiver</span>
                            <strong>{draft.deliveryName || 'Not provided'}</strong>
                          </div>
                          <div>
                            <span>Parcel weight</span>
                            <strong>
                              {(Number(draft.weightGrams || 0) / 1000).toFixed(2)} kg
                            </strong>
                          </div>
                          <div>
                            <span>Last saved</span>
                            <strong>{formatDate(draft.createdAt)}</strong>
                          </div>
                          <div>
                            <span>Recipient payment</span>
                            <strong>{draft.paymentMode || 'PREPAID'}</strong>
                          </div>
                          {draft.paymentMode === 'COD' && (
                            <div>
                              <span>COD amount</span>
                              <strong>{formatMoney(draft.codAmount)}</strong>
                            </div>
                          )}
                        </div>

                        <Link
                          to={`/shipping-charges/${draft.id}`}
                          className="sn-card-action"
                        >
                          Continue Booking <span>→</span>
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="sn-shipment-section">
                <div className="sn-section-heading">
                  <div>
                    <span className="sn-section-kicker">02 / ACTIVE RECORDS</span>
                    <h3>Confirmed Shipments</h3>
                    <p>Your booked shipments and their tracking information.</p>
                  </div>
                  <span className="sn-count">{confirmedCount} BOOKINGS</span>
                </div>

                {filteredShipments.length === 0 ? (
                  <div className="sn-empty-state">
                    <span className="sn-empty-line" />
                    <h4>
                      {search || activeFilter !== 'ALL'
                        ? 'No matching shipments'
                        : 'No confirmed shipments yet'}
                    </h4>
                    <p>
                      {search || activeFilter !== 'ALL'
                        ? 'Change your search or filter to see other records.'
                        : 'Once you confirm a booking, its details will appear here.'}
                    </p>
                    {!search && activeFilter === 'ALL' && (
                      <Link to="/book-shipment" className="sn-text-link">
                        Book your first shipment
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="sn-shipment-grid">
                    {filteredShipments.map((shipment) => (
                      <article className="sn-shipment-card" key={shipment.id}>
                        <div className="sn-shipment-card-top">
                          <div>
                            <span className="sn-record-label">TRACKING REFERENCE</span>
                            <strong className="sn-tracking-id">
                              {shipment.trackingId || 'Reference unavailable'}
                            </strong>
                          </div>

                          <span className={`sn-status-pill ${getStatusClass(shipment.status)}`}>
                            {formatLabel(shipment.status)}
                          </span>
                        </div>

                        <div className="sn-route">
                          <div>
                            <span>ORIGIN PIN</span>
                            <strong>{shipment.pickupPincode || '—'}</strong>
                          </div>
                          <div className="sn-route-connector"><span /></div>
                          <div>
                            <span>DESTINATION PIN</span>
                            <strong>{shipment.deliveryPincode || '—'}</strong>
                          </div>
                        </div>

                        <div className="sn-card-details">
                          <div>
                            <span>Parcel weight</span>
                            <strong>
                              {(Number(shipment.weightGrams || 0) / 1000).toFixed(2)} kg
                            </strong>
                          </div>
                          <div>
                            <span>Booking date</span>
                            <strong>{formatDate(shipment.createdAt)}</strong>
                          </div>
                          <div>
                            <span>Shipping charge</span>
                            <strong>{formatMoney(shipment.shippingCharge)}</strong>
                          </div>
                          <div>
                            <span>Shipping payment</span>
                            <strong>{shipment.paymentMode || 'WALLET'}</strong>
                          </div>
                        </div>

                        <div className="sn-cod-panel">
                          <div className="sn-cod-heading">
                            <div>
                              <span className="sn-section-kicker">RECIPIENT PAYMENT</span>
                              <h4>
                                {shipment.recipientPaymentMode === 'COD'
                                  ? 'Cash on Delivery'
                                  : 'Prepaid Shipment'}
                              </h4>
                            </div>
                            <span className={`sn-cod-type ${
                              shipment.recipientPaymentMode === 'COD' ? 'cod' : 'prepaid'
                            }`}>
                              {shipment.recipientPaymentMode || 'PREPAID'}
                            </span>
                          </div>

                          {shipment.recipientPaymentMode === 'COD' && (
                            <>
                              <div className="sn-cod-amount">
                                <span>COD amount</span>
                                <strong>{formatMoney(shipment.codAmount)}</strong>
                              </div>

                              <div className="sn-cod-status-grid">
                                <div>
                                  <span>Collection status</span>
                                  <strong className={`sn-cod-status ${getCodStatusClass(shipment.codCollectionStatus)}`}>
                                    {formatLabel(shipment.codCollectionStatus)}
                                  </strong>
                                </div>
                                <div>
                                  <span>Remittance status</span>
                                  <strong className={`sn-cod-status ${getCodStatusClass(shipment.codRemittanceStatus)}`}>
                                    {formatLabel(shipment.codRemittanceStatus)}
                                  </strong>
                                </div>
                              </div>

                              {shipment.codCollectedAt && (
                                <div className="sn-cod-extra">
                                  <span>Collected on</span>
                                  <strong>{formatDate(shipment.codCollectedAt)}</strong>
                                </div>
                              )}

                              {shipment.codRemittanceReference && (
                                <div className="sn-cod-extra">
                                  <span>Remittance reference</span>
                                  <strong>{shipment.codRemittanceReference}</strong>
                                </div>
                              )}

                              <p className="sn-cod-note">
                                COD is collected and remitted directly by the courier
                                to the merchant. ShipNext displays the available
                                tracking information.
                              </p>
                            </>
                          )}
                        </div>

                        <Link
                          to={`/track/${shipment.trackingId}`}
                          className="sn-card-action"
                        >
                          View Shipment Details <span>→</span>
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
                            </section>

              {/* REFUND MANAGEMENT SECTION START */}

              <section className="sn-shipment-section sn-refund-section">
                <div className="sn-section-heading">
                  <div>
                    <span className="sn-section-kicker">03 / CUSTOMER SERVICES</span>
                    <h3>Refund Management</h3>
                    <p>Submit a refund request and track its progress.</p>
                  </div>
                  <span className="sn-count">{refunds.length} REQUESTS</span>
                </div>

                <div className="sn-refund-form-card">
                  <div className="sn-refund-form-heading">
                    <span className="sn-eyebrow">SHIPNEXT SUPPORT</span>
                    <h4>Request a Refund</h4>
                    <p>Select a shipment and provide the refund details.</p>
                  </div>

                  <form onSubmit={handleRefundSubmit} className="sn-refund-form">
                    <div className="sn-refund-field">
                      <label htmlFor="refund-shipment">Select Shipment</label>
                      <select
                        id="refund-shipment"
                        value={refundForm.shipmentId}
                        onChange={(event) =>
                          setRefundForm({ ...refundForm, shipmentId: event.target.value })
                        }
                        required
                      >
                        <option value="">Choose a shipment</option>
                        {shipments.map((shipment) => (
                          <option key={shipment.id} value={shipment.id}>
                            {shipment.docketNumber || shipment.trackingId} — {shipment.pickupPincode} to {shipment.deliveryPincode}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sn-refund-field">
                      <label htmlFor="refund-amount">Refund Amount (₹)</label>
                      <input
                        id="refund-amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        max={shipments.find(
                          (shipment) => shipment.id === refundForm.shipmentId
                        )?.shippingCharge || undefined}
                        placeholder="Enter amount"
                        value={refundForm.amount}
                        onChange={(event) =>
                          setRefundForm({ ...refundForm, amount: event.target.value })
                        }
                        required
                      />
                      <small>Maximum refundable amount is the shipment's shipping charge.</small>
                    </div>

                    <div className="sn-refund-field">
                      <label htmlFor="refund-reason">Reason for Refund</label>
                      <textarea
                        id="refund-reason"
                        rows="4"
                        maxLength="1000"
                        placeholder="Explain why you are requesting a refund..."
                        value={refundForm.reason}
                        onChange={(event) =>
                          setRefundForm({ ...refundForm, reason: event.target.value })
                        }
                        required
                      />
                    </div>

                    {refundError && (
                      <div className="sn-refund-message error">{refundError}</div>
                    )}

                    {refundSuccess && (
                      <div className="sn-refund-message success">{refundSuccess}</div>
                    )}

                    <button
                      type="submit"
                      className="sn-refund-submit"
                      disabled={refundSubmitting || shipments.length === 0}
                    >
                      {refundSubmitting ? 'Submitting Request...' : 'Submit Refund Request'}
                    </button>
                  </form>
                </div>

                <div className="sn-refund-history">
                  <div className="sn-refund-history-heading">
                    <h4>Your Refund Requests</h4>
                    <span>{refunds.length} TOTAL</span>
                  </div>

                  {refundLoading ? (
                    <p className="sn-refund-empty">Loading refund history...</p>
                  ) : refunds.length === 0 ? (
                    <div className="sn-refund-empty">No refund requests yet.</div>
                  ) : (
                    <div className="sn-refund-list">
                      {refunds.map((refund) => (
                        <article className="sn-refund-item" key={refund.id}>
                          <div className="sn-refund-item-main">
                            <span className="sn-section-kicker">
                              {refund.shipment?.docketNumber ||
                                refund.shipment?.trackingId || 'GENERAL REFUND'}
                            </span>
                            <h5>{refund.reason}</h5>
                            <span className="sn-refund-date">
                              Requested {formatDate(refund.createdAt)}
                            </span>
                          </div>

                          <div className="sn-refund-item-side">
                            <strong>{formatMoney(refund.amount)}</strong>
                            <span className={`sn-refund-status ${String(refund.status || 'PENDING').toLowerCase()}`}>
                              {formatLabel(refund.status)}
                            </span>
                          </div>

                          {refund.adminNote && (
                            <p className="sn-refund-admin-note">
                              Admin note: {refund.adminNote}
                            </p>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* REFUND MANAGEMENT SECTION END */}

            </section>
          </>
        )}

        <footer className="sn-shipments-footer">
          <p>Moving your business forward.</p>
        </footer>
      </main>
    </div>
  );
}

export default MyShipments;
