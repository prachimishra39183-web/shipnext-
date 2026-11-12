
function Navbar() {
  return (
    <header className="navbar">
  <a href="/" className="logo">
    <img
      src="/logo.jpeg"
      alt="ShipNext Logo"
      className="logo-image"
    />
   
  </a>

      <nav>
        <a href="/#services">Solutions</a>
        <a href="/#solutions">Pin & Rate Calculator</a>
         <a href="/#ai-engine">Ai Engine & NDR Services</a>
        <a href="/#how-it-works">How It Works</a>
        
        <a href="/dashboard"> Customer Dashboard</a>
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
