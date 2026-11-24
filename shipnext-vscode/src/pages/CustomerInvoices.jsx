
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Download,
  RefreshCw,
  Receipt,
  CalendarDays,
  Package,
} from 'lucide-react';
import API_URL from '../config/api';
import './CustomerInvoices.css';

export default function CustomerInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState('');
  const [error, setError] = useState('');

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
    `₹${Number(value || 0).toFixed(2)}`;

  const formatDate = (value) =>
    new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="customer-invoices-page">
      <div className="customer-invoices-header">
        <Link to="/dashboard" className="invoice-back-link">
          <ArrowLeft size={18} />
          Dashboard
        </Link>

        <div className="invoice-heading">
          <div className="invoice-heading-icon">
            <Receipt size={25} />
          </div>

          <div>
            <h1>My Invoices</h1>
            <p>View and download your ShipNext shipment invoices.</p>
          </div>
        </div>

        <button
          className="invoice-refresh-button"
          onClick={loadInvoices}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="invoice-error-message">
          {error}
        </div>
      )}

      <div className="invoice-summary-card">
        <div className="invoice-summary-icon">
          <FileText size={25} />
        </div>

        <div>
          <span>Total Invoices</span>
          <strong>{invoices.length}</strong>
        </div>
      </div>

      <div className="invoice-list-card">
        <div className="invoice-list-heading">
          <div>
            <h2>Invoice History</h2>
            <p>Your shipment billing records</p>
          </div>
        </div>

        {loading ? (
          <div className="invoice-loading">
            <RefreshCw className="invoice-spinner" size={25} />
            <p>Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="invoice-empty-state">
            <FileText size={42} />
            <h3>No invoices yet</h3>
            <p>
              Your invoice will appear here automatically after
              a shipment is successfully booked.
            </p>
            <Link to="/book-shipment">
              Book a Shipment
            </Link>
          </div>
        ) : (
          <div className="invoice-table-wrapper">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Docket Number</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <div className="invoice-number-cell">
                        <FileText size={18} />
                        <strong>{invoice.invoiceNumber}</strong>
                      </div>
                    </td>

                    <td>{invoice.docketNumber}</td>

                    <td>
                      <span className="invoice-date-cell">
                        <CalendarDays size={15} />
                        {formatDate(invoice.invoiceDate)}
                      </span>
                    </td>

                    <td className="invoice-amount">
                      {formatMoney(invoice.totalAmount)}
                    </td>

                    <td>
                      <span className={`invoice-payment-status ${
                        invoice.paymentStatus === 'PAID'
                          ? 'paid'
                          : 'pending'
                      }`}>
                        {invoice.paymentStatus}
                      </span>
                    </td>

                    <td>
                      <button
                        className="invoice-download-button"
                        onClick={() => downloadInvoice(invoice)}
                        disabled={downloading === invoice.id}
                      >
                        <Download size={16} />
                        {downloading === invoice.id
                          ? 'Downloading...'
                          : 'PDF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
