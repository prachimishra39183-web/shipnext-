
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';

function AdminWallet() {
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [rechargeRequests, setRechargeRequests] = useState([]);

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalWalletBalance: '0.00',
    totalCredits: '0.00',
    totalDebits: '0.00',
    totalTransactions: 0,
  });

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [rechargeLoading, setRechargeLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactionError, setTransactionError] = useState('');
  const [rechargeError, setRechargeError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const token = sessionStorage.getItem('shipnextToken');

  const fetchRechargeRequests = async () => {
    setRechargeLoading(true);
    setRechargeError('');

    try {
      const response = await fetch(
        `${API_URL}/api/wallet/admin/recharge-requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to load recharge requests.'
        );
      }

      setRechargeRequests(data.requests || []);
    } catch (err) {
      setRechargeError(err.message || 'Unable to load recharge requests.');
    } finally {
      setRechargeLoading(false);
    }
  };

  const fetchWalletData = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [walletResponse, transactionResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/wallets`, { headers }),
        fetch(`${API_URL}/api/admin/wallet-transactions`, { headers }),
      ]);

      const walletData = await walletResponse.json();
      const transactionData = await transactionResponse.json();

      if (!walletResponse.ok) {
        throw new Error(
          walletData.message || 'Unable to load wallet records.'
        );
      }

      setWallets(walletData.wallets || []);
      setStats(walletData.stats || {
        totalCustomers: 0,
        totalWalletBalance: '0.00',
        totalCredits: '0.00',
        totalDebits: '0.00',
        totalTransactions: 0,
      });

      if (!transactionResponse.ok) {
        setTransactionError(
          transactionData.message || 'Unable to load transactions.'
        );
      } else {
        setTransactions(transactionData.transactions || []);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError('Please log in as an administrator.');
      setLoading(false);
      setRechargeLoading(false);
      return;
    }

    fetchWalletData();
    fetchRechargeRequests();
  }, []);

  const handleReview = async (requestId, status) => {
    const action = status === 'APPROVED' ? 'approve' : 'reject';

    if (
      !window.confirm(
        `Are you sure you want to ${action} this recharge request?`
      )
    ) {
      return;
    }

    setActionLoading(requestId);
    setActionMessage('');
    setRechargeError('');

    try {
      const response = await fetch(
        `${API_URL}/api/wallet/admin/recharge-requests/${requestId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to review request.');
      }

      setActionMessage(data.message || 'Request updated successfully.');

      await Promise.all([
        fetchRechargeRequests(),
        fetchWalletData(),
      ]);
    } catch (err) {
      setRechargeError(err.message || 'Unable to review request.');
    } finally {
      setActionLoading('');
    }
  };

  const filteredWallets = useMemo(() => {
    const query = search.toLowerCase();

    return wallets.filter((wallet) =>
      [wallet.name, wallet.email, wallet.phone || ''].some((value) =>
        String(value || '').toLowerCase().includes(query)
      )
    );
  }, [wallets, search]);

  const formatDate = (date) =>
    new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getTransactionColor = (type) => {
    if (type === 'CREDIT' || type === 'REFUND') return '#16a34a';
    if (type === 'DEBIT') return '#dc2626';
    return '#64748b';
  };

  const getTransactionSign = (type) => {
    if (type === 'CREDIT' || type === 'REFUND') return '+';
    if (type === 'DEBIT') return '-';
    return '';
  };

  const pendingCount = rechargeRequests.filter(
    (request) => request.status === 'PENDING'
  ).length;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <img
        src="/logo.png"
        alt="ShipNext Logo"
        className="logo-image"
      />
        <Link to="/admin">📊 Dashboard</Link>
        <Link to="/admin/customers">👥 Customers</Link>
        <Link to="/admin/shipments">📦 Shipments</Link>
        <Link to="/admin/bookings">🚚 Bookings</Link>
        <Link to="/admin/wallet" className="admin-active">
          💳 Wallet Management
        </Link>
        <Link to="/admin/enquiries">📩 Enquiries</Link>
        <Link to="/">🌐 View Website</Link>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Wallet Management</h1>
            <p>Monitor customer wallet balances and transactions.</p>
          </div>
        </header>

        {/* UPI RECHARGE VERIFICATION */}
        <section className="admin-content-card">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <h2>UPI Recharge Verification</h2>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                Verify customer payments before crediting their wallets.
              </p>
            </div>

            <span style={{
              background: '#fff3e8',
              color: '#c45b16',
              padding: '8px 14px',
              borderRadius: '20px',
              fontWeight: 700,
              fontSize: '13px',
            }}>
              {pendingCount} Pending Requests
            </span>
          </div>

          {actionMessage && (
            <p style={{
              padding: '12px',
              background: '#e9f8ef',
              color: '#176b37',
              borderRadius: '8px',
            }}>
              {actionMessage}
            </p>
          )}

          {rechargeError && (
            <p style={{
              padding: '12px',
              background: '#fff0f0',
              color: '#a32222',
              borderRadius: '8px',
            }}>
              {rechargeError}
            </p>
          )}

          {rechargeLoading ? (
            <div className="admin-empty">
              <p>Loading recharge requests...</p>
            </div>
          ) : rechargeRequests.length === 0 ? (
            <div className="admin-empty">
              <span>💳</span>
              <h3>No recharge requests</h3>
              <p>Customer UPI recharge requests will appear here.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
              }}>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>UPI Reference / UTR</th>
                    <th>Request Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {rechargeRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <strong>
                          {request.user?.name ||
                            request.user?.fullName ||
                            'Customer'}
                        </strong>
                        <br />
                        <small>{request.user?.email || '—'}</small>
                      </td>

                      <td>
                        <strong>
                          ₹{Number(request.amount).toFixed(2)}
                        </strong>
                      </td>

                      <td>
                        <strong>{request.upiReference}</strong>
                      </td>

                      <td>{formatDate(request.createdAt)}</td>

                      <td>
                        <span style={{
                          color:
                            request.status === 'APPROVED'
                              ? '#16803c'
                              : request.status === 'REJECTED'
                                ? '#c53030'
                                : '#b7791f',
                          fontWeight: 700,
                        }}>
                          {request.status}
                        </span>
                      </td>

                      <td>
                        {request.status === 'PENDING' ? (
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap',
                          }}>
                            <button
                              type="button"
                              disabled={!!actionLoading}
                              onClick={() =>
                                handleReview(request.id, 'APPROVED')
                              }
                              style={{
                                padding: '8px 12px',
                                background: '#16803c',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              {actionLoading === request.id
                                ? 'Please wait...'
                                : 'Approve'}
                            </button>

                            <button
                              type="button"
                              disabled={!!actionLoading}
                              onClick={() =>
                                handleReview(request.id, 'REJECTED')
                              }
                              style={{
                                padding: '8px 12px',
                                background: '#dc2626',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#64748b' }}>
                            Reviewed
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

        {/* WALLET STATISTICS */}
        <section className="admin-stats">
          <div className="admin-stat-card">
            <span>Total Wallet Balance</span>
            <h2>₹{Number(stats.totalWalletBalance).toFixed(2)}</h2>
          </div>

          <div className="admin-stat-card">
            <span>Total Credits</span>
            <h2>₹{Number(stats.totalCredits).toFixed(2)}</h2>
          </div>

          <div className="admin-stat-card">
            <span>Total Debits</span>
            <h2>₹{Number(stats.totalDebits).toFixed(2)}</h2>
          </div>

          <div className="admin-stat-card">
            <span>Transactions</span>
            <h2>{stats.totalTransactions}</h2>
          </div>
        </section>

        {/* CUSTOMER WALLETS */}
        <section className="admin-content-card">
          <h2>Customer Wallets</h2>

          <input
            type="search"
            placeholder="Search customer by name, email or phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              width: '100%',
              padding: '14px',
              border: '1px solid #dbe2ed',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          />

          {loading ? (
            <div className="admin-empty">
              <p>Loading customer wallets...</p>
            </div>
          ) : error ? (
            <div className="admin-empty">
              <h3>Unable to load wallets</h3>
              <p>{error}</p>
            </div>
          ) : filteredWallets.length === 0 ? (
            <div className="admin-empty">
              <span>💳</span>
              <h3>No wallet records found</h3>
              <p>
                {search
                  ? 'Try another search.'
                  : 'Customer wallet balances will appear here.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
              }}>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Wallet Balance</th>
                    <th>Account Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredWallets.map((wallet) => (
                    <tr key={wallet.id}>
                      <td>{wallet.name}</td>
                      <td>{wallet.email}</td>
                      <td>{wallet.phone || '—'}</td>
                      <td>₹{Number(wallet.balance).toFixed(2)}</td>
                      <td>{wallet.isActive ? 'Active' : 'Inactive'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* TRANSACTION HISTORY */}
        <section className="admin-content-card">
          <h2>Wallet Transaction History</h2>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Showing the latest {transactions.length} recorded transactions.
          </p>

          {loading ? (
            <div className="admin-empty">
              <p>Loading transactions...</p>
            </div>
          ) : transactionError ? (
            <div className="admin-empty">
              <h3>Unable to load transactions</h3>
              <p>{transactionError}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="admin-empty">
              <span>📄</span>
              <h3>No transactions yet</h3>
              <p>
                Wallet credits, debits and refunds will appear here when recorded.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
              }}>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Reference</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <strong>{transaction.customer}</strong>
                        <br />
                        <small>{transaction.email}</small>
                      </td>
                      <td>{transaction.type}</td>
                      <td style={{
                        color: getTransactionColor(transaction.type),
                        fontWeight: 600,
                      }}>
                        {getTransactionSign(transaction.type)}
                        ₹{Number(transaction.amount).toFixed(2)}
                      </td>
                      <td>{transaction.description || '—'}</td>
                      <td>{transaction.reference || '—'}</td>
                      <td>{formatDate(transaction.createdAt)}</td>
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

export default AdminWallet;
