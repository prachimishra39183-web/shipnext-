
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [documents, setDocuments] = useState({
    aadhaar: null,
    pan: null,
    cancelledCheque: null,
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

  const handleDocumentChange = (event) => {
    const { name, files } = event.target;
    const file = files[0];

    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG and PDF documents are allowed.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Each document must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }

    setError('');

    setDocuments((previous) => ({
      ...previous,
      [name]: file,
    }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (
      !documents.aadhaar ||
      !documents.pan ||
      !documents.cancelledCheque
    ) {
      setError('Please upload all three mandatory documents.');
      return;
    }

    setLoading(true);

    try {
      const uploadData = new FormData();

      uploadData.append('fullName', formData.fullName);
      uploadData.append('email', formData.email);
      uploadData.append('phone', formData.phone);
      uploadData.append('password', formData.password);

      uploadData.append('aadhaar', documents.aadhaar);
      uploadData.append('pan', documents.pan);
      uploadData.append('cancelledCheque', documents.cancelledCheque);

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        body: uploadData,
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
            src="/logo.png"
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

          <div className="kyc-upload-section">
            <h3>Identity Verification</h3>

            <p>
              Upload all three documents to complete your registration.
              JPG, PNG or PDF. Maximum 5 MB per document.
            </p>

            <label htmlFor="aadhaar">Aadhaar Card *</label>
            <input
              id="aadhaar"
              name="aadhaar"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleDocumentChange}
              required
            />

            {documents.aadhaar && (
              <small>Selected: {documents.aadhaar.name}</small>
            )}

            <label htmlFor="pan">PAN Card *</label>
            <input
              id="pan"
              name="pan"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleDocumentChange}
              required
            />

            {documents.pan && (
              <small>Selected: {documents.pan.name}</small>
            )}

            <label htmlFor="cancelledCheque">
              Cancelled Cheque *
            </label>
            <input
              id="cancelledCheque"
              name="cancelledCheque"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleDocumentChange}
              required
            />

            {documents.cancelledCheque && (
              <small>
                Selected: {documents.cancelledCheque.name}
              </small>
            )}
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
