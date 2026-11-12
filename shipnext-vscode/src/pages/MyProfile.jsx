
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

  const handleChange = (event) => {
    setProfile({
      ...profile,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    alert('Profile saving will be connected to the ShipNext backend soon.');
  };

  return (
    <div className="booking-page">
      <header className="booking-header">
        <Link to="/dashboard" className="logo">
          <span className="logo-icon">S</span>
          Ship<span>Next</span>
        </Link>

        <Link to="/dashboard" className="booking-back">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="profile-container">
        <div className="booking-heading">
          <span>YOUR SHIPNEXT ACCOUNT</span>
          <h1>My Profile</h1>
          <p>Manage your personal and contact information.</p>
        </div>

        <form className="profile-card" onSubmit={handleSubmit}>
          <div className="profile-avatar">👤</div>

          <h2>Personal Information</h2>
          <p className="profile-subtitle">
            Keep your account details up to date.
          </p>

          <div className="booking-grid">
            <div className="booking-field">
              <label>Full Name</label>
              <input
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="booking-field">
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

            <div className="booking-field">
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

            <div className="booking-field">
              <label>Pincode</label>
              <input
                name="pincode"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={profile.pincode}
                onChange={handleChange}
                placeholder="6-digit pincode"
              />
            </div>

            <div className="booking-field full-width">
              <label>Address</label>
              <textarea
                name="address"
                value={profile.address}
                onChange={handleChange}
                placeholder="Enter your complete address"
              />
            </div>
          </div>

          <button type="submit" className="profile-save">
            Save Profile →
          </button>
        </form>
      </main>
    </div>
  );
}

export default MyProfile;
