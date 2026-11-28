import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Download,
  RefreshCw,
  Receipt,
  Search,
  CalendarDays,
  Info,
  X,
} from 'lucide-react';
import API_URL from '../config/api';
import './CustomerInvoices.css';

export default function CustomerInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState('');
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const token = sessionStorage.getItem('shipnextToken');

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_URL}/api/customer-invoices`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load invoices.');
      }

      setInvoices(data.invoices || []);
    } catch (err) {
      setError(err.message || 'Unable to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        String(invoice.invoiceNumber || '').toLowerCase().includes(searchText) ||
        String(invoice.docketNumber || '').toLowerCase().includes(searchText);

      const invoiceDate = new Date(invoice.invoiceDate);
      const start = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
      const end = toDate ? new Date(`${toDate}T23:59:59`) : null;

      const matchesFrom = !start || invoiceDate >= start;
      const matchesTo = !end || invoiceDate <= end;

      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [invoices, search, fromDate, toDate]);

  const downloadInvoice = async (invoice) => {
    try {
      setDownloading(invoice.id);
      setError('');

      const response = await fetch(
        `${API_URL}/api/customer-invoices/${invoice.id}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'PDF download failed.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Unable to download invoice.');
    } finally {
      setDownloading('');
    }
  };

  const formatMoney = (value) =>
    `₹${Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (value) => {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const clearFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="customer-invoices-page">

      {/* HEADER */}
      <header className="customer-invoices-header">
        <Link to="/dashboard" className="invoice-back-link">
          <ArrowLeft size={18} />
          Dashboard
        </Link>

        <div className="invoice-header-title">
          <span>SHIPNEXT BILLING CENTRE</span>
          <h1>My Invoices</h1>
        </div>

        <button
          className="invoice-refresh-button"
          onClick={loadInvoices}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'invoice-spinning' : ''} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="invoice-error-message">
          <Info size={17} />
          {error}
        </div>
      )}

      {/* FILTER AND SUMMARY PANEL */}
      <section className="invoice-top-panel">

        <div className="invoice-top-row">
          <div className="invoice-active-tab">
            <FileText size={18} />
            Invoices
          </div>

          <div className="invoice-filter-controls">
            <div className="invoice-date-filter">
              <CalendarDays size={17} />

              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                aria-label="From date"
              />

              <span>to</span>

              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                aria-label="To date"
              />
            </div>

            <div className="invoice-info-icon" title="Filter invoices by date">
              <Info size={19} />
            </div>

            <div className="invoice-search-box">
              <input
                type="text"
                placeholder="Search invoice number or docket"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={19} />
            </div>
          </div>
        </div>

        <div className="invoice-summary-area">
          <span className="invoice-summary-label">Total Invoices</span>

          <div className="invoice-total-box">
            <span>Total</span>
            <strong>{invoices.length}</strong>
          </div>
        </div>

      </section>

      {/* INVOICE TABLE */}
      <section className="invoice-list-card">

        <div className="invoice-list-heading">
          <div>
            <h2>Invoices</h2>
            <p>View and download your shipment billing records</p>
          </div>

          <div className="invoice-table-actions">
            <span>
              Showing <strong>{filteredInvoices.length}</strong> of{' '}
              <strong>{invoices.length}</strong>
            </span>

            {(search || fromDate || toDate) && (
              <button
                className="invoice-clear-button"
                onClick={clearFilters}
              >
                <X size={14} />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="invoice-loading">
            <RefreshCw size={25} className="invoice-spinning" />
            <p>Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="invoice-empty-state">
            <div className="invoice-empty-icon">
              <Receipt size={32} />
            </div>

            <h3>
              {invoices.length === 0
                ? 'No invoices yet'
                : 'No matching invoices'}
            </h3>

            <p>
              {invoices.length === 0
                ? 'Your invoices will appear here after your shipments are successfully booked.'
                : 'Try changing your search or date filters.'}
            </p>

            {invoices.length === 0 ? (
              <Link to="/book-shipment">
                Book a Shipment
              </Link>
            ) : (
              <button onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="invoice-table-wrapper">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Docket Number</th>
                  <th>Invoice Date</th>
                  <th>Invoice Details</th>
                  <th>Payment Status</th>
                  <th>Download</th>
                </tr>
              </thead>

              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <div className="invoice-number-cell">
                        <FileText size={17} />
                        <strong>{invoice.invoiceNumber || '—'}</strong>
                      </div>
                    </td>

                    <td className="invoice-docket-cell">
                      {invoice.docketNumber || '—'}
                    </td>

                    <td>
                      <span className="invoice-date-cell">
                        <CalendarDays size={15} />
                        {formatDate(invoice.invoiceDate)}
                      </span>
                    </td>

                    <td>
                      <div className="invoice-details-cell">
                        <span>Invoice Amount</span>
                        <strong>{formatMoney(invoice.totalAmount)}</strong>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`invoice-payment-status ${
                          String(invoice.paymentStatus).toUpperCase() === 'PAID'
                            ? 'paid'
                            : 'pending'
                        }`}
                      >
                        <span className="invoice-status-dot"></span>
                        {invoice.paymentStatus || 'PENDING'}
                      </span>
                    </td>

                    <td>
                      <button
                        className="invoice-download-button"
                        onClick={() => downloadInvoice(invoice)}
                        disabled={downloading === invoice.id}
                      >
                        {downloading === invoice.id ? (
                          <RefreshCw size={16} className="invoice-spinning" />
                        ) : (
                          <Download size={16} />
                        )}

                        {downloading === invoice.id ? 'Downloading' : 'PDF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="invoice-table-footer">
          <span>
            Total records: <strong>{filteredInvoices.length}</strong>
          </span>
          <span>SHIPNEXT • Billing & Invoices</span>
        </div>

      </section>
    </div>
  );
}