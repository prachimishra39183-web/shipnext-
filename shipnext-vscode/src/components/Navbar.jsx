
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="logo">
        <img
          src="/logo.jpeg"
          alt="ShipNext Logo"
          className="logo-image"
        />
      </Link>

      <nav>
        <a href="/#services">Solutions</a>
        <a href="/#solutions">Pin & Rate Calculator</a>
        <a href="/#ai-engine">AI Engine & NDR Services</a>
        <Link to="/enquiry">Enquire Now</Link>
      </nav>

      <div className="nav-actions">
        <Link to="/login" className="login-link">Login</Link>
        <Link to="/register" className="primary-button">
          Get Started →
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
