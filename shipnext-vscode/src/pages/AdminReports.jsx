
import API_URL from '../config/api';
import { useState, useEffect } from 'react';
import './AdminReports.css';

const reportTypes = [
  { id: 'wallet', title: 'Wallet Report', description: 'Customer balances, credits and debits' },
  { id: 'revenue', title: 'Revenue Report', description: 'Revenue collected over a selected period' },
  { id: 'onboarding', title: 'Client Onboarding Report', description: 'New customer registrations and dates' },
  { id: 'shipments', title: 'Shipment Report', description: 'Bookings, deliveries, cancellations and RTO' },
  { id: 'ledger', title: 'Ledger Report', description: 'Complete transaction and account entries' },
  { id: 'outstanding', title: 'Outstanding Report', description: 'Pending payments and outstanding amounts' },
  { id: 'invoices', title: 'Invoice Report', description: 'Invoice numbers, amounts and generated dates' },
  { id: 'ndr', title: 'NDR Report', description: 'Failed delivery attempts, NDR reasons, actions and resolutions' },
];

function getReportDates(period, startDate, endDate) {
  const today = new Date();

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const end = new Date(today);
  const start = new Date(today);

  if (period === 'weekly') {
    start.setDate(today.getDate() - 6);
  } else if (period === 'monthly') {
    start.setDate(1);
  } else if (period === 'yearly') {
    start.setMonth(0, 1);
  } else if (period === 'custom') {
    return { from: startDate, to: endDate };
  }

  return {
    from: formatDate(start),
    to: formatDate(end),
  };
}

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

  const flattenedRows = reportRecords.map(record => flattenRecord(record));
  const columns = [...new Set(flattenedRows.flatMap(row => Object.keys(row)))];

  const ndrSummary = {
    total: reportRecords.length,
    open: reportRecords.filter(r => r.status === 'OPEN').length,
    actionRequired: reportRecords.filter(r => r.status === 'ACTION_REQUIRED').length,
    reattempt: reportRecords.filter(r => r.status === 'REATTEMPT_SCHEDULED').length,
    resolved: reportRecords.filter(r => r.status === 'RESOLVED').length,
    rto: reportRecords.filter(r => r.status === 'RTO_INITIATED').length,
  };

  const handleDownloadCSV = () => {
    if (!reportRecords.length) {
      alert('There are no records to download.');
      return;
    }

    const escapeCSV = value =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    const csv = [
      columns.map(escapeCSV).join(','),
      ...flattenedRows.map(row =>
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
        let reportUrl;

        if (selectedReport === 'ndr') {
          const dates = getReportDates(period, startDate, endDate);
          const params = new URLSearchParams({
            from: dates.from,
            to: dates.to,
          });

          reportUrl = `${API_URL}/api/ndr/admin?${params.toString()}`;
        } else {
          const params = new URLSearchParams({
            type: selectedReport,
            period,
          });

          if (period === 'custom') {
            params.set('startDate', startDate);
            params.set('endDate', endDate);
          }

          reportUrl = `${API_URL}/api/admin/reports?${params.toString()}`;
        }

        const response = await fetch(reportUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Unable to load report');
        }

        setReportData(selectedReport === 'ndr' ? result : result.data);
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
    <div className="admin-layout sn-reports-page">
      <aside className="admin-sidebar sn-reports-sidebar">
        <div className="sn-reports-brand">
          <img src="/logo.jpeg" alt="ShipNext Logo" />
          <span>ADMINISTRATION</span>
        </div>

        <p className="admin-menu-title">MAIN MENU</p>
        <a href="/admin">Dashboard</a>
        <a href="/admin/customers">Customers</a>
        <a href="/admin/shipments">Shipments</a>
        <a href="/admin/bookings">Bookings</a>
        <a href="/admin/wallet">Wallet Management</a>
        <a href="/admin/enquiries">Enquiries</a>
        <a href="/admin/support">Support Tickets</a>
        <a href="/admin/reports" className="admin-active">Reports & Analytics</a>

        <p className="admin-menu-title">ACCOUNT</p>
        <a href="/">View Website</a>
        <a href="/login">Logout</a>

        <div className="sn-reports-sidebar-footer">
          <span>SHIPNEXT</span>
          <small>LOGISTICS MANAGEMENT</small>
        </div>
      </aside>

      <main className="admin-main sn-reports-main">
        <header className="sn-reports-header">
          <div>
            <span className="sn-reports-eyebrow">BUSINESS INTELLIGENCE</span>
            <h1>Reports <span>& Analytics</span></h1>
            <p>Monitor business performance and generate detailed operational reports.</p>
          </div>

          <div className="sn-reports-admin-label">
            <span className="sn-reports-status-dot" />
            Administrator
          </div>
        </header>

        <section className="sn-reports-overview">
          <div>
            <span className="sn-reports-section-label">REPORTING CENTER</span>
            <h2>Business Intelligence Hub</h2>
            <p>Choose a reporting period and select the data you want to analyse.</p>
          </div>
         
        </section>

        <section className="sn-reports-panel">
          <div className="sn-reports-panel-heading">
            <div>
              <span className="sn-reports-section-label">01 / TIME RANGE</span>
              <h2>Select Report Period</h2>
            </div>
            <span className="sn-reports-panel-note">Choose your reporting window</span>
          </div>

          <div className="sn-reports-periods">
            {['daily', 'weekly', 'monthly', 'yearly', 'custom'].map(option => (
              <button
                key={option}
                type="button"
                className={period === option ? 'sn-period-active' : ''}
                onClick={() => setPeriod(option)}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="sn-reports-date-filters">
              <label>
                START DATE
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={e => setStartDate(e.target.value)}
                />
              </label>

              <label>
                END DATE
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

        <section className="sn-reports-panel">
          <div className="sn-reports-panel-heading">
            <div>
              <span className="sn-reports-section-label">02 / REPORT LIBRARY</span>
              <h2>Available Reports</h2>
            </div>
            <span className="sn-reports-count">{reportTypes.length} REPORT TYPES</span>
          </div>

          <div className="sn-reports-grid">
            {reportTypes.map((report, index) => (
              <button
                type="button"
                key={report.id}
                className={`sn-report-type-card ${selectedReport === report.id ? 'sn-report-selected' : ''}`}
                onClick={() => setSelectedReport(report.id)}
              >
                <span className="sn-report-card-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <strong>{report.title}</strong>
                <small>{report.description}</small>
                <span className="sn-report-card-action">
                  {selectedReport === report.id ? 'SELECTED' : 'VIEW REPORT'}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="sn-reports-panel sn-reports-results-panel">
          <div className="sn-reports-panel-heading">
            <div>
              <span className="sn-reports-section-label">03 / GENERATED DATA</span>
              <h2>Selected Report</h2>
            </div>
            <span className="sn-reports-live-label">REPORT PREVIEW</span>
          </div>

          <div className="sn-reports-selected-info">
            <div>
              <span className="sn-reports-selected-overline">CURRENT SELECTION</span>
              <h3>{selected.title}</h3>
              <p>{selected.description}</p>
            </div>
            <div className="sn-reports-period-badge">
              {period.toUpperCase()}
            </div>
          </div>

          {period === 'custom' && (!startDate || !endDate) && (
            <div className="sn-reports-notice">
              Select both start and end dates to generate your custom report.
            </div>
          )}

          {loading && (
            <div className="sn-reports-loading">
              <span className="sn-reports-loader" />
              <p>Generating your report...</p>
            </div>
          )}

          {error && (
            <div className="sn-reports-error">{error}</div>
          )}

          {!loading && reportData && (
            <div className="sn-report-results sn-print-content">
              {selectedReport === 'ndr' && (
                <div className="sn-ndr-summary-grid">
                  {[
                    ['Total NDR', ndrSummary.total],
                    ['Open', ndrSummary.open],
                    ['Action Required', ndrSummary.actionRequired],
                    ['Reattempt Scheduled', ndrSummary.reattempt],
                    ['Resolved', ndrSummary.resolved],
                    ['RTO Initiated', ndrSummary.rto],
                  ].map(([label, value]) => (
                    <div className="sn-ndr-summary-card" key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="sn-report-results-header">
                <div>
                  <h3>{selected.title}</h3>
                  <p>{reportRecords.length} records found</p>
                </div>

                <div className="sn-report-download-actions">
                  <button type="button" onClick={handleDownloadCSV}>
                    Download CSV
                  </button>
                  <button type="button" onClick={handleDownloadPDF}>
                    Print / Save PDF
                  </button>
                </div>
              </div>

              {selectedReport === 'revenue' && (
                <div className="sn-revenue-card">
                  <span>BOOKED SHIPPING VALUE</span>
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
                <div className="sn-report-table-wrapper">
                  <table className="sn-report-table">
                    <thead>
                      <tr>
                        {columns.map(column => (
                          <th key={column}>{column.replace(/_/g, ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {flattenedRows.map((row, index) => (
                        <tr key={reportRecords[index].id || index}>
                          {columns.map(column => {
                            const value = row[column];
                            return (
                              <td key={column}>
                                {value === null || value === undefined || value === ''
                                  ? '—'
                                  : typeof value === 'object'
                                    ? JSON.stringify(value)
                                    : String(value)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="sn-reports-empty">
                  <span>NO DATA AVAILABLE</span>
                  <h3>No records found</h3>
                  <p>There are no records for this report and selected period.</p>
                </div>
              )}
            </div>
          )}
        </section>

        <footer className="sn-reports-footer">
          <span>SHIPNEXT BUSINESS INTELLIGENCE</span>
          <span>CONFIDENTIAL ADMINISTRATIVE DATA</span>
        </footer>
      </main>
    </div>
  );
}

export default AdminReports;
