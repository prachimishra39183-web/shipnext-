
import { useState } from 'react';
import './Settlement.css';

function Settlement() {
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('2026-10-28');
  const [toDate, setToDate] = useState('2026-11-28');
  const [showSettings, setShowSettings] = useState(false);

  const downloadReport = () => {
    const headers = [
      'Settlement ID',
      'Type',
      'Receivable Amount',
      'Settlement Amount',
      'Settlement Date',
      'Transaction ID',
      'Transaction Status',
      'Report'
    ];

    const csv = headers.join(',');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'shipnext-settlement-report.csv';
    link.click();

    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch('');
    setFromDate('2026-10-28');
    setToDate('2026-11-28');
  };

  return (
    <div className="sn-settlement-page">

      {/* TOP SETTLEMENT FILTER AREA */}
      <div className="sn-settlement-top-panel">

        <div className="sn-settlement-top-row">
          <h1>Settlement</h1>

          <div className="sn-settlement-filters">

            <div className="sn-date-range">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />

              <span>→</span>

              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="sn-info-button"
              title="Settlement information"
            >
              i
            </button>

            <div className="sn-settlement-search">
              <input
                type="text"
                placeholder="Settlement ID & Transaction ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <button type="button" title="Search">
                <svg viewBox="0 0 24 24" width="19" height="19"
                  fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m16 16 4 4" />
                </svg>
              </button>
            </div>

          </div>
        </div>

        {/* STATUS AND SUMMARY */}
        <div className="sn-settlement-status-row">

          <div className="sn-settlement-status-area">
            <p>Settlement Status</p>

            <div className="sn-settlement-done-box">
              <span>Done</span>
              <strong>0</strong>
            </div>
          </div>

          <div className="sn-settlement-summary">

            <div className="sn-settlement-summary-card">
              <span>Next Due Settlement</span>
              <strong>-</strong>
            </div>

            <div className="sn-settlement-summary-card">
              <span>Done Settlement</span>
              <strong>₹0.00</strong>
            </div>

            <div className="sn-settlement-summary-card">
              <span>
                Due Settlement
                <small title="Amount pending settlement">ⓘ</small>
              </span>
              <strong>₹0.00</strong>
            </div>

          </div>
        </div>
      </div>

      {/* DONE SETTLEMENTS */}
      <div className="sn-settlement-table-panel">

        <div className="sn-settlement-table-toolbar">

          <h2>Done Settlements</h2>

          <div className="sn-settlement-toolbar-actions">

            <button
              type="button"
              className="sn-due-report-button"
              onClick={downloadReport}
            >
              <span>↓</span>
              Due Settlement Report
            </button>

            <button
              type="button"
              className="sn-settlement-icon-button"
              onClick={downloadReport}
              title="Download report"
            >
              ↓
            </button>

            <button
              type="button"
              className="sn-settlement-icon-button"
              onClick={() => window.location.reload()}
              title="Refresh"
            >
              ↻
            </button>

            <div className="sn-settlement-settings-wrap">
              <button
                type="button"
                className="sn-settlement-icon-button"
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
              >
                ⚙
              </button>

              {showSettings && (
                <div className="sn-settlement-settings-menu">
                  <strong>Table Settings</strong>
                  <p>All settlement columns are currently displayed.</p>
                </div>
              )}
            </div>

            <button
              type="button"
              className="sn-clear-filters"
              onClick={clearFilters}
            >
              Clear Filters
            </button>

          </div>
        </div>

        {/* SETTLEMENT TABLE */}
        <div className="sn-settlement-table-wrapper">

          <table className="sn-settlement-table">
            <thead>
              <tr>
                <th className="sn-check-column">
                  <input type="checkbox" disabled />
                </th>
                <th>Settlement ID <span>☷</span></th>
                <th>Type <span>☷</span></th>
                <th>Receivable Amount <span>☷</span></th>
                <th>Settlement Amount <span>ⓘ</span></th>
                <th>Settlement Date <span>▦</span></th>
                <th>Transaction ID <span>☷</span></th>
                <th>Transaction Status</th>
                <th>Report</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan="9">
                  <div className="sn-settlement-no-data">
                    <svg
                      width="72"
                      height="62"
                      viewBox="0 0 72 62"
                      fill="none"
                    >
                      <path
                        d="M8 22L20 8H52L64 22V49C64 52 61 55 58 55H14C11 55 8 52 8 49V22Z"
                        stroke="#D5DDE8"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M8 22H25L28 29H44L47 22H64"
                        stroke="#D5DDE8"
                        strokeWidth="1.5"
                      />
                    </svg>

                    <p>No Data</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>

    </div>
  );
}

export default Settlement;
