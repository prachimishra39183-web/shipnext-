
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';

const API = `${API_URL}/api`;

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

  function statusClass(status) {
    switch (status) {
      case 'RESOLVED':
        return 'resolved';
      case 'IN_PROGRESS':
        return 'progress';
      case 'CLOSED':
        return 'closed';
      default:
        return 'pending';
    }
  }

  function formatStatus(status = '') {
    return status.replaceAll('_', ' ');
  }

  if (loading) {
    return (
      <div className="sn-support-page">
        <div className="sn-support-loading">
          <div className="sn-support-loader" />
          <p>Preparing your support centre...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sn-support-page">
      <header className="sn-support-header">
        <Link to="/dashboard" className="sn-support-brand">
          
        </Link>

        <Link to="/dashboard" className="sn-support-back">
          Back to Dashboard
        </Link>
      </header>

      <main className="sn-support-container">
        <section className="sn-support-hero">
          <div>
            <span className="sn-support-eyebrow">
              SHIPNEXT CUSTOMER CARE
            </span>
            <h1>We're here to <span>help.</span></h1>
            <p>
              One place for shipment assistance, account queries
              and complete support ticket management.
            </p>
          </div>

          <div className="sn-support-hero-art">
            <div className="sn-support-orbit orbit-one" />
            <div className="sn-support-orbit orbit-two" />
            <div className="sn-support-art-core">SN</div>
            <span className="sn-support-art-label">SUPPORT DESK</span>
          </div>
        </section>

        <section className="sn-support-stats">
          <div className="sn-support-stat">
            <span>TOTAL TICKETS</span>
            <strong>{tickets.length}</strong>
            <small>Your submitted requests</small>
          </div>

          <div className="sn-support-stat">
            <span>OPEN REQUESTS</span>
            <strong>
              {tickets.filter(t =>
                !['RESOLVED', 'CLOSED'].includes(t.status)
              ).length}
            </strong>
            <small>Awaiting completion</small>
          </div>

          <div className="sn-support-stat">
            <span>RESOLVED</span>
            <strong>
              {tickets.filter(t => t.status === 'RESOLVED').length}
            </strong>
            <small>Successfully resolved</small>
          </div>
        </section>

        {error && (
          <div className="sn-support-alert error">{error}</div>
        )}

        {success && (
          <div className="sn-support-alert success">{success}</div>
        )}

        <div className="sn-support-layout">
          <section className="sn-support-panel sn-support-form-panel">
            <div className="sn-support-section-heading">
              <div>
                <span>01 / NEW REQUEST</span>
                <h2>Raise a Ticket</h2>
                <p>Tell us what you need help with.</p>
              </div>
              <div className="sn-support-section-number">01</div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="sn-support-field">
                <label>Issue Category *</label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setShipmentId('');
                  }}
                  required
                >
                  <option value="">Choose an issue category</option>
                  {categories.map(item => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {needsShipment && (
                <div className="sn-support-field">
                  <label>Related Shipment *</label>
                  <select
                    value={shipmentId}
                    onChange={(e) => setShipmentId(e.target.value)}
                    required
                  >
                    <option value="">Select a shipment</option>
                    {shipments.map(shipment => (
                      <option key={shipment.id} value={shipment.id}>
                        {shipment.trackingId} — {shipment.pickupPincode} to {shipment.deliveryPincode}
                      </option>
                    ))}
                  </select>

                  {shipments.length === 0 && (
                    <small className="sn-support-field-note">
                      No confirmed shipments are available. A shipment
                      is required for this category.
                    </small>
                  )}
                </div>
              )}

              <div className="sn-support-field">
                <label>Ticket Subject *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Briefly describe your issue"
                  maxLength={150}
                  required
                />
              </div>

              <div className="sn-support-field">
                <div className="sn-support-label-row">
                  <label>Describe Your Issue *</label>
                  <span>{message.length}/3000</span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share the details so our team can assist you..."
                  maxLength={3000}
                  rows={6}
                  required
                />
              </div>

              <button
                type="submit"
                className="sn-support-submit"
                disabled={submitting || (needsShipment && shipments.length === 0)}
              >
                {submitting ? 'Submitting Request...' : 'Submit Support Request'}
                <span>→</span>
              </button>

              <p className="sn-support-form-note">
                Your request will be added to your support history.
              </p>
            </form>
          </section>

          <section className="sn-support-panel sn-support-tickets-panel">
            <div className="sn-support-section-heading">
              <div>
                <span>02 / REQUEST HISTORY</span>
                <h2>My Tickets</h2>
                <p>Monitor your support conversations.</p>
              </div>

              <button
                type="button"
                className="sn-support-refresh"
                onClick={loadData}
              >
                Refresh
              </button>
            </div>

            {tickets.length === 0 ? (
              <div className="sn-support-empty">
                <div className="sn-support-empty-art">SN</div>
                <h3>No tickets yet</h3>
                <p>
                  Your submitted support requests will appear here.
                </p>
              </div>
            ) : (
              <div className="sn-support-ticket-list">
                {tickets.map(ticket => (
                  <article
                    key={ticket.id}
                    className="sn-support-ticket"
                  >
                    <div className="sn-support-ticket-top">
                      <div>
                        <span className="sn-support-ticket-label">
                          TICKET REFERENCE
                        </span>
                        <strong>{ticket.ticketNumber}</strong>
                      </div>

                      <span className={`sn-support-status ${statusClass(ticket.status)}`}>
                        {formatStatus(ticket.status)}
                      </span>
                    </div>

                    <h3>{ticket.subject}</h3>

                    <div className="sn-support-ticket-meta">
                      <span>
                        {categories.find(c => c.value === ticket.category)?.label || ticket.category}
                      </span>
                      <span>
                        {new Date(ticket.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <div className="sn-support-ticket-message">
                      {ticket.message}
                    </div>

                    {ticket.shipment && (
                      <div className="sn-support-shipment">
                        <div>
                          <span>TRACKING ID</span>
                          <strong>{ticket.shipment.trackingId}</strong>
                        </div>
                        <div>
                          <span>DOCKET NUMBER</span>
                          <strong>
                            {ticket.shipment.docketNumber || 'Not generated yet'}
                          </strong>
                        </div>
                      </div>
                    )}

                    {ticket.adminReply && (
                      <div className="sn-support-admin-reply">
                        <span>SHIPNEXT TEAM RESPONSE</span>
                        <p>{ticket.adminReply}</p>
                      </div>
                    )}

                    <div className="sn-support-ticket-footer">
                      SUBMITTED {new Date(ticket.createdAt).toLocaleString('en-IN')}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <footer className="sn-support-footer">
           YOUR SHIPPING. OUR PRIORITY.
        </footer>
      </main>
    </div>
  );
}

export default Support;
