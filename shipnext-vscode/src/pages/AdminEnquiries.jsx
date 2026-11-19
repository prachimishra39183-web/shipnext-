
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
import './AdminEnquiries.css';

function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      setError('');

      const token = sessionStorage.getItem('shipnextToken');

      if (!token) {
        throw new Error('Please log in with your admin account.');
      }

      const response = await fetch(`${API_URL}/api/admin/enquiries`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load enquiries.');
      }

      setEnquiries(data.enquiries || []);
      setStats(data.stats || {
        total: 0,
        new: 0,
        inProgress: 0,
        resolved: 0,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const filteredEnquiries = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return enquiries;

    return enquiries.filter((enquiry) =>
      [
        enquiry.name,
        enquiry.email,
        enquiry.phone,
        enquiry.message,
      ].some((value) =>
        String(value || '').toLowerCase().includes(query)
      )
    );
  }, [enquiries, search]);

  const updateStatus = async (id, isResolved) => {
    try {
      setUpdatingId(id);
      setError('');

      const token = sessionStorage.getItem('shipnextToken');

      const response = await fetch(
        `${API_URL}/api/admin/enquiries/${id}/resolve`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isResolved }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update enquiry.');
      }

      await fetchEnquiries();
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
    <div className="admin-layout sn-enquiries-page">
      <aside className="admin-sidebar sn-enquiries-sidebar">
        <div className="sn-enquiries-brand">
        
        </div>

        <div className="sn-enquiries-nav-label">MAIN MENU</div>

        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/customers">Customers</Link>
        <Link to="/admin/shipments">Shipments</Link>
        <Link to="/admin/bookings">Bookings</Link>
        <Link to="/admin/wallet">Wallet Management</Link>
        <Link to="/admin/enquiries" className="admin-active">Enquiries</Link>
        <Link to="/">View Website</Link>

        <div className="sn-enquiries-sidebar-bottom">
          <span />
          SYSTEM OPERATIONAL
        </div>
      </aside>

      <main className="admin-main sn-enquiries-main">
        <header className="sn-enquiries-header">
          <div>
            <span className="sn-enquiries-eyebrow">CUSTOMER RELATIONSHIP CENTER</span>
            <h1>Customer <span>Enquiries</span></h1>
            <p>Manage visitor enquiries and keep every conversation moving.</p>
          </div>

          <button
            className="sn-enquiries-refresh"
            type="button"
            onClick={fetchEnquiries}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '↻ Refresh Enquiries'}
          </button>
        </header>

        {error && (
          <div className="sn-enquiries-error">{error}</div>
        )}

        <section className="sn-enquiries-hero">
          <div className="sn-enquiries-hero-copy">
            <span className="sn-enquiries-eyebrow">SHIPNEXT CUSTOMER DESK</span>
            <h2>Every enquiry is<br /><span>an opportunity.</span></h2>
            <p>
              Track incoming customer conversations, review contact details
              and manage resolution status from one place.
            </p>
          </div>

          <div className="sn-enquiries-hero-visual">
            <div className="sn-enquiries-orbit orbit-one" />
            <div className="sn-enquiries-orbit orbit-two" />
            <div className="sn-enquiries-hero-symbol">✉</div>
            <span>ENQUIRY CENTER</span>
          </div>
        </section>

        <section className="sn-enquiries-stats">
          <article className="sn-enquiries-stat stat-total">
            <div className="sn-enquiries-stat-top">
              <span>Total Enquiries</span>
              <b className="stat-icon">Σ</b>
            </div>
            <h2>{stats.total}</h2>
            <small>All submitted enquiries</small>
          </article>

          <article className="sn-enquiries-stat">
            <div className="sn-enquiries-stat-top">
              <span>New Enquiries</span>
              <b className="stat-icon stat-orange">✦</b>
            </div>
            <h2>{stats.new}</h2>
            <small>Awaiting resolution</small>
          </article>

          <article className="sn-enquiries-stat">
            <div className="sn-enquiries-stat-top">
              <span>In Progress</span>
              <b className="stat-icon stat-blue">◷</b>
            </div>
            <h2>{stats.inProgress}</h2>
            <small>Currently being handled</small>
          </article>

          <article className="sn-enquiries-stat">
            <div className="sn-enquiries-stat-top">
              <span>Resolved</span>
              <b className="stat-icon stat-green">✓</b>
            </div>
            <h2>{stats.resolved}</h2>
            <small>Successfully completed</small>
          </article>
        </section>

        <section className="sn-enquiries-section">
          <div className="sn-enquiries-section-heading">
            <div>
              <span className="sn-enquiries-eyebrow">INBOX MANAGEMENT</span>
              <h2>Enquiry Directory</h2>
              <p>Review customer messages and update their resolution status.</p>
            </div>
            <span className="sn-enquiries-count">
              {filteredEnquiries.length} RESULTS
            </span>
          </div>

          <div className="sn-enquiries-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search name, email, phone or message..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {loading ? (
            <div className="sn-enquiries-empty">
              Loading customer enquiries...
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="sn-enquiries-empty">
              <h3>{search ? 'No matching enquiries' : 'No enquiries received'}</h3>
              <p>
                {search
                  ? 'Try another search term.'
                  : 'Website visitor enquiries will appear here.'}
              </p>
            </div>
          ) : (
            <div className="sn-enquiries-list">
              {filteredEnquiries.map((enquiry) => (
                <article className="sn-enquiry-card" key={enquiry.id}>
                  <div className="sn-enquiry-card-top">
                    <div className="sn-enquiry-person">
                      <div className="sn-enquiry-avatar">
                        {(enquiry.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3>{enquiry.name}</h3>
                        <span>Submitted {formatDate(enquiry.createdAt)}</span>
                      </div>
                    </div>

                    <span className={`sn-enquiry-status ${enquiry.isResolved ? 'resolved' : 'new'}`}>
                      <i />
                      {enquiry.isResolved ? 'Resolved' : 'New Enquiry'}
                    </span>
                  </div>

                  <div className="sn-enquiry-contact-grid">
                    <div className="sn-enquiry-contact-box">
                      <span>PHONE NUMBER</span>
                      <strong>{enquiry.phone || 'Not provided'}</strong>
                    </div>
                    <div className="sn-enquiry-contact-box">
                      <span>EMAIL ADDRESS</span>
                      <strong>{enquiry.email || 'Not provided'}</strong>
                    </div>
                  </div>

                  <div className="sn-enquiry-message">
                    <span>CUSTOMER MESSAGE</span>
                    <p>{enquiry.message}</p>
                  </div>

                  <div className="sn-enquiry-card-footer">
                    <span>
                      {enquiry.isResolved
                        ? 'This enquiry has been marked as resolved.'
                        : 'This enquiry is awaiting resolution.'}
                    </span>

                    <button
                      type="button"
                      className={enquiry.isResolved ? 'reopen' : 'resolve'}
                      disabled={updatingId === enquiry.id}
                      onClick={() =>
                        updateStatus(enquiry.id, !enquiry.isResolved)
                      }
                    >
                      {updatingId === enquiry.id
                        ? 'Updating...'
                        : enquiry.isResolved
                          ? 'Reopen Enquiry'
                          : 'Mark as Resolved'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="sn-enquiries-footer">
          <span>SHIPNEXT CUSTOMER OPERATIONS</span>
          <span>ENQUIRY MANAGEMENT CONSOLE</span>
        </footer>
      </main>
    </div>
  );
}

export default AdminEnquiries;
