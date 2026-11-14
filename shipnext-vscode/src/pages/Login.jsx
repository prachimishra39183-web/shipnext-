
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      sessionStorage.setItem('shipnextToken', data.token);
      sessionStorage.setItem('shipnextUser', JSON.stringify(data.user));

      if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      setError(error.message || 'Unable to connect to ShipNext.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <a href="/" className="logo">
          <img
            src="/logo.jpeg"
            alt="ShipNext Logo"
            className="logo-image"
          />
        </a>
        <p>Your Shipping. Our Priority.</p>
      </div>

      <div className="auth-card">
        <div className="auth-icon">👋</div>

        <h1>Welcome back!</h1>
        <p className="auth-description">
          Sign in to manage your shipments and deliveries.
        </p>

        <form onSubmit={handleLogin}>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <div className="auth-options">
            <label className="remember">
              <input type="checkbox" />
              Remember me
            </label>
            <a href="#forgot-password">Forgot password?</a>
          </div>

          {error && (
            <p style={{ color: '#dc2626', marginTop: '12px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In →'}
          </button>
        </form>

        <div className="auth-divider">
          <span>NEW TO SHIPNEXT?</span>
        </div>

        <a href="/register" className="auth-secondary">
          Create an Account
        </a>

        <a href="/" className="back-home">← Back to Home</a>
      </div>

      <p className="auth-copyright">
        © {new Date().getFullYear()} ShipNext. All rights reserved.
      </p>
    </div>
  );
}

export default Login;
