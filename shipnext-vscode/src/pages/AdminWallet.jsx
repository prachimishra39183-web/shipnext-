
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
import './AdminWallet.css';

function AdminWallet() {
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalWalletBalance: '0.00',
    totalCredits: '0.00',
    totalDebits: '0.00',
    totalTransactions: 0,
  });

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactionError, setTransactionError] = useState('');
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [paymentError, setPaymentError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [openingProof, setOpeningProof] = useState('');

  const token = sessionStorage.getItem('shipnextToken');

  const fetchWalletData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [walletResponse, transactionResponse, paymentResponse] =
        await Promise.all([
          fetch(`${API_URL}/api/admin/wallets`, { headers }),
          fetch(`${API_URL}/api/admin/wallet-transactions`, { headers }),
          fetch(`${API_URL}/api/admin/wallet-recharge-requests`, { headers }),
        ]);

      const walletData = await walletResponse.json();
      const transactionData = await transactionResponse.json();
      const paymentData = await paymentResponse.json();

      if (paymentResponse.ok) {
        setPaymentRequests(paymentData.requests || []);
        setPaymentError('');
      } else {
        setPaymentError(
          paymentData.message || 'Unable to load payment documents.'
        );
      }
      setPaymentLoading(false);

      if (!walletResponse.ok) {
        throw new Error(walletData.message || 'Unable to load wallet records.');
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
        setTransactionError('');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError('Please log in as an administrator.');
      setLoading(false);
      setPaymentLoading(false);
      return;
    }
    fetchWalletData();
  }, []);

  const filteredWallets = useMemo(() => {
    const query = search.toLowerCase();
    return wallets.filter((wallet) =>
      [wallet.name, wallet.email, wallet.phone || ''].some((value) =>
        String(value || '').toLowerCase().includes(query)
      )
    );
  }, [wallets, search]);

  const viewPaymentProof = async (requestId) => {
    try {
      setOpeningProof(requestId);

      const response = await fetch(
        `${API_URL}/api/admin/wallet-recharge-requests/${requestId}/proof`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Unable to open document.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');

      if (!newWindow) {
        URL.revokeObjectURL(url);
        throw new Error('Please allow pop-ups to view the document.');
      }

      newWindow.addEventListener('beforeunload', () => {
        URL.revokeObjectURL(url);
      }, { once: true });
    } catch (err) {
      alert(err.message || 'Unable to open payment document.');
    } finally {
      setOpeningProof('');
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getTransactionColor = (type) => {
    if (type === 'CREDIT' || type === 'REFUND') return 'credit';
    if (type === 'DEBIT') return 'debit';
    return 'neutral';
  };

  const getTransactionSign = (type) => {
    if (type === 'CREDIT' || type === 'REFUND') return '+';
    if (type === 'DEBIT') return '-';
    return '';
  };

  const paymentMethodLabel = (method) => {
    if (method === 'CREDIT_CARD') return 'Credit Card';
    if (method === 'DEBIT_CARD') return 'Debit Card';
    return 'UPI';
  };

  return (
    <div className="admin-layout sn-wallet-page">
      <aside className="admin-sidebar sn-wallet-sidebar">
        <div className="sn-wallet-brand">
          
        </div>

        <div className="sn-wallet-nav-label">MAIN MENU</div>
        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/customers">Customers</Link>
        <Link to="/admin/shipments">Shipments</Link>
        <Link to="/admin/bookings">Bookings</Link>
        <Link to="/admin/wallet" className="admin-active">Wallet Management</Link>
        <Link to="/admin/enquiries">Enquiries</Link>
        <Link to="/">View Website</Link>

        <div className="sn-wallet-sidebar-bottom">
          <span className="sn-wallet-status-dot" />
          SYSTEM OPERATIONAL
        </div>
      </aside>

      <main className="admin-main sn-wallet-main">
        <header className="sn-wallet-header">
          <div>
            <span className="sn-wallet-eyebrow">FINANCIAL CONTROL CENTER</span>
            <h1>Wallet <span>Management</span></h1>
            <p>Monitor balances, payment submissions and customer transactions.</p>
          </div>
          <div className="sn-wallet-header-right">
            <span className="sn-wallet-live-dot" />
            LIVE WALLET OVERVIEW
          </div>
        </header>

        {error && (
          <div className="sn-wallet-alert">{error}</div>
        )}

        <section className="sn-wallet-hero">
          <div className="sn-wallet-hero-copy">
            <span className="sn-wallet-eyebrow">SHIPNEXT FINANCIAL OVERVIEW</span>
            <h2>Every transaction.<br /><span>Under control.</span></h2>
            <p>A unified view of customer wallet activity and submitted recharge payments.</p>
          </div>
          <div className="sn-wallet-hero-visual">
            <div className="sn-wallet-orbit sn-wallet-orbit-one" />
            <div className="sn-wallet-orbit sn-wallet-orbit-two" />
            <div className="sn-wallet-hero-symbol">₹</div>
            <div className="sn-wallet-hero-caption">WALLET NETWORK</div>
          </div>
        </section>

        <section className="sn-wallet-stats">
          <article className="sn-wallet-stat sn-wallet-stat-primary">
            <span className="sn-wallet-stat-icon">₹</span>
            <p>Total Wallet Balance</p>
            <h2>₹{Number(stats.totalWalletBalance).toFixed(2)}</h2>
            <small>Combined customer balance</small>
          </article>

          <article className="sn-wallet-stat">
            <span className="sn-wallet-stat-icon sn-wallet-green">↗</span>
            <p>Total Credits</p>
            <h2>₹{Number(stats.totalCredits).toFixed(2)}</h2>
            <small>Wallet inflow</small>
          </article>

          <article className="sn-wallet-stat">
            <span className="sn-wallet-stat-icon sn-wallet-red">↘</span>
            <p>Total Debits</p>
            <h2>₹{Number(stats.totalDebits).toFixed(2)}</h2>
            <small>Wallet outflow</small>
          </article>

          <article className="sn-wallet-stat">
            <span className="sn-wallet-stat-icon sn-wallet-blue">≋</span>
            <p>Total Transactions</p>
            <h2>{stats.totalTransactions}</h2>
            <small>Recorded wallet activity</small>
          </article>
        </section>

        <section className="sn-wallet-section">
          <div className="sn-wallet-section-heading">
            <div>
              <span className="sn-wallet-eyebrow">CUSTOMER ACCOUNTS</span>
              <h2>Customer Wallets</h2>
              <p>Individual wallet balances and account status.</p>
            </div>
            <span className="sn-wallet-count">{wallets.length} ACCOUNTS</span>
          </div>

          <div className="sn-wallet-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search by customer name, email or phone..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {loading ? (
            <div className="sn-wallet-empty">Loading customer wallets...</div>
          ) : error ? (
            <div className="sn-wallet-empty">Unable to load wallets: {error}</div>
          ) : filteredWallets.length === 0 ? (
            <div className="sn-wallet-empty">
              <h3>No wallet records found</h3>
              <p>{search ? 'Try another search.' : 'Customer wallet balances will appear here.'}</p>
            </div>
          ) : (
            <div className="sn-wallet-table-wrap">
              <table className="sn-wallet-table">
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
                      <td className="sn-wallet-customer">{wallet.name}</td>
                      <td>{wallet.email}</td>
                      <td>{wallet.phone || '—'}</td>
                      <td className="sn-wallet-amount">
                        ₹{Number(wallet.balance).toFixed(2)}
                      </td>
                      <td>
                        <span className={`sn-wallet-status ${wallet.isActive ? 'active' : 'inactive'}`}>
                          {wallet.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="sn-wallet-section">
          <div className="sn-wallet-section-heading">
            <div>
              <span className="sn-wallet-eyebrow">RECHARGE VERIFICATION</span>
              <h2>Customer Payment Documents</h2>
              <p>Review customer payment references and uploaded proof documents.</p>
            </div>
            <span className="sn-wallet-count">{paymentRequests.length} SUBMISSIONS</span>
          </div>

          {paymentLoading ? (
            <div className="sn-wallet-empty">Loading payment documents...</div>
          ) : paymentError ? (
            <div className="sn-wallet-empty">
              Unable to load payment documents: {paymentError}
            </div>
          ) : paymentRequests.length === 0 ? (
            <div className="sn-wallet-empty">
              <h3>No payment documents submitted</h3>
              <p>Customer recharge submissions will appear here.</p>
            </div>
          ) : (
            <div className="sn-wallet-table-wrap">
              <table className="sn-wallet-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Reference ID</th>
                    <th>Document</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <strong>{request.customer}</strong>
                        <small className="sn-wallet-subtext">{request.email}</small>
                        <small className="sn-wallet-subtext">{request.phone || '—'}</small>
                      </td>
                      <td className="sn-wallet-amount">
                        ₹{Number(request.amount).toFixed(2)}
                      </td>
                      <td>{paymentMethodLabel(request.paymentMethod)}</td>
                      <td>{request.reference || '—'}</td>
                      <td>
                        {request.fileName ? (
                          <button
                            className="sn-wallet-proof-button"
                            type="button"
                            onClick={() => viewPaymentProof(request.id)}
                            disabled={openingProof === request.id}
                          >
                            {openingProof === request.id ? 'Opening...' : 'View Document'}
                          </button>
                        ) : 'No document'}
                      </td>
                      <td>{formatDate(request.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="sn-wallet-section">
          <div className="sn-wallet-section-heading">
            <div>
              <span className="sn-wallet-eyebrow">FINANCIAL ACTIVITY</span>
              <h2>Wallet Transaction History</h2>
              <p>Latest recorded credits, debits and refunds.</p>
            </div>
            <span className="sn-wallet-count">{transactions.length} RECORDS</span>
          </div>

          {loading ? (
            <div className="sn-wallet-empty">Loading transactions...</div>
          ) : transactionError ? (
            <div className="sn-wallet-empty">{transactionError}</div>
          ) : transactions.length === 0 ? (
            <div className="sn-wallet-empty">
              <h3>No transactions yet</h3>
              <p>Wallet credits, debits and refunds will appear here when recorded.</p>
            </div>
          ) : (
            <div className="sn-wallet-table-wrap">
              <table className="sn-wallet-table">
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
                        <small className="sn-wallet-subtext">{transaction.email}</small>
                      </td>
                      <td>
                        <span className={`sn-wallet-type ${getTransactionColor(transaction.type)}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className={`sn-wallet-amount ${getTransactionColor(transaction.type)}`}>
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

        <footer className="sn-wallet-footer">
          <span>SHIPNEXT FINANCIAL OPERATIONS</span>
          <span>WALLET MANAGEMENT CONSOLE</span>
        </footer>
      </main>
    </div>
  );
}

export default AdminWallet;
