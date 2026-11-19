
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';

function Wallet() {
  const [balance, setBalance] = useState('0.00');
  const [transactions, setTransactions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [amount, setAmount] = useState('');
  const [upiReference, setUpiReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentProof, setPaymentProof] = useState(null);
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
      setError('Please enter your payment reference or transaction ID.');
      return;
    }

    if (!paymentProof) {
      setError('Please upload your payment screenshot.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append('amount', amount);
      formData.append('upiReference', upiReference.trim());
      formData.append('paymentMethod', paymentMethod);
      formData.append('paymentProof', paymentProof);

      const response = await fetch(
        `${API_URL}/api/wallet/recharge-requests`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit request.');
      }

      setMessage(
        'Recharge request submitted successfully. Awaiting payment verification.'
      );

      setAmount('');
      setUpiReference('');
      setPaymentProof(null);

      const fileInput = document.getElementById('walletProof');
      if (fileInput) fileInput.value = '';

      await fetchWallet();
    } catch (err) {
      setError(err.message || 'Unable to submit recharge request.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Date unavailable';

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return 'Date unavailable';

    return parsed.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const formatAmount = (value) => {
    const number = Number(value);
    return Number.isFinite(number)
      ? number.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '0.00';
  };

  const totalCredits = transactions
    .filter((item) => item.type !== 'DEBIT')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalDebits = transactions
    .filter((item) => item.type === 'DEBIT')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const paymentMethods = [
    {
      id: 'UPI',
      name: 'UPI PAYMENT',
      description: 'GPay, PhonePe, Paytm',
    },
    {
      id: 'CREDIT_CARD',
      name: 'CREDIT CARD',
      description: 'Visa, Mastercard, RuPay',
    },
    {
      id: 'DEBIT_CARD',
      name: 'DEBIT CARD',
      description: 'Visa, Mastercard, RuPay',
    },
  ];

  const getRechargeStatus = (request) => {
    const status = request.status || 'PENDING';
    return status.replaceAll('_', ' ').toUpperCase();
  };

  return (
    <main className="sn-wallet-page">
      <header className="sn-wallet-header">
        <Link to="/" className="sn-wallet-brand">
          
        </Link>

        <Link to="/dashboard" className="sn-wallet-back">
          Back to Dashboard
        </Link>
      </header>

      <div className="sn-wallet-container">
        <section className="sn-wallet-intro">
          <span className="sn-wallet-eyebrow">
            SHIPNEXT FINANCIAL CENTRE
          </span>
          <h1>My <span>Wallet.</span></h1>
          <p>
            Manage your shipping funds, submit recharge requests
            and review your account activity.
          </p>
        </section>

        {error && (
          <div className="sn-wallet-alert sn-wallet-alert-error">
            {error}
          </div>
        )}

        {message && (
          <div className="sn-wallet-alert sn-wallet-alert-success">
            {message}
          </div>
        )}

        <section className="sn-wallet-overview">
          <div className="sn-wallet-balance">
            <div className="sn-wallet-balance-top">
              <span>AVAILABLE WALLET BALANCE</span>
              <span className="sn-wallet-live-label">SHIPNEXT ACCOUNT</span>
            </div>

            <div className="sn-wallet-balance-amount">
              <span>₹</span>
              <strong>
                {loading ? 'Loading...' : formatAmount(balance)}
              </strong>
            </div>

            <p>Your current available shipping funds</p>

            <div className="sn-wallet-balance-bottom">
              <span>SHIPNEXT</span>
              <span>WALLET ACCOUNT</span>
            </div>
          </div>

          <div className="sn-wallet-metrics">
            <article className="sn-wallet-metric">
              <span>TOTAL CREDITS</span>
              <strong>₹{formatAmount(totalCredits)}</strong>
              <small>Based on loaded transactions</small>
            </article>

            <article className="sn-wallet-metric">
              <span>TOTAL DEBITS</span>
              <strong>₹{formatAmount(totalDebits)}</strong>
              <small>Based on loaded transactions</small>
            </article>

            <article className="sn-wallet-metric">
              <span>RECHARGE REQUESTS</span>
              <strong>{requests.length}</strong>
              <small>Submitted requests</small>
            </article>
          </div>
        </section>

        <section className="sn-wallet-recharge">
          <div className="sn-wallet-section-heading">
            <div>
              <span className="sn-wallet-eyebrow">WALLET FUNDING</span>
              <h2>Add money to your wallet</h2>
              <p>
                Submit your payment details for ShipNext verification.
              </p>
            </div>
            <span className="sn-wallet-step">01 / RECHARGE</span>
          </div>

          <div className="sn-wallet-methods">
            {paymentMethods.map((method, index) => (
              <button
                type="button"
                key={method.id}
                className={`sn-wallet-method ${
                  paymentMethod === method.id ? 'active' : ''
                }`}
                onClick={() => setPaymentMethod(method.id)}
              >
                <span className="sn-wallet-method-number">
                  0{index + 1}
                </span>
                <strong>{method.name}</strong>
                <small>{method.description}</small>
                <span className="sn-wallet-method-select">
                  {paymentMethod === method.id ? 'SELECTED' : 'SELECT'}
                </span>
              </button>
            ))}
          </div>

          <div className="sn-wallet-form-layout">
            {paymentMethod === 'UPI' && (
              <div className="sn-wallet-qr-panel">
                <span className="sn-wallet-eyebrow">PAYMENT INSTRUCTIONS</span>
                <h3>Scan and pay</h3>

                <div className="sn-wallet-qr-frame">
                  <img
                    src="/sp-qr.jpeg"
                    alt="ShipNext UPI QR Code"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                      event.currentTarget.parentElement.classList.add(
                        'sn-wallet-qr-missing'
                      );
                    }}
                  />
                  <span className="sn-wallet-qr-fallback">
                    QR CODE NOT AVAILABLE
                  </span>
                </div>

                <p>
                  Complete your UPI payment using the displayed
                  ShipNext QR code.
                </p>

                <div className="sn-wallet-qr-note">
                  Use the exact amount entered in the recharge form.
                </div>
              </div>
            )}

            <form
              className="sn-wallet-form"
              onSubmit={handleRecharge}
            >
              <span className="sn-wallet-eyebrow">
                PAYMENT SUBMISSION
              </span>

              <h3>
                {paymentMethod === 'UPI'
                  ? 'UPI payment details'
                  : paymentMethod === 'CREDIT_CARD'
                  ? 'Credit card payment details'
                  : 'Debit card payment details'}
              </h3>

              <div className="sn-wallet-field">
                <label htmlFor="walletAmount">Recharge amount</label>
                <div className="sn-wallet-amount-input">
                  <span>₹</span>
                  <input
                    id="walletAmount"
                    type="number"
                    min="100"
                    max="1000000"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount (minimum ₹100)"
                    required
                  />
                </div>
                <small>Minimum ₹100 · Maximum ₹10,00,000</small>
              </div>

              <div className="sn-wallet-field">
                <label htmlFor="walletReference">
                  Payment reference / transaction ID
                </label>
                <input
                  id="walletReference"
                  type="text"
                  value={upiReference}
                  onChange={(e) => setUpiReference(e.target.value)}
                  placeholder="Enter your payment reference"
                  maxLength={100}
                  required
                />
              </div>

              <div className="sn-wallet-field">
                <label htmlFor="walletProof">
                  Payment proof
                </label>
                <input
                  id="walletProof"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (!file) {
                      setPaymentProof(null);
                      return;
                    }

                    if (file.size > 5 * 1024 * 1024) {
                      setError('Payment proof must be smaller than 5 MB.');
                      e.target.value = '';
                      setPaymentProof(null);
                      return;
                    }

                    setError('');
                    setPaymentProof(file);
                  }}
                  required
                />
                <small>JPG, PNG, WEBP or PDF · Maximum 5 MB</small>
              </div>

              {paymentProof && (
                <div className="sn-wallet-file-selected">
                  Selected file: {paymentProof.name}
                </div>
              )}

              <button
                type="submit"
                className="sn-wallet-submit"
                disabled={submitting || loading}
              >
                {submitting
                  ? 'Submitting request...'
                  : 'Submit recharge request'}
              </button>

              <p className="sn-wallet-verification-note">
                Wallet funds are credited only after successful
                payment verification by ShipNext administration.
              </p>
            </form>
          </div>
        </section>

        <section className="sn-wallet-history">
          <div className="sn-wallet-section-heading">
            <div>
              <span className="sn-wallet-eyebrow">PAYMENT ACTIVITY</span>
              <h2>Recharge history</h2>
              <p>Track the status of your submitted recharge requests.</p>
            </div>
            <span className="sn-wallet-history-count">
              {requests.length} REQUESTS
            </span>
          </div>

          {loading ? (
            <div className="sn-wallet-empty">Loading recharge history...</div>
          ) : requests.length === 0 ? (
            <div className="sn-wallet-empty">
              <h3>No recharge requests yet</h3>
              <p>Your submitted payment requests will appear here.</p>
            </div>
          ) : (
            <div className="sn-wallet-table-wrap">
              <table className="sn-wallet-table">
                <thead>
                  <tr>
                    <th>PAYMENT DETAILS</th>
                    <th>REFERENCE</th>
                    <th>DATE</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <strong>
                          {request.paymentMethod === 'CREDIT_CARD'
                            ? 'Credit Card Recharge'
                            : request.paymentMethod === 'DEBIT_CARD'
                            ? 'Debit Card Recharge'
                            : 'UPI Wallet Recharge'}
                        </strong>
                      </td>
                      <td>{request.upiReference || '—'}</td>
                      <td>{formatDate(request.createdAt)}</td>
                      <td className="sn-wallet-table-amount">
                        ₹{formatAmount(request.amount)}
                      </td>
                      <td>
                        <span className="sn-wallet-request-status">
                          {getRechargeStatus(request)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="sn-wallet-history">
          <div className="sn-wallet-section-heading">
            <div>
              <span className="sn-wallet-eyebrow">ACCOUNT ACTIVITY</span>
              <h2>Transaction history</h2>
              <p>Review recorded credits and debits in your wallet.</p>
            </div>
            <span className="sn-wallet-history-count">
              {transactions.length} TRANSACTIONS
            </span>
          </div>

          {loading ? (
            <div className="sn-wallet-empty">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="sn-wallet-empty">
              <h3>No transactions yet</h3>
              <p>Your completed wallet transactions will appear here.</p>
            </div>
          ) : (
            <div className="sn-wallet-transaction-list">
              {transactions.map((transaction) => (
                <article
                  className="sn-wallet-transaction"
                  key={transaction.id}
                >
                  <div className="sn-wallet-transaction-info">
                    <strong>
                      {transaction.description || 'Wallet transaction'}
                    </strong>
                    <span>{formatDate(transaction.createdAt)}</span>
                  </div>

                  <strong
                    className={
                      transaction.type === 'DEBIT'
                        ? 'sn-wallet-debit'
                        : 'sn-wallet-credit'
                    }
                  >
                    {transaction.type === 'DEBIT' ? '−' : '+'}
                    ₹{formatAmount(transaction.amount)}
                  </strong>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="sn-wallet-footer">
         
          <p>Your shipping funds, managed with clarity.</p>
        </footer>
      </div>
    </main>
  );
}

export default Wallet;
