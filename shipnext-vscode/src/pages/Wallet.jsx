import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
import './Wallet.css';

function Wallet() {
  const [balance, setBalance] = useState('0.00');
  const [transactions, setTransactions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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
        throw new Error(
          requestData.message || 'Unable to load recharge history.'
        );
      }

      setBalance(walletData.wallet.balance);
      setTransactions(walletData.wallet.transactions || []);
      setRequests(requestData.requests || []);
      setError('');
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
        theme: { color: '#155EEF' },

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
            setMessage(
              'Payment window closed. Your wallet has not been credited.'
            );
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', (response) => {
        setError(
          response.error?.description || 'Payment failed. Please try again.'
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

  const completedRecharges = requests.filter(
    (item) => String(item.status || '').toUpperCase() === 'COMPLETED'
  ).length;

  const getChargeType = (transaction) => {
    const description = String(transaction.description || '').toLowerCase();

    if (description.includes('refund')) return 'Refund';
    if (description.includes('recharge')) return 'Wallet Recharge';
    if (description.includes('admin')) return 'Wallet Adjustment';

    return 'Wallet Transaction';
  };

  const filteredTransactions = useMemo(() => {
    let list = [...transactions];

    if (filter === 'CREDIT') {
      list = list.filter((item) => item.type !== 'DEBIT');
    }

    if (filter === 'DEBIT') {
      list = list.filter((item) => item.type === 'DEBIT');
    }

    if (filter === 'REFUND') {
      list = list.filter((item) =>
        String(item.description || '').toLowerCase().includes('refund')
      );
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      list = list.filter((item) =>
        [
          item.id,
          item.reference,
          item.description,
          item.type,
        ].some((value) =>
          String(value || '').toLowerCase().includes(query)
        )
      );
    }

    if (fromDate) {
      const start = new Date(`${fromDate}T00:00:00`);
      list = list.filter((item) => new Date(item.createdAt) >= start);
    }

    if (toDate) {
      const end = new Date(`${toDate}T23:59:59.999`);
      list = list.filter((item) => new Date(item.createdAt) <= end);
    }

    return list;
  }, [transactions, filter, search, fromDate, toDate]);

  const clearFilters = () => {
    setFilter('ALL');
    setSearch('');
    setFromDate('');
    setToDate('');
  };

  const exportTransactions = () => {
    const headers = [
      'Transaction Date',
      'Transaction ID',
      'Charge Type',
      'Type',
      'Amount',
      'Description',
    ];

    const rows = filteredTransactions.map((item) => [
      formatDate(item.createdAt),
      item.id,
      getChargeType(item),
      item.type,
      item.amount,
      item.description || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) =>
          `"${String(value ?? '').replace(/"/g, '""')}"`
        ).join(',')
      )
      .join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shipnext-wallet-transactions.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="sn-wallet-page">
      <div className="sn-wallet-container">

        <header className="sn-wallet-header">
          
          <Link to="/dashboard" className="sn-wallet-back">
            <span>←</span> Dashboard
          </Link>
            
          <span className="sn-wallet-header-label">
            SHIPNEXT FINANCIAL CENTRE
          </span>
        </header>
        {error && (
          <div className="sn-wallet-alert sn-wallet-alert-error">
            <span>!</span> {error}
          </div>
        )}

        {message && (
          <div className="sn-wallet-alert sn-wallet-alert-success">
            <span>✓</span> {message}
          </div>
        )}

               {/* COMPACT WALLET BALANCE + ADD MONEY */}
        <section className="sn-wallet-top-grid">

          <div className="sn-wallet-balance-card">
            <div className="sn-wallet-balance-top">
              <div>
                <span className="sn-wallet-card-label">
                  AVAILABLE WALLET BALANCE
                </span>
                <span className="sn-wallet-card-status">
                  <i /> ACTIVE
                </span>
              </div>
              <div className="sn-wallet-balance-symbol">₹</div>
            </div>

            <div className="sn-wallet-balance-value">
              <span>₹</span>
              <strong>{loading ? '...' : formatAmount(balance)}</strong>
            </div>

            <p>Your available ShipNext wallet funds</p>
          </div>

          <section className="sn-wallet-recharge-card" id="wallet-recharge">
            <div className="sn-wallet-recharge-heading">
              <div className="sn-wallet-recharge-icon">＋</div>
              <div>
                <span className="sn-wallet-eyebrow">WALLET FUNDING</span>
                <h2>Add Money</h2>
              </div>
            </div>

            <form onSubmit={handleRecharge}>
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
                <span className="sn-wallet-inr">INR</span>
              </div>

              <button
                type="submit"
                className="sn-wallet-pay-button"
                disabled={submitting || loading}
              >
                {submitting ? 'Processing Payment...' : 'Add Money Securely'}
                <span>→</span>
              </button>
            </form>

            <div className="sn-wallet-secure-note">
              <span>✓</span>
              Secure payment powered by Razorpay
            </div>
          </section>
        </section>

        
        

        {/* TRANSACTION TABLE */}
        <section className="sn-wallet-history-section">
          <div className="sn-wallet-history-heading">
            <div>
              <span className="sn-wallet-eyebrow">ACCOUNT ACTIVITY</span>
            
              <p>View, search and manage your wallet transaction records.</p>
            </div>

            <span className="sn-wallet-record-count">
              {filteredTransactions.length} / {transactions.length} RECORDS
            </span>
          </div>

          <div className="sn-wallet-table-toolbar">
            <div className="sn-wallet-filter-tabs">
              {[
                { label: 'All', value: 'ALL' },
                { label: 'Credit', value: 'CREDIT' },
                { label: 'Debit', value: 'DEBIT' },
                { label: 'Refund', value: 'REFUND' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.value}
                  className={filter === item.value ? 'active' : ''}
                  onClick={() => setFilter(item.value)}
                >
                  {item.label}
                  {item.value === 'ALL' && (
                    <span>{transactions.length}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="sn-wallet-filter-controls">
              <div className="sn-wallet-search">
                <span>⌕</span>
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <input
                className="sn-wallet-date-input"
                type="date"
                aria-label="From date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />

              <input
                className="sn-wallet-date-input"
                type="date"
                aria-label="To date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />

              <button
                type="button"
                className="sn-wallet-clear-button"
                onClick={clearFilters}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="sn-wallet-table-wrap">
            <table className="sn-wallet-table">
              <thead>
                <tr>
                  <th>TRANSACTION DATE</th>
                  <th>TRANSACTION ID</th>
                  <th>CHARGE TYPE</th>
                  <th>TYPE</th>
                  <th>AMOUNT</th>
                  <th>DESCRIPTION</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="sn-wallet-table-empty">
                      Loading wallet transactions...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="sn-wallet-table-empty">
                      <div className="sn-wallet-empty-state">
                        <div>₹</div>
                        <strong>No transactions found</strong>
                        <p>
                          Try changing your filters or make your first wallet
                          transaction.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.createdAt)}</td>

                      <td className="sn-wallet-transaction-id">
                        {transaction.id}
                      </td>

                      <td>
                        <span className="sn-wallet-charge-label">
                          {getChargeType(transaction)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            transaction.type === 'DEBIT'
                              ? 'sn-wallet-type-badge debit'
                              : 'sn-wallet-type-badge credit'
                          }
                        >
                          {transaction.type === 'DEBIT' ? 'Debit' : 'Credit'}
                        </span>
                      </td>

                      <td>
                        <strong
                          className={
                            transaction.type === 'DEBIT'
                              ? 'sn-wallet-debit-amount'
                              : 'sn-wallet-credit-amount'
                          }
                        >
                          {transaction.type === 'DEBIT' ? '−' : '+'}
                          ₹{formatAmount(transaction.amount)}
                        </strong>
                      </td>

                      <td className="sn-wallet-description">
                        {transaction.description || 'Wallet transaction'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="sn-wallet-table-footer">
            <span>
              Showing {filteredTransactions.length} of {transactions.length}{' '}
              loaded transactions
            </span>

            <div>
              <button type="button" onClick={fetchWallet}>
                ↻ Refresh
              </button>

              <button type="button" onClick={exportTransactions}>
                ↓ Export CSV
              </button>
            </div>
          </div>
        </section>

        <footer className="sn-wallet-footer">
          <span>SHIPNEXT</span>
          <p>Shipping funds, managed with clarity.</p>
        </footer>

      </div>
    </main>
  );
}

export default Wallet;