
function Navbar() {
  return (
    <header className="navbar">
      <a href="/" className="logo">
        <span className="logo-icon">S</span>
        Ship<span>Next</span>
      </a>

      <nav>
        <a href="/#services">Services</a>
        <a href="/#how-it-works">How It Works</a>
        <a href="/track">Track Shipment</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/admin">Admin</a>
      </nav>

      <div className="nav-actions">
        <a href="/login" className="login-link">Login</a>
        <a href="/register" className="primary-button">
          Get Started →
        </a>
      </div>
    </header>
  );
}

export default Navbar;
