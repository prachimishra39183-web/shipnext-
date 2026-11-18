
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';

function Wallet() {
  const [balance, setBalance] = useState('0.00');
  const [transactions, setTransactions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [amount, setAmount] = useState('');
  const [upiReference, setUpiReference] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const token = sessionStorage.getItem('shipnextToken');

  const fetchWallet = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wallet/me`, {
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

      const requestResponse = await fetch(
        `${API_URL}/api/wallet/recharge-requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const requestData = await requestResponse.json();

      if (!requestResponse.ok) {
        throw new Error(
          requestData.message || 'Unable to load recharge requests.'
        );
      }

      setRequests(requestData.requests || []);
    } catch (err) {
      setError(err.message || 'Unable to load wallet details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError('Please log in to view your wallet.');
      setLoading(false);
      return;
    }

    fetchWallet();
  }, []);

  const handleRecharge = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!amount || Number(amount) < 100) {
      setError('Minimum recharge amount is ₹100.');
      return;
    }

    if (!upiReference.trim()) {
      setError('Please enter your UPI transaction reference (UTR).');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/api/wallet/recharge-requests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: Number(amount),
            upiReference: upiReference.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit request.');
      }

      setMessage('Your recharge request has been submitted successfully.');
      setAmount('');
      setUpiReference('');

      await fetchWallet();
    } catch (err) {
      setError(err.message || 'Unable to submit recharge request.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  const formatAmount = (value) => Number(value).toFixed(2);



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
          <p>Manage your funds for ShipNext shipping services.</p>
        </div>

        <section className="wallet-balance-card">
          <div className="wallet-balance-info">
            <span>AVAILABLE BALANCE</span>
            <h2>
              {loading ? 'Loading...' : `₹${formatAmount(balance)}`}
            </h2>
            <p>Your current ShipNext wallet balance</p>
          </div>

          <div className="wallet-symbol">₹</div>
        </section>

        <section className="wallet-action-card">
          <div>
            <h2>Add Money to Wallet</h2>
            <p>
  Pay using the official ShipNext UPI QR code and submit your
  transaction reference for your records.
</p>
          </div>

          <div className="wallet-recharge-layout">
            <div className="wallet-qr-section">
              <h3>Scan & Pay</h3>

              <div className="wallet-qr-placeholder">
                <img
                  src="/shipnext-upi-qr.png"
                  alt="ShipNext UPI QR Code"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <p>
                  Add your QR image as
                  <strong> shipnext-upi-qr.png </strong>
                  inside the public folder.
                </p>
              </div>
                 <small>
  Complete your UPI payment and enter the transaction reference below.
</small>
            </div>

            <form className="wallet-add-form" onSubmit={handleRecharge}>
              <label htmlFor="amount">Amount (₹)</label>
              <input
                id="amount"
                type="number"
                min="100"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (minimum ₹100)"
                required
              />

              <label htmlFor="upiReference">
                UPI Transaction ID / UTR
              </label>
              <input
                id="upiReference"
                type="text"
                value={upiReference}
                onChange={(e) => setUpiReference(e.target.value)}
                placeholder="Enter your UPI reference number"
                maxLength={100}
                required
              />

              <button type="submit" disabled={submitting || loading}>
                {submitting ? 'Submitting...' : '+ Submit Recharge '}
              </button>

              <small>
               Submit your UPI transaction reference after completing the payment.
              </small>
            </form>
          </div>
        </section>

        {message && (
          <div className="wallet-success-message">{message}</div>
        )}

        {error && (
          <div className="wallet-error-message">{error}</div>
        )}

        <section className="wallet-transactions">
          <div className="wallet-transactions-heading">
            <div>
            <h2>Recharge History</h2>
<p>View your submitted UPI wallet recharge requests.</p>
            </div>
          </div>

          {loading ? (
            <div className="wallet-empty">
              <p>Loading recharge requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="wallet-empty">
             
              <p>Your submitted UPI recharge history will appear here.</p>
            </div>
          ) : (
            <div className="wallet-transaction-list">
  {requests.map((request) => (
    <div key={request.id}>
      <div>
        <strong>UPI Wallet Recharge</strong>
        <p>UPI Reference: {request.upiReference}</p>
        <p>{formatDate(request.createdAt)}</p>
      </div>

      <strong>₹{formatAmount(request.amount)}</strong>
    </div>
  ))}
</div>
          )}
        </section>

        <section className="wallet-transactions">
          <div className="wallet-transactions-heading">
            <div>
              <h2>Transaction History</h2>
              <p>Review your completed wallet transactions.</p>
            </div>
          </div>

          {loading ? (
            <div className="wallet-empty">
              <p>Loading wallet transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="wallet-empty">
              <h3>No transactions yet</h3>
              <p>Your wallet transactions will appear here.</p>
            </div>
          ) : (
            <div className="wallet-transaction-list">
              {transactions.map((transaction) => (
                <div key={transaction.id}>
                  <div>
                    <strong>
                      {transaction.description || 'Wallet transaction'}
                    </strong>
                    <p>{formatDate(transaction.createdAt)}</p>
                  </div>

                  <strong>
                    {transaction.type === 'DEBIT' ? '-' : '+'}
                    ₹{formatAmount(transaction.amount)}
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
