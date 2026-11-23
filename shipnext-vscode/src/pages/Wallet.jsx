
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';

function Wallet() {
  const [balance, setBalance] = useState('0.00');
  const [transactions, setTransactions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const token = sessionStorage.getItem('shipnextToken');

  const fetchWallet = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [walletResponse, requestResponse] = await Promise.all([
        fetch(`${API_URL}/api/wallet/me`, { headers }),
        fetch(`${API_URL}/api/wallet/recharge-requests`, { headers }),
      ]);

      const walletData = await walletResponse.json();
      const requestData = await requestResponse.json();

      if (!walletResponse.ok) {
        throw new Error(walletData.message || 'Unable to load wallet.');
      }

      if (!requestResponse.ok) {
        throw new Error(requestData.message || 'Unable to load recharge history.');
      }

      setBalance(walletData.wallet.balance);
      setTransactions(walletData.wallet.transactions || []);
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

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRecharge = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const rechargeAmount = Number(amount);

    if (
      !Number.isFinite(rechargeAmount) ||
      rechargeAmount < 1 ||
      rechargeAmount > 1000000
    ) {
      setError('Enter a valid recharge amount between ₹1 and ₹10,00,000.');
      return;
    }

    setSubmitting(true);

    try {
      const loaded = await loadRazorpay();

      if (!loaded) {
        throw new Error('Unable to load Razorpay Checkout. Please try again.');
      }

      // Create order on ShipNext backend.
      const orderResponse = await fetch(
        `${API_URL}/api/wallet/recharge-orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount: rechargeAmount.toFixed(2) }),
        }
      );

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.message || 'Unable to create payment order.');
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'SHIPNEXT',
        description: 'Wallet Recharge',
        order_id: orderData.order.id,
        theme: {
          color: '#FF3B1F',
        },

        handler: async (paymentResponse) => {
          try {
            const verifyResponse = await fetch(
              `${API_URL}/api/wallet/verify-recharge`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(paymentResponse),
              }
            );

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.message ||
                'Payment verification failed. Please contact support.'
              );
            }

            setMessage(
              `₹${rechargeAmount.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              })} successfully added to your ShipNext wallet.`
            );

            setAmount('');
            await fetchWallet();
          } catch (err) {
            setError(
              err.message ||
              'Payment received but verification needs attention. Please contact support.'
            );
          } finally {
            setSubmitting(false);
          }
        },

        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setMessage('Payment window closed. Your wallet has not been credited.');
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', (response) => {
        setError(
          response.error?.description ||
          'Payment failed. Please try again.'
        );
        setSubmitting(false);
      });

      razorpayInstance.open();
    } catch (err) {
      setError(err.message || 'Unable to start payment.');
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

  return (
    <main className="sn-wallet-page">
      <header className="sn-wallet-header">
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
            Manage your shipping funds, recharge securely
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
              <small>All recharge attempts</small>
            </article>
          </div>
        </section>

        <section className="sn-wallet-recharge">
          <div className="sn-wallet-section-heading">
            <div>
              <span className="sn-wallet-eyebrow">WALLET FUNDING</span>
              <h2>Add money to your wallet</h2>
              <p>
                Securely recharge your ShipNext wallet through Razorpay.
              </p>
            </div>

            <span className="sn-wallet-step">01 / RECHARGE</span>
          </div>

          <div className="sn-wallet-form-layout">
            <form
              className="sn-wallet-form"
              onSubmit={handleRecharge}
            >
              <span className="sn-wallet-eyebrow">
                SECURE PAYMENT
              </span>

              <h3>Wallet recharge</h3>

              <div className="sn-wallet-field">
                <label htmlFor="walletAmount">
                  Recharge amount
                </label>

                <div className="sn-wallet-amount-input">
                  <span>₹</span>
                  <input
                    id="walletAmount"
                    type="number"
                    min="1"
                    max="1000000"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                    disabled={submitting}
                  />
                </div>

                <small>Minimum ₹1 · Maximum ₹10,00,000</small>
              </div>

              <button
                type="submit"
                className="sn-wallet-submit-btn"
                disabled={submitting || loading}
              >
                {submitting ? 'Processing...' : 'Add Money Securely'}
              </button>

              <p className="sn-wallet-verification-note">
                Payments are verified by ShipNext's server.
                Your wallet is credited only after successful payment verification.
              </p>

              <div className="sn-wallet-payment-security">
                <strong>SECURE PAYMENTS BY RAZORPAY</strong>
                <span>UPI · Cards · Netbanking · Supported payment methods</span>
              </div>
            </form>
          </div>
        </section>

        <section className="sn-wallet-history">
          <div className="sn-wallet-section-heading">
            <div>
              <span className="sn-wallet-eyebrow">PAYMENT ACTIVITY</span>
              <h2>Recharge history</h2>
              <p>Track your wallet recharge payments.</p>
            </div>

            <span className="sn-wallet-history-count">
              {requests.length} REQUESTS
            </span>
          </div>

          {loading ? (
            <div className="sn-wallet-empty">
              Loading recharge history...
            </div>
          ) : requests.length === 0 ? (
            <div className="sn-wallet-empty">
              <h3>No recharge requests yet</h3>
              <p>Your completed and pending recharges will appear here.</p>
            </div>
          ) : (
            <div className="sn-wallet-table-wrap">
              <table className="sn-wallet-table">
                <thead>
                  <tr>
                    <th>PAYMENT DETAILS</th>
                    <th>PAYMENT ID</th>
                    <th>DATE</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <strong>Razorpay Wallet Recharge</strong>
                      </td>

                      <td>
                        {request.razorpayPaymentId || 'Pending'}
                      </td>

                      <td>{formatDate(request.createdAt)}</td>

                      <td className="sn-wallet-table-amount">
                        ₹{formatAmount(request.amount)}
                      </td>

                      <td>
                        <span className="sn-wallet-request-status">
                          {request.status || 'PENDING'}
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
            <div className="sn-wallet-empty">
              Loading transactions...
            </div>
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
