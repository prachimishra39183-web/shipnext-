
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
import './CustomerCodRemittance.css';

const money = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function CustomerCodRemittance() {
  const [shipments, setShipments] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError('');

      const token = sessionStorage.getItem('shipnextToken');

      const response = await fetch(
        `${API_URL}/api/cod-remittance/customer`,
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

  return (
    <div className="customer-cod-page">
      <div className="customer-cod-header">
        <div>
          <span>PAYMENTS & SETTLEMENTS</span>
          <h1>COD Remittance</h1>
          <p>Track your cash-on-delivery collections and settlements.</p>
        </div>
            
        <button onClick={fetchRecords}>↻ Refresh</button>
         <Link to="/dashboard" className="sn-track-back">
          Back to Dashboard
        </Link>
      </div>
      
      {error && <div className="customer-cod-error">{error}</div>}

      <div className="customer-cod-summary">
        <div className="customer-cod-card">
          <span>Total COD Amount</span>
          <strong>{money(summary.totalCOD)}</strong>
        </div>

        <div className="customer-cod-card">
          <span>COD Charges</span>
          <strong>{money(summary.totalCharges)}</strong>
        </div>

        <div className="customer-cod-card">
          <span>Remittance Received</span>
          <strong>{money(summary.remitted)}</strong>
        </div>

        <div className="customer-cod-card">
          <span>Remittance Pending</span>
          <strong>{money(summary.pending)}</strong>
        </div>
      </div>

      <div className="customer-cod-table-panel">
        <div className="customer-cod-table-heading">
          <h2>Shipment-wise COD Details</h2>
          <span>{shipments.length} Shipments</span>
        </div>

        {loading ? (
          <div className="customer-cod-empty">Loading records...</div>
        ) : shipments.length === 0 ? (
          <div className="customer-cod-empty">
            No COD shipments found yet.
          </div>
        ) : (
          <div className="customer-cod-table-scroll">
            <table className="customer-cod-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>COD Amount</th>
                  <th>COD Fee</th>
                  <th>Net Amount</th>
                  <th>Collection</th>
                  <th>Courier Remittance</th>
                  <th>Customer Settlement</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {shipments.map((shipment) => (
                  <tr key={shipment.id}>
                    <td>
                      <strong>{shipment.trackingId}</strong>
                      <small>{shipment.docketNumber || 'No docket'}</small>
                    </td>

                    <td>{money(shipment.codAmount)}</td>
                    <td>{money(shipment.codCharge)}</td>
                    <td><strong>{money(shipment.codNetAmount)}</strong></td>

                    <td>{shipment.codCollectionStatus || 'PENDING'}</td>

                    <td>
                      <span className={`customer-cod-status ${
                        shipment.codRemittanceStatus === 'REMITTED'
                          ? 'completed' : 'pending'
                      }`}>
                        {shipment.codRemittanceStatus || 'PENDING'}
                      </span>
                    </td>

                    <td>
                      <span className={`customer-cod-status ${
                        shipment.codSettlementStatus === 'SETTLED'
                          ? 'completed' : 'pending'
                      }`}>
                        {shipment.codSettlementStatus || 'PENDING'}
                      </span>
                    </td>

                    <td>
                      {new Date(shipment.createdAt).toLocaleDateString('en-IN')}
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
