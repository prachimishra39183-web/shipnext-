
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
import './Register.css';

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
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleDocumentChange = (event) => {
    const { name, files } = event.target;
    const file = files?.[0];

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

  const documentFields = [
    {
      name: 'aadhaar',
      title: 'Aadhaar Card',
      description: 'Upload your Aadhaar identity document',
      number: '01',
    },
    {
      name: 'pan',
      title: 'PAN Card',
      description: 'Upload your PAN identity document',
      number: '02',
    },
    {
      name: 'cancelledCheque',
      title: 'Cancelled Cheque',
      description: 'Upload your bank verification document',
      number: '03',
    },
  ];

  return (
    <div className="sn-register-page">
      <div className="sn-register-glow sn-register-glow-one" />
      <div className="sn-register-glow sn-register-glow-two" />

      <header className="sn-register-header">
        <Link to="/" className="sn-register-logo">
          <img src="/logo.jpeg" alt="ShipNext" />
        </Link>

        <Link to="/login" className="sn-register-header-link">
          Already registered? <span>Sign In</span>
        </Link>
      </header>

      <main className="sn-register-container">
        <section className="sn-register-intro">
          <span className="sn-register-eyebrow">
            SHIPNEXT / CUSTOMER REGISTRATION
          </span>

          <h1>
            Start shipping.
            <span> Start growing.</span>
          </h1>

          <p>
            Create your ShipNext account and access a smarter,
            more connected shipping experience.
          </p>

          <div className="sn-register-highlights">
            <div>
              <strong>01</strong>
              <span>Account Setup</span>
            </div>
            <div>
              <strong>02</strong>
              <span>Identity Verification</span>
            </div>
            <div>
              <strong>03</strong>
              <span>Start Shipping</span>
            </div>
          </div>
        </section>

        <section className="sn-register-card">
          <div className="sn-register-card-heading">
            <div>
              <span>CREATE YOUR ACCOUNT</span>
              <h2>Join ShipNext</h2>
              <p>Enter your details to get started.</p>
            </div>
            <div className="sn-register-card-number">01</div>
          </div>

          <form onSubmit={handleRegister}>
            <div className="sn-register-section-title">
              <span>01</span>
              Personal Information
            </div>

            <div className="sn-register-fields">
              <div className="sn-register-field full">
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
              </div>

              <div className="sn-register-field">
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
              </div>

              <div className="sn-register-field">
                <label htmlFor="phone">Mobile Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="10-digit mobile number"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="sn-register-field">
                <label htmlFor="registerPassword">Password</label>
                <input
                  id="registerPassword"
                  name="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="sn-register-field">
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
              </div>
            </div>

            <div className="sn-register-section-title sn-register-kyc-title">
              <span>02</span>
              Identity Verification
            </div>

            <div className="sn-register-kyc-banner">
              <div>
                <strong>Complete your KYC verification</strong>
                <p>
                  All three documents are mandatory. JPG, PNG or PDF,
                  maximum 5 MB per document.
                </p>
              </div>
              <span>3 REQUIRED</span>
            </div>

            <div className="sn-register-documents">
              {documentFields.map((document) => (
                <div className="sn-register-document" key={document.name}>
                  <div className="sn-register-document-top">
                    <span>{document.number}</span>
                    <small>REQUIRED</small>
                  </div>

                  <h3>{document.title}</h3>
                  <p>{document.description}</p>

                  <label
                    htmlFor={`register-${document.name}`}
                    className="sn-register-upload"
                  >
                    {documents[document.name]
                      ? 'Replace Document'
                      : 'Choose Document'}

                    <input
                      id={`register-${document.name}`}
                      name={document.name}
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={handleDocumentChange}
                      required
                    />
                  </label>

                  <div className="sn-register-file">
                    {documents[document.name]
                      ? documents[document.name].name
                      : 'No file selected'}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="sn-register-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="sn-register-submit"
              disabled={loading}
            >
              {loading ? 'Creating Your Account...' : 'Create ShipNext Account'}
              <span>→</span>
            </button>

            <p className="sn-register-secure-note">
              Your submitted documents are used for account verification.
            </p>
          </form>
        </section>
      </main>

      <footer className="sn-register-footer">
        © {new Date().getFullYear()} SHIPNEXT
        <span>•</span>
        YOUR SHIPPING. OUR PRIORITY.
      </footer>
    </div>
  );
}

export default Register;
