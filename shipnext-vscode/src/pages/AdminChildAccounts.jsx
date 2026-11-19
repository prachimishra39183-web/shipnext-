
import { useEffect, useMemo, useState } from 'react';
import API_URL from '../config/api';
import './AdminChildAccounts.css';

const EMPTY_FORM = {
  parentId: '',
  accountName: '',
  branchName: '',
  branchCode: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  dailyShipmentLimit: '',
  dailyWalletLimit: '',
};

function AdminChildAccounts() {
  const [children, setChildren] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const token = sessionStorage.getItem('shipnextToken');

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [childResponse, customerResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/child-accounts`, { headers }),
        fetch(`${API_URL}/api/admin/customers`, { headers }),
      ]);

      const childData = await childResponse.json();
      const customerData = await customerResponse.json();

      if (!childResponse.ok || !childData.success) {
        throw new Error(childData.message || 'Unable to load child accounts.');
      }

      if (!customerResponse.ok || !customerData.success) {
        throw new Error(customerData.message || 'Unable to load parent accounts.');
      }

      setChildren(childData.children || []);
      setCustomers(customerData.customers || []);
    } catch (err) {
      setError(err.message || 'Unable to connect to ShipNext.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => ({
    total: children.length,
    active: children.filter(item => item.status === 'ACTIVE').length,
    inactive: children.filter(item => item.status === 'INACTIVE').length,
    suspended: children.filter(item => item.status === 'SUSPENDED').length,
  }), [children]);

  const filteredChildren = useMemo(() => {
    const term = search.toLowerCase().trim();

    return children.filter(item => {
      const matchesSearch = [
        item.accountName,
        item.branchName,
        item.branchCode,
        item.contactPerson,
        item.email,
        item.city,
        item.parent?.name,
        item.parent?.email,
      ].some(value => String(value || '').toLowerCase().includes(term));

      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [children, search, statusFilter]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm(previous => ({ ...previous, [name]: value }));
  };

  const createChild = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch(`${API_URL}/api/admin/child-accounts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not create child account.');
      }

      setShowModal(false);
      setForm(EMPTY_FORM);
      setNotice('Child account created successfully. It is currently inactive.');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (child, status) => {
    const action = status === 'ACTIVE'
      ? 'activate'
      : status === 'SUSPENDED'
        ? 'suspend'
        : 'deactivate';

    if (!window.confirm(`Are you sure you want to ${action} ${child.branchName}?`)) {
      return;
    }

    setUpdatingId(child.id);
    setError('');
    setNotice('');

    try {
      const response = await fetch(
        `${API_URL}/api/admin/child-accounts/${child.id}/status`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to update account status.');
      }

      setChildren(previous =>
        previous.map(item => item.id === child.id ? data.child : item)
      );
      setNotice(`${child.branchName} is now ${status.toLowerCase()}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId('');
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <main className="child-page">
      <section className="child-hero">
        <div className="child-hero-content">
          <div className="child-eyebrow">
            <span className="child-eyebrow-dot" />
            SHIPNEXT CONTROL CENTRE
          </div>

          <h1>
            Child Account <span>Management</span>
          </h1>

          <p>
            Manage merchant branches, monitor account access and control
            your ShipNext branch network from one place.
          </p>

          <button
            className="child-create-btn"
            onClick={() => {
              setError('');
              setShowModal(true);
            }}
          >
            <span>＋</span> Create Child Account
          </button>
        </div>

        <div className="child-hero-art" aria-hidden="true">
          <div className="child-orbit orbit-one" />
          <div className="child-orbit orbit-two" />
          <div className="child-orbit orbit-three" />
          <div className="child-art-core">SN</div>
          <div className="child-art-tag tag-top">BRANCH NETWORK</div>
          <div className="child-art-tag tag-bottom">ONE CENTRAL PLATFORM</div>
        </div>
      </section>

      {error && <div className="child-alert error-alert">{error}</div>}
      {notice && <div className="child-alert success-alert">{notice}</div>}

      <section className="child-stats">
        <div className="child-stat-card">
          <div className="stat-icon total-icon">▦</div>
          <div>
            <span>Total branches</span>
            <strong>{stats.total}</strong>
            <small>Registered child accounts</small>
          </div>
          <div className="stat-decoration">01</div>
        </div>

        <div className="child-stat-card">
          <div className="stat-icon active-icon">✓</div>
          <div>
            <span>Active branches</span>
            <strong>{stats.active}</strong>
            <small>Currently marked active</small>
          </div>
          <div className="stat-decoration">02</div>
        </div>

        <div className="child-stat-card">
          <div className="stat-icon inactive-icon">Ⅱ</div>
          <div>
            <span>Inactive branches</span>
            <strong>{stats.inactive}</strong>
            <small>Awaiting activation</small>
          </div>
          <div className="stat-decoration">03</div>
        </div>

        <div className="child-stat-card">
          <div className="stat-icon suspended-icon">!</div>
          <div>
            <span>Suspended branches</span>
            <strong>{stats.suspended}</strong>
            <small>Access status suspended</small>
          </div>
          <div className="stat-decoration">04</div>
        </div>
      </section>

      <section className="child-directory">
        <div className="child-directory-heading">
          <div>
            <span className="section-kicker">NETWORK DIRECTORY</span>
            <h2>Branch accounts</h2>
            <p>View and manage all registered merchant branches.</p>
          </div>

          <div className="child-total-pill">
            {filteredChildren.length} <span>RESULTS</span>
          </div>
        </div>

        <div className="child-toolbar">
          <div className="child-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search branch, parent, code or city..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            className="child-filter"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          <button className="child-refresh" onClick={loadData} title="Refresh">
            ↻
          </button>
        </div>

        {loading ? (
          <div className="child-empty">
            <div className="child-loader" />
            <strong>Loading branch network</strong>
            <span>Connecting to ShipNext records...</span>
          </div>
        ) : filteredChildren.length === 0 ? (
          <div className="child-empty">
            <div className="empty-symbol">⌂</div>
            <strong>No child accounts found</strong>
            <span>
              {children.length === 0
                ? 'Create your first child account to start building the branch network.'
                : 'Try changing your search or status filter.'}
            </span>
            {children.length === 0 && (
              <button onClick={() => setShowModal(true)}>
                Create first branch
              </button>
            )}
          </div>
        ) : (
          <div className="child-table-wrap">
            <table className="child-table">
              <thead>
                <tr>
                  <th>BRANCH DETAILS</th>
                  <th>PARENT MERCHANT</th>
                  <th>LOCATION</th>
                  <th>CREATED</th>
                  <th>STATUS</th>
                  <th>ACCOUNT CONTROL</th>
                </tr>
              </thead>

              <tbody>
                {filteredChildren.map(child => (
                  <tr key={child.id}>
                    <td>
                      <div className="branch-identity">
                        <div className="branch-avatar">
                          {(child.branchName || 'B').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <strong>{child.branchName}</strong>
                          <span>{child.accountName}</span>
                          <small>CODE: {child.branchCode}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="parent-identity">
                        <strong>{child.parent?.name || '—'}</strong>
                        <span>{child.parent?.email || '—'}</span>
                      </div>
                    </td>

                    <td>
                      <div className="location-identity">
                        <strong>{child.city}, {child.state}</strong>
                        <span>PIN {child.pincode}</span>
                      </div>
                    </td>

                    <td className="date-cell">{formatDate(child.createdAt)}</td>

                    <td>
                      <span className={`child-status status-${child.status?.toLowerCase()}`}>
                        <i />
                        {child.status}
                      </span>
                    </td>

                    <td>
                      <div className="child-actions">
                        <select
                          value={child.status}
                          disabled={updatingId === child.id}
                          onChange={event => changeStatus(child, event.target.value)}
                          aria-label={`Change status for ${child.branchName}`}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="SUSPENDED">Suspended</option>
                        </select>
                        {updatingId === child.id && <span className="updating-text">Saving...</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <div className="child-modal-backdrop" onMouseDown={event => {
          if (event.target === event.currentTarget) setShowModal(false);
        }}>
          <section className="child-modal">
            <div className="child-modal-header">
              <div>
                <span className="section-kicker">NEW BRANCH REGISTRATION</span>
                <h2>Create child account</h2>
                <p>Add a branch under an existing parent merchant.</p>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <form onSubmit={createChild}>
              <div className="modal-section-title">01 / Parent merchant</div>
              <div className="child-form-grid">
                <label className="full-field">
                  Parent customer account *
                  <select
                    name="parentId"
                    value={form.parentId}
                    onChange={updateForm}
                    required
                  >
                    <option value="">Select parent merchant</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} — {customer.email}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="modal-section-title">02 / Branch identity</div>
              <div className="child-form-grid">
                <label>
                  Account name *
                  <input name="accountName" value={form.accountName} onChange={updateForm} required />
                </label>
                <label>
                  Branch / business name *
                  <input name="branchName" value={form.branchName} onChange={updateForm} required />
                </label>
                <label>
                  Branch code *
                  <input name="branchCode" value={form.branchCode} onChange={updateForm} required />
                </label>
                <label>
                  Contact person *
                  <input name="contactPerson" value={form.contactPerson} onChange={updateForm} required />
                </label>
              </div>

              <div className="modal-section-title">03 / Contact & address</div>
              <div className="child-form-grid">
                <label>
                  Email address *
                  <input type="email" name="email" value={form.email} onChange={updateForm} required />
                </label>
                <label>
                  Mobile number *
                  <input name="phone" value={form.phone} onChange={updateForm} required />
                </label>
                <label className="full-field">
                  Full address *
                  <input name="address" value={form.address} onChange={updateForm} required />
                </label>
                <label>
                  City *
                  <input name="city" value={form.city} onChange={updateForm} required />
                </label>
                <label>
                  State *
                  <input name="state" value={form.state} onChange={updateForm} required />
                </label>
                <label>
                  PIN code *
                  <input name="pincode" value={form.pincode} onChange={updateForm} required maxLength={6} />
                </label>
              </div>

              <div className="modal-section-title">04 / Optional operating limits</div>
              <div className="child-form-grid">
                <label>
                  Daily shipment limit
                  <input type="number" min="1" name="dailyShipmentLimit" value={form.dailyShipmentLimit} onChange={updateForm} placeholder="No limit" />
                </label>
                <label>
                  Daily wallet limit (₹)
                  <input type="number" min="0" step="0.01" name="dailyWalletLimit" value={form.dailyWalletLimit} onChange={updateForm} placeholder="No limit" />
                </label>
              </div>

              <div className="child-modal-note">
                <span>ⓘ</span>
                New branches are created as <strong>INACTIVE</strong>.
                Activate them when setup is complete.
              </div>

              {error && <div className="child-alert error-alert">{error}</div>}

              <div className="child-modal-footer">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="child-submit" disabled={saving}>
                  {saving ? 'Creating...' : 'Create child account →'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default AdminChildAccounts;
