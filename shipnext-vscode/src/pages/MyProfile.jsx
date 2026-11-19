
import { useState } from 'react';
import { Link } from 'react-router-dom';

function MyProfile() {
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    pincode: '',
  });

  const [documents, setDocuments] = useState({
    aadhaar: null,
    pan: null,
    cancelledCheque: null,
  });

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = (event) => {
    setProfile((previous) => ({
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
    setMessage('');

    setDocuments((previous) => ({
      ...previous,
      [name]: file,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (
      !documents.aadhaar ||
      !documents.pan ||
      !documents.cancelledCheque
    ) {
      setError('Please upload all three mandatory KYC documents.');
      return;
    }

    setMessage(
      'Your details and documents are ready. Profile saving will be connected to the ShipNext backend.'
    );
  };

  const documentFields = [
    {
      name: 'aadhaar',
      title: 'Aadhaar Card',
      description: 'Upload your Aadhaar card',
      number: '01',
    },
    {
      name: 'pan',
      title: 'PAN Card',
      description: 'Upload your PAN card',
      number: '02',
    },
    {
      name: 'cancelledCheque',
      title: 'Cancelled Cheque',
      description: 'Upload your bank cancelled cheque',
      number: '03',
    },
  ];

  return (
    <div className="sn-profile-page">
      <header className="sn-profile-header">
        <Link to="/dashboard" className="sn-profile-brand">
          <img src="/logo.png" alt="ShipNext" />
          <span>SHIPNEXT</span>
        </Link>

        <Link to="/dashboard" className="sn-profile-back">
          Back to Dashboard
        </Link>
      </header>

      <main className="sn-profile-container">
        <section className="sn-profile-intro">
          <span className="sn-profile-eyebrow">
            YOUR SHIPNEXT ACCOUNT
          </span>
          <h1>Account <span>Profile</span></h1>
          <p>
            Manage your personal information and complete your
            business identity verification.
          </p>
        </section>

        {error && (
          <div className="sn-profile-alert error">
            {error}
          </div>
        )}

        {message && (
          <div className="sn-profile-alert success">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <section className="sn-profile-card">
            <div className="sn-profile-section-heading">
              <div>
                <span>01 / ACCOUNT DETAILS</span>
                <h2>Personal Information</h2>
                <p>Your primary contact and delivery information.</p>
              </div>
              <div className="sn-profile-section-number">01</div>
            </div>

            <div className="sn-profile-grid">
              <div className="sn-profile-field">
                <label>Full Name</label>
                <input
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="sn-profile-field">
                <label>Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="sn-profile-field">
                <label>Mobile Number</label>
                <input
                  name="phone"
                  type="tel"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={profile.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>

              <div className="sn-profile-field">
                <label>PIN Code</label>
                <input
                  name="pincode"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={profile.pincode}
                  onChange={handleChange}
                  placeholder="6-digit PIN code"
                />
              </div>

              <div className="sn-profile-field full">
                <label>Complete Address</label>
                <textarea
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  placeholder="Enter your complete address"
                  rows={4}
                />
              </div>
            </div>
          </section>

          <section className="sn-profile-card sn-profile-kyc">
            <div className="sn-profile-section-heading">
              <div>
                <span>02 / DOCUMENT VERIFICATION</span>
                <h2>Identity Verification</h2>
                <p>
                  Submit your documents for ShipNext account verification.
                </p>
              </div>
              <div className="sn-profile-section-number">02</div>
            </div>

            <div className="sn-profile-kyc-banner">
              <div>
                <strong>Mandatory KYC Documents</strong>
                <p>
                  Upload all three documents. Accepted formats:
                  JPG, PNG and PDF. Maximum 5 MB per file.
                </p>
              </div>
              <span>3 DOCUMENTS</span>
            </div>

            <div className="sn-profile-document-grid">
              {documentFields.map((document) => (
                <div
                  className="sn-profile-document"
                  key={document.name}
                >
                  <div className="sn-profile-document-top">
                    <span className="sn-profile-document-number">
                      {document.number}
                    </span>
                    <span className="sn-profile-required">
                      REQUIRED
                    </span>
                  </div>

                  <h3>{document.title}</h3>
                  <p>{document.description}</p>

                  <label
                    className="sn-profile-upload"
                    htmlFor={`profile-${document.name}`}
                  >
                    <span>
                      {documents[document.name]
                        ? 'Replace Document'
                        : 'Choose Document'}
                    </span>
                    <input
                      id={`profile-${document.name}`}
                      name={document.name}
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={handleDocumentChange}
                    />
                  </label>

                  <div className="sn-profile-file-name">
                    {documents[document.name]
                      ? documents[document.name].name
                      : 'No document selected'}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="sn-profile-actions">
            <p>
              Your information is intended for secure account
              verification and profile management.
            </p>
            <button type="submit">
              Save Profile
              <span>→</span>
            </button>
          </div>
        </form>

        <footer className="sn-profile-footer">
          SHIPNEXT <span>•</span> YOUR SHIPPING. OUR PRIORITY.
        </footer>
      </main>
    </div>
  );
}

export default MyProfile;
