
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API = 'http://localhost:5000/api';

const categories = [
  { value: 'DELIVERY', label: 'Delivery related issue' },
  { value: 'PICKUP', label: 'Pickup related issue' },
  { value: 'RTO', label: 'RTO issue' },
  { value: 'CLAIM', label: 'Claim issue' },
  { value: 'ACCOUNT', label: 'Account related issue' },
  { value: 'GST', label: 'GST related issue' },
];

const shipmentCategories = ['DELIVERY', 'PICKUP', 'RTO', 'CLAIM'];

function Support() {
  const token = sessionStorage.getItem('shipnextToken');

  const [tickets, setTickets] = useState([]);
  const [shipments, setShipments] = useState([]);

  const [category, setCategory] = useState('');
  const [shipmentId, setShipmentId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const needsShipment = shipmentCategories.includes(category);

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const [ticketResponse, shipmentResponse] = await Promise.all([
        fetch(`${API}/support/my`, { headers }),
        fetch(`${API}/shipments/my`, { headers }),
      ]);

      const ticketData = await ticketResponse.json();
      const shipmentData = await shipmentResponse.json();

      if (!ticketResponse.ok || !ticketData.success) {
        throw new Error(ticketData.message || 'Unable to load tickets.');
      }

      if (!shipmentResponse.ok || !shipmentData.success) {
        throw new Error(shipmentData.message || 'Unable to load shipments.');
      }

      setTickets(ticketData.tickets || []);
      setShipments(shipmentData.shipments || []);
    } catch (err) {
      setError(err.message || 'Unable to load support information.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!category || !subject.trim() || !message.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    if (needsShipment && !shipmentId) {
      setError('Please select the related shipment.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API}/support`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          subject,
          message,
          ...(shipmentId ? { shipmentId } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to raise ticket.');
      }

      setSuccess(
        `Ticket ${data.ticket.ticketNumber} raised successfully!`
      );

      setCategory('');
      setShipmentId('');
      setSubject('');
      setMessage('');

      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to submit your ticket.');
    } finally {
      setSubmitting(false);
    }
  }

  function statusColor(status) {
    switch (status) {
      case 'RESOLVED':
        return '#15803d';
      case 'IN_PROGRESS':
        return '#2563eb';
      case 'CLOSED':
        return '#64748b';
      default:
        return '#d97706';
    }
  }

  function formatStatus(status) {
    return status.replaceAll('_', ' ');
  }

  if (loading) {
    return <div className="support-page">Loading support information...</div>;
  }

  return (
    <div
      className="support-page"
      style={{
        maxWidth: '1150px',
        margin: '30px auto',
        padding: '20px',
        color: '#172033',
      }}
    >
      <div style={{ marginBottom: '25px' }}>
        <Link to="/dashboard" style={{ color: '#2563eb' }}>
          ← Back to Dashboard
        </Link>

        <h1 style={{ marginBottom: '5px' }}>Customer Support</h1>
        <p style={{ color: '#64748b' }}>
          Raise a support ticket and track its progress.
        </p>
      </div>

      {error && (
        <div style={messageStyle('#fee2e2', '#991b1b')}>
          {error}
        </div>
      )}

      {success && (
        <div style={messageStyle('#dcfce7', '#166534')}>
          {success}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '25px',
          alignItems: 'start',
        }}
      >
        {/* RAISE TICKET FORM */}
        <section style={cardStyle}>
          <h2>Raise a New Ticket</h2>

          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>Issue Category *</label>

            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setShipmentId('');
              }}
              required
              style={fieldStyle}
            >
              <option value="">Select issue category</option>
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            {needsShipment && (
              <>
                <label style={labelStyle}>Select Shipment *</label>

                <select
                  value={shipmentId}
                  onChange={(e) => setShipmentId(e.target.value)}
                  required
                  style={fieldStyle}
                >
                  <option value="">Select your shipment</option>

                  {shipments.map((shipment) => (
                    <option key={shipment.id} value={shipment.id}>
                      {shipment.trackingId} — {shipment.pickupPincode} to{' '}
                      {shipment.deliveryPincode}
                    </option>
                  ))}
                </select>

                {shipments.length === 0 && (
                  <p style={{ color: '#b45309', fontSize: '13px' }}>
                    You don't have any confirmed shipments yet. A shipment
                    is required for this issue category.
                  </p>
                )}
              </>
            )}

            <label style={labelStyle}>Subject *</label>

            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter ticket subject"
              maxLength={150}
              required
              style={fieldStyle}
            />

            <label style={labelStyle}>Describe Your Issue *</label>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain your issue in detail..."
              maxLength={3000}
              rows={6}
              required
              style={{ ...fieldStyle, resize: 'vertical' }}
            />

            <button
              type="submit"
              disabled={submitting || (needsShipment && shipments.length === 0)}
              style={{
                width: '100%',
                padding: '13px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'wait' : 'pointer',
                fontWeight: '600',
                opacity: submitting || (needsShipment && shipments.length === 0)
                  ? 0.6
                  : 1,
              }}
            >
              {submitting ? 'Submitting...' : 'Raise Support Ticket'}
            </button>
          </form>
        </section>

        {/* MY TICKETS */}
        <section style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <h2>My Tickets ({tickets.length})</h2>

            <button
              type="button"
              onClick={loadData}
              style={{
                border: '1px solid #cbd5e1',
                background: '#fff',
                padding: '8px 12px',
                borderRadius: '7px',
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>

          {tickets.length === 0 ? (
            <p style={{ color: '#64748b' }}>
              You haven't raised any support tickets yet.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {tickets.map((ticket) => (
                <article
                  key={ticket.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '15px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <strong>{ticket.ticketNumber}</strong>

                    <span
                      style={{
                        color: statusColor(ticket.status),
                        fontWeight: '700',
                        fontSize: '12px',
                      }}
                    >
                      {formatStatus(ticket.status)}
                    </span>
                  </div>

                  <p style={{ marginBottom: '5px' }}>
                    <strong>Category:</strong>{' '}
                    {categories.find((c) => c.value === ticket.category)?.label}
                  </p>

                  <p><strong>Subject:</strong> {ticket.subject}</p>

                  <p style={{ overflowWrap: 'anywhere' }}>
                    <strong>Message:</strong> {ticket.message}
                  </p>

                  {ticket.shipment && (
                    <>
                      <p>
                        <strong>Tracking ID:</strong>{' '}
                        {ticket.shipment.trackingId}
                      </p>
                      <p>
                        <strong>Docket Number:</strong>{' '}
                        {ticket.shipment.docketNumber || 'Not generated yet'}
                      </p>
                    </>
                  )}

                  {ticket.adminReply && (
                    <div
                      style={{
                        background: '#eff6ff',
                        padding: '12px',
                        borderRadius: '8px',
                        marginTop: '10px',
                      }}
                    >
                      <strong>Admin Reply</strong>
                      <p style={{ marginBottom: 0 }}>{ticket.adminReply}</p>
                    </div>
                  )}

                  <small style={{ color: '#64748b' }}>
                    Raised: {new Date(ticket.createdAt).toLocaleString('en-IN')}
                  </small>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const cardStyle = {
  background: '#fff',
  padding: '22px',
  borderRadius: '12px',
  boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
};

const labelStyle = {
  display: 'block',
  fontWeight: '600',
  marginTop: '16px',
  marginBottom: '7px',
};

const fieldStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  fontSize: '14px',
};

function messageStyle(background, color) {
  return {
    background,
    color,
    padding: '12px 15px',
    borderRadius: '8px',
    marginBottom: '15px',
  };
}

export default Support;
