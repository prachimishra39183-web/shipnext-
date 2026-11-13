
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

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

  useEffect(() => {
    const fetchWalletData = async () => {
      const token = sessionStorage.getItem('shipnextToken');

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [walletResponse, transactionResponse] = await Promise.all([
          fetch('http://localhost:5000/api/admin/wallets', { headers }),
          fetch('http://localhost:5000/api/admin/wallet-transactions', {
            headers,
          }),
        ]);

        const walletData = await walletResponse.json();
        const transactionData = await transactionResponse.json();

        if (!walletResponse.ok) {
          throw new Error(walletData.message || 'Unable to load wallet records.');
        }

        setWallets(walletData.wallets || []);
        setStats(walletData.stats || stats);

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

    fetchWalletData();
  }, []);

  const filteredWallets = useMemo(() => {
    const query = search.toLowerCase();

    return wallets.filter((wallet) =>
      [wallet.name, wallet.email, wallet.phone || ''].some((value) =>
        value.toLowerCase().includes(query)
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

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>ShipNext <span>Admin</span></h2>
        <Link to="/admin">📊 Dashboard</Link>
        <Link to="/admin/customers">👥 Customers</Link>
        <Link to="/admin/shipments">📦 Shipments</Link>
        <Link to="/admin/bookings">🚚 Bookings</Link>
        <Link to="/admin/wallet" className="admin-active">💳 Wallet Management</Link>
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
              <p>Wallet credits, debits and refunds will appear here when recorded.</p>
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
