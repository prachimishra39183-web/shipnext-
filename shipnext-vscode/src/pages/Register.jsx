
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      alert('Your ShipNext account has been created successfully!');
      navigate('/login');

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

      <div className="auth-card register-card">
        <div className="auth-icon">🚀</div>

        <h1>Create your account</h1>
        <p className="auth-description">
          Join ShipNext and simplify your shipping experience.
        </p>

        <form onSubmit={handleRegister}>
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />

          <label htmlFor="registerEmail">Email Address</label>
          <input
            id="registerEmail"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="phone">Mobile Number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Enter your mobile number"
            pattern="[0-9]{10}"
            maxLength={10}
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <label htmlFor="registerPassword">Password</label>
          <input
            id="registerPassword"
            name="password"
            type="password"
            placeholder="Create a password"
            minLength={8}
            value={formData.password}
            onChange={handleChange}
            required
          />

          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            minLength={8}
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

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
            {loading ? 'Creating Account...' : 'Create Account →'}
          </button>
        </form>

        <div className="auth-divider">
          <span>ALREADY HAVE AN ACCOUNT?</span>
        </div>

        <a href="/login" className="auth-secondary">
          Sign In
        </a>

        <a href="/" className="back-home">← Back to Home</a>
      </div>

      <p className="auth-copyright">
        © {new Date().getFullYear()} ShipNext. All rights reserved.
      </p>
    </div>
  );
}

export default Register;
