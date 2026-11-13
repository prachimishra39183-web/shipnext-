
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API = 'http://localhost:5000/api';

const MODES = [
  { value: 'EXPRESS_AIR', label: 'Express Air' },
  { value: 'NORMAL_AIR', label: 'Normal Air' },
  { value: 'EXPRESS_SURFACE', label: 'Express Surface' },
  { value: 'NORMAL_SURFACE', label: 'Normal Surface' },
];

function AdminServiceability() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    pickupPincode: '',
    deliveryPincode: '',
    mode: 'EXPRESS_AIR',
    priority: 1,
  });

  const token = sessionStorage.getItem('shipnextToken');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const fetchRoutes = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${API}/serviceability/admin/routes`,
        { headers: authHeaders }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load routes.');
      }

      setRoutes(data.routes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === 'priority' ? value : value,
    }));
  };

  const addRoute = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!/^\d{6}$/.test(form.pickupPincode)) {
      setError('Enter a valid six-digit pickup PIN code.');
      return;
    }

    if (!/^\d{6}$/.test(form.deliveryPincode)) {
      setError('Enter a valid six-digit delivery PIN code.');
      return;
    }

    if (!Number.isInteger(Number(form.priority)) || Number(form.priority) < 1) {
      setError('Priority must be a positive whole number.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API}/serviceability/admin/routes`,
        {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            ...form,
            priority: Number(form.priority),
            isActive: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to add route.');
      }

      setSuccess('Shipping mode added successfully.');

      setForm((previous) => ({
        ...previous,
        priority: 1,
      }));

      await fetchRoutes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateRoute = async (id, changes) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API}/serviceability/admin/routes/${id}`,
        {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify(changes),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update route.');
      }

      setSuccess('Route updated successfully.');
      await fetchRoutes();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteRoute = async (id) => {
    if (!window.confirm('Remove this shipping mode from the route?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API}/serviceability/admin/routes/${id}`,
        {
          method: 'DELETE',
          headers: authHeaders,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete route.');
      }

      setSuccess('Shipping mode removed successfully.');
      await fetchRoutes();
    } catch (err) {
      setError(err.message);
    }
  };

  const getModeLabel = (value) => {
    return MODES.find((mode) => mode.value === value)?.label || value;
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
        <Link to="/admin/enquiries">📩 Enquiries</Link>
        <Link to="/admin/support">🎧 Support Tickets</Link>
        <Link to="/admin/serviceability" className="admin-active">
          📍 Serviceability
        </Link>
        <Link to="/">🌐 View Website</Link>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>PIN Serviceability Management</h1>
            <p>
              Configure shipping modes and automatic route allocation.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchRoutes}
            disabled={loading}
          >
            {loading ? 'Loading...' : '↻ Refresh'}
          </button>
        </header>

        {error && (
          <div className="admin-error">{error}</div>
        )}

        {success && (
          <div className="admin-success">{success}</div>
        )}

        <section className="admin-stats">
          <div className="admin-stat-card">
            <span>Total Configurations</span>
            <h2>{routes.length}</h2>
          </div>

          <div className="admin-stat-card">
            <span>Active Modes</span>
            <h2>{routes.filter((route) => route.isActive).length}</h2>
          </div>

          <div className="admin-stat-card">
            <span>Inactive Modes</span>
            <h2>{routes.filter((route) => !route.isActive).length}</h2>
          </div>
        </section>

        <section className="admin-content-card">
          <h2>Add Shipping Mode to Route</h2>

          <p>
            Add one of the four shipping modes for a pickup and delivery
            PIN combination.
          </p>

          <form onSubmit={addRoute}>
            <div className="admin-serviceability-form">
              <div>
                <label>Pickup PIN Code</label>
                <input
                  name="pickupPincode"
                  value={form.pickupPincode}
                  onChange={handleChange}
                  placeholder="e.g. 110001"
                  maxLength={6}
                  inputMode="numeric"
                  required
                />
              </div>

              <div>
                <label>Delivery PIN Code</label>
                <input
                  name="deliveryPincode"
                  value={form.deliveryPincode}
                  onChange={handleChange}
                  placeholder="e.g. 400001"
                  maxLength={6}
                  inputMode="numeric"
                  required
                />
              </div>

              <div>
                <label>Shipping Mode</label>
                <select
                  name="mode"
                  value={form.mode}
                  onChange={handleChange}
                >
                  {MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Allocation Priority</label>
                <input
                  type="number"
                  name="priority"
                  min="1"
                  step="1"
                  value={form.priority}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={saving}>
              {saving ? 'Adding...' : '+ Add Shipping Mode'}
            </button>
          </form>
        </section>

        <section className="admin-content-card">
          <h2>Configured PIN Routes</h2>

          {loading ? (
            <div className="admin-empty">
              Loading serviceability routes...
            </div>
          ) : routes.length === 0 ? (
            <div className="admin-empty">
              <span>📍</span>
              <h3>No routes configured</h3>
              <p>
                Add verified PIN combinations and their available modes
                using the form above.
              </p>
            </div>
          ) : (
            <div className="admin-serviceability-list">
              {routes.map((route) => (
                <article
                  className="admin-serviceability-card"
                  key={route.id}
                >
                  <div>
                    <h3>
                      {route.pickupPincode} → {route.deliveryPincode}
                    </h3>

                    <p>
                      <strong>{getModeLabel(route.mode)}</strong>
                    </p>

                    <p>Priority: {route.priority}</p>

                    <span className={
                      route.isActive
                        ? 'serviceability-active'
                        : 'serviceability-inactive'
                    }>
                      {route.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="admin-serviceability-actions">
                    <label>Priority</label>
                    <input
                      type="number"
                      min="1"
                      defaultValue={route.priority}
                      key={`${route.id}-${route.priority}`}
                      onBlur={(event) => {
                        const value = Number(event.target.value);

                        if (
                          Number.isInteger(value) &&
                          value >= 1 &&
                          value !== route.priority
                        ) {
                          updateRoute(route.id, { priority: value });
                        } else {
                          event.target.value = route.priority;
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        updateRoute(route.id, {
                          isActive: !route.isActive,
                        })
                      }
                    >
                      {route.isActive ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteRoute(route.id)}
                    >
                      Delete
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

export default AdminServiceability;
