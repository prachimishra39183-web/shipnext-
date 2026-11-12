
import { useState } from 'react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (event) => {
    event.preventDefault();
    alert('Login will be connected to the ShipNext backend soon.');
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <a href="/" className="logo">
          <span className="logo-icon">S</span>
          Ship<span>Next</span>
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

          <button type="submit" className="auth-submit">
            Sign In →
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
