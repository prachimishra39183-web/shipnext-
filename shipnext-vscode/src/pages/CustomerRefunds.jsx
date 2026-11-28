
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
import './CustomerRefunds.css';

function CustomerRefunds() {
  const [shipments, setShipments] = useState([]);
  const [refunds, setRefunds] = useState([]);

  const [refundForm, setRefundForm] = useState({
    shipmentId: '',
    amount: '',
    reason: '',
  });

  const [loading, setLoading] = useState(true);
  const [refundLoading, setRefundLoading] = useState(true);
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [refundError, setRefundError] = useState('');
  const [refundSuccess, setRefundSuccess] = useState('');

  const selectedShipment = shipments.find(
    (shipment) => String(shipment.id) === String(refundForm.shipmentId)
  );

  const formatMoney = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

  const formatDate = (date) => {
    if (!date) return 'Date unavailable';

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatLabel = (value) => {
    if (!value) return 'Pending';

    return String(value)
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const fetchRefunds = async (token) => {
    const response = await fetch(`${API_URL}/api/refunds/my`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to load refund requests.');
    }

    setRefunds(data.refunds || []);
  };

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const token = sessionStorage.getItem('shipnextToken');

        if (!token) {
          throw new Error('Please log in to access refund management.');
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [shipmentsResponse, refundsResponse] = await Promise.all([
          fetch(`${API_URL}/api/shipments/my`, { headers }),
          fetch(`${API_URL}/api/refunds/my`, { headers }),
        ]);

        const shipmentsData = await shipmentsResponse.json();
        const refundsData = await refundsResponse.json();

        if (!shipmentsResponse.ok) {
          throw new Error(
            shipmentsData.message || 'Unable to load your shipments.'
          );
        }

        if (!refundsResponse.ok) {
          throw new Error(
            refundsData.message || 'Unable to load refund requests.'
          );
        }

        setShipments(shipmentsData.shipments || []);
        setRefunds(refundsData.refunds || []);
      } catch (err) {
        setError(err.message || 'Unable to load refund management.');
      } finally {
        setLoading(false);
        setRefundLoading(false);
      }
    };

    fetchPageData();
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

    if (
      selectedShipment?.shippingCharge &&
      Number(refundForm.amount) > Number(selectedShipment.shippingCharge)
    ) {
      setRefundError('Refund amount cannot exceed the shipping charge.');
      return;
    }

    if (!refundForm.reason.trim()) {
      setRefundError('Please provide a refund reason.');
      return;
    }

    try {
      setRefundSubmitting(true);

      const token = sessionStorage.getItem('shipnextToken');

      if (!token) {
        throw new Error('Please log in again to submit your request.');
      }

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

      await fetchRefunds(token);
    } catch (err) {
      setRefundError(err.message || 'Unable to submit refund request.');
    } finally {
      setRefundSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="sn-refund-page">
        <div className="sn-refund-loading">Loading refund management...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sn-refund-page">
        <div className="sn-refund-error">{error}</div>
        <Link to="/dashboard" className="sn-refund-back">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="sn-refund-page">
      <div className="sn-refund-page-header">
        <div>
          <span className="sn-refund-eyebrow">SHIPNEXT / CUSTOMER SERVICES</span>
          <h1>Refund Management</h1>
          <p>Request refunds and monitor the progress of your requests.</p>
        </div>

        <Link to="/dashboard" className="sn-refund-back">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="sn-refund-stats">
        <div className="sn-refund-stat-card">
          <span>Total Requests</span>
          <strong>{refunds.length}</strong>
        </div>

        <div className="sn-refund-stat-card">
          <span>Pending Requests</span>
          <strong>
            {refunds.filter(
              (refund) =>
                String(refund.status || 'PENDING').toUpperCase() === 'PENDING'
            ).length}
          </strong>
        </div>

        <div className="sn-refund-stat-card">
          <span>Approved Requests</span>
          <strong>
            {refunds.filter(
              (refund) =>
                String(refund.status || '').toUpperCase() === 'APPROVED'
            ).length}
          </strong>
        </div>
      </div>

      <div className="sn-refund-page-grid">
        <section className="sn-refund-form-card">
          <div className="sn-refund-form-heading">
            <span className="sn-refund-eyebrow">SHIPNEXT SUPPORT</span>
            <h2>Request a Refund</h2>
            <p>Select a shipment and provide the refund details.</p>
          </div>

          <form onSubmit={handleRefundSubmit} className="sn-refund-form">
            <div className="sn-refund-field">
              <label htmlFor="refund-shipment">Select Shipment</label>
              <select
                id="refund-shipment"
                value={refundForm.shipmentId}
                onChange={(event) =>
                  setRefundForm({
                    ...refundForm,
                    shipmentId: event.target.value,
                    amount: '',
                  })
                }
                required
              >
                <option value="">Choose a shipment</option>

                {shipments.map((shipment) => (
                  <option key={shipment.id} value={shipment.id}>
                    {shipment.docketNumber || shipment.trackingId} —{' '}
                    {shipment.pickupPincode} to {shipment.deliveryPincode}
                  </option>
                ))}
              </select>
            </div>

            {selectedShipment && (
              <div className="sn-refund-shipment-info">
                <span>Selected Shipment</span>
                <strong>
                  {selectedShipment.docketNumber ||
                    selectedShipment.trackingId}
                </strong>
                <span>
                  Shipping Charge:{' '}
                  {formatMoney(selectedShipment.shippingCharge)}
                </span>
              </div>
            )}

            <div className="sn-refund-field">
              <label htmlFor="refund-amount">Refund Amount (₹)</label>
              <input
                id="refund-amount"
                type="number"
                min="0.01"
                step="0.01"
                max={selectedShipment?.shippingCharge || undefined}
                placeholder="Enter refund amount"
                value={refundForm.amount}
                onChange={(event) =>
                  setRefundForm({
                    ...refundForm,
                    amount: event.target.value,
                  })
                }
                required
              />
              <small>
                Maximum refundable amount is the shipment's shipping charge.
              </small>
            </div>

            <div className="sn-refund-field">
              <label htmlFor="refund-reason">Reason for Refund</label>
              <textarea
                id="refund-reason"
                rows="5"
                maxLength="1000"
                placeholder="Explain why you are requesting a refund..."
                value={refundForm.reason}
                onChange={(event) =>
                  setRefundForm({
                    ...refundForm,
                    reason: event.target.value,
                  })
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
              {refundSubmitting
                ? 'Submitting Request...'
                : 'Submit Refund Request'}
            </button>

            {shipments.length === 0 && (
              <p className="sn-refund-empty">
                No shipments are available for refund requests.
              </p>
            )}
          </form>
        </section>

        <section className="sn-refund-history-card">
          <div className="sn-refund-history-heading">
            <div>
              <span className="sn-refund-eyebrow">YOUR ACTIVITY</span>
              <h2>Refund Request History</h2>
            </div>
            <span className="sn-refund-total">{refunds.length} TOTAL</span>
          </div>

          {refundLoading ? (
            <p className="sn-refund-empty">Loading refund history...</p>
          ) : refunds.length === 0 ? (
            <div className="sn-refund-empty">
              No refund requests yet. Your submitted requests will appear here.
            </div>
          ) : (
            <div className="sn-refund-list">
              {refunds.map((refund) => (
                <article className="sn-refund-item" key={refund.id}>
                  <div className="sn-refund-item-main">
                    <span className="sn-refund-id">
                      REFUND ID: {refund.id}
                    </span>

                    <h3>
                      {refund.shipment?.docketNumber ||
                        refund.shipment?.trackingId ||
                        'General Refund'}
                    </h3>

                    <p>{refund.reason}</p>

                    <span className="sn-refund-date">
                      Requested {formatDate(refund.createdAt)}
                    </span>
                  </div>

                  <div className="sn-refund-item-side">
                    <strong>{formatMoney(refund.amount)}</strong>

                    <span
                      className={`sn-refund-status ${String(
                        refund.status || 'PENDING'
                      ).toLowerCase()}`}
                    >
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
        </section>
      </div>
    </div>
  );
}

export default CustomerRefunds;
