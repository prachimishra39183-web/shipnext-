
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
import './AdminCustomers.css';

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = sessionStorage.getItem('shipnextToken');

        const response = await fetch(`${API_URL}/api/admin/customers`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

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

  useEffect(() => {
    return () => {
      if (selectedDocument?.url) {
        URL.revokeObjectURL(selectedDocument.url);
      }
    };
  }, [selectedDocument?.url]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return customers;

    return customers.filter((customer) =>
      (customer.name || '').toLowerCase().includes(query) ||
      (customer.email || '').toLowerCase().includes(query) ||
      (customer.phone || '').toLowerCase().includes(query)
    );
  }, [customers, search]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(Number(amount || 0));

  const viewKycDocument = async (customer, documentType) => {
    setDocumentLoading(true);
    setDocumentError('');

    try {
      const token = sessionStorage.getItem('shipnextToken');

      const response = await fetch(
        `${API_URL}/api/admin/customers/${customer.id}/documents/${documentType}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        let message = 'Unable to load document.';
        try {
          const data = await response.json();
          message = data.message || message;
        } catch {
          // Keep the fallback message if the response is not JSON.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const documentUrl = URL.createObjectURL(blob);

      setSelectedDocument({
        url: documentUrl,
        name: customer.name,
        type: documentType
      });
    } catch (err) {
      setDocumentError(err.message || 'Unable to load document.');
    } finally {
      setDocumentLoading(false);
    }
  };

  const closeDocumentViewer = () => {
    setSelectedDocument(null);
  };

  const documentTypes = [
    { type: 'AADHAAR', label: 'Aadhaar' },
    { type: 'PAN', label: 'PAN' },
    { type: 'CANCELLED_CHEQUE', label: 'Cancelled Cheque' }
  ];

  const totalActive = customers.filter((customer) => customer.isActive).length;

  return (
    <div className="admin-layout sn-customers-page">
      <aside className="admin-sidebar sn-customers-sidebar">
       

        <div className="sn-sidebar-caption">ADMINISTRATION</div>

        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/customers" className="admin-active">
          Customers
        </Link>
        <Link to="/admin/shipments">Shipments</Link>
        <Link to="/admin/bookings">Bookings</Link>
        <Link to="/admin/wallet">Wallet Management</Link>
        <Link to="/admin/enquiries">Enquiries</Link>
        <Link to="/admin/support">Support Tickets</Link>
        <Link to="/admin/child-accounts">Child Accounts</Link>
        <Link to="/admin/reports">Reports</Link>

        <div className="sn-sidebar-bottom">
          <Link to="/">View Website</Link>
        </div>
      </aside>

      <main className="admin-main sn-customers-main">
        <header className="admin-header sn-customers-heading">
          <div>
            <span className="sn-eyebrow">SHIPNEXT / MANAGEMENT</span>
            <h1>Customer Management</h1>
            <p>Manage registered customers and verify their KYC documents.</p>
          </div>

          <div className="sn-customer-heading-tag">
            CUSTOMER DATABASE
          </div>
        </header>

        <div className="sn-customers-content">
          <section className="sn-customer-overview">
            <div className="sn-customer-overview-copy">
              <span className="sn-eyebrow">CUSTOMER OVERVIEW</span>
              <h2>Registered customers</h2>
              <p>Monitor customer accounts, contact details and verification records.</p>
            </div>

            <div className="sn-customer-metrics">
              <div className="sn-customer-metric">
                <span>Total customers</span>
                <strong>{customers.length}</strong>
              </div>
              <div className="sn-customer-metric">
                <span>Active accounts</span>
                <strong>{totalActive}</strong>
              </div>
              <div className="sn-customer-metric">
                <span>Inactive accounts</span>
                <strong>{customers.length - totalActive}</strong>
              </div>
            </div>
          </section>

          <section className="sn-customer-table-panel">
            <div className="sn-customer-table-heading">
              <div>
                <span className="sn-eyebrow">ACCOUNT DIRECTORY</span>
                <h2>All Customers</h2>
                <p>
                  Showing {filteredCustomers.length} of {customers.length} customer accounts
                </p>
              </div>

              <div className="sn-customer-search">
                <span className="sn-search-symbol">⌕</span>
                <input
                  type="search"
                  placeholder="Search name, email or mobile..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search customers"
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')}>
                    Clear
                  </button>
                )}
              </div>
            </div>

            {loading && (
              <div className="sn-customer-state">
                <div className="sn-customer-loader" />
                <h3>Loading customer records</h3>
                <p>Please wait while the customer database is retrieved.</p>
              </div>
            )}

            {!loading && error && (
              <div className="sn-customer-state sn-customer-error">
                <h3>Unable to load customers</h3>
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && filteredCustomers.length === 0 && (
              <div className="sn-customer-state">
                <div className="sn-customer-empty-mark">01</div>
                <h3>
                  {customers.length === 0
                    ? 'No customers registered yet'
                    : 'No matching customers found'}
                </h3>
                <p>
                  {customers.length === 0
                    ? 'New registered customers will appear here.'
                    : 'Try another name, email address or mobile number.'}
                </p>
              </div>
            )}

            {!loading && !error && filteredCustomers.length > 0 && (
              <div className="sn-customer-table-scroll">
                <table className="sn-customer-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Contact Details</th>
                      <th>Wallet Balance</th>
                      <th>Account Status</th>
                      <th>Joined Date</th>
                      <th>KYC Documents</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id}>
                       <td>
  <div className="sn-customer-identity">
    <div className="sn-customer-insight-actions">
      <Link
        to={`/admin/customer-analytics?customerId=${encodeURIComponent(customer.id)}`}
        className="sn-customer-icon-btn"
        title="Customer Analytics"
      >
        <span>▥</span>
      </Link>

      <Link
        to={`/admin/customer-history?customerId=${encodeURIComponent(customer.id)}`}
        className="sn-customer-icon-btn"
        title="Customer Delivery History"
      >
        <span>↗</span>
      </Link>
    </div>

    <div className="sn-customer-avatar">
      {(customer.name || 'C').trim().charAt(0).toUpperCase()}
    </div>

    <div>
      <strong>{customer.name || 'Unnamed customer'}</strong>
      <span>Customer account</span>
    </div>
  </div>
</td>
                        <td>
                          <div className="sn-customer-contact">
                            <strong>{customer.email || 'No email'}</strong>
                            <span>{customer.phone || 'No mobile number'}</span>
                          </div>
                        </td>

                        <td>
                          <strong className="sn-customer-balance">
                            {formatCurrency(customer.wallet?.balance)}
                          </strong>
                        </td>

                        <td>
                          <span className={`sn-account-status ${customer.isActive ? 'is-active' : 'is-inactive'}`}>
                            <span />
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td>
                          <span className="sn-customer-date">
                            {customer.createdAt
                              ? new Date(customer.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : '—'}
                          </span>
                        </td>

                        <td>
                          <div className="sn-kyc-list">
                            {documentTypes.map(({ type, label }) => {
                              const uploaded = customer.customerDocuments?.some(
                                (doc) => doc.documentType === type
                              );

                              return (
                                <button
                                  key={type}
                                  type="button"
                                  className={`sn-kyc-button ${uploaded ? 'is-uploaded' : 'is-missing'}`}
                                  disabled={!uploaded || documentLoading}
                                  onClick={() => viewKycDocument(customer, type)}
                                >
                                  <span className="sn-kyc-indicator" />
                                  {label}
                                  <span className="sn-kyc-action">
                                    {uploaded ? 'View' : 'Missing'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {documentLoading && (
            <div className="sn-document-loading">
              <div className="sn-customer-loader" />
              Loading secure customer document...
            </div>
          )}

          {documentError && (
            <div className="sn-document-error">
              <span>{documentError}</span>
              <button type="button" onClick={() => setDocumentError('')}>
                Dismiss
              </button>
            </div>
          )}
        </div>
      </main>

      {selectedDocument && (
        <div
          className="sn-document-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDocumentViewer();
          }}
        >
          <section
            className="sn-document-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Customer KYC document"
          >
            <header className="sn-document-modal-header">
              <div>
                <span className="sn-eyebrow">SECURE DOCUMENT VIEWER</span>
                <h2>{selectedDocument.name}</h2>
                <p>{selectedDocument.type.replaceAll('_', ' ')}</p>
              </div>

              <button
                type="button"
                className="sn-document-close"
                onClick={closeDocumentViewer}
                aria-label="Close document viewer"
              >
                ×
              </button>
            </header>

            <iframe
              src={selectedDocument.url}
              title="Customer KYC Document"
              className="sn-document-frame"
            />
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminCustomers;
