
import { useState } from 'react';
import { ArrowLeft, Search, MapPin, Package, IndianRupee, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
import './AdminPincodeRates.css';

const modeLabels = {
  EXPRESS_AIR: 'Express Air',
  NORMAL_AIR: 'Normal Air',
  EXPRESS_SURFACE: 'Express Surface',
  NORMAL_SURFACE: 'Normal Surface',
};

const courierLabels = {
  DELHIVERY: 'Delhivery',
  SKYKING: 'Skyking',
  BLUEDART: 'Blue Dart',
};

export default function AdminPincodeRates() {
  const [pickupPincode, setPickupPincode] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [weight, setWeight] = useState('0.5');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const compareRates = async (e) => {
    e.preventDefault();
    setError('');
    setResults([]);
    setSearched(false);

    if (!/^\d{6}$/.test(pickupPincode) ||
        !/^\d{6}$/.test(deliveryPincode)) {
      setError('Enter valid six-digit PIN codes.');
      return;
    }

    if (!Number.isFinite(Number(weight)) || Number(weight) < 0.5) {
      setError('Minimum shipment weight is 500 grams.');
      return;
    }

    setLoading(true);

    try {
      const token = sessionStorage.getItem('shipnextToken');

      const response = await fetch(
        `${API_URL}/api/serviceability/admin/rate-comparison`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            pickupPincode,
            deliveryPincode,
            weight: Number(weight),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to compare rates.');
      }

      setResults(data.results || []);
      setSearched(true);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-pincode-rates">
      <div className="rates-topbar">
        <Link to="/admin" className="rates-back">
          <ArrowLeft size={18} /> Admin Dashboard
        </Link>
        <span className="rates-admin-label">ADMIN CONTROL PANEL</span>
      </div>

      <div className="rates-heading">
        <span className="rates-eyebrow">SHIPPING MANAGEMENT</span>
        <h1>PIN Code <span>Rate Calculator</span></h1>
        <p>Compare available courier partners and all shipping modes.</p>
      </div>

      <form className="rates-search-card" onSubmit={compareRates}>
        <div className="rates-form-grid">
          <label>
            <span><MapPin size={15} /> PICKUP PIN CODE</span>
            <input
              value={pickupPincode}
              onChange={(e) => setPickupPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter pickup PIN"
              inputMode="numeric"
              maxLength={6}
              required
            />
          </label>

          <label>
            <span><MapPin size={15} /> DELIVERY PIN CODE</span>
            <input
              value={deliveryPincode}
              onChange={(e) => setDeliveryPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter delivery PIN"
              inputMode="numeric"
              maxLength={6}
              required
            />
          </label>

          <label>
            <span><Package size={15} /> WEIGHT (KG)</span>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? <RefreshCw size={17} className="rates-spin" /> : <Search size={17} />}
          {loading ? 'Comparing Rates...' : 'Compare All Rates'}
        </button>
      </form>

      {error && <div className="rates-error">{error}</div>}

      {searched && (
        <section className="rates-results">
          <div className="rates-results-heading">
            <div>
              <span className="rates-eyebrow">RATE COMPARISON</span>
              <h2>Available Shipping Rates</h2>
              <p>{pickupPincode} → {deliveryPincode} · {weight} kg</p>
            </div>
            <span className="rates-count">{results.length} options</span>
          </div>

          {results.length > 0 ? (
            <div className="rates-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>RANK</th>
                    <th>COURIER PARTNER</th>
                    <th>SHIPPING MODE</th>
                    
                    <th>BASE RATE</th>
                    <th>ADDITIONAL CHARGE</th>
                    <th>TOTAL RATE</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item, index) => (
                    <tr key={`${item.courier}-${item.mode}`}>
                      <td>
                        <span className={index === 0 ? 'rates-rank best' : 'rates-rank'}>
                          {index + 1}
                        </span>
                      </td>
                      <td><strong>{courierLabels[item.courier] || item.courier}</strong></td>
                      <td>{modeLabels[item.mode] || item.mode}</td>
                      
                      <td>₹{Number(item.base).toFixed(2)}</td>
                      <td>₹{Number(item.additionalCharge).toFixed(2)}</td>
                      <td className="rates-total">
                        <IndianRupee size={14} />
                        {Number(item.total).toFixed(2)}
                        {index === 0 && <span className="rates-best-label">LOWEST</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rates-empty">
              No courier partner serves both entered PIN codes.
            </div>
          )}

          
        </section>
      )}
    </div>
  );
}
