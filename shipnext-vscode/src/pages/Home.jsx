import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
import Navbar from '../components/Navbar.jsx';
import Solutions from '../components/Solutions.jsx';
import FrictionlessDispatch from '../components/FrictionlessDispatch.jsx';
import AIEngineNDR from '../components/AIEngineNDR.jsx';

const networkMonths = [
  { month: "MAY", value: 38 },
  { month: "JUN", value: 46 },
  { month: "JUL", value: 52 },
  { month: "AUG", value: 61 },
  { month: "SEP", value: 74 },
  { month: "OCT", value: 92 }
];

function LiveNetworkSection() {
  const metrics = [
    {
      label: "On-time delivery",
      value: "99.4%",
      delta: "↑ from 88%"
    },
    {
      label: "RTO reduction",
      value: "38%",
      delta: "WhatsApp NDR"
    },
    {
      label: "Avg. transit time",
      value: "2.4",
      suffix: " days",
      delta: "Metro to metro"
    }
  ];

  return (
    <section className="live-network-section" id="telemetry">
      <div className="live-network-container">

        <div className="live-network-heading">
          <div className="network-eyebrow">
            // THE LIVE NETWORK
          </div>

          <h2>
            Every parcel is a lap.
            <br />
            <span>The dashboard keeps score.</span>
          </h2>
        </div>

        <div className="network-grid">

          {/* Main Analytics Dashboard */}
          <div className="network-dashboard">

            <div className="network-topbar">
              <div className="network-window-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <span className="network-url">
                shipnext.telemetry/live-network
              </span>

              <span className="network-live">
                <span className="network-live-dot"></span>
                LIVE
              </span>
            </div>

            <div className="network-dashboard-content">

              <div className="network-chart-label">
                PARCELS MOVED · LAST 6 MONTHS
              </div>

              <div className="network-total-row">
                <div className="network-total">
                  1,248,600
                </div>

                <span className="network-growth">
                  ↑ 164%
                </span>
              </div>

              {/* Line Chart */}
              <div className="network-chart">
                <svg
                  viewBox="0 0 600 220"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="Parcel movement growth chart from May to October"
                >
                  <defs>
                    <linearGradient
                      id="networkAreaGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#FF3B1F"
                        stopOpacity="0.45"
                      />
                      <stop
                        offset="100%"
                        stopColor="#FF3B1F"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>

                  {[55, 110, 165].map((position) => (
                    <line
                      key={position}
                      x1="0"
                      x2="600"
                      y1={position}
                      y2={position}
                      stroke="rgba(255,255,255,0.12)"
                      strokeDasharray="4 6"
                    />
                  ))}

                  <path
                    className="network-area"
                    d="M0,190 C60,184 90,170 140,160 C200,146 230,150 290,118 C350,86 390,96 450,62 C500,36 550,30 600,14 L600,220 L0,220 Z"
                    fill="url(#networkAreaGradient)"
                  />

                  <path
                    className="network-line"
                    d="M0,190 C60,184 90,170 140,160 C200,146 230,150 290,118 C350,86 390,96 450,62 C500,36 550,30 600,14"
                    fill="none"
                    stroke="#FF3B1F"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>

                <div className="network-scan"></div>
              </div>

              {/* Monthly Bars */}
              <div className="network-bars">
                {networkMonths.map((item, index) => (
                  <div className="network-bar-item" key={item.month}>
                    <div className="network-bar-track">
                      <div
                        className={`network-bar ${
                          index === 5 ? "network-bar-active" : ""
                        }`}
                        style={{ height: `${item.value}%` }}
                      ></div>
                    </div>

                    <span>{item.month}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Performance Cards */}
          <div className="network-metrics">
            {metrics.map((metric) => (
              <div className="network-metric-card" key={metric.label}>

                <div className="network-metric-top">
                  <span>{metric.label}</span>
                  <span className="network-metric-icon">↗</span>
                </div>

                <div className="network-metric-value">
                  {metric.value}
                  {metric.suffix && (
                    <small>{metric.suffix}</small>
                  )}
                </div>

                <div className="network-metric-delta">
                  {metric.delta}
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

function Home() {
    const navigate = useNavigate();

  // TRACK SHIPMENT
  const [trackingId, setTrackingId] = useState('');

  const handleTrackShipment = (e) => {
    e.preventDefault();

    const id = trackingId.trim();

    if (!id) return;

    navigate(`/track/${encodeURIComponent(id)}`);
  };

  // PIN CODE SERVICEABILITY
  const [pickupPincode, setPickupPincode] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [courierResults, setCourierResults] = useState([]);
  const [checkingServiceability, setCheckingServiceability] = useState(false);
  const [serviceabilityError, setServiceabilityError] = useState('');

  const handleServiceabilityCheck = async (e) => {
    e.preventDefault();

    setCheckingServiceability(true);
    setServiceabilityError('');
    setCourierResults([]);

    try {
      const response = await fetch(
        `${API_URL}/api/serviceability/couriers/check`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pickupPincode: pickupPincode.trim(),
            deliveryPincode: deliveryPincode.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to check PIN-code serviceability.'
        );
      }

      setCourierResults(data.courierResults || []);
    } catch (error) {
      setServiceabilityError(
        error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setCheckingServiceability(false);
    }
  };

  const courierNames = {
    DELHIVERY: 'Delhivery',
    SKYKING: 'Skyking',
    BLUEDART: 'Blue Dart',
  };
  const movingServices1 = [
  "Air Cargo",
  "Surface Express",
  "COD Remittance",
  "WhatsApp NDR",
  "White-Label Tracking",
  "Smart Wallet",
  "PIN Serviceability"
];

const movingServices2 = [
  "Same-Day Pickup",
  "AWB Labels",
  "Zero RTO Leakage",
  "OTP Delivery",
  "Live GPS Scans",
  "29,400+ PINs",
  "GST Invoicing"
];

  return (
    <div className="app">
      <Navbar />

      <main>
        <section className="hero">
          
          <div className="hero-content">
            <div className="eyebrow">
              <span className="status-dot"></span>
              
D2C & B2B Logistics // 29,400+ PIN Codes · AI Carrier Core · Smart NDR.
            </div>

            <h1>Shipping Made Smarter.<br /><span>Delivering Made Simpler.</span></h1>

            <p>
              One connected logistics platform to manage dispatches, track parcels in real time, and streamline merchant operations with automated wallet debits.
            </p>

            <div className="hero-actions">
             
              <a href="#track" className="secondary-button">Track Your Parcel</a>
            </div>

            <div className="hero-trust">
              <div>✓ Easy online booking</div>
              <div>✓ Transparent pricing</div>
              <div>✓ Real-time tracking</div>
            </div>
          </div>

          

              
        </section>
             
<section className="quick-tools" id="track">

  {/* TRACK SHIPMENT */}
  <div className="tool-card">
    <div className="tool-icon">📍</div>

    <div className="tool-content">
      <h3>Track your shipment</h3>

      <p>Enter your ShipNext tracking ID to follow your parcel.</p>

      <form onSubmit={handleTrackShipment}>
        <input
          type="text"
          placeholder="Enter tracking ID"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          required
        />

        <button type="submit">
          Track →
        </button>
      </form>
    </div>
    
  </div>

  {/* CHECK SERVICEABILITY */}
  <div className="tool-card">
    <div className="tool-icon">🚚</div>

    <div className="tool-content">
      <h3>Check serviceability</h3>

      <p>
        Check courier availability between your pickup and delivery PIN codes.
      </p>

      <form onSubmit={handleServiceabilityCheck}>
        <input
          type="text"
          placeholder="Pickup PIN code"
          value={pickupPincode}
          onChange={(e) =>
            setPickupPincode(e.target.value.replace(/\D/g, '').slice(0, 6))
          }
          pattern="[0-9]{6}"
          maxLength={6}
          required
        />

        <input
          type="text"
          placeholder="Delivery PIN code"
          value={deliveryPincode}
          onChange={(e) =>
            setDeliveryPincode(e.target.value.replace(/\D/g, '').slice(0, 6))
          }
          pattern="[0-9]{6}"
          maxLength={6}
          required
        />

        <button type="submit" disabled={checkingServiceability}>
          {checkingServiceability ? 'Checking...' : 'Check →'}
        </button>
      </form>

      {serviceabilityError && (
        <p style={{ color: '#dc2626', marginTop: '12px' }}>
          {serviceabilityError}
        </p>
      )}

      
{courierResults.length > 0 && (
  <div className="shipnext-serviceability-result" style={{ marginTop: '20px' }}>
    <h3>ShipNext Serviceability</h3>

    {(() => {
      const pickupAvailable = courierResults.some(
        (courier) => courier.pickup?.available
      );

      const deliveryAvailable = courierResults.some(
        (courier) => courier.delivery?.available
      );

      const overallAvailable = courierResults.some(
        (courier) => courier.serviceable
      );

      const prepaidAvailable = courierResults.some(
        (courier) =>
          courier.serviceable && courier.delivery?.prepaid
      );

      const rows = [
        {
          label: 'Overall Availability',
          available: overallAvailable,
        },
        {
          label: 'Pickup PIN',
          available: pickupAvailable,
        },
        {
          label: 'Delivery PIN',
          available: deliveryAvailable,
        },
        {
          label: 'Prepaid',
          available: prepaidAvailable,
        },
      ];

      return (
        <>
          {rows.map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '13px 15px',
                marginTop: '10px',
                background: '#fff7f4',
                border: '1px solid #ffddd5',
                borderRadius: '10px',
              }}
            >
              <strong style={{ color: '#334155' }}>
                {item.label}
              </strong>

              <strong
                style={{
                  color: item.available ? '#15803d' : '#dc2626',
                }}
              >
                {item.available ? 'Available' : 'Not Available'}
              </strong>
            </div>
          ))}

          <p
            style={{
              fontSize: '12px',
              color: '#64748b',
              marginTop: '12px',
            }}
          >
            Serviceability is based on ShipNext's available PIN-code
            records and is subject to final booking confirmation.
          </p>
        </>
      );
    })()}
  </div>
)}

    </div>
    
  </div>
  

</section>

           <br></br>
           <br></br>
           <br></br>
            <br></br>
           <br></br>
           <br></br>
<section className="everything-section">
  <div className="everything-heading">
    // EVERYTHING WE MOVE
  </div>

  <div className="moving-row">
    <div className="moving-track">
      {[...movingServices1, ...movingServices1].map((item, index) => (
        <span className="moving-item" key={index}>
          <span className={index % 2 === 0 ? "filled-text" : "outline-text"}>
            {item}
          </span>
          <span className="moving-slash">/</span>
        </span>
      ))}
    </div>
  </div>

  <div className="moving-row">
    <div className="moving-track reverse-track">
      {[...movingServices2, ...movingServices2].map((item, index) => (
        <span className="moving-item" key={index}>
          <span className={index % 2 === 1 ? "filled-text" : "outline-text"}>
            {item}
          </span>
          <span className="moving-slash">/</span>
        </span>
      ))}
    </div>
  </div>
</section>
<br></br>
<br></br>

<LiveNetworkSection />
<Solutions />

<AIEngineNDR />
      <section className="services section" id="services">
  <div className="services-glow services-glow-one"></div>
  <div className="services-glow services-glow-two"></div>

  <div className="section-heading services-heading">
    <span className="services-eyebrow">
      <i></i> WHAT WE OFFER
    </span>

    <h2>
      Logistics that moves
      <span> your business forward.</span>
    </h2>

    
  </div>

  <div className="service-grid">

    <article className="service-card service-card-orange">
      <div className="service-card-top">
        <span className="service-number">01 / 03</span>
        <span className="service-arrow">↗</span>
      </div>

      <div className="service-icon">📦</div>

      <h3>Parcel Delivery</h3>

      <p>
        From a single parcel to bulk business shipments,
        get your packages moving with reliable delivery solutions.
      </p>

      <div className="service-tags">
        <span>Domestic</span>
        <span>Express</span>
      </div>

      <div className="service-card-line"></div>
    </article>

    <article className="service-card service-card-blue">
      <div className="service-card-top">
        <span className="service-number">02 / 03</span>
        <span className="service-arrow">↗</span>
      </div>

      <div className="service-icon">⚡</div>

      <h3>Smart Booking</h3>

      <p>
        Book shipments, calculate charges and generate
        shipping labels through one simple platform.
      </p>

      <div className="service-tags">
        <span>Instant Quotes</span>
        <span>Easy Dispatch</span>
      </div>

      <div className="service-card-line"></div>
    </article>

    <article className="service-card service-card-purple">
      <div className="service-card-top">
        <span className="service-number">03 / 03</span>
        <span className="service-arrow">↗</span>
      </div>

      <div className="service-icon">🛰️</div>

      <h3>Live Shipment Tracking</h3>

      <p>
        Keep every delivery in sight with shipment updates
        and transparent tracking throughout its journey.
      </p>

      <div className="service-tags">
        <span>Live Updates</span>
        <span>Full Visibility</span>
      </div>

      <div className="service-card-line"></div>
    </article>

  </div>
</section>

        
        <section className="cta-section">
          <h2>Ready to ship smarter?</h2>
          <p>Join ShipNext and make your shipping experience simpler.</p>
          <a href="/register" className="cta-button">Get Started Today →</a>
        </section>
        
      </main>

      
<footer className="footer">
  <div className="footer-main">

    <div className="footer-brand">
      <a href="/" className="logo">
        <img
          src="/logo.png"
          alt="ShipNext Logo"
          className="logo-image"
        />
      </a>

      <h3>Your Shipping. Our Priority.</h3>
      <p>
        One connected logistics platform to simplify shipping,
        streamline dispatches and grow your business.
      </p>

      <div className="footer-socials">
        <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
        <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a>
        <a href="https://www.facebook.com/" target="_blank" rel="noreferrer">Facebook</a>
      </div>
    </div>

    <div className="footer-column">
      <h4>Explore</h4>
      <a href="/">Home</a>
      <a href="/#solutions">Our Solutions</a>
      
      <a href="/#ai-engine">AI & NDR Engine</a>
      <a href="/#services">Services</a>
    </div>

    <div className="footer-column">
      <h4>Shipping</h4>
      <a href="/book-shipment">Book a Shipment</a>
      <a href="/track">Track Shipment</a>
      <a href="/shipping-charges">Shipping Rates</a>
      
      <a href="/register">Create Account</a>
    </div>

    <div className="footer-column">
      <h4>Account</h4>
      <a href="/login">Login</a>
      <a href="/register">Register</a>
      <a href="/wallet">My Wallet</a>
      <a href="/shipments">My Shipments</a>
      <a href="/profile">My Profile</a>
    </div>

    <div className="footer-column">
      <h4>Get Started</h4>
      <p>Ready to simplify your shipping operations?</p>
      <a href="/register" className="footer-cta">
        Get Started <span>↗</span>
      </a>
      <a href="/#contact">Contact Us</a>
    </div>

  </div>

  <div className="footer-bottom">
    <span>© {new Date().getFullYear()} ShipNext. All rights reserved.</span>

    <div className="footer-bottom-links">
      <a href="/privacy-policy">Privacy Policy</a>
      <a href="/terms">Terms & Conditions</a>
      <a href="/#contact">Support</a>
    </div>

    <span className="footer-tagline">Built to move your business forward.</span>
  </div>
</footer>

    </div>
  );
}
export default Home;