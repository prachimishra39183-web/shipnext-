import API_URL from '../config/api';
import { useState, useEffect } from 'react';

const reportTypes = [
  { id: 'wallet', title: 'Wallet Report', description: 'Customer balances, credits and debits', icon: '💳' },
  { id: 'revenue', title: 'Revenue Report', description: 'Revenue collected over a selected period', icon: '📈' },
  { id: 'onboarding', title: 'Client Onboarding Report', description: 'New customer registrations and dates', icon: '👥' },
  { id: 'shipments', title: 'Shipment Report', description: 'Bookings, deliveries, cancellations and RTO', icon: '📦' },
  { id: 'ledger', title: 'Ledger Report', description: 'Complete transaction and account entries', icon: '📒' },
  { id: 'outstanding', title: 'Outstanding Report', description: 'Pending payments and outstanding amounts', icon: '⏳' },
  { id: 'invoices', title: 'Invoice Report', description: 'Invoice numbers, amounts and generated dates', icon: '🧾' },
];

function AdminReports() {
const [period, setPeriod] = useState('monthly');
const [selectedReport, setSelectedReport] = useState('wallet');
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');
const [reportData, setReportData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');



  const selected = reportTypes.find(report => report.id === selectedReport);
  const flattenRecord = (record, prefix = '') => {
  return Object.entries(record).reduce((result, [key, value]) => {
    const field = prefix ? `${prefix}_${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenRecord(value, field));
    } else {
      result[field] = value ?? '';
    }

    return result;
  }, {});
};

const reportRecords = Array.isArray(reportData)
  ? reportData
  : Array.isArray(reportData?.records)
    ? reportData.records
    : [];

const handleDownloadCSV = () => {
  if (!reportRecords.length) {
    alert('There are no records to download.');
    return;
  }

  const rows = reportRecords.map(record => flattenRecord(record));
  const columns = [...new Set(rows.flatMap(row => Object.keys(row)))];

  const escapeCSV = value =>
    `"${String(value ?? '').replace(/"/g, '""')}"`;

  const csv = [
    columns.map(escapeCSV).join(','),
    ...rows.map(row =>
      columns.map(column => escapeCSV(row[column])).join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csv], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `shipnext-${selectedReport}-${period}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};

const handleDownloadPDF = () => {
  window.print();
};
 

useEffect(() => {
  if (period === 'custom' && (!startDate || !endDate)) {
    setReportData(null);
    return;
  }

  const fetchReport = async () => {
    setLoading(true);
    setError('');

    try {
      const token = sessionStorage.getItem('shipnextToken');

      const params = new URLSearchParams({
        type: selectedReport,
        period,
      });

      if (period === 'custom') {
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }

      const response = await fetch(
        `${API_URL}/api/admin/reports?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Unable to load report');
      }

      setReportData(result.data);
    } catch (err) {
      setError(err.message);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  fetchReport();
}, [selectedReport, period, startDate, endDate]);

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <img src="/logo.png" alt="ShipNext Logo" className="logo-image" />
        <span>Admin</span>

        <p className="admin-menu-title">MAIN MENU</p>
        <a href="/admin">Dashboard</a>
        <a href="/admin/customers">Customers</a>
        <a href="/admin/shipments">Shipments</a>
        <a href="/admin/bookings">Bookings</a>
        <a href="/admin/wallet">Wallet Management</a>
        <a href="/admin/enquiries">Enquiries</a>
        <a href="/admin/support">Support Tickets</a>
        <a href="/admin/reports" className="admin-active">Reports</a>

        <p className="admin-menu-title">ACCOUNT</p>
        <a href="/">View Website</a>
        <a href="/login">Logout</a>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Reports & Analytics</h1>
            <p>Generate and download your ShipNext business reports.</p>
          </div>
          <div className="admin-user">👤 Administrator</div>
        </header>

        <section className="admin-content-card">
          <h2>Select Report Period</h2>

          <div className="report-period-options">
            {['weekly', 'monthly', 'yearly', 'custom'].map(option => (
              <button
                key={option}
                type="button"
                className={period === option ? 'report-period-active' : 'report-period-button'}
                onClick={() => setPeriod(option)}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="report-date-filters">
              <label>
                Start Date
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </label>

              <label>
                End Date
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={e => setEndDate(e.target.value)}
                />
              </label>
            </div>
          )}
        </section>

        <section className="admin-content-card">
          <h2>Available Reports</h2>

          <div className="reports-grid">
            {reportTypes.map(report => (
              <button
                type="button"
                key={report.id}
                className={`report-type-card ${selectedReport === report.id ? 'report-type-selected' : ''}`}
                onClick={() => setSelectedReport(report.id)}
              >
                <span className="report-icon">{report.icon}</span>
                <strong>{report.title}</strong>
                <small>{report.description}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="admin-content-card">
          <h2>Selected Report</h2>

          <div className="selected-report-info">
            <span className="report-icon">{selected.icon}</span>
            <div>
              <h3>{selected.title}</h3>
              <p>{selected.description}</p>
              <small>
                Period: {period.charAt(0).toUpperCase() + period.slice(1)}
              </small>
            </div>
          </div>

          {period === 'custom' && (!startDate || !endDate) && (
            <p>Please select both start and end dates to generate a custom report.</p>
          )}

         {loading && <p>Loading report...</p>}

{error && <p style={{ color: '#d93025' }}>{error}</p>}
{reportData && (
  <div className="report-results">
    <div className="report-results-header">
      <div>
        <h3>{selected.title}</h3>
        <p>{reportRecords.length} records found</p>
      </div>

      <div className="report-download-actions">
        <button type="button" onClick={handleDownloadCSV}>
          ↓ Download Excel / CSV
        </button>

        <button type="button" onClick={handleDownloadPDF}>
          ↓ Download PDF
        </button>
      </div>
    </div>

    {selectedReport === 'revenue' && (
      <div className="report-summary-card">
        <span>Booked Shipping Value</span>
        <strong>
          ₹{Number(reportData.bookedShippingValue || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </strong>
        <small>{reportData.note}</small>
      </div>
    )}

    {reportRecords.length > 0 ? (
      <div className="report-table-wrapper">
        <table className="report-table">
          <thead>
            <tr>
              {Object.keys(flattenRecord(reportRecords[0])).map(column => (
                <th key={column}>{column.replace(/_/g, ' ')}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {reportRecords.map((record, index) => {
              const flatRecord = flattenRecord(record);

              return (
                <tr key={record.id || index}>
                  {Object.values(flatRecord).map((value, cellIndex) => (
                    <td key={cellIndex}>
                      {String(value ?? '—')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="report-empty">
        No records found for this selected period.
      </p>
    )}
  </div>
)}
        </section>
      </main>
    </div>
  );
}

export default AdminReports;
