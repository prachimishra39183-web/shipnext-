
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
import './Login.css';

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

  const changeLoginMethod = (method) => {
    setLoginMethod(method);
    setError('');
  };

  return (
    <div className="sn-login-page">
      <div className="sn-login-background">
        <div className="sn-login-glow sn-login-glow-one" />
        <div className="sn-login-glow sn-login-glow-two" />
        <div className="sn-login-grid" />
      </div>

      <header className="sn-login-topbar">
        <a href="/" className="sn-login-brand">
          <img src="/logo.png" alt="ShipNext Logo" />
        </a>

        <a href="/" className="sn-login-home-link">
          Back to website <span>↗</span>
        </a>
      </header>

      <main className="sn-login-content">
        <section className="sn-login-showcase">
          <span className="sn-login-kicker">
            <span className="sn-login-kicker-line" />
            THE SMARTER WAY TO SHIP
          </span>

          <h1>
            Move your
            <br />
            business <span>forward.</span>
          </h1>

          <p className="sn-login-showcase-description">
            One powerful platform for your shipping operations.
            Manage bookings, track shipments and stay in control
            of your logistics journey.
          </p>

          <div className="sn-login-feature-list">
            <div className="sn-login-feature">
              <span className="sn-login-feature-number">01</span>
              <div>
                <strong>Unified Shipping</strong>
                <small>All your shipments in one place</small>
              </div>
            </div>

            <div className="sn-login-feature">
              <span className="sn-login-feature-number">02</span>
              <div>
                <strong>Real-time Visibility</strong>
                <small>Stay informed at every step</small>
              </div>
            </div>

            <div className="sn-login-feature">
              <span className="sn-login-feature-number">03</span>
              <div>
                <strong>Business Control</strong>
                <small>Manage your logistics with confidence</small>
              </div>
            </div>
          </div>

          <div className="sn-login-showcase-footer">
            <span>SHIP SMARTER.</span>
            <span>GROW FASTER.</span>
          </div>
        </section>

        <section className="sn-login-card">
          <div className="sn-login-card-top">
            <span className="sn-login-card-label">SECURE ACCESS PORTAL</span>
            <span className="sn-login-secure-indicator">
              <span /> SECURE
            </span>
          </div>

          <div className="sn-login-heading">
            <h2>Welcome <span>back.</span></h2>
            <p>Sign in to continue your ShipNext journey.</p>
          </div>

          <div className="sn-login-switch">
            <button
              type="button"
              onClick={() => changeLoginMethod('account')}
              className={loginMethod === 'account' ? 'active' : ''}
            >
              Account Login
            </button>

            <button
              type="button"
              onClick={() => changeLoginMethod('booking')}
              className={loginMethod === 'booking' ? 'active' : ''}
            >
              Booking Access
            </button>
          </div>

          {loginMethod === 'account' ? (
            <form className="sn-login-form" onSubmit={handleLogin}>
              <div className="sn-login-field">
                <label htmlFor="email">EMAIL ADDRESS</label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="sn-login-field">
                <label htmlFor="password">PASSWORD</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <div className="sn-login-error">{error}</div>
              )}

              <button
                type="submit"
                className="sn-login-submit"
                disabled={loading}
              >
                <span>{loading ? 'Signing you in...' : 'Sign In to ShipNext'}</span>
                <span className="sn-login-submit-arrow">→</span>
              </button>
            </form>
          ) : (
            <form className="sn-login-form" onSubmit={handleBookingAccess}>
              <div className="sn-login-booking-intro">
                <span className="sn-login-booking-line" />
                <p>
                  Access your shipment details using the Booking ID
                  or docket number provided by ShipNext.
                </p>
              </div>

              <div className="sn-login-field">
                <label htmlFor="docketNumber">BOOKING ID / DOCKET NUMBER</label>
                <input
                  id="docketNumber"
                  type="text"
                  placeholder="e.g. SNX123456"
                  value={docketNumber}
                  onChange={(e) => setDocketNumber(e.target.value.toUpperCase())}
                  required
                />
              </div>

              {error && (
                <div className="sn-login-error">{error}</div>
              )}

              <button
                type="submit"
                className="sn-login-submit"
                disabled={loading}
              >
                <span>{loading ? 'Verifying booking...' : 'Access My Booking'}</span>
                <span className="sn-login-submit-arrow">→</span>
              </button>
            </form>
          )}

          <div className="sn-login-divider">
            <span />
            <small>NEW TO SHIPNEXT?</small>
            <span />
          </div>

          <a href="/register" className="sn-login-register">
            Create your ShipNext account <span>→</span>
          </a>

          <div className="sn-login-card-footer">
            <span>SHIPNEXT</span>
            <span>LOGISTICS, REIMAGINED.</span>
          </div>
        </section>
      </main>

      <footer className="sn-login-bottom">
        <span>© {new Date().getFullYear()} SHIPNEXT. ALL RIGHTS RESERVED.</span>
        <span>YOUR SHIPPING. OUR PRIORITY.</span>
      </footer>
    </div>
  );
}

export default Login;
