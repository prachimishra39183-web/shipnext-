
import { useEffect, useState } from 'react';
import API_URL from '../config/api';
import './AdminCodRemittance.css';

const money = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function AdminCodRemittance() {
  const [shipments, setShipments] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState('');

  const token = sessionStorage.getItem('shipnextToken');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_URL}/api/cod-remittance/admin`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load COD records.');
      }

      setShipments(data.shipments || []);
      setSummary(data.summary || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const updateStatus = async (shipmentId, action) => {
    const isRemit = action === 'remit';

    const reference = window.prompt(
      isRemit
        ? 'Enter courier remittance reference (optional):'
        : 'Enter customer settlement reference (optional):'
    );

    if (reference === null) return;

    try {
      setProcessing(shipmentId);
      setError('');
      setMessage('');

      const response = await fetch(
        `${API_URL}/api/cod-remittance/${shipmentId}/${action}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reference: reference.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update record.');
      }

      setMessage(data.message);
      await fetchRecords();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing('');
    }
  };

  return (
    <div className="cod-admin-page">
      <div className="cod-admin-header">
        <div>
          <span className="cod-eyebrow">FINANCE MANAGEMENT</span>
          <h1>COD Remittance</h1>
       
        </div>

        <button className="cod-refresh-btn" onClick={fetchRecords}>
          ↻ Refresh
        </button>
      </div>

      {error && <div className="cod-alert error">{error}</div>}
      {message && <div className="cod-alert success">{message}</div>}

      <div className="cod-summary-grid">
        <div className="cod-summary-card">
          <span>Total COD Collected</span>
          <strong>{money(summary.totalCOD)}</strong>
        </div>

        <div className="cod-summary-card">
          <span>COD Charges</span>
          <strong>{money(summary.totalCharges)}</strong>
        </div>

        <div className="cod-summary-card">
          <span>Courier Remitted</span>
          <strong>{money(summary.remitted)}</strong>
        </div>

        <div className="cod-summary-card">
          <span>Courier Pending</span>
          <strong>{money(summary.pending)}</strong>
        </div>
      </div>

      <div className="cod-table-panel">
        <div className="cod-table-heading">
          <div>
            <h2>COD Shipment Records</h2>
           
          </div>
          <span>{shipments.length} Records</span>
        </div>

        {loading ? (
          <div className="cod-empty">Loading COD records...</div>
        ) : shipments.length === 0 ? (
          <div className="cod-empty">No COD shipments found.</div>
        ) : (
          <div className="cod-table-scroll">
            <table className="cod-table">
              <thead>
                <tr>
                  <th>Shipment</th>
                  <th>Customer</th>
                  <th>COD Amount</th>
                  <th>COD Fee</th>
                  <th>Net Amount</th>
                  <th>Courier Remittance</th>
                  <th>Customer Settlement</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {shipments.map((shipment) => (
                  <tr key={shipment.id}>
                    <td>
                      <strong>{shipment.trackingId}</strong>
                      <small>{shipment.docketNumber || 'No docket'}</small>
                    </td>

                    <td>
                      <strong>{shipment.customer?.name || 'Customer'}</strong>
                      <small>{shipment.customer?.email || ''}</small>
                    </td>

                    <td>{money(shipment.codAmount)}</td>
                    <td>{money(shipment.codCharge)}</td>
                    <td><strong>{money(shipment.codNetAmount)}</strong></td>

                    <td>
                      <span className={`cod-status ${shipment.codRemittanceStatus === 'REMITTED' ? 'completed' : 'pending'}`}>
                        {shipment.codRemittanceStatus || 'PENDING'}
                      </span>
                    </td>

                    <td>
                      <span className={`cod-status ${shipment.codSettlementStatus === 'SETTLED' ? 'completed' : 'pending'}`}>
                        {shipment.codSettlementStatus || 'PENDING'}
                      </span>
                    </td>

                    <td>
                      {shipment.codRemittanceStatus !== 'REMITTED' ? (
                        <button
                          className="cod-action-btn"
                          disabled={processing === shipment.id}
                          onClick={() => updateStatus(shipment.id, 'remit')}
                        >
                          {processing === shipment.id ? 'Updating...' : 'Mark Received'}
                        </button>
                      ) : shipment.codSettlementStatus !== 'SETTLED' ? (
                        <button
                          className="cod-action-btn settle"
                          disabled={processing === shipment.id}
                          onClick={() => updateStatus(shipment.id, 'settle')}
                        >
                          {processing === shipment.id ? 'Updating...' : 'Settle Customer'}
                        </button>
                      ) : (
                        <span className="cod-done">Completed</span>
                      )}
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
