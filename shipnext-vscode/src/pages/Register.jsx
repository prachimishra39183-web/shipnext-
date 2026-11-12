
import { useState } from 'react';

function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleRegister = (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    alert('Registration will be connected to the ShipNext backend soon.');
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

          <button type="submit" className="auth-submit">
            Create Account →
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
