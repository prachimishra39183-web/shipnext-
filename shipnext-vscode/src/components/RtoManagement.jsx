
import { useCallback, useEffect, useState } from 'react';
import {
  Package,
  RefreshCw,
  RotateCcw,
  CalendarDays,
  MapPin,
  CheckCircle2,
  Truck,
  Clock3,
} from 'lucide-react';
import API_URL from '../config/api';
import './RtoManagement.css';

const formatDate = (date) => {
  if (!date) return 'Awaiting update';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatStatus = (status) =>
  (status || 'INITIATED').replaceAll('_', ' ');

export default function RtoManagement() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const token = sessionStorage.getItem('shipnextToken');

      const response = await fetch(`${API_URL}/api/rto/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to load RTO records.');
      }

      setRecords(data.records || []);
    } catch (err) {
      setError(err.message || 'Unable to load RTO records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const activeCount = records.filter(
    (record) =>
      !['DELIVERED_TO_SELLER', 'CANCELLED'].includes(record.status)
  ).length;

  if (loading) {
    return (
      <div className="sn-rto-loading">
        <RefreshCw className="sn-rto-spin" size={22} />
        <p>Loading your return shipments...</p>
      </div>
    );
  }

  return (
    <div className="sn-rto-page">
      <div className="sn-rto-topbar">
        <div className="sn-rto-intro">
          <div className="sn-rto-main-icon">
            <RotateCcw size={23} />
          </div>
          <div>
            <h3>Return to Origin</h3>
            <p>Track shipments being returned to your registered address.</p>
          </div>
        </div>

        <button
          className="sn-rto-refresh"
          onClick={loadRecords}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      <div className="sn-rto-stats">
        <div className="sn-rto-stat-card">
          <span>Total RTO Shipments</span>
          <strong>{records.length}</strong>
          <div className="sn-rto-stat-icon blue">
            <Package size={19} />
          </div>
        </div>

        <div className="sn-rto-stat-card">
          <span>In Progress</span>
          <strong>{activeCount}</strong>
          <div className="sn-rto-stat-icon purple">
            <Truck size={19} />
          </div>
        </div>

        <div className="sn-rto-stat-card">
          <span>Returned to Seller</span>
          <strong>
            {records.filter(
              (record) => record.status === 'DELIVERED_TO_SELLER'
            ).length}
          </strong>
          <div className="sn-rto-stat-icon green">
            <CheckCircle2 size={19} />
          </div>
        </div>
      </div>

      {error ? (
        <div className="sn-rto-error">
          <span>{error}</span>
          <button onClick={loadRecords}>Try Again</button>
        </div>
      ) : records.length === 0 ? (
        <div className="sn-rto-empty">
          <div className="sn-rto-empty-icon">
            <Package size={30} />
          </div>
          <h3>No return shipments</h3>
          <p>
            Shipments marked for return will appear here with their latest
            status and tracking information.
          </p>
        </div>
      ) : (
        <div className="sn-rto-list">
          {records.map((record) => {
            const shipment = record.shipment || {};

            return (
              <article className="sn-rto-card" key={record.id}>
                <div className="sn-rto-card-header">
                  <div className="sn-rto-shipment">
                    <div className="sn-rto-shipment-icon">
                      <RotateCcw size={19} />
                    </div>
                    <div>
                      <span>TRACKING / DOCKET NUMBER</span>
                      <strong>
                        {shipment.trackingId ||
                          shipment.docketNumber ||
                          'Not available'}
                      </strong>
                    </div>
                  </div>

                  <span
                    className={`sn-rto-status status-${(
                      record.status || 'initiated'
                    ).toLowerCase()}`}
                  >
                    {formatStatus(record.status)}
                  </span>
                </div>

                <div className="sn-rto-reason">
                  <span>RETURN REASON</span>
                  <strong>{record.reason || 'Not specified'}</strong>
                </div>

                <div className="sn-rto-info-grid">
                  <div>
                    <CalendarDays size={15} />
                    <span>RTO initiated</span>
                    <strong>{formatDate(record.initiatedAt)}</strong>
                  </div>

                  <div>
                    <Clock3 size={15} />
                    <span>Last updated</span>
                    <strong>{formatDate(record.updatedAt)}</strong>
                  </div>

                  <div>
                    <MapPin size={15} />
                    <span>Return delivery</span>
                    <strong>{formatDate(record.deliveredAt)}</strong>
                  </div>

                  <div>
                    <Truck size={15} />
                    <span>Return tracking</span>
                    <strong>{record.returnAwb || 'Awaiting update'}</strong>
                  </div>
                </div>

                {record.remarks && (
                  <div className="sn-rto-update">
                    <span>Latest shipment update</span>
                    <p>{record.remarks}</p>
                  </div>
                )}

                <div className="sn-rto-progress">
                  <div className="sn-rto-progress-heading">
                    <strong>Return progress</strong>
                    <span>{formatStatus(record.status)}</span>
                  </div>

                  <div className="sn-rto-progress-track">
                    <div
                      className="sn-rto-progress-fill"
                      style={{
                        width:
                          record.status === 'INITIATED'
                            ? '25%'
                            : record.status === 'IN_TRANSIT'
                              ? '50%'
                              : record.status === 'OUT_FOR_DELIVERY'
                                ? '75%'
                                : record.status === 'DELIVERED_TO_SELLER'
                                  ? '100%'
                                  : '0%',
                      }}
                    />
                  </div>

                  <div className="sn-rto-progress-labels">
                    <span>Initiated</span>
                    <span>In transit</span>
                    <span>Out for delivery</span>
                    <span>Returned</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
