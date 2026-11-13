
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function Wallet() {
  const [balance, setBalance] = useState('0.00');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWallet = async () => {
      const token = sessionStorage.getItem('shipnextToken');

      if (!token) {
        setError('Please log in to view your wallet.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/wallet/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load wallet.');
        }

        setBalance(data.wallet.balance);
        setTransactions(data.wallet.transactions || []);
      } catch (err) {
        setError(err.message || 'Unable to load wallet details.');
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="booking-page">
      <header className="booking-header">
        <Link to="/" className="logo">
          <span className="logo-ship">SHIP</span>
          <span className="logo-next">NEXT</span>
        </Link>

        <Link to="/dashboard" className="booking-back">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="wallet-container">
        <div className="booking-heading">
          <span>YOUR SHIPNEXT ACCOUNT</span>
          <h1>My Wallet</h1>
          <p>Manage your shipping funds and transactions.</p>
        </div>

        <section className="wallet-balance-card">
          <div className="wallet-balance-info">
            <span>AVAILABLE BALANCE</span>
            <h2>
              {loading ? 'Loading...' : `₹${Number(balance).toFixed(2)}`}
            </h2>
            <p>Your current ShipNext wallet balance</p>
          </div>

          <div className="wallet-symbol">₹</div>
        </section>

        <section className="wallet-action-card">
          <div>
            <h2>Add Money to Wallet</h2>
            <p>Add funds to pay for your upcoming shipments.</p>
          </div>

          <div className="wallet-add-form">
            <label htmlFor="amount">Amount (₹)</label>
            <input
              id="amount"
              type="number"
              min="100"
              placeholder="Enter amount (minimum ₹100)"
              disabled
            />

            <button type="button" disabled>
              + Add Money
            </button>

            <small>Online wallet top-ups will be enabled after payment gateway integration.</small>
          </div>
        </section>

        <section className="wallet-transactions">
          <div className="wallet-transactions-heading">
            <div>
              <h2>Transaction History</h2>
              <p>Review your wallet activity.</p>
            </div>
          </div>

          {loading ? (
            <div className="wallet-empty">
              <p>Loading wallet transactions...</p>
            </div>
          ) : error ? (
            <div className="wallet-empty">
              <h3>Unable to load wallet</h3>
              <p>{error}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="wallet-empty">
              <div>💳</div>
              <h3>No transactions yet</h3>
              <p>Your wallet transactions will appear here.</p>
            </div>
          ) : (
            <div className="wallet-transaction-list">
              {transactions.map((transaction) => (
                <div key={transaction.id}>
                  <div>
                    <strong>{transaction.description || 'Wallet transaction'}</strong>
                    <p>{formatDate(transaction.createdAt)}</p>
                  </div>

                  <strong>
                    {transaction.type === 'DEBIT' ? '-' : '+'}
                    ₹{Number(transaction.amount).toFixed(2)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Wallet;
