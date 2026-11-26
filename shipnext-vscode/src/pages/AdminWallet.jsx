
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
  // ADMIN WALLET CREDIT / DEBIT
  const [showAdjustmentConfirm, setShowAdjustmentConfirm] = useState(false);
 
const [selectedWallet, setSelectedWallet] = useState(null);
const [adjustmentType, setAdjustmentType] = useState('CREDIT');
const [adjustmentAmount, setAdjustmentAmount] = useState('');
const [adjustmentReason, setAdjustmentReason] = useState('');
const [adjustmentLoading, setAdjustmentLoading] = useState(false);
const [adjustmentMessage, setAdjustmentMessage] = useState('');
const [adjustmentError, setAdjustmentError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactionError, setTransactionError] = useState('');
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [paymentError, setPaymentError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [openingProof, setOpeningProof] = useState('');
const [refunds, setRefunds] = useState([]);
const [refundLoading, setRefundLoading] = useState(true);
const [refundError, setRefundError] = useState('');
const [refundActionLoading, setRefundActionLoading] = useState('');
  const token = sessionStorage.getItem('shipnextToken');

  const fetchWalletData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [
  walletResponse,
  transactionResponse,
  paymentResponse,
  refundResponse,
] =
        await Promise.all([
          fetch(`${API_URL}/api/admin/wallets`, { headers }),
          fetch(`${API_URL}/api/admin/wallet-transactions`, { headers }),
          fetch(`${API_URL}/api/admin/wallet-recharge-requests`, { headers }),
           fetch(`${API_URL}/api/refunds`, { headers }),
        ]);
        const refundData = await refundResponse.json();

if (refundResponse.ok) {
  setRefunds(refundData.refunds || []);
  setRefundError('');
} else {
  setRefundError(refundData.message || 'Unable to load refunds.');
}

setRefundLoading(false);
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
      setRefundLoading(false);
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
   const handleRefundAction = async (refundId, action) => {
  let adminNote = '';

  if (action === 'reject') {
    adminNote = window.prompt('Enter the reason for rejecting this refund:');

    if (!adminNote || !adminNote.trim()) {
      return;
    }
  }

  const token = sessionStorage.getItem('shipnextToken');

  try {
    setRefundActionLoading(refundId);
    setRefundError('');

    const response = await fetch(
      `${API_URL}/api/refunds/${refundId}/${action}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminNote }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Refund action failed.');
    }

    await fetchWalletData();
  } catch (error) {
    setRefundError(error.message);
  } finally {
    setRefundActionLoading('');
  }
};

const handleWalletAdjustment = (event) => {
  event.preventDefault();

  setAdjustmentError('');
  setAdjustmentMessage('');

  if (!selectedWallet) {
    setAdjustmentError('Please select a customer.');
    return;
  }

  if (
    !/^\d+(\.\d{1,2})?$/.test(adjustmentAmount) ||
    Number(adjustmentAmount) <= 0 ||
    Number(adjustmentAmount) > 1000000
  ) {
    setAdjustmentError('Enter a valid amount between ₹0.01 and ₹10,00,000.');
    return;
  }

  if (
    adjustmentReason.trim().length < 5 ||
    adjustmentReason.trim().length > 500
  ) {
    setAdjustmentError('Reason must contain 5 to 500 characters.');
    return;
  }

  setShowAdjustmentConfirm(true);
};

const confirmWalletAdjustment = async () => {
  if (!selectedWallet) return;

  try {
    setAdjustmentLoading(true);
    setAdjustmentError('');

    const response = await fetch(
      `${API_URL}/api/wallet/admin/adjust`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedWallet.id,
          type: adjustmentType,
          amount: adjustmentAmount,
          reason: adjustmentReason.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Wallet adjustment failed.');
    }

    setAdjustmentMessage(
      `${data.message} New balance: ₹${data.balance}`
    );

    setShowAdjustmentConfirm(false);
    setSelectedWallet(null);
    setAdjustmentAmount('');
    setAdjustmentReason('');

    await fetchWalletData();
  } catch (err) {
    setAdjustmentError(err.message || 'Unable to adjust wallet.');
  } finally {
    setAdjustmentLoading(false);
  }
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
           {adjustmentMessage && (
  <div className="sn-wallet-adjustment-success">{adjustmentMessage}</div>
)}

{adjustmentError && (
  <div className="sn-wallet-adjustment-error">{adjustmentError}</div>
)}

{selectedWallet && (
  <form
    className="sn-wallet-adjustment-form"
    onSubmit={handleWalletAdjustment}
  >
    <div className="sn-wallet-adjustment-form-header">
      <div>
        <span>WALLET ADJUSTMENT</span>
        <h3>
          {adjustmentType === 'CREDIT'
            ? 'Credit Customer Wallet'
            : 'Debit Customer Wallet'}
        </h3>
        <p>{selectedWallet.name} · {selectedWallet.email}</p>
      </div>

      <button type="button" onClick={() => setSelectedWallet(null)}>
        Close
      </button>
    </div>

    <div className="sn-wallet-adjustment-current">
      Current balance:{' '}
      <strong>
        ₹{Number(selectedWallet.balance || 0).toFixed(2)}
      </strong>
    </div>

    <div className="sn-wallet-adjustment-actions">
      <button
        type="button"
        className={adjustmentType === 'CREDIT' ? 'active credit' : 'credit'}
        onClick={() => setAdjustmentType('CREDIT')}
      >
        + CREDIT
      </button>

      <button
        type="button"
        className={adjustmentType === 'DEBIT' ? 'active debit' : 'debit'}
        onClick={() => setAdjustmentType('DEBIT')}
      >
        − DEBIT
      </button>
    </div>

    <label>Amount (₹)</label>
    <input
      type="number"
      min="0.01"
      max="1000000"
      step="0.01"
      value={adjustmentAmount}
      onChange={(e) => setAdjustmentAmount(e.target.value)}
      required
    />

    <label>Reason</label>
    <textarea
      value={adjustmentReason}
      onChange={(e) => setAdjustmentReason(e.target.value)}
      minLength={5}
      maxLength={500}
      rows={3}
      placeholder="Enter the reason for this adjustment"
      required
    />

    <button type="submit" disabled={adjustmentLoading}>
      {adjustmentLoading
        ? 'Processing...'
        : adjustmentType === 'CREDIT'
          ? 'Confirm Credit'
          : 'Confirm Debit'}
    </button>
  </form>
)}
{showAdjustmentConfirm && selectedWallet && (
  <div className="sn-wallet-confirm-overlay">
    <div className="sn-wallet-confirm-card">
      <div className="sn-wallet-confirm-icon">
        {adjustmentType === 'CREDIT' ? '＋' : '−'}
      </div>

      <span className="sn-wallet-confirm-label">
        FINAL CONFIRMATION
      </span>

      <h3>
        {adjustmentType === 'CREDIT'
          ? 'Confirm Wallet Credit'
          : 'Confirm Wallet Debit'}
      </h3>

      <p className="sn-wallet-confirm-description">
        Please review this transaction before proceeding.
      </p>

      <div className="sn-wallet-confirm-details">
        <div>
          <span>Customer</span>
          <strong>{selectedWallet.name}</strong>
        </div>

        <div>
          <span>Transaction Type</span>
          <strong>{adjustmentType}</strong>
        </div>

        <div>
          <span>Amount</span>
          <strong>₹{Number(adjustmentAmount).toFixed(2)}</strong>
        </div>

        <div>
          <span>Reason</span>
          <strong>{adjustmentReason}</strong>
        </div>
      </div>

      <div className="sn-wallet-confirm-warning">
        This action will immediately update the customer's wallet balance.
      </div>

      <div className="sn-wallet-confirm-buttons">
        <button
          type="button"
          onClick={() => setShowAdjustmentConfirm(false)}
          disabled={adjustmentLoading}
        >
          Go Back
        </button>

        <button
          type="button"
          className={adjustmentType === 'CREDIT' ? 'confirm-credit' : 'confirm-debit'}
          onClick={confirmWalletAdjustment}
          disabled={adjustmentLoading}
        >
          {adjustmentLoading
            ? 'Processing...'
            : `Confirm ${adjustmentType}`}
        </button>
      </div>
    </div>
  </div>
)}
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
<th>Wallet Actions</th>
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

<td>
  <div className="sn-wallet-actions">
    <button
      type="button"
      className="sn-wallet-credit-btn"
      onClick={() => {
        setSelectedWallet(wallet);
        setAdjustmentType('CREDIT');
        setAdjustmentAmount('');
        setAdjustmentReason('');
        setAdjustmentMessage('');
        setAdjustmentError('');
      }}
    >
      + Credit
    </button>

    <button
      type="button"
      className="sn-wallet-debit-btn"
      onClick={() => {
        setSelectedWallet(wallet);
        setAdjustmentType('DEBIT');
        setAdjustmentAmount('');
        setAdjustmentReason('');
        setAdjustmentMessage('');
        setAdjustmentError('');
      }}
    >
      − Debit
    </button>
  </div>
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
          <section className="admin-wallet-section">
  <div className="admin-wallet-section-header">
    <div>
      <h2>Refund Management</h2>
      <p>Review, approve and process customer refund requests.</p>
    </div>
    <span className="refund-count">
      {refunds.length} Requests
    </span>
  </div>

  {refundError && (
    <div className="admin-wallet-error">{refundError}</div>
  )}

  {refundLoading ? (
    <p>Loading refund requests...</p>
  ) : refunds.length === 0 ? (
    <p className="admin-wallet-empty">No refund requests found.</p>
  ) : (
    <div className="admin-wallet-table-wrapper">
      <table className="admin-wallet-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Shipment</th>
            <th>Amount</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Admin Note</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {refunds.map((refund) => (
            <tr key={refund.id}>
              <td>
                {refund.user?.name || refund.user?.email || 'Customer'}
              </td>

              <td>
                {refund.shipment?.docketNumber ||
                  refund.shipment?.trackingId ||
                  'General refund'}
              </td>

              <td>
                ₹{Number(refund.amount).toFixed(2)}
              </td>

              <td>{refund.reason}</td>

              <td>
                <span className={`refund-status refund-${refund.status?.toLowerCase()}`}>
                  {refund.status}
                </span>
              </td>

              <td>{refund.adminNote || '—'}</td>

              <td>
                <div className="refund-actions">
                  {refund.status === 'PENDING' && (
                    <>
                      <button
                        className="refund-approve-btn"
                        disabled={refundActionLoading === refund.id}
                        onClick={() => handleRefundAction(refund.id, 'approve')}
                      >
                        Approve
                      </button>

                      <button
                        className="refund-reject-btn"
                        disabled={refundActionLoading === refund.id}
                        onClick={() => handleRefundAction(refund.id, 'reject')}
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {refund.status === 'APPROVED' && (
                    <button
                      className="refund-process-btn"
                      disabled={refundActionLoading === refund.id}
                      onClick={() => handleRefundAction(refund.id, 'process')}
                    >
                      {refundActionLoading === refund.id
                        ? 'Processing...'
                        : 'Process Refund'}
                    </button>
                  )}

                  {refund.status === 'COMPLETED' && (
                    <span className="refund-completed-text">
                      Wallet Credited
                    </span>
                  )}

                  {refund.status === 'REJECTED' && (
                    <span className="refund-rejected-text">
                      Rejected
                    </span>
                  )}
                </div>
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
