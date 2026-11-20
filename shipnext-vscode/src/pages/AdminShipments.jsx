
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
import './AdminShipments.css';

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
      const response = await fetch(`${API_URL}/api/admin/shipments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load shipments.');
      }

      const items = data.shipments || [];
      setShipments(items);
      setStats(data.stats || calculateStats(items));
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

  const formatStatus = (status = '') =>
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
    <div className="admin-layout sn-shipments-page">
      <aside className="admin-sidebar sn-shipments-sidebar">


        <div className="sn-sidebar-label">OVERVIEW</div>
        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/customers">Customers</Link>
        <Link to="/admin/shipments" className="admin-active">
          Shipments
        </Link>
        <Link to="/admin/bookings">Bookings</Link>

        <div className="sn-sidebar-label">OPERATIONS</div>
        <Link to="/admin/wallet">Wallet Management</Link>
        <Link to="/admin/enquiries">Enquiries</Link>
        <Link to="/">View Website</Link>

        <div className="sn-sidebar-footer">
          <span className="sn-sidebar-indicator" />
          <div>
            <strong>Administrator</strong>
            <small>System access</small>
          </div>
        </div>
      </aside>

      <main className="admin-main sn-shipments-main">
        <header className="sn-shipments-heading">
          <div>
            <span className="sn-shipments-eyebrow">SHIPNEXT CONTROL CENTER</span>
            <h1>Shipment Management</h1>
            <p>Monitor deliveries, manage shipment statuses and track processing schedules.</p>
          </div>

          <div className="sn-shipments-heading-side">
            <span className="sn-live-indicator" />
            <span>Shipment Operations</span>
          </div>
        </header>

        <section className="sn-shipments-welcome">
          <div className="sn-welcome-orbit sn-orbit-one" />
          <div className="sn-welcome-orbit sn-orbit-two" />
          <div className="sn-welcome-content">
            <span className="sn-welcome-tag">LOGISTICS OVERVIEW</span>
            <h2>Complete shipment visibility.</h2>
            <p>
              Review every shipment in your network, monitor delivery progress
              and keep customers informed with timely status updates.
            </p>
          </div>
          <div className="sn-welcome-mark" aria-hidden="true">
            <div className="sn-mark-ring">
              <div className="sn-mark-core" />
            </div>
          </div>
        </section>

        <section className="sn-shipment-metrics">
          <article className="sn-shipment-stat sn-stat-total">
            <div className="sn-stat-top">
              <span>Total Shipments</span>
              <span className="sn-stat-symbol">01</span>
            </div>
            <h2>{stats.total}</h2>
            <p>All registered shipments</p>
            <div className="sn-stat-bottom-line" />
          </article>

          <article className="sn-shipment-stat sn-stat-transit">
            <div className="sn-stat-top">
              <span>In Transit</span>
              <span className="sn-stat-symbol">02</span>
            </div>
            <h2>{stats.inTransit}</h2>
            <p>Currently moving through network</p>
            <div className="sn-stat-bottom-line" />
          </article>

          <article className="sn-shipment-stat sn-stat-delivered">
            <div className="sn-stat-top">
              <span>Delivered</span>
              <span className="sn-stat-symbol">03</span>
            </div>
            <h2>{stats.delivered}</h2>
            <p>Successfully delivered shipments</p>
            <div className="sn-stat-bottom-line" />
          </article>

          <article className="sn-shipment-stat sn-stat-pending">
            <div className="sn-stat-top">
              <span>Pending</span>
              <span className="sn-stat-symbol">04</span>
            </div>
            <h2>{stats.pending}</h2>
            <p>Awaiting shipment processing</p>
            <div className="sn-stat-bottom-line" />
          </article>
        </section>

        <section className="sn-shipment-table-panel">
          <div className="sn-panel-heading">
            <div>
              <span className="sn-panel-eyebrow">NETWORK RECORDS</span>
              <h2>All Shipments</h2>
              <p>Search, review and update shipment information.</p>
            </div>

            <div className="sn-record-count">
              <span className="sn-record-dot" />
              {filteredShipments.length} Records
            </div>
          </div>

          {successMessage && (
            <div className="sn-shipment-success">
              <span className="sn-message-check">✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          <div className="sn-shipment-toolbar">
            <div className="sn-shipment-search">
              <span className="sn-search-symbol" aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search docket, tracking ID, customer or pincode..."
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="sn-clear-search"
                  onClick={() => setSearch('')}
                >
                  Clear
                </button>
              )}
            </div>

            <span className="sn-search-result">
              Showing {filteredShipments.length} of {shipments.length}
            </span>
          </div>

          {loading && (
            <div className="sn-shipment-state">
              <div className="sn-loader" />
              <h3>Loading shipment records</h3>
              <p>Retrieving your shipment network data...</p>
            </div>
          )}

          {!loading && error && (
            <div className="sn-shipment-state sn-shipment-error">
              <div className="sn-state-symbol">!</div>
              <h3>Unable to load shipments</h3>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  fetchShipments();
                }}
              >
                Retry Loading
              </button>
            </div>
          )}

          {!loading && !error && filteredShipments.length === 0 && (
            <div className="sn-shipment-state">
              <div className="sn-state-symbol">—</div>
              <h3>
                {shipments.length === 0
                  ? 'No shipments available'
                  : 'No matching shipments found'}
              </h3>
              <p>
                {shipments.length === 0
                  ? 'Customer shipments will appear here after booking.'
                  : 'Try searching with another tracking ID, customer name or pincode.'}
              </p>
            </div>
          )}

          {!loading && !error && filteredShipments.length > 0 && (
            <div className="sn-shipment-table-scroll">
              <table className="sn-shipment-table">
                <thead>
                  <tr>
                    <th>Docket Number</th>
                    <th>Tracking ID</th>
                    <th>Customer</th>
                    <th>Pickup PIN</th>
                    <th>Delivery PIN</th>
                    <th>Courier Partner</th>
                    <th>Weight</th>
                    <th>Charge</th>
                    <th>Booking Date</th>
                    <th>Processing Date</th>
                    <th>Status Control</th>
                    
                  </tr>
                </thead>

                <tbody>
                  {filteredShipments.map(shipment => (
                    <tr key={shipment.id}>
                      <td>
                        <strong className="sn-docket-number">
                          {shipment.docketNumber || 'Not generated'}
                        </strong>
                      </td>

                      <td>
                        <strong className="sn-tracking-number">
                          {shipment.trackingId || '—'}
                        </strong>
                      </td>

                      <td>
                        <div className="sn-customer-cell">
                          <span className="sn-customer-initial">
                            {(shipment.customer?.name || 'C').charAt(0).toUpperCase()}
                          </span>
                          <span>{shipment.customer?.name || '—'}</span>
                        </div>
                      </td>

                      <td>{shipment.pickupPincode || '—'}</td>
<td>{shipment.deliveryPincode || '—'}</td>
<td>
  <strong className="sn-courier-partner">
    {shipment.courierPartner || 'Not assigned'}
  </strong>
</td>
<td>
  {((Number(shipment.weightGrams) || 0) / 1000).toFixed(2)} kg
</td>
                      <td className="sn-shipment-charge">
                        {formatCurrency(shipment.shippingCharge)}
                      </td>
                      <td>{formatDate(shipment.createdAt)}</td>
                      <td>{formatDate(shipment.processingDate)}</td>

                      <td>
                        <div className="sn-status-control">
                          <select
                            className={`sn-status-select sn-status-${(shipment.status || 'pending').toLowerCase()}`}
                            value={shipment.status}
                            disabled={updatingId === shipment.id}
                            onChange={event =>
                              updateShipmentStatus(shipment, event.target.value)
                            }
                          >
                            {shipmentStatuses.map(status => (
                              <option key={status} value={status}>
                                {formatStatus(status)}
                              </option>
                            ))}
                          </select>

                          {updatingId === shipment.id && (
                            <small className="sn-updating-label">Updating...</small>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="sn-shipment-panel-footer">
            <span>SHIPNEXT · SHIPMENT OPERATIONS</span>
            <span>Live records from your shipment database</span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminShipments;
