
import { useState } from 'react';
import { Link } from 'react-router-dom';

function Enquiry() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit enquiry.');
      }

      setSuccess(data.message);
      setForm({
        name: '',
        phone: '',
        email: '',
        message: '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="enquiry-page">
      <div className="enquiry-container">
        <Link to="/" className="tracking-back">
          ← Back to Home
        </Link>

        <div className="enquiry-heading">
          <span>WE'RE HERE TO HELP</span>
          <h1>Get in Touch</h1>
          <p>
            Have questions about shipping with ShipNext?
            Send us an enquiry and our team will get back to you.
          </p>
        </div>

        <form className="enquiry-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            maxLength={100}
            required
          />

          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="10-digit mobile number"
            pattern="[0-9]{10}"
            maxLength={10}
            required
          />

          <label htmlFor="email">Email Address (Optional)</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email address"
            maxLength={254}
          />

          <label htmlFor="message">Your Message</label>
          <textarea
            id="message"
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="How can we help you?"
            rows={5}
            maxLength={2000}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Enquiry →'}
          </button>

          {success && <p className="enquiry-success">{success}</p>}
          {error && <p className="enquiry-error">{error}</p>}
        </form>
      </div>
    </main>
  );
}

export default Enquiry;
