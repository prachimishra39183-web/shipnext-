import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import API_URL from '../config/api';
import './AdminPincodeBlockage.css';

export default function AdminPincodeBlockage() {
  const [pincode, setPincode] = useState('');
  const [reason, setReason] = useState('');
  const [blockedPincodes, setBlockedPincodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const token = sessionStorage.getItem('shipnextToken');

  const fetchBlockedPincodes = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/admin/pincode-blockage`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load blocked PIN codes.');
      }

      setBlockedPincodes(data.blockedPincodes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedPincodes();
  }, []);

  const handleBlock = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');

    if (!/^\d{6}$/.test(pincode.trim())) {
      setError('Enter a valid six-digit PIN code.');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/api/admin/pincode-blockage/block`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            pincode: pincode.trim(),
            reason: reason.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to block PIN code.');
      }

      setMessage(data.message);
      setPincode('');
      setReason('');

      await fetchBlockedPincodes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async (pin) => {
    const confirmed = window.confirm(
      `Are you sure you want to unblock PIN ${pin}?`
    );

    if (!confirmed) return;

    setMessage('');
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/api/admin/pincode-blockage/${pin}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to unblock PIN code.');
      }

      setMessage(data.message);
      await fetchBlockedPincodes();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="sn-pincode-page">
      <div className="sn-pincode-header">
        <Link to="/admin" className="sn-back-dashboard">
  <ArrowLeft size={18} />
  Back to Dashboard
</Link>
        <div>
          <span className="sn-pincode-eyebrow">ADMIN CONTROL</span>
            
          <h1>Pincode Blockage</h1>
          <p>Manage PIN codes restricted from shipment bookings.</p>
        </div>
         
        <div className="sn-pincode-count">
          
          <span>Total Blocked PINs</span>
          
          <strong>{blockedPincodes.length}</strong>
        </div>
      
      </div>

      {message && (
        <div className="sn-pincode-alert success">
          {message}
        </div>
      )}

      {error && (
        <div className="sn-pincode-alert error">
          {error}
        </div>
      )}

      <div className="sn-pincode-card">
        <div className="sn-pincode-card-heading">
          <div>
            <h2>Block a PIN Code</h2>
            <p>Blocked PINs will be unavailable across all courier partners.</p>
          </div>
        </div>

        <form onSubmit={handleBlock}>
          <div className="sn-pincode-form-grid">
            <div className="sn-pincode-field">
              <label>PIN Code *</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit PIN"
                value={pincode}
                onChange={(e) =>
                  setPincode(e.target.value.replace(/\D/g, ''))
                }
                required
              />
            </div>

            <div className="sn-pincode-field">
              <label>Reason for blockage</label>
              <input
                type="text"
                placeholder="Enter reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="sn-pincode-block-btn"
            disabled={saving || !/^\d{6}$/.test(pincode)}
          >
            {saving ? 'Blocking...' : 'Block PIN Code'}
          </button>
        </form>
      </div>

      <div className="sn-pincode-card">
        <div className="sn-pincode-card-heading">
          <div>
            <h2>Blocked PIN Codes</h2>
            <p>PIN codes currently restricted by ShipNext administration.</p>
          </div>

          <button
            className="sn-pincode-refresh"
            onClick={fetchBlockedPincodes}
            type="button"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="sn-pincode-empty">Loading blocked PIN codes...</p>
        ) : blockedPincodes.length === 0 ? (
          <p className="sn-pincode-empty">
            No PIN codes have been blocked.
          </p>
        ) : (
          <div className="sn-pincode-table-wrapper">
            <table className="sn-pincode-table">
              <thead>
                <tr>
                  <th>PIN CODE</th>
                  <th>REASON</th>
                  <th>BLOCKED ON</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {blockedPincodes.map((item) => (
                  <tr key={item.id}>
                    <td className="sn-pincode-number">
                      {item.pincode}
                    </td>
                    <td>{item.reason || 'Not specified'}</td>
                    <td>
                      {new Date(item.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <button
                        className="sn-pincode-unblock-btn"
                        onClick={() => handleUnblock(item.pincode)}
                      >
                        Unblock
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
