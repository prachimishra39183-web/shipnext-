
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const API = 'http://localhost:5000/api/admin/support';

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
      ].some((value) => String(value || '').toLowerCase().includes(query))
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

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>ShipNext <span>Admin</span></h2>
        <Link to="/admin">📊 Dashboard</Link>
        <Link to="/admin/customers">👥 Customers</Link>
        <Link to="/admin/shipments">📦 Shipments</Link>
        <Link to="/admin/bookings">🚚 Bookings</Link>
        <Link to="/admin/wallet">💳 Wallet Management</Link>
        <Link to="/admin/enquiries">📩 Enquiries</Link>
        <Link to="/admin/support" className="admin-active">
          🎧 Support Tickets
        </Link>
        <Link to="/">🌐 View Website</Link>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Support Tickets</h1>
            <p>Manage customer complaints and support requests.</p>
          </div>

          <button
            type="button"
            onClick={fetchTickets}
            disabled={loading}
          >
            {loading ? 'Loading...' : '↻ Refresh'}
          </button>
        </header>

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        <section className="admin-stats">
          <div className="admin-stat-card">
            <span>Total Tickets</span>
            <h2>{stats.total}</h2>
          </div>

          <div className="admin-stat-card">
            <span>Open</span>
            <h2>{stats.open}</h2>
          </div>

          <div className="admin-stat-card">
            <span>In Progress</span>
            <h2>{stats.inProgress}</h2>
          </div>

          <div className="admin-stat-card">
            <span>Resolved</span>
            <h2>{stats.resolved}</h2>
          </div>
        </section>

        <section className="admin-content-card">
          <h2>All Support Tickets</h2>

          <input
            type="search"
            placeholder="Search ticket, customer, docket number or tracking ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              width: '100%',
              padding: '14px',
              border: '1px solid #dbe2ed',
              borderRadius: '8px',
              marginBottom: '20px',
              boxSizing: 'border-box',
            }}
          />

          {loading ? (
            <div className="admin-empty">
              <p>Loading support tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="admin-empty">
              <span>🎧</span>
              <h3>
                {search ? 'No matching tickets' : 'No support tickets yet'}
              </h3>
              <p>
                {search
                  ? 'Try another search term.'
                  : 'Customer support tickets will appear here.'}
              </p>
            </div>
          ) : (
            <div className="admin-enquiries-list">
              {filteredTickets.map((ticket) => (
                <article className="admin-enquiry-card" key={ticket.id}>
                  <div className="admin-enquiry-top">
                    <div>
                      <h3>{ticket.ticketNumber}</h3>
                      <p>{formatDate(ticket.createdAt)}</p>
                    </div>

                    <span className={`enquiry-status ${
                      ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                        ? 'resolved'
                        : 'new'
                    }`}>
                      {ticket.status.replaceAll('_', ' ')}
                    </span>
                  </div>

                  <div className="admin-enquiry-contact">
                    <p><strong>Customer:</strong> {ticket.customer?.name}</p>
                    <p><strong>Email:</strong> {ticket.customer?.email}</p>
                    <p><strong>Phone:</strong> {ticket.customer?.phone || 'Not provided'}</p>
                  </div>

                  <div className="admin-enquiry-message">
                    <p>
                      <strong>Category:</strong>{' '}
                      {categories[ticket.category] || ticket.category}
                    </p>

                    <p><strong>Subject:</strong> {ticket.subject}</p>

                    <strong>Customer Message</strong>
                    <p>{ticket.message}</p>
                  </div>

                  <div className="admin-enquiry-message">
                    <strong>Shipment Details</strong>

                    {ticket.shipment ? (
                      <>
                        <p>
                          <strong>Docket Number:</strong>{' '}
                          {ticket.shipment.docketNumber || 'Not generated yet'}
                        </p>
                        <p>
                          <strong>Tracking ID:</strong>{' '}
                          {ticket.shipment.trackingId}
                        </p>
                        <p>
                          <strong>Route:</strong>{' '}
                          {ticket.shipment.pickupPincode} →{' '}
                          {ticket.shipment.deliveryPincode}
                        </p>
                      </>
                    ) : (
                      <p>No shipment linked to this ticket.</p>
                    )}
                  </div>

                  <div style={{ marginTop: '18px' }}>
                    <label>
                      <strong>Update Ticket Status</strong>
                    </label>

                    <select
                      value={ticket.status}
                      disabled={updatingId === ticket.id}
                      onChange={(event) =>
                        updateTicket(ticket.id, { status: event.target.value })
                      }
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '11px',
                        marginTop: '8px',
                        border: '1px solid #dbe2ed',
                        borderRadius: '8px',
                      }}
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>

                  <div style={{ marginTop: '18px' }}>
                    <label>
                      <strong>Reply to Customer</strong>
                    </label>

                    <textarea
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
                      style={{
                        display: 'block',
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '12px',
                        marginTop: '8px',
                        border: '1px solid #dbe2ed',
                        borderRadius: '8px',
                        resize: 'vertical',
                      }}
                    />

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
                      style={{ marginTop: '10px' }}
                    >
                      {updatingId === ticket.id
                        ? 'Updating...'
                        : 'Send Reply'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminSupport;
