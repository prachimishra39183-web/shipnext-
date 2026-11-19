
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
import './AdminSupport.css';

const API = `${API_URL}/api/admin/support`;

const categories = {
  DELIVERY: 'Delivery Related Issue',
  PICKUP: 'Pickup Related Issue',
  RTO: 'RTO Issue',
  CLAIM: 'Claim Issue',
  ACCOUNT: 'Account Related Issue',
  GST: 'GST Related Issue',
};

function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [replies, setReplies] = useState({});

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');

      const token = sessionStorage.getItem('shipnextToken');

      if (!token) {
        throw new Error('Please log in with your admin account.');
      }

      const response = await fetch(API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to load support tickets.');
      }

      setTickets(data.tickets || []);
      setStats(data.stats || {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return tickets;

    return tickets.filter((ticket) =>
      [
        ticket.ticketNumber,
        ticket.category,
        ticket.subject,
        ticket.message,
        ticket.status,
        ticket.customer?.name,
        ticket.customer?.email,
        ticket.customer?.phone,
        ticket.shipment?.docketNumber,
        ticket.shipment?.trackingId,
      ].some((value) =>
        String(value || '').toLowerCase().includes(query)
      )
    );
  }, [tickets, search]);

  const updateTicket = async (id, changes) => {
    try {
      setUpdatingId(id);
      setError('');

      const token = sessionStorage.getItem('shipnextToken');

      const response = await fetch(`${API}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(changes),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to update ticket.');
      }

      await fetchTickets();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId('');
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  const statusLabel = (status) =>
    String(status || '').replaceAll('_', ' ');

  const getStatusClass = (status) => {
    if (status === 'RESOLVED') return 'resolved';
    if (status === 'CLOSED') return 'closed';
    if (status === 'IN_PROGRESS') return 'progress';
    return 'open';
  };

  return (
    <div className="admin-layout sn-support-admin-page">
      <aside className="admin-sidebar sn-support-admin-sidebar">
        <div className="sn-support-admin-brand">
          <img src="/logo.jpeg" alt="ShipNext Logo" />
          <span>SHIP<em>NEXT</em></span>
        </div>

        <div className="sn-support-admin-nav-label">MAIN MENU</div>

        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/customers">Customers</Link>
        <Link to="/admin/shipments">Shipments</Link>
        <Link to="/admin/bookings">Bookings</Link>
        <Link to="/admin/wallet">Wallet Management</Link>
        <Link to="/admin/enquiries">Enquiries</Link>
        <Link to="/admin/support" className="admin-active">Support Tickets</Link>
        <Link to="/">View Website</Link>

        <div className="sn-support-admin-sidebar-bottom">
          <span />
          SYSTEM OPERATIONAL
        </div>
      </aside>

      <main className="admin-main sn-support-admin-main">
        <header className="sn-support-admin-header">
          <div>
            <span className="sn-support-admin-eyebrow">CUSTOMER EXPERIENCE CENTER</span>
            <h1>Support <span>Management</span></h1>
            <p>Manage customer complaints, shipment issues and support resolutions.</p>
          </div>

          <button
            type="button"
            className="sn-support-admin-refresh"
            onClick={fetchTickets}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '↻ Refresh Tickets'}
          </button>
        </header>

        {error && (
          <div className="sn-support-admin-error">{error}</div>
        )}

        <section className="sn-support-admin-hero">
          <div className="sn-support-admin-hero-copy">
            <span className="sn-support-admin-eyebrow">SHIPNEXT SUPPORT OPERATIONS</span>
            <h2>Service starts<br /><span>with support.</span></h2>
            <p>
              One centralized workspace to review complaints, track shipment
              issues and respond to customers.
            </p>
          </div>

          <div className="sn-support-admin-hero-visual">
            <div className="sn-support-admin-orbit orbit-one" />
            <div className="sn-support-admin-orbit orbit-two" />
            <div className="sn-support-admin-hero-symbol">S</div>
            <span>SUPPORT OPERATIONS</span>
          </div>
        </section>

        <section className="sn-support-admin-stats">
          <article className="sn-support-admin-stat stat-total">
            <div className="sn-support-admin-stat-top">
              <span>Total Tickets</span>
              <b>T</b>
            </div>
            <h2>{stats.total}</h2>
            <small>All customer support requests</small>
          </article>

          <article className="sn-support-admin-stat">
            <div className="sn-support-admin-stat-top">
              <span>Open Tickets</span>
              <b className="orange">O</b>
            </div>
            <h2>{stats.open}</h2>
            <small>Awaiting action</small>
          </article>

          <article className="sn-support-admin-stat">
            <div className="sn-support-admin-stat-top">
              <span>In Progress</span>
              <b className="blue">P</b>
            </div>
            <h2>{stats.inProgress}</h2>
            <small>Currently being handled</small>
          </article>

          <article className="sn-support-admin-stat">
            <div className="sn-support-admin-stat-top">
              <span>Resolved</span>
              <b className="green">R</b>
            </div>
            <h2>{stats.resolved}</h2>
            <small>Successfully resolved</small>
          </article>

          <article className="sn-support-admin-stat">
            <div className="sn-support-admin-stat-top">
              <span>Closed</span>
              <b className="purple">C</b>
            </div>
            <h2>{stats.closed}</h2>
            <small>Closed support requests</small>
          </article>
        </section>

        <section className="sn-support-admin-section">
          <div className="sn-support-admin-section-heading">
            <div>
              <span className="sn-support-admin-eyebrow">TICKET CONTROL CENTER</span>
              <h2>Customer Support Tickets</h2>
              <p>Review customer details, shipment references and reply to tickets.</p>
            </div>
            <span className="sn-support-admin-count">
              {filteredTickets.length} TICKETS
            </span>
          </div>

          <div className="sn-support-admin-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search ticket, customer, docket number or tracking ID..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {loading ? (
            <div className="sn-support-admin-empty">
              Loading support tickets...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="sn-support-admin-empty">
              <h3>{search ? 'No matching tickets' : 'No support tickets yet'}</h3>
              <p>
                {search
                  ? 'Try another search term.'
                  : 'Customer support tickets will appear here.'}
              </p>
            </div>
          ) : (
            <div className="sn-support-admin-list">
              {filteredTickets.map((ticket) => (
                <article className="sn-support-ticket" key={ticket.id}>
                  <div className="sn-support-ticket-top">
                    <div>
                      <span className="sn-support-ticket-reference">TICKET REFERENCE</span>
                      <h3>{ticket.ticketNumber}</h3>
                      <p>Submitted {formatDate(ticket.createdAt)}</p>
                    </div>

                    <span className={`sn-support-ticket-status ${getStatusClass(ticket.status)}`}>
                      <i />
                      {statusLabel(ticket.status)}
                    </span>
                  </div>

                  <div className="sn-support-ticket-customer">
                    <div className="sn-support-ticket-avatar">
                      {(ticket.customer?.name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span>CUSTOMER ACCOUNT</span>
                      <h4>{ticket.customer?.name || 'Unknown Customer'}</h4>
                    </div>
                  </div>

                  <div className="sn-support-ticket-contact">
                    <div>
                      <span>EMAIL ADDRESS</span>
                      <strong>{ticket.customer?.email || 'Not provided'}</strong>
                    </div>
                    <div>
                      <span>PHONE NUMBER</span>
                      <strong>{ticket.customer?.phone || 'Not provided'}</strong>
                    </div>
                  </div>

                  <div className="sn-support-ticket-details">
                    <div className="sn-support-ticket-category">
                      <span>ISSUE CATEGORY</span>
                      <strong>{categories[ticket.category] || ticket.category}</strong>
                    </div>

                    <div className="sn-support-ticket-subject">
                      <span>SUBJECT</span>
                      <strong>{ticket.subject}</strong>
                    </div>

                    <div className="sn-support-ticket-message">
                      <span>CUSTOMER MESSAGE</span>
                      <p>{ticket.message}</p>
                    </div>
                  </div>

                  <div className="sn-support-ticket-shipment">
                    <div className="sn-support-ticket-shipment-heading">
                      <div>
                        <span className="sn-support-admin-eyebrow">SHIPMENT INFORMATION</span>
                        <h4>Linked Shipment</h4>
                      </div>
                      <span className="sn-support-shipment-tag">
                        {ticket.shipment ? 'LINKED' : 'NOT LINKED'}
                      </span>
                    </div>

                    {ticket.shipment ? (
                      <div className="sn-support-shipment-grid">
                        <div>
                          <span>DOCKET NUMBER</span>
                          <strong>{ticket.shipment.docketNumber || 'Not generated yet'}</strong>
                        </div>
                        <div>
                          <span>TRACKING ID</span>
                          <strong>{ticket.shipment.trackingId || 'Not available'}</strong>
                        </div>
                        <div>
                          <span>PICKUP PINCODE</span>
                          <strong>{ticket.shipment.pickupPincode || '—'}</strong>
                        </div>
                        <div>
                          <span>DELIVERY PINCODE</span>
                          <strong>{ticket.shipment.deliveryPincode || '—'}</strong>
                        </div>
                      </div>
                    ) : (
                      <p className="sn-support-no-shipment">
                        No shipment has been linked to this ticket.
                      </p>
                    )}
                  </div>

                  <div className="sn-support-ticket-actions">
                    <div className="sn-support-ticket-status-control">
                      <label htmlFor={`status-${ticket.id}`}>
                        UPDATE TICKET STATUS
                      </label>
                      <select
                        id={`status-${ticket.id}`}
                        value={ticket.status}
                        disabled={updatingId === ticket.id}
                        onChange={(event) =>
                          updateTicket(ticket.id, { status: event.target.value })
                        }
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>

                    <div className="sn-support-ticket-reply">
                      <label htmlFor={`reply-${ticket.id}`}>
                        REPLY TO CUSTOMER
                      </label>
                      <textarea
                        id={`reply-${ticket.id}`}
                        rows={3}
                        maxLength={3000}
                        value={replies[ticket.id] ?? ticket.adminReply ?? ''}
                        onChange={(event) =>
                          setReplies((previous) => ({
                            ...previous,
                            [ticket.id]: event.target.value,
                          }))
                        }
                        placeholder="Write your response to the customer..."
                      />

                      <div className="sn-support-reply-footer">
                        <span>
                          {(replies[ticket.id] ?? ticket.adminReply ?? '').length}/3000 characters
                        </span>
                        <button
                          type="button"
                          disabled={
                            updatingId === ticket.id ||
                            !(replies[ticket.id] ?? ticket.adminReply ?? '').trim()
                          }
                          onClick={() =>
                            updateTicket(ticket.id, {
                              adminReply: replies[ticket.id] ?? ticket.adminReply,
                            })
                          }
                        >
                          {updatingId === ticket.id ? 'Updating...' : 'Send Reply'}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="sn-support-admin-footer">
          <span>SHIPNEXT CUSTOMER OPERATIONS</span>
          <span>SUPPORT MANAGEMENT CONSOLE</span>
        </footer>
      </main>
    </div>
  );
}

export default AdminSupport;
