
import { useEffect, useState } from 'react';
import API_URL from '../config/api';
import './AdminRefunds.css';
function AdminRefunds() {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [type, setType] = useState('CREDIT');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [historyType, setHistoryType] = useState('');

  const token = sessionStorage.getItem('shipnextToken');

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // LOAD ADMIN WALLET ADJUSTMENT HISTORY
  const loadTransactions = async (currentPage = page, filter = historyType) => {
    setHistoryLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(currentPage),
      });

      if (filter) params.set('type', filter);

      const response = await fetch(
        `${API_URL}/api/wallet/admin/transactions?${params}`,
        { headers: authHeaders }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load transactions.');
      }

      setTransactions(data.transactions || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions(1, '');
  }, []);

  // CUSTOMER SEARCH WITH DEBOUNCE
  useEffect(() => {
    if (search.trim().length < 2 || selectedCustomer) {
      setCustomers([]);
      setSearching(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setSearching(true);

      try {
        const response = await fetch(
          `${API_URL}/api/wallet/admin/customers?search=${encodeURIComponent(search.trim())}`,
          { headers: authHeaders }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Customer search failed.');
        }

        if (!cancelled) {
          setCustomers(data.customers || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, selectedCustomer]);

  // SELECT CUSTOMER
  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSearch(customer.name);
    setCustomers([]);
    setError('');
    setMessage('');
  };

  // RESET CUSTOMER SELECTION
  const clearCustomer = () => {
    setSelectedCustomer(null);
    setSearch('');
    setCustomers([]);
    setAmount('');
    setReason('');
  };

  // SUBMIT WALLET ADJUSTMENT
  const submitAdjustment = async (event) => {
    event.preventDefault();

    setError('');
    setMessage('');

    if (!selectedCustomer) {
      setError('Please select a customer.');
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(amount) ||
        Number(amount) <= 0 ||
        Number(amount) > 1000000) {
      setError('Enter a valid amount between ₹0.01 and ₹10,00,000.');
      return;
    }

    if (reason.trim().length < 5 || reason.trim().length > 500) {
      setError('Reason must contain between 5 and 500 characters.');
      return;
    }

    const action = type === 'CREDIT' ? 'credit' : 'debit';

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ₹${amount} ${type === 'CREDIT' ? 'to' : 'from'} ${selectedCustomer.name}'s wallet?`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/wallet/admin/adjust`,
        {
          method: 'POST',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: selectedCustomer.id,
            type,
            amount,
            reason: reason.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Wallet adjustment failed.');
      }

      setMessage(
        `${data.message} New balance: ₹${data.balance}`
      );

      setSelectedCustomer({
        ...selectedCustomer,
        walletBalance: data.balance,
      });

      setAmount('');
      setReason('');

      await loadTransactions(1, historyType);
      setPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const changeHistoryFilter = (value) => {
    setHistoryType(value);
    setPage(1);
    loadTransactions(1, value);
  };

  const changePage = (nextPage) => {
    setPage(nextPage);
    loadTransactions(nextPage, historyType);
  };

  return (
    <div className="admin-refunds-page">

      <div className="admin-refunds-header">
        <div>
          <span>ADMIN CONTROL</span>
          <h1>Wallet Adjustments</h1>
          <p>
            Manage customer wallet credits, debits and financial adjustments.
          </p>
        </div>
      </div>

      {message && (
        <div className="refund-success">
          {message}
        </div>
      )}

      {error && (
        <div className="refund-error">
          {error}
        </div>
      )}

      <div className="refund-adjustment-card">
        <div className="refund-section-heading">
          <div>
            <span>FINANCIAL OPERATIONS</span>
            <h2>Customer Wallet Adjustment</h2>
            <p>Select a customer and enter the adjustment details.</p>
          </div>
        </div>

        <form onSubmit={submitAdjustment}>

          <label>Search Customer</label>

          <div className="refund-search-field">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSelectedCustomer(null);
                setError('');
                setMessage('');
              }}
              placeholder="Search name, email, phone or company"
              autoComplete="off"
            />

            {searching && <span>Searching...</span>}
          </div>

          {customers.length > 0 && (
            <div className="refund-customer-results">
              {customers.map((customer) => (
                <button
                  type="button"
                  key={customer.id}
                  onClick={() => selectCustomer(customer)}
                >
                  <strong>{customer.name}</strong>
                  <span>{customer.email}</span>
                  <small>
                    {customer.phone || 'No phone'} · Wallet: ₹
                    {customer.walletBalance}
                  </small>
                </button>
              ))}
            </div>
          )}

          {search.trim().length >= 2 &&
            !searching &&
            customers.length === 0 &&
            !selectedCustomer && (
              <p className="refund-no-customer">
                No matching customers found.
              </p>
            )}

          {selectedCustomer && (
            <div className="refund-selected-customer">
              <div>
                <strong>{selectedCustomer.name}</strong>
                <span>{selectedCustomer.email}</span>
                <small>{selectedCustomer.phone || 'No phone number'}</small>
              </div>

              <div>
                <small>AVAILABLE WALLET BALANCE</small>
                <strong>₹{selectedCustomer.walletBalance}</strong>
              </div>

              <button
                type="button"
                onClick={clearCustomer}
                aria-label="Change customer"
              >
                Change
              </button>
            </div>
          )}

         <label>Choose Wallet Action</label>

<div className="wallet-action-buttons">
  <button
    type="button"
    className={type === 'CREDIT' ? 'active credit' : 'credit'}
    onClick={() => setType('CREDIT')}
  >
    <span>＋</span>
    CREDIT
  </button>

  <button
    type="button"
    className={type === 'DEBIT' ? 'active debit' : 'debit'}
    onClick={() => setType('DEBIT')}
  >
    <span>−</span>
    DEBIT
  </button>
</div>
          <label>Adjustment Amount (₹)</label>

          <input
            type="number"
            min="0.01"
            max="1000000"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Enter amount"
            required
          />

          <label>Reason for Adjustment</label>

          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Enter a clear reason for this financial adjustment..."
            minLength={5}
            maxLength={500}
            rows={4}
            required
          />

          <div className="refund-form-footer">
            <p>
              Every adjustment is recorded with the admin ID, reason,
              transaction reference and previous/new wallet balance.
            </p>

            <button
              type="submit"
              disabled={loading || !selectedCustomer}
            >
              {loading
                ? 'Processing...'
                : type === 'CREDIT'
                  ? 'Credit Customer Wallet'
                  : 'Debit Customer Wallet'}
            </button>
          </div>

        </form>
      </div>

      <div className="refund-history-card">

        <div className="refund-history-header">
          <div>
            <span>FINANCIAL RECORDS</span>
            <h2>Adjustment History</h2>
            <p>Admin-performed wallet credits and debits.</p>
          </div>

          <select
            value={historyType}
            onChange={(event) => changeHistoryFilter(event.target.value)}
          >
            <option value="">All Adjustments</option>
            <option value="CREDIT">Credits</option>
            <option value="DEBIT">Debits</option>
          </select>
        </div>

        <div className="refund-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance Before</th>
                <th>Balance After</th>
                <th>Reason</th>
                <th>Performed By</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {historyLoading ? (
                <tr>
                  <td colSpan="8">Loading adjustment history...</td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <strong>{transaction.user?.name || '—'}</strong>
                      <small>{transaction.user?.email || '—'}</small>
                    </td>

                    <td>
                      <span className={`refund-type ${transaction.type.toLowerCase()}`}>
                        {transaction.type}
                      </span>
                    </td>

                    <td>₹{transaction.amount}</td>

                    <td>
                      {transaction.balanceBefore != null
                        ? `₹${transaction.balanceBefore}`
                        : '—'}
                    </td>

                    <td>
                      {transaction.balanceAfter != null
                        ? `₹${transaction.balanceAfter}`
                        : '—'}
                    </td>

                    <td>{transaction.reason || transaction.description || '—'}</td>

                    <td>
                      <strong>
                        {transaction.performedByAdmin?.name || '—'}
                      </strong>
                      <small>
                        {transaction.performedByAdmin?.email || ''}
                      </small>
                    </td>

                    <td>
                      {new Date(transaction.createdAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">No admin wallet adjustments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="refund-pagination">
          <span>
            Page {page} of {totalPages}
          </span>

          <div>
            <button
              type="button"
              disabled={page <= 1 || historyLoading}
              onClick={() => changePage(page - 1)}
            >
              Previous
            </button>

            <button
              type="button"
              disabled={page >= totalPages || historyLoading}
              onClick={() => changePage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminRefunds;
