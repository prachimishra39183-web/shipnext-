
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
const shipmentStatuses = [
  'PENDING',
  'CONFIRMED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RTO',
];

function AdminShipments() {
  const [shipments, setShipments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    inTransit: 0,
    delivered: 0,
    pending: 0,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const token = sessionStorage.getItem('shipnextToken');

  const calculateStats = (items) => ({
    total: items.length,
    inTransit: items.filter(item => item.status === 'IN_TRANSIT').length,
    delivered: items.filter(item => item.status === 'DELIVERED').length,
    pending: items.filter(item => item.status === 'PENDING').length,
  });

  const fetchShipments = async () => {
    try {
      const response = await fetch(
        '${API_URL}/api/admin/shipments',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load shipments.');
      }

      setShipments(data.shipments || []);
      setStats(data.stats || calculateStats(data.shipments || []));
      setError('');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const updateShipmentStatus = async (shipment, newStatus) => {
    if (shipment.status === newStatus) return;

    const confirmed = window.confirm(
      `Change shipment ${shipment.trackingId} status to ${newStatus.replaceAll('_', ' ')}? A customer notification will be created.`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(shipment.id);
      setSuccessMessage('');

      const response = await fetch(
        `${API_URL}/api/admin/shipments/${shipment.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update shipment.');
      }

      setSuccessMessage(
        data.notificationCreated
          ? `Shipment ${shipment.trackingId} updated. Customer notification created successfully.`
          : data.message
      );

      await fetchShipments();
    } catch (err) {
      alert(err.message || 'Unable to update shipment status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredShipments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return shipments;

    return shipments.filter(shipment =>
      shipment.trackingId?.toLowerCase().includes(query) ||
      shipment.docketNumber?.toLowerCase().includes(query) ||
      shipment.customer?.name?.toLowerCase().includes(query) ||
      shipment.customer?.email?.toLowerCase().includes(query) ||
      shipment.pickupPincode?.includes(query) ||
      shipment.deliveryPincode?.includes(query)
    );
  }, [shipments, search]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Number(amount || 0));

  const formatStatus = (status) =>
    status.replaceAll('_', ' ');

  const formatDate = (value) => {
    if (!value) return 'Not scheduled';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>ShipNext <span>Admin</span></h2>
        <Link to="/admin">📊 Dashboard</Link>
        <Link to="/admin/customers">👥 Customers</Link>
        <Link to="/admin/shipments" className="admin-active">
          📦 Shipments
        </Link>
        <Link to="/admin/bookings">🚚 Bookings</Link>
        <Link to="/admin/wallet">💳 Wallet Management</Link>
        <Link to="/admin/enquiries">📩 Enquiries</Link>
        <Link to="/">🌐 View Website</Link>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Shipment Management</h1>
            <p>Manage shipments, dockets and processing schedules.</p>
          </div>
        </header>

        <section className="admin-stats">
          <div className="admin-stat-card">
            <span>Total Shipments</span>
            <h2>{stats.total}</h2>
          </div>
          <div className="admin-stat-card">
            <span>In Transit</span>
            <h2>{stats.inTransit}</h2>
          </div>
          <div className="admin-stat-card">
            <span>Delivered</span>
            <h2>{stats.delivered}</h2>
          </div>
          <div className="admin-stat-card">
            <span>Pending</span>
            <h2>{stats.pending}</h2>
          </div>
        </section>

        <section className="admin-content-card">
          <h2>All Shipments</h2>

          {successMessage && (
            <div style={{
              padding: '12px',
              marginBottom: '16px',
              background: '#e8f7ed',
              color: '#166534',
              borderRadius: '8px',
            }}>
              {successMessage}
            </div>
          )}

          <input
            type="search"
            placeholder="Search docket, tracking ID, customer or pincode..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            style={{
              width: '100%',
              padding: '14px',
              border: '1px solid #dbe2ed',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          />

          {loading && <p>Loading shipments...</p>}

          {!loading && error && (
            <div className="admin-empty">
              <h3>Unable to load shipments</h3>
              <p>{error}</p>
              <button onClick={() => {
                setLoading(true);
                fetchShipments();
              }}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredShipments.length === 0 && (
            <div className="admin-empty">
              <span>📦</span>
              <h3>
                {shipments.length === 0
                  ? 'No shipments available'
                  : 'No matching shipments found'}
              </h3>
              <p>
                {shipments.length === 0
                  ? 'Customer shipments will appear here after booking.'
                  : 'Try another search.'}
              </p>
            </div>
          )}

          {!loading && !error && filteredShipments.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
              }}>
                <thead>
                  <tr>
                    {[
                      'Docket Number',
                      'Tracking ID',
                      'Customer',
                      'Pickup PIN',
                      'Delivery PIN',
                      'Weight',
                      'Charge',
                      'Booking Date',
                      'Processing Date',
                      'Status',
                    ].map(heading => (
                      <th key={heading} style={{
                        padding: '14px',
                        borderBottom: '1px solid #e5eaf1',
                        whiteSpace: 'nowrap',
                      }}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredShipments.map(shipment => (
                    <tr key={shipment.id}>
                      <td style={{ padding: '14px', borderBottom: '1px solid #edf0f5' }}>
                        <strong>{shipment.docketNumber || 'Not generated'}</strong>
                      </td>

                      <td style={{ padding: '14px', borderBottom: '1px solid #edf0f5' }}>
                        <strong>{shipment.trackingId}</strong>
                      </td>

                      <td style={{ padding: '14px', borderBottom: '1px solid #edf0f5' }}>
                        {shipment.customer?.name || '—'}
                      </td>

                      <td style={{ padding: '14px', borderBottom: '1px solid #edf0f5' }}>
                        {shipment.pickupPincode}
                      </td>

                      <td style={{ padding: '14px', borderBottom: '1px solid #edf0f5' }}>
                        {shipment.deliveryPincode}
                      </td>

                      <td style={{ padding: '14px', borderBottom: '1px solid #edf0f5' }}>
                        {(shipment.weightGrams / 1000).toFixed(2)} kg
                      </td>

                      <td style={{
                        padding: '14px',
                        borderBottom: '1px solid #edf0f5',
                        whiteSpace: 'nowrap',
                      }}>
                        {formatCurrency(shipment.shippingCharge)}
                      </td>

                      <td style={{ padding: '14px', borderBottom: '1px solid #edf0f5', whiteSpace: 'nowrap' }}>
                        {formatDate(shipment.createdAt)}
                      </td>

                      <td style={{ padding: '14px', borderBottom: '1px solid #edf0f5', whiteSpace: 'nowrap' }}>
                        {formatDate(shipment.processingDate)}
                      </td>

                      <td style={{ padding: '14px', borderBottom: '1px solid #edf0f5' }}>
                        <select
                          value={shipment.status}
                          disabled={updatingId === shipment.id}
                          onChange={event =>
                            updateShipmentStatus(shipment, event.target.value)
                          }
                          style={{
                            padding: '9px',
                            border: '1px solid #dbe2ed',
                            borderRadius: '7px',
                            background: '#fff',
                            cursor: 'pointer',
                            minWidth: '155px',
                          }}
                        >
                          {shipmentStatuses.map(status => (
                            <option key={status} value={status}>
                              {formatStatus(status)}
                            </option>
                          ))}
                        </select>

                        {updatingId === shipment.id && (
                          <small style={{ display: 'block', marginTop: '5px' }}>
                            Updating...
                          </small>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminShipments;
