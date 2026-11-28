
import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  RefreshCw,
  Package,
  CalendarDays,
  CheckCircle2,
  Send,
  Truck,
} from 'lucide-react';
import API_URL from '../config/api';
import './NdrManagement.css';

const formatDate = (date) => {
  if (!date) return 'Not scheduled';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatStatus = (status) =>
  (status || 'OPEN').replaceAll('_', ' ');

export default function NdrManagement() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [actions, setActions] = useState({});
  const [remarks, setRemarks] = useState({});
  const [submittingId, setSubmittingId] = useState('');

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const token = sessionStorage.getItem('shipnextToken');

      const response = await fetch(`${API_URL}/api/ndr/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to load NDR records.');
      }

      setRecords(data.records || []);
    } catch (err) {
      setError(err.message || 'Unable to load NDR records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const submitAction = async (recordId) => {
    const actionRequired = actions[recordId];

    if (!actionRequired) {
      setMessage('Please select a delivery instruction.');
      return;
    }

    setSubmittingId(recordId);
    setMessage('');

    try {
      const token = sessionStorage.getItem('shipnextToken');

      const response = await fetch(
        `${API_URL}/api/ndr/${recordId}/action`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            actionRequired,
            remarks: remarks[recordId] || '',
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to submit instruction.');
      }

      setMessage('Your delivery instruction has been submitted successfully.');
      await loadRecords();
    } catch (err) {
      setMessage(err.message || 'Unable to submit instruction.');
    } finally {
      setSubmittingId('');
    }
  };

  const openCount = records.filter(
    (record) => !['RESOLVED', 'RTO_INITIATED'].includes(record.status)
  ).length;

  if (loading) {
    return (
      <div className="sn-ndr-loading">
        <RefreshCw className="sn-spin" size={22} />
        <p>Loading your NDR records...</p>
      </div>
    );
  }

  return (
    <div className="sn-ndr-page">
      <div className="sn-ndr-topbar">
        <div className="sn-ndr-intro">
          <div className="sn-ndr-main-icon">
            <AlertCircle size={23} />
          </div>
          <div>
            <h3>Non-Delivery Reports</h3>
            <p>Review delivery exceptions and submit your instructions.</p>
          </div>
        </div>

        <button
          className="sn-ndr-refresh"
          onClick={loadRecords}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      <div className="sn-ndr-stats">
        <div className="sn-ndr-stat-card">
          <span>Total NDR Records</span>
          <strong>{records.length}</strong>
          <div className="sn-ndr-stat-icon blue">
            <Package size={19} />
          </div>
        </div>

        <div className="sn-ndr-stat-card">
          <span>Awaiting Action</span>
          <strong>{openCount}</strong>
          <div className="sn-ndr-stat-icon purple">
            <AlertCircle size={19} />
          </div>
        </div>

        <div className="sn-ndr-stat-card">
          <span>Resolved</span>
          <strong>
            {records.filter((r) => r.status === 'RESOLVED').length}
          </strong>
          <div className="sn-ndr-stat-icon green">
            <CheckCircle2 size={19} />
          </div>
        </div>
      </div>

      {message && (
        <div className="sn-ndr-message" role="status">
          {message}
        </div>
      )}

      {error ? (
        <div className="sn-ndr-error">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={loadRecords}>Try Again</button>
        </div>
      ) : records.length === 0 ? (
        <div className="sn-ndr-empty">
          <div className="sn-ndr-empty-icon">
            <CheckCircle2 size={30} />
          </div>
          <h3>All shipments are looking good!</h3>
          <p>
            No non-delivery reports are currently available for your account.
          </p>
        </div>
      ) : (
        <div className="sn-ndr-list">
          {records.map((record) => {
            const shipment = record.shipment || {};
            const isClosed = ['RESOLVED', 'RTO_INITIATED'].includes(
              record.status
            );

            return (
              <article className="sn-ndr-card" key={record.id}>
                <div className="sn-ndr-card-header">
                  <div className="sn-ndr-shipment">
                    <div className="sn-ndr-shipment-icon">
                      <Truck size={19} />
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
                    className={`sn-ndr-status status-${(
                      record.status || 'open'
                    ).toLowerCase()}`}
                  >
                    {formatStatus(record.status)}
                  </span>
                </div>

                <div className="sn-ndr-reason">
                  <span>Delivery exception reason</span>
                  <strong>{record.reason || 'Not specified'}</strong>
                </div>

                <div className="sn-ndr-info-grid">
                  <div>
                    <CalendarDays size={15} />
                    <span>Reported</span>
                    <strong>{formatDate(record.reportedAt)}</strong>
                  </div>
                  <div>
                    <Package size={15} />
                    <span>Attempt number</span>
                    <strong>{record.attemptNumber || 1}</strong>
                  </div>
                  <div>
                    <CalendarDays size={15} />
                    <span>Next attempt</span>
                    <strong>{formatDate(record.nextAttemptDate)}</strong>
                  </div>
                </div>

                {record.actionRequired && (
                  <div className="sn-ndr-previous-action">
                    <span>Your submitted instruction</span>
                    <strong>
                      {formatStatus(record.actionRequired)}
                    </strong>
                    {record.remarks && <p>{record.remarks}</p>}
                  </div>
                )}

                {!isClosed && (
                  <div className="sn-ndr-action-area">
                    <h4>What would you like us to do?</h4>

                    <select
                      value={actions[record.id] || ''}
                      onChange={(e) =>
                        setActions((prev) => ({
                          ...prev,
                          [record.id]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select delivery instruction</option>
                      <option value="RESCHEDULE_DELIVERY">
                        Request another delivery attempt
                      </option>
                      <option value="UPDATE_ADDRESS">
                        Request address update
                      </option>
                      <option value="CONTACT_CUSTOMER">
                        Request customer contact
                      </option>
                      <option value="OTHER">
                        Other instruction
                      </option>
                    </select>

                    <textarea
                      rows={2}
                      value={remarks[record.id] || ''}
                      onChange={(e) =>
                        setRemarks((prev) => ({
                          ...prev,
                          [record.id]: e.target.value,
                        }))
                      }
                      placeholder="Add any additional delivery instructions..."
                    />

                    <button
                      className="sn-ndr-submit"
                      onClick={() => submitAction(record.id)}
                      disabled={submittingId === record.id}
                    >
                      <Send size={15} />
                      {submittingId === record.id
                        ? 'Submitting...'
                        : 'Submit Instruction'}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
