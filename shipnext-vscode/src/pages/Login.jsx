
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [docketNumber, setDocketNumber] = useState('');
  const [loginMethod, setLoginMethod] = useState('account');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      sessionStorage.setItem('shipnextToken', data.token);
      sessionStorage.setItem('shipnextUser', JSON.stringify(data.user));

      if (data.user.role === 'ADMIN') navigate('/admin');
      else navigate('/dashboard');

    } catch (error) {
      setError(error.message || 'Unable to connect to ShipNext.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAccess = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/booking-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docketNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Booking verification failed.');
      }
      navigate('/dashboard', {
  state: {
    bookingAccess: true,
    shipment: data.shipment,
  },
});

    } catch (error) {
      setError(error.message || 'Unable to verify Booking ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <a href="/" className="logo">
          <img src="/logo.png" alt="ShipNext Logo" className="logo-image" />
        </a>
        <p>Your Shipping. Our Priority.</p>
      </div>

      <div className="auth-card">
        <div className="auth-icon">👋</div>
        <h1>Welcome back!</h1>
        <p className="auth-description">
          Access your ShipNext account or view your booking.
        </p>

        <div className="login-method-switch">
  <button
    type="button"
    onClick={() => {
      setLoginMethod('account');
      setError('');
    }}
    className={loginMethod === 'account' ? 'login-method active' : 'login-method'}
  >
    Sign In
  </button>

  <button
    type="button"
    onClick={() => {
      setLoginMethod('booking');
      setError('');
    }}
    className={loginMethod === 'booking' ? 'login-method active' : 'login-method'}
  >
    Booking ID
  </button>
</div>

        {loginMethod === 'account' ? (
          <form onSubmit={handleLogin}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleBookingAccess}>
            <label htmlFor="docketNumber">Booking ID / Docket Number</label>
            <input
              id="docketNumber"
              type="text"
              placeholder="Enter your SNX booking ID"
              value={docketNumber}
              onChange={(e) => setDocketNumber(e.target.value.toUpperCase())}
              required
            />

            <p className="auth-description">
              Enter the docket number provided after your shipment booking.
            </p>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Verifying...' : 'View My Booking →'}
            </button>
          </form>
        )}

        <div className="auth-divider">
          <span>NEW TO SHIPNEXT?</span>
        </div>

        <a href="/register" className="auth-secondary">
          Create an Account
        </a>

        <a href="/" className="back-home">
          ← Back to Home
        </a>
      </div>

      <p className="auth-copyright">
        © {new Date().getFullYear()} ShipNext. All rights reserved.
      </p>
    </div>
  );
}

export default Login;
