
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Building2,
  MapPin,
  Users,
  Search,
  ChevronDown,
  Power,
  X,
  GitBranch,
} from 'lucide-react';
import API_URL from '../config/api';
import './CustomerChildAccounts.css';

const initialForm = {
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

function CustomerChildAccounts() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const token = sessionStorage.getItem('shipnextToken');

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const loadChildren = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_URL}/api/child-accounts`,
        { headers }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load branches.');
      }

      setChildren(data.children || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  const stats = useMemo(() => ({
    total: children.length,
    active: children.filter(c => c.status === 'ACTIVE').length,
    inactive: children.filter(c => c.status === 'INACTIVE').length,
    suspended: children.filter(c => c.status === 'SUSPENDED').length,
  }), [children]);

  const filteredChildren = children.filter(child => {
    const term = search.toLowerCase();

    const matchesSearch = [
      child.accountName,
      child.branchName,
      child.branchCode,
      child.contactPerson,
      child.city,
    ].some(value => value?.toLowerCase().includes(term));

    const matchesFilter =
      filter === 'ALL' || child.status === filter;

    return matchesSearch && matchesFilter;
  });

  const updateForm = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const createChild = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setNotice('');

      const response = await fetch(
        `${API_URL}/api/child-accounts`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to create branch.');
      }

      setNotice('Your new branch has been created successfully.');
      setShowModal(false);
      setForm(initialForm);
      await loadChildren();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (child) => {
    const nextStatus =
      child.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    if (!window.confirm(
      `Change ${child.branchName} to ${nextStatus}?`
    )) return;

    try {
      setError('');
      setNotice('');

      const response = await fetch(
        `${API_URL}/api/child-accounts/${child.id}/status`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update branch.');
      }

      setNotice(`Branch ${nextStatus.toLowerCase()} successfully.`);
      await loadChildren();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="child-page">

      <header className="child-page-header">
        <div className="child-brand">
          <Link to="/dashboard" className="child-back">
            <ArrowLeft size={17} /> Dashboard
          </Link>
          <div className="child-brand-title">
            <GitBranch size={23} />
            <span>SHIPNEXT <b>BRANCH NETWORK</b></span>
          </div>
        </div>

        <button
          className="child-add-button"
          onClick={() => {
            setForm(initialForm);
            setShowModal(true);
          }}
        >
          <Plus size={18} /> Add New Branch
        </button>
      </header>

      <main className="child-page-content">

        <section className="child-hero">
          <div>
            <span className="child-eyebrow">
              PARENT MERCHANT CONTROL CENTRE
            </span>
            <h1>Manage Your Branch Network</h1>
            <p>
              Manage your business branches, monitor their status
              and keep your shipping operations connected.
            </p>
          </div>

          <div className="child-hero-art">
            <Building2 size={76} strokeWidth={1.1} />
            <span className="child-orbit orbit-one" />
            <span className="child-orbit orbit-two" />
          </div>
        </section>

        {notice && (
          <div className="child-notice">{notice}</div>
        )}

        {error && (
          <div className="child-error">{error}</div>
        )}

        <section className="child-stats">

          <div className="child-stat-card">
            <div className="child-stat-icon orange">
              <GitBranch size={21} />
            </div>
            <div>
              <span>Total Branches</span>
              <h2>{stats.total}</h2>
              <small>Your registered branches</small>
            </div>
          </div>

          <div className="child-stat-card">
            <div className="child-stat-icon green">
              <Power size={21} />
            </div>
            <div>
              <span>Active Branches</span>
              <h2>{stats.active}</h2>
              <small>Currently activated</small>
            </div>
          </div>

          <div className="child-stat-card">
            <div className="child-stat-icon grey">
              <Building2 size={21} />
            </div>
            <div>
              <span>Inactive Branches</span>
              <h2>{stats.inactive}</h2>
              <small>Awaiting activation</small>
            </div>
          </div>

          <div className="child-stat-card">
            <div className="child-stat-icon red">
              <Users size={21} />
            </div>
            <div>
              <span>Suspended</span>
              <h2>{stats.suspended}</h2>
              <small>Restricted branches</small>
            </div>
          </div>

        </section>

        <section className="child-directory">

          <div className="child-directory-heading">
            <div>
              <h2>Branch Directory</h2>
              <p>All branches connected to your parent account.</p>
            </div>
            <span className="child-record-count">
              {filteredChildren.length} Branches
            </span>
          </div>

          <div className="child-toolbar">
            <div className="child-search">
              <Search size={18} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search branch, code or city..."
              />
            </div>

            <div className="child-filter">
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
              <ChevronDown size={16} />
            </div>
          </div>

          {loading ? (
            <div className="child-empty">
              Loading your branch network...
            </div>
          ) : filteredChildren.length === 0 ? (
            <div className="child-empty">
              <Building2 size={42} />
              <h3>No branches found</h3>
              <p>
                {children.length === 0
                  ? 'Create your first branch to expand your ShipNext network.'
                  : 'Try changing your search or status filter.'}
              </p>
              {children.length === 0 && (
                <button
                  className="child-add-button"
                  onClick={() => setShowModal(true)}
                >
                  <Plus size={17} /> Create Your First Branch
                </button>
              )}
            </div>
          ) : (
            <div className="child-table-wrap">
              <table className="child-table">
                <thead>
                  <tr>
                    <th>BRANCH DETAILS</th>
                    <th>BRANCH CODE</th>
                    <th>CONTACT</th>
                    <th>LOCATION</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredChildren.map(child => (
                    <tr key={child.id}>
                      <td>
                        <strong>{child.branchName}</strong>
                        <small>{child.accountName}</small>
                      </td>
                      <td>
                        <span className="child-code">
                          {child.branchCode}
                        </span>
                      </td>
                      <td>
                        <strong>{child.contactPerson}</strong>
                        <small>{child.phone}</small>
                      </td>
                      <td>
                        <span className="child-location">
                          <MapPin size={14} />
                          {child.city}, {child.state}
                        </span>
                      </td>
                      <td>
                        <span className={`child-status ${child.status?.toLowerCase()}`}>
                          {child.status}
                        </span>
                      </td>
                      <td>
                        {child.status !== 'SUSPENDED' && (
                          <button
                            className="child-status-button"
                            onClick={() => changeStatus(child)}
                          >
                            {child.status === 'ACTIVE'
                              ? 'Deactivate'
                              : 'Activate'}
                          </button>
                        )}
                        {child.status === 'SUSPENDED' && (
                          <span className="child-restricted">
                            Restricted by admin
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </section>

        <footer className="child-footer">
          © {new Date().getFullYear()} ShipNext. Parent Merchant Branch Management.
        </footer>

      </main>

      {showModal && (
        <div
          className="child-modal-overlay"
          onMouseDown={e => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="child-modal">

            <div className="child-modal-heading">
              <div>
                <span>EXPAND YOUR NETWORK</span>
                <h2>Create New Branch</h2>
                <p>Enter your new branch information below.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="child-modal-close"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={createChild}>

              <div className="child-form-grid">

                <label>
                  Account Name *
                  <input
                    name="accountName"
                    value={form.accountName}
                    onChange={updateForm}
                    placeholder="Your business account"
                    required
                  />
                </label>

                <label>
                  Branch Name *
                  <input
                    name="branchName"
                    value={form.branchName}
                    onChange={updateForm}
                    placeholder="Mumbai Main Branch"
                    required
                  />
                </label>

                <label>
                  Branch Code *
                  <input
                    name="branchCode"
                    value={form.branchCode}
                    onChange={updateForm}
                    placeholder="MUM001"
                    required
                  />
                </label>

                <label>
                  Contact Person *
                  <input
                    name="contactPerson"
                    value={form.contactPerson}
                    onChange={updateForm}
                    placeholder="Full name"
                    required
                  />
                </label>

                <label>
                  Branch Email *
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={updateForm}
                    placeholder="branch@example.com"
                    required
                  />
                </label>

                <label>
                  Mobile Number *
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={updateForm}
                    placeholder="Mobile number"
                    required
                  />
                </label>

                <label className="child-full-field">
                  Address *
                  <input
                    name="address"
                    value={form.address}
                    onChange={updateForm}
                    placeholder="Complete branch address"
                    required
                  />
                </label>

                <label>
                  City *
                  <input
                    name="city"
                    value={form.city}
                    onChange={updateForm}
                    placeholder="City"
                    required
                  />
                </label>

                <label>
                  State *
                  <input
                    name="state"
                    value={form.state}
                    onChange={updateForm}
                    placeholder="State"
                    required
                  />
                </label>

                <label>
                  PIN Code *
                  <input
                    name="pincode"
                    value={form.pincode}
                    onChange={updateForm}
                    placeholder="6-digit PIN code"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                  />
                </label>

                <label>
                  Daily Shipment Limit
                  <input
                    type="number"
                    min="1"
                    name="dailyShipmentLimit"
                    value={form.dailyShipmentLimit}
                    onChange={updateForm}
                    placeholder="Optional"
                  />
                </label>

                <label className="child-full-field">
                  Daily Wallet Limit (₹)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="dailyWalletLimit"
                    value={form.dailyWalletLimit}
                    onChange={updateForm}
                    placeholder="Optional"
                  />
                </label>

              </div>

              <div className="child-modal-note">
                New branches are created as INACTIVE. You can activate
                them after reviewing their details.
              </div>

              <div className="child-modal-actions">
                <button
                  type="button"
                  className="child-cancel-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="child-add-button"
                  disabled={saving}
                >
                  {saving ? 'Creating...' : 'Create Branch'}
                  {!saving && <Plus size={17} />}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default CustomerChildAccounts;
