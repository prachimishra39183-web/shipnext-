
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
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

      const response = await fetch(
        `${API_URL}/api/admin/enquiries`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
      ].some((value) => value?.toLowerCase().includes(query))
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

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>ShipNext <span>Admin</span></h2>
        <Link to="/admin">📊 Dashboard</Link>
        <Link to="/admin/customers">👥 Customers</Link>
        <Link to="/admin/shipments">📦 Shipments</Link>
        <Link to="/admin/bookings">🚚 Bookings</Link>
        <Link to="/admin/wallet">💳 Wallet Management</Link>
        <Link to="/admin/enquiries" className="admin-active">📩 Enquiries</Link>
        <Link to="/">🌐 View Website</Link>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Customer Enquiries</h1>
            <p>Manage enquiries submitted by website visitors.</p>
          </div>

          <button
            type="button"
            onClick={fetchEnquiries}
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
            <span>Total Enquiries</span>
            <h2>{stats.total}</h2>
          </div>

          <div className="admin-stat-card">
            <span>New</span>
            <h2>{stats.new}</h2>
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
          <h2>All Enquiries</h2>

          <input
            type="search"
            placeholder="Search by name, email, phone or message..."
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
              <p>Loading enquiries...</p>
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="admin-empty">
              <span>📩</span>
              <h3>
                {search ? 'No matching enquiries' : 'No enquiries received'}
              </h3>
              <p>
                {search
                  ? 'Try another search term.'
                  : 'Website visitor enquiries will appear here.'}
              </p>
            </div>
          ) : (
            <div className="admin-enquiries-list">
              {filteredEnquiries.map((enquiry) => (
                <article className="admin-enquiry-card" key={enquiry.id}>
                  <div className="admin-enquiry-top">
                    <div>
                      <h3>{enquiry.name}</h3>
                      <p>{formatDate(enquiry.createdAt)}</p>
                    </div>

                    <span className={
                      enquiry.isResolved
                        ? 'enquiry-status resolved'
                        : 'enquiry-status new'
                    }>
                      {enquiry.isResolved ? 'Resolved' : 'New'}
                    </span>
                  </div>

                  <div className="admin-enquiry-contact">
                    <p><strong>Phone:</strong> {enquiry.phone}</p>
                    <p><strong>Email:</strong> {enquiry.email || 'Not provided'}</p>
                  </div>

                  <div className="admin-enquiry-message">
                    <strong>Message</strong>
                    <p>{enquiry.message}</p>
                  </div>

                  <button
                    type="button"
                    disabled={updatingId === enquiry.id}
                    onClick={() =>
                      updateStatus(enquiry.id, !enquiry.isResolved)
                    }
                  >
                    {updatingId === enquiry.id
                      ? 'Updating...'
                      : enquiry.isResolved
                        ? 'Mark as New'
                        : 'Mark as Resolved'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminEnquiries;
