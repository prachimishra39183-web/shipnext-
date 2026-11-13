
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = sessionStorage.getItem('shipnextToken');

        const response = await fetch(
          'http://localhost:5000/api/admin/customers',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load customers.');
        }

        setCustomers(data.customers || []);

      } catch (err) {
        setError(err.message || 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return customers;

    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      (customer.phone || '').includes(query)
    );
  }, [customers, search]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(Number(amount || 0));
  };

  return (
    <div className="admin-layout">

      <aside className="admin-sidebar">
        <h2>ShipNext <span>Admin</span></h2>

        <Link to="/admin">📊 Dashboard</Link>
        <Link to="/admin/customers" className="admin-active">👥 Customers</Link>
        <Link to="/admin/shipments">📦 Shipments</Link>
        <Link to="/admin/bookings">🚚 Bookings</Link>
        <Link to="/admin/wallet">💳 Wallet Management</Link>
        <Link to="/admin/enquiries">📩 Enquiries</Link>
        <Link to="/">🌐 View Website</Link>
      </aside>

      <main className="admin-main">

        <header className="admin-header">
          <div>
            <h1>Customer Management</h1>
            <p>Manage all ShipNext registered customers.</p>
          </div>
        </header>

        <section className="admin-content-card">

          <h2>All Customers</h2>

          <p>
            Total Registered Customers: <strong>{customers.length}</strong>
          </p>

          <input
            type="search"
            placeholder="Search by customer name, email or phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              width: '100%',
              padding: '14px',
              border: '1px solid #dbe2ed',
              borderRadius: '8px',
              marginBottom: '20px'
            }}
          />

          {loading && (
            <div className="admin-empty">
              <h3>Loading customers...</h3>
              <p>Please wait while we retrieve customer records.</p>
            </div>
          )}

          {!loading && error && (
            <div className="admin-empty">
              <h3>Unable to load customers</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && filteredCustomers.length === 0 && (
            <div className="admin-empty">
              <span>👥</span>
              <h3>
                {customers.length === 0
                  ? 'No customers registered yet'
                  : 'No matching customers found'}
              </h3>
              <p>
                {customers.length === 0
                  ? 'Registered customers will appear here.'
                  : 'Try searching with another name, email or phone.'}
              </p>
            </div>
          )}

          {!loading && !error && filteredCustomers.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left'
                }}
              >
                <thead>
                  <tr>
                    {['Customer', 'Email', 'Mobile', 'Wallet Balance', 'Status', 'Joined'].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: '14px',
                          borderBottom: '1px solid #e5eaf1',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td style={{ padding: '14px', borderBottom: '1px solid #edf0f5' }}>
                        <strong>{customer.name}</strong>
                      </td>

                      <td style={{ padding: '14px', borderBottom: '1px solid #edf0f5' }}>
                        {customer.email}
                      </td>

                      <td style={{ padding: '14px', borderBottom: '1px solid #edf0f5' }}>
                        {customer.phone || '—'}
                      </td>

                      <td style={{ padding: '14px', borderBottom: '1px solid #edf0f5', whiteSpace: 'nowrap' }}>
                        {formatCurrency(customer.wallet?.balance)}
                      </td>

                      <td style={{ padding: '14px', borderBottom: '1px solid #edf0f5' }}>
                        <span style={{
                          color: customer.isActive ? '#16834a' : '#d14343',
                          fontWeight: '600'
                        }}>
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td style={{ padding: '14px', borderBottom: '1px solid #edf0f5', whiteSpace: 'nowrap' }}>
                        {new Date(customer.createdAt).toLocaleDateString('en-IN')}
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

export default AdminCustomers;
