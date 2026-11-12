import Navbar from '../components/Navbar.jsx';
function Home() {
  return (
    <div className="app">
      <Navbar />

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="status-dot"></span>
              SMART SHIPPING. SIMPLIFIED.
            </div>

            <h1>Your Shipping.<br /><span>Our Priority.</span></h1>

            <p>
              Send parcels across India with reliable delivery,
              transparent pricing and a smarter shipping experience.
            </p>

            <div className="hero-actions">
              <a href="/register" className="primary-button">Book a Shipment →</a>
              <a href="#track" className="secondary-button">Track Your Parcel</a>
            </div>

            <div className="hero-trust">
              <div>✓ Easy online booking</div>
              <div>✓ Transparent pricing</div>
              <div>✓ Real-time tracking</div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="delivery-card">
              <div className="delivery-top">
                <span>SHIPNEXT DELIVERY</span>
                <span className="delivery-badge">ON THE MOVE</span>
              </div>
              <div className="parcel-illustration">📦</div>
              <h3>Your parcel, on its way.</h3>
              <p>Every shipment deserves a smooth journey.</p>

              <div className="route">
                <div className="route-point">
                  <span className="route-dot pickup"></span>
                  <div><small>PICKUP</small><strong>Your Location</strong></div>
                </div>
                <div className="route-line"></div>
                <div className="route-point">
                  <span className="route-dot destination"></span>
                  <div><small>DESTINATION</small><strong>Delivery Address</strong></div>
                </div>
              </div>

              <div className="delivery-footer">
                <span>SMART SHIPPING</span>
                <strong>SHIPNEXT</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="quick-tools" id="track">
          <div className="tool-card">
            <div className="tool-icon">📍</div>
            <div className="tool-content">
              <h3>Track your shipment</h3>
              <p>Enter your tracking ID to follow your parcel.</p>
              <form onSubmit={(e) => {
                e.preventDefault();
                alert('Tracking will be connected soon.');
              }}>
                <input placeholder="Enter tracking ID" required />
                <button type="submit">Track →</button>
              </form>
            </div>
          </div>

          <div className="tool-card">
            <div className="tool-icon">🚚</div>
            <div className="tool-content">
              <h3>Check serviceability</h3>
              <p>Find out whether we deliver to your pincode.</p>
              <form onSubmit={(e) => {
                e.preventDefault();
                alert('Pincode checking will be connected soon.');
              }}>
                <input
                  placeholder="Enter 6-digit pincode"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                />
                <button type="submit">Check →</button>
              </form>
            </div>
          </div>
        </section>

        <section className="services section" id="services">
          <div className="section-heading">
            <span>WHAT WE OFFER</span>
            <h2>Shipping made simple.</h2>
            <p>Everything you need to send parcels with confidence.</p>
          </div>

          <div className="service-grid">
            <article className="service-card">
              <div className="service-icon">📦</div>
              <h3>Parcel Delivery</h3>
              <p>Convenient parcel shipping for your everyday business needs.</p>
            </article>

            <article className="service-card">
              <div className="service-icon">⚡</div>
              <h3>Easy Booking</h3>
              <p>Book shipments online with a simple and smooth process.</p>
            </article>

            <article className="service-card">
              <div className="service-icon">🛡️</div>
              <h3>Reliable Tracking</h3>
              <p>Stay informed about your shipment throughout its journey.</p>
            </article>
          </div>
        </section>

        <section className="how-section section" id="how-it-works">
          <div className="section-heading">
            <span>GET STARTED</span>
            <h2>Ship in three simple steps.</h2>
          </div>

          <div className="steps">
            <div className="step">
              <span>01</span>
              <h3>Create an account</h3>
              <p>Register with ShipNext to get started.</p>
            </div>

            <div className="step">
              <span>02</span>
              <h3>Book your parcel</h3>
              <p>Enter shipment details and confirm your booking.</p>
            </div>

            <div className="step">
              <span>03</span>
              <h3>Track your delivery</h3>
              <p>Follow your shipment with its tracking ID.</p>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <h2>Ready to ship smarter?</h2>
          <p>Join ShipNext and make your shipping experience simpler.</p>
          <a href="/register" className="cta-button">Get Started Today →</a>
        </section>
      </main>

      <footer className="footer">
        <a href="/" className="logo">
          <span className="logo-icon">S</span>
          Ship<span>Next</span>
        </a>
        <p>Your Shipping. Our Priority.</p>
        <span>© {new Date().getFullYear()} ShipNext. All rights reserved.</span>
      </footer>
    </div>
  );
}
export default Home;